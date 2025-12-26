// Crypto POS Application - Production Version
class CryptoPOS {
    constructor() {
        this.currentMethod = null;
        this.currentAmount = null;
        this.paymentId = null;
        this.paymentAddress = null;
        this.paymentInterval = null;
        this.apiBaseUrl = window.location.origin;
        this.maxRetries = 450; // 15 minutes of checking (450 * 2 seconds = 900 seconds)
        this.retryCount = 0;
        this.init();
    }

    init() {
        // Load coins from API
        this.loadCoins();

        // Amount input
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generatePayment();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMethodSelection();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cancelPayment();
        });

        document.getElementById('newPaymentBtn').addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyAddress();
        });

        // Enter key on amount input
        document.getElementById('amountInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generatePayment();
            }
        });

        // Check server health on load
        this.checkServerHealth();
    }

    async loadCoins() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/coins`);
            const data = await response.json();
            
            if (data.coins && data.coins.length > 0) {
                this.coins = data.coins;
                this.renderCoins(data.coins);
            } else {
                this.showError('No payment methods available. Please configure coins in admin panel.');
            }
        } catch (error) {
            console.error('Error loading coins:', error);
            this.showError('Failed to load payment methods. Please try again.');
        }
    }

    renderCoins(coins) {
        const methodsContainer = document.querySelector('.payment-methods');
        if (!methodsContainer) return;

        methodsContainer.innerHTML = coins.map(coin => {
            const iconPath = coin.icon || 'usdc.svg';
            const iconFallback = coin.icon ? '' : `<div style="display:none; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2775CA 0%, #1E5A9E 100%); align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${coin.symbol}</div>`;
            
            return `
                <button class="payment-btn" data-method="${coin.method_code}">
                    <div class="coin-icon-wrapper">
                        <img src="${iconPath}" alt="${coin.name}" class="coin-icon-img" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        ${iconFallback}
                    </div>
                    <div class="coin-info">
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-network">${coin.network === 'mainnet' ? coin.symbol : coin.network}</div>
                    </div>
                </button>
            `;
        }).join('');

        // Re-attach event listeners
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.currentTarget.dataset.method);
            });
        });
    }

    async checkServerHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            const data = await response.json();
            console.log('Server status:', data);
        } catch (error) {
            console.error('Server health check failed:', error);
            this.showError('Cannot connect to server. Please ensure the backend is running.');
        }
    }

    selectPaymentMethod(method) {
        this.currentMethod = method;
        
        // Find coin info
        const coin = this.coins?.find(c => c.method_code === method);
        if (coin) {
            const networkText = coin.network === 'mainnet' ? coin.symbol : coin.network;
            document.getElementById('currencyDisplay').textContent = `${coin.name} (${networkText})`;
        } else {
            document.getElementById('currencyDisplay').textContent = method;
        }
        
        this.showAmountInput();
    }

    showMethodSelection() {
        document.getElementById('methodSection').classList.remove('hidden');
        document.getElementById('amountSection').classList.add('hidden');
        document.getElementById('paymentSection').classList.add('hidden');
        this.currentMethod = null;
        this.clearErrors();
    }

    showAmountInput() {
        document.getElementById('methodSection').classList.add('hidden');
        document.getElementById('amountSection').classList.remove('hidden');
        document.getElementById('paymentSection').classList.add('hidden');
        document.getElementById('amountInput').focus();
        this.clearErrors();
    }

    async generatePayment() {
        const amount = parseFloat(document.getElementById('amountInput').value);

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        this.currentAmount = amount;
        this.retryCount = 0;

        try {
            // Show loading state
            this.setLoadingState(true);

            // Create payment request via API
            const response = await fetch(`${this.apiBaseUrl}/api/payment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: this.currentMethod,
                    amount: amount
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment request');
            }

            const data = await response.json();
            this.paymentId = data.paymentId;
            this.paymentAddress = data.address;

            this.displayPayment(data);
            this.startPaymentMonitoring();
        } catch (error) {
            console.error('Error creating payment:', error);
            this.showError(error.message || 'Failed to create payment request. Please try again.');
            this.setLoadingState(false);
        }
    }

    displayPayment(data) {
        // Find coin info
        const coin = this.coins?.find(c => c.method_code === this.currentMethod);
        const coinName = coin ? coin.name : this.currentMethod;
        const currency = coin ? coin.symbol : 'COIN';

        // Show payment section FIRST so elements are available
        document.getElementById('methodSection').classList.add('hidden');
        document.getElementById('amountSection').classList.add('hidden');
        document.getElementById('paymentSection').classList.remove('hidden');

        // Update payment info
        document.getElementById('displayAmount').textContent = 
            `${this.currentAmount.toFixed(2)} ${currency}`;
        document.getElementById('displayMethod').textContent = coinName;
        document.getElementById('paymentAddress').textContent = this.paymentAddress;

        // Generate QR code - use qrData if available, otherwise use address
        const qrData = data.qrData || this.paymentAddress;

        // Get container element directly (more reliable)
        const qrContainer = document.querySelector('.qr-container');
        if (!qrContainer) {
            console.error('QR container not found');
            this.setLoadingState(false);
            return;
        }

        // Get canvas element (may be null if using server-side)
        const qrCanvas = document.getElementById('qrCode');

        // Function to use server-side QR code generation as fallback
        const useServerSideQR = () => {
            const encodedData = encodeURIComponent(qrData);
            const qrImageUrl = `${this.apiBaseUrl}/api/qrcode/${encodedData}`;
            qrContainer.innerHTML = `
                <img src="${qrImageUrl}" 
                     alt="QR Code" 
                     style="max-width: 100%; height: auto; border-radius: 10px;"
                     onerror="this.parentElement.innerHTML='<div style=\\'padding: 20px; text-align: center; background: #f8f9fa; border-radius: 10px;\\'><p style=\\'margin-bottom: 10px; color: #666;\\'>QR Code unavailable</p><p style=\\'font-size: 0.9em; color: #999;\\'>Please use the payment address below</p></div>'">
            `;
        };

        // Check if QRCode library is loaded and canvas exists
        if (typeof QRCode === 'undefined' || QRCode === null) {
            console.warn('QRCode library not loaded, using server-side generation');
            useServerSideQR();
        } else if (!qrCanvas) {
            console.warn('Canvas element not found, using server-side generation');
            useServerSideQR();
        } else {
            try {
                QRCode.toCanvas(qrCanvas, qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (error) => {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        console.warn('Falling back to server-side QR code generation');
                        useServerSideQR();
                    }
                });
            } catch (error) {
                console.error('QRCode error:', error);
                console.warn('Falling back to server-side QR code generation');
                useServerSideQR();
            }
        }

        // Reset status
        const statusEl = document.getElementById('paymentStatus');
        statusEl.className = 'status';
        statusEl.innerHTML = `
            <div class="status-icon-wrapper">
                <div class="spinner"></div>
            </div>
            <span class="status-text">Waiting for payment...</span>
        `;

        this.setLoadingState(false);
    }

    startPaymentMonitoring() {
        // Clear any existing interval
        if (this.paymentInterval) {
            clearInterval(this.paymentInterval);
        }

        // Check payment status every 2 seconds
        this.paymentInterval = setInterval(() => {
            this.checkPayment();
        }, 2000);
    }

    async checkPayment() {
        if (!this.paymentId) {
            this.stopMonitoring();
            return;
        }

        // Stop checking after max retries
        if (this.retryCount >= this.maxRetries) {
            this.stopMonitoring();
            const timeoutMinutes = Math.floor(this.maxRetries * 2 / 60);
            this.showError(`Payment timeout after ${timeoutMinutes} minutes. Please create a new payment request if payment was sent.`);
            return;
        }

        this.retryCount++;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/payment/status/${this.paymentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check payment status');
            }

            const data = await response.json();

            if (data.confirmed) {
                this.confirmPayment(data);
            } else {
                // Update status with remaining time
                const statusEl = document.getElementById('paymentStatus');
                const totalSeconds = this.maxRetries * 2;
                const elapsedSeconds = this.retryCount * 2;
                const remainingSeconds = totalSeconds - elapsedSeconds;
                const remainingMinutes = Math.floor(remainingSeconds / 60);
                const remainingSecs = remainingSeconds % 60;
                
                statusEl.innerHTML = `
                    <div class="status-icon-wrapper">
                        <div class="spinner"></div>
                    </div>
                    <span class="status-text">Waiting for payment... (${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')} remaining)</span>
                `;
            }
        } catch (error) {
            console.error('Error checking payment:', error);
            // Don't show error on every failed check, only log it
            // The retry mechanism will handle temporary network issues
        }
    }

    confirmPayment(paymentData) {
        this.stopMonitoring();

        const statusEl = document.getElementById('paymentStatus');
        statusEl.className = 'status success';
        
        let message = 'Payment confirmed!';
        if (paymentData.txHash) {
            message += `\nTransaction: ${paymentData.txHash.substring(0, 16)}...`;
        }
        
        statusEl.innerHTML = `
            <div class="status-icon-wrapper"></div>
            <span class="status-text">${message}</span>
        `;

        // Show success notification
        setTimeout(() => {
            const txInfo = paymentData.txHash ?
                `\n\nTransaction Hash:\n${paymentData.txHash}` : '';
            const coin = this.coins?.find(c => c.method_code === this.currentMethod);
            const currency = coin ? coin.symbol : 'COIN';
            alert(`✅ Payment of ${this.currentAmount} ${currency} confirmed!${txInfo}`);
        }, 500);
    }

    stopMonitoring() {
        if (this.paymentInterval) {
            clearInterval(this.paymentInterval);
            this.paymentInterval = null;
        }
    }

    cancelPayment() {
        this.stopMonitoring();
        this.reset();
    }

    reset() {
        this.stopMonitoring();

        this.currentMethod = null;
        this.currentAmount = null;
        this.paymentId = null;
        this.paymentAddress = null;
        this.retryCount = 0;
        document.getElementById('amountInput').value = '';
        this.showMethodSelection();
    }

    copyAddress() {
        if (!this.paymentAddress) return;

        navigator.clipboard.writeText(this.paymentAddress).then(() => {
            const copyBtn = document.getElementById('copyBtn');
            const copyText = copyBtn.querySelector('.copy-text');
            const originalText = copyText ? copyText.textContent : 'Copy';
            
            if (copyText) {
                copyText.textContent = 'Copied!';
            }
            copyBtn.style.background = 'var(--success)';
            setTimeout(() => {
                if (copyText) {
                    copyText.textContent = originalText;
                }
                copyBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showError('Failed to copy address to clipboard');
        });
    }

    showError(message) {
        // Remove any existing error messages
        this.clearErrors();

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 2px solid #f5c6cb;
            font-weight: 500;
        `;

        // Insert error at the top of the current section
        const currentSection = document.querySelector('.section:not(.hidden)');
        if (currentSection) {
            currentSection.insertBefore(errorDiv, currentSection.firstChild);
        }
    }

    clearErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => error.remove());
    }

    setLoadingState(loading) {
        const generateBtn = document.getElementById('generateBtn');
        if (loading) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
        } else {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Payment';
        }
    }
}

// Initialize the POS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if QRCode library is loaded (with a small delay to allow scripts to load)
    setTimeout(() => {
        if (typeof QRCode === 'undefined' || QRCode === null) {
            console.warn('⚠️ QRCode library not loaded. QR code generation will not work.');
            console.warn('Please check your internet connection or CDN availability.');
        }
    }, 1000);

    new CryptoPOS();
});
