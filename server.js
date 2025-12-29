const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const { getDatabase } = require('./database');
const adminRoutes = require('./routes/admin');
const { requireAuthHTML } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Vercel and other reverse proxies)
// This ensures req.protocol and req.secure are set correctly
app.set('trust proxy', 1);

// Initialize database
const db = getDatabase();

// Detect production environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isHTTPS = isProduction || process.env.HTTPS === 'true';

// Determine sameSite setting
// 'lax' works for same-domain (recommended for Vercel)
// 'none' is required for cross-domain but needs secure: true
const sameSiteSetting = process.env.COOKIE_SAMESITE || (isHTTPS ? 'lax' : 'lax');

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Session configuration - optimized for Vercel/serverless
app.use(session({
    secret: process.env.SESSION_SECRET || 'crypto-pos-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'crypto-pos.sid', // Custom session name
    cookie: {
        secure: isHTTPS, // true in production (HTTPS required on Vercel)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: sameSiteSetting, // 'lax' for same-domain, 'none' for cross-domain (requires secure: true)
        path: '/', // Ensure cookie is available for all paths
        domain: process.env.COOKIE_DOMAIN || undefined // Set if using custom domain
    },
    // For serverless environments, we rely on cookie-based sessions
    // The session data is stored in the cookie itself (signed and encrypted)
    rolling: true // Reset expiration on activity to keep session alive
}));

// Store active payment requests (in-memory for quick access, also stored in DB)
const activePayments = new Map();

// Configuration is now stored in JSON database
// All config comes from database via /api/admin/coins endpoints

// Get enabled coins for POS frontend
app.get('/api/coins', async (req, res) => {
    try {
        const coins = db.getEnabledCoins();
        res.json({ coins });
    } catch (error) {
        console.error('Error fetching coins:', error);
        res.status(500).json({ error: 'Failed to fetch coins' });
    }
});

// Generate payment request
app.post('/api/payment/create', async (req, res) => {
    try {
        const { method, amount } = req.body;

        if (!method || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment method or amount' });
        }

        // Get coin from database
        const coin = db.getCoinByMethodCode(method);
        if (!coin) {
            return res.status(400).json({ error: 'Payment method not available or disabled' });
        }

        if (!coin.wallet_address) {
            return res.status(500).json({
                error: `Wallet address not configured for ${coin.name}. Please configure in admin panel.`
            });
        }

        // Generate payment ID
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store payment in database
        const paymentData = {
            id: paymentId,
            paymentId,
            coinId: coin.id,
            method: coin.method_code,
            amount: parseFloat(amount),
            address: coin.wallet_address,
            status: 'pending',
            confirmed: false
        };

        db.createPayment(paymentData);

        // Also store in memory for quick access
        activePayments.set(paymentId, {
            ...paymentData,
            createdAt: new Date().toISOString(),
            coin: coin
        });

        res.json({
            paymentId,
            address: coin.wallet_address,
            amount: paymentData.amount,
            method: coin.method_code,
            qrData: generateQRData(coin.method_code, coin.wallet_address, amount)
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

        // Try to get from memory first, then database
        let payment = activePayments.get(paymentId);
        if (!payment) {
            const dbPayment = db.getPaymentById(paymentId);
            if (!dbPayment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            // Get coin info
            const coin = db.getCoinById(dbPayment.coin_id);
            payment = {
                ...dbPayment,
                method: dbPayment.method,
                address: dbPayment.address,
                coin: coin
            };
        }

        // Check blockchain for payment
        const paymentStatus = await checkBlockchainPayment(payment);

        // Update payment status in database and memory
        if (paymentStatus.confirmed && !payment.confirmed) {
            db.updatePayment(paymentId, {
                confirmed: true,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
                tx_hash: paymentStatus.txHash
            });

            if (activePayments.has(paymentId)) {
                payment.confirmed = true;
                payment.status = 'confirmed';
                payment.confirmedAt = new Date().toISOString();
                payment.txHash = paymentStatus.txHash;
            }
        }

        const dbPayment = db.getPaymentById(paymentId);
        res.json({
            paymentId: dbPayment.payment_id,
            status: dbPayment.status,
            confirmed: dbPayment.confirmed === 1,
            amount: dbPayment.amount,
            method: dbPayment.method,
            address: dbPayment.address,
            txHash: dbPayment.tx_hash,
            createdAt: dbPayment.created_at,
            confirmedAt: dbPayment.confirmed_at
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
});

// Check blockchain for payment
async function checkBlockchainPayment(payment) {
    try {
        // Get coin data (from payment object or database)
        let coin = payment.coin;
        if (!coin && payment.coinId) {
            coin = db.getCoinById(payment.coinId);
        }
        if (!coin && payment.method) {
            coin = db.getCoinByMethodCode(payment.method);
        }

        if (!coin) {
            console.error('Coin not found for payment:', payment.method);
            return { confirmed: false };
        }

        // Route to appropriate checker based on coin type
        if (coin.id === 'btc') {
            return await checkBTCPayment(payment, coin);
        } else if (coin.contract_address) {
            // Token payment (USDT, USDC, etc.)
            return await checkTokenPayment(payment, coin);
        } else {
            // Native coin payment (AVAX, etc.)
            return await checkNativePayment(payment, coin);
        }
    } catch (error) {
        console.error(`Error checking ${payment.method} payment:`, error);
        return { confirmed: false };
    }
}

// Check Bitcoin payment
async function checkBTCPayment(payment, coin) {
    try {
        const apiUrl = coin.api_url || 'https://blockstream.info/api';
        const response = await axios.get(
            `${apiUrl}/address/${payment.address}/txs`,
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

// Check token payment (USDT, USDC, etc.)
async function checkTokenPayment(payment, coin) {
    try {
        const apiUrl = coin.api_url || 'https://api.snowtrace.io/api';
        const apiKey = coin.api_key ? `&apikey=${coin.api_key}` : '';
        const contractAddress = coin.contract_address;
        const decimals = coin.decimals || 6;

        const response = await axios.get(
            `${apiUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${payment.address}&startblock=0&endblock=99999999&sort=desc${apiKey}`,
            { timeout: 10000 }
        );

        if (response.data.status !== '1' || !response.data.result) {
            return { confirmed: false };
        }

        const transactions = response.data.result || [];
        const paymentTime = new Date(payment.createdAt || payment.created_at).getTime();

        for (const tx of transactions) {
            const txTime = parseInt(tx.timeStamp) * 1000;

            // Check if transaction is recent and incoming
            if (txTime >= paymentTime &&
                tx.to.toLowerCase() === payment.address.toLowerCase() &&
                (tx.tokenSymbol === coin.symbol || tx.contractAddress?.toLowerCase() === contractAddress.toLowerCase())) {

                const receivedAmount = parseInt(tx.value) / Math.pow(10, decimals);

                // Check if amount matches (with small tolerance)
                const tolerance = 0.01;
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

// Check native coin payment (AVAX, etc.)
async function checkNativePayment(payment, coin) {
    try {
        // Use testnet or mainnet API based on network setting
        let apiUrl = coin.api_url;
        if (coin.network === 'testnet' && coin.id === 'avax') {
            apiUrl = 'https://api-testnet.snowtrace.io/api';
        }
        const apiKey = coin.api_key ? `&apikey=${coin.api_key}` : '';

        const response = await axios.get(
            `${apiUrl}?module=account&action=txlist&address=${payment.address}&startblock=0&endblock=99999999&sort=desc${apiKey}`,
            { timeout: 10000 }
        );

        if (response.data.status !== '1' || !response.data.result) {
            return { confirmed: false };
        }

        const transactions = response.data.result || [];
        const paymentTime = new Date(payment.createdAt || payment.created_at).getTime();
        const decimals = coin.decimals || 18;

        for (const tx of transactions) {
            const txTime = parseInt(tx.timeStamp) * 1000;

            // Check if transaction is recent and incoming
            if (txTime >= paymentTime &&
                tx.to.toLowerCase() === payment.address.toLowerCase() &&
                tx.value !== '0') {

                const receivedAmount = parseFloat(tx.value) / Math.pow(10, decimals);

                // Check if amount matches (with small tolerance)
                const tolerance = 0.01;
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
    } else if (method === 'avax') {
        // For AVAX, use simple address (some wallets support ethereum: format)
        return address; // Simple address for QR code
    } else if (method === 'usdc-avax') {
        // For USDC, use simple address (some wallets support ethereum: format)
        return address; // Simple address for QR code
    } else if (method === 'AVAX0' || method === 'avax0') {
        // For AVAX0 token, use simple address (some wallets support ethereum: format)
        return address; // Simple address for QR code
    }
    return address;
}

// Generate QR code image (server-side fallback)
app.get('/api/qrcode/:data', async (req, res) => {
    try {
        const { data } = req.params;
        const decodedData = decodeURIComponent(data);
        // Use a QR code API service as fallback (free, no key required)
        const encodedData = encodeURIComponent(decodedData);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;

        // Proxy the QR code image
        const response = await axios.get(qrUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        res.set({
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600'
        });
        res.send(response.data);
    } catch (error) {
        console.error('QR code generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

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

// Admin API routes
app.use('/api/admin', adminRoutes);

// Admin pages
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin', requireAuthHTML, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get('/admin/coins', requireAuthHTML, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'coins.html'));
});

app.get('/admin/payments', requireAuthHTML, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'payments.html'));
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
    console.log(`🔐 Access the Admin Panel at http://localhost:${PORT}/admin`);
    console.log(`⚠️  Default admin credentials: admin / admin123`);
    console.log(`⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IMMEDIATELY!`);

    // Validate configuration
    const enabledCoins = db.getEnabledCoins();
    console.log(`✅ ${enabledCoins.length} coin(s) enabled and ready`);
});

// Cleanup interval (every 10 minutes)
setInterval(cleanupOldPayments, 10 * 60 * 1000);

