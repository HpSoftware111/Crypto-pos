const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active payment requests (in production, use Redis or database)
const activePayments = new Map();

// Configuration
const CONFIG = {
    BTC: {
        walletAddress: process.env.BTC_WALLET_ADDRESS || '',
        apiUrl: 'https://blockstream.info/api',
        confirmationsRequired: 1
    },
    AVALANCHE: {
        walletAddress: process.env.AVALANCHE_WALLET_ADDRESS || '',
        apiUrl: 'https://api.snowtrace.io/api',
        apiKey: process.env.SNOWTRACE_API_KEY || '',
        confirmationsRequired: 1,
        // USDT contract address on Avalanche C-Chain
        usdtContractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' // USDT.e on Avalanche
    }
};

// Validate configuration
function validateConfig() {
    const errors = [];
    if (!CONFIG.BTC.walletAddress) {
        errors.push('BTC_WALLET_ADDRESS is not set');
    }
    if (!CONFIG.AVALANCHE.walletAddress) {
        errors.push('AVALANCHE_WALLET_ADDRESS is not set');
    }
    if (errors.length > 0) {
        console.warn('⚠️  Configuration warnings:', errors.join(', '));
        console.warn('⚠️  Please set wallet addresses in .env file');
    }
}

// Generate payment request
app.post('/api/payment/create', async (req, res) => {
    try {
        const { method, amount } = req.body;

        // Validation
        if (!method || !['btc', 'usdt-avax'].includes(method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate payment ID
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get wallet address based on method
        let walletAddress;
        if (method === 'btc') {
            walletAddress = CONFIG.BTC.walletAddress;
        } else if (method === 'usdt-avax') {
            walletAddress = CONFIG.AVALANCHE.walletAddress;
        }

        if (!walletAddress) {
            return res.status(500).json({ 
                error: `Wallet address not configured for ${method}. Please set in .env file.` 
            });
        }

        // Store payment request
        const paymentData = {
            id: paymentId,
            method,
            amount: parseFloat(amount),
            address: walletAddress,
            createdAt: new Date().toISOString(),
            status: 'pending',
            confirmed: false
        };

        activePayments.set(paymentId, paymentData);

        // Clean up old payments (older than 1 hour)
        cleanupOldPayments();

        res.json({
            paymentId,
            address: walletAddress,
            amount: paymentData.amount,
            method,
            qrData: generateQRData(method, walletAddress, amount)
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment request' });
    }
});

// Check payment status
app.get('/api/payment/status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = activePayments.get(paymentId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Check blockchain for payment
        const paymentStatus = await checkBlockchainPayment(payment);

        // Update payment status
        if (paymentStatus.confirmed && !payment.confirmed) {
            payment.confirmed = true;
            payment.status = 'confirmed';
            payment.confirmedAt = new Date().toISOString();
            payment.txHash = paymentStatus.txHash;
        }

        res.json({
            paymentId: payment.id,
            status: payment.status,
            confirmed: payment.confirmed,
            amount: payment.amount,
            method: payment.method,
            address: payment.address,
            txHash: payment.txHash,
            createdAt: payment.createdAt,
            confirmedAt: payment.confirmedAt
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
});

// Check blockchain for payment
async function checkBlockchainPayment(payment) {
    try {
        if (payment.method === 'btc') {
            return await checkBTCPayment(payment);
        } else if (payment.method === 'usdt-avax') {
            return await checkUSDTPayment(payment);
        }
    } catch (error) {
        console.error(`Error checking ${payment.method} payment:`, error);
        return { confirmed: false };
    }
}

// Check Bitcoin payment
async function checkBTCPayment(payment) {
    try {
        const response = await axios.get(
            `${CONFIG.BTC.apiUrl}/address/${payment.address}/txs`,
            { timeout: 10000 }
        );

        const transactions = response.data || [];
        
        // Check recent transactions
        for (const tx of transactions.slice(0, 10)) {
            // Check if transaction is recent (within last hour)
            const txTime = tx.status.block_time * 1000;
            const paymentTime = new Date(payment.createdAt).getTime();
            
            if (txTime >= paymentTime) {
                // Calculate total received in this transaction
                let totalReceived = 0;
                for (const vout of tx.vout || []) {
                    if (vout.scriptpubkey_address === payment.address) {
                        totalReceived += vout.value / 100000000; // Convert satoshi to BTC
                    }
                }

                // Check if amount matches (with small tolerance for fees)
                const tolerance = 0.0001; // 0.0001 BTC tolerance
                if (Math.abs(totalReceived - payment.amount) <= tolerance || totalReceived >= payment.amount) {
                    return {
                        confirmed: true,
                        txHash: tx.txid,
                        amount: totalReceived
                    };
                }
            }
        }

        return { confirmed: false };
    } catch (error) {
        if (error.response?.status === 404) {
            // Address has no transactions yet
            return { confirmed: false };
        }
        throw error;
    }
}

// Check USDT payment on Avalanche
async function checkUSDTPayment(payment) {
    try {
        const apiKey = CONFIG.AVALANCHE.apiKey ? `&apikey=${CONFIG.AVALANCHE.apiKey}` : '';
        const response = await axios.get(
            `${CONFIG.AVALANCHE.apiUrl}?module=account&action=tokentx&contractaddress=${CONFIG.AVALANCHE.usdtContractAddress}&address=${payment.address}&startblock=0&endblock=99999999&sort=desc${apiKey}`,
            { timeout: 10000 }
        );

        if (response.data.status !== '1' || !response.data.result) {
            return { confirmed: false };
        }

        const transactions = response.data.result || [];
        const paymentTime = new Date(payment.createdAt).getTime();

        // USDT has 6 decimals
        const expectedAmount = Math.floor(payment.amount * 1000000);

        for (const tx of transactions) {
            const txTime = parseInt(tx.timeStamp) * 1000;
            
            // Check if transaction is recent and incoming
            if (txTime >= paymentTime && 
                tx.to.toLowerCase() === payment.address.toLowerCase() &&
                tx.tokenSymbol === 'USDT') {
                
                const receivedAmount = parseInt(tx.value) / 1000000; // Convert from 6 decimals
                
                // Check if amount matches (with small tolerance)
                const tolerance = 0.01; // 0.01 USDT tolerance
                if (Math.abs(receivedAmount - payment.amount) <= tolerance || receivedAmount >= payment.amount) {
                    return {
                        confirmed: true,
                        txHash: tx.hash,
                        amount: receivedAmount
                    };
                }
            }
        }

        return { confirmed: false };
    } catch (error) {
        if (error.response?.status === 404 || error.response?.data?.status === '0') {
            return { confirmed: false };
        }
        throw error;
    }
}

// Generate QR code data
function generateQRData(method, address, amount) {
    if (method === 'btc') {
        // Bitcoin URI format
        return `bitcoin:${address}?amount=${amount}`;
    } else if (method === 'usdt-avax') {
        // For USDT, we can use a simple address or add amount parameter
        // Some wallets support ethereum: URI format
        return address; // Simple address for QR code
    }
    return address;
}

// Cleanup old payments
function cleanupOldPayments() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [id, payment] of activePayments.entries()) {
        const paymentTime = new Date(payment.createdAt).getTime();
        if (paymentTime < oneHourAgo) {
            activePayments.delete(id);
        }
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        activePayments: activePayments.size
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Crypto POS Server running on port ${PORT}`);
    console.log(`📱 Access the POS at http://localhost:${PORT}`);
    validateConfig();
});

// Cleanup interval (every 10 minutes)
setInterval(cleanupOldPayments, 10 * 60 * 1000);

