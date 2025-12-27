const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

class DatabaseManager {
    constructor() {
        const dbPath = path.join(__dirname, 'data.json');
        this.dbPath = dbPath;
        this.initDatabase();
    }

    initDatabase() {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize JSON database structure
        if (!fs.existsSync(this.dbPath)) {
            const initialData = {
                coins: [],
                admin_users: [],
                payments: [],
                admin_logs: [],
                _meta: {
                    version: '1.0.0',
                    created_at: new Date().toISOString()
                }
            };
            this.writeData(initialData);
            this.migrateExistingCoins();
            this.initDefaultAdmin();
        } else {
            // Ensure all required tables exist
            const data = this.readData();
            if (!data.coins) data.coins = [];
            if (!data.admin_users) data.admin_users = [];
            if (!data.payments) data.payments = [];
            if (!data.admin_logs) data.admin_logs = [];
            this.writeData(data);

            // Initialize default admin if no users exist
            if (data.admin_users.length === 0) {
                this.initDefaultAdmin();
            }

            // Migrate coins if empty
            if (data.coins.length === 0) {
                this.migrateExistingCoins();
            }
        }
    }

    readData() {
        try {
            const fileContent = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading database:', error);
            return {
                coins: [],
                admin_users: [],
                payments: [],
                admin_logs: []
            };
        }
    }

    writeData(data) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing database:', error);
            throw error;
        }
    }

    initDefaultAdmin() {
        const data = this.readData();

        if (data.admin_users.length === 0) {
            // Default admin: username='admin', password='admin123' (must be changed!)
            const defaultPassword = 'admin123';
            const passwordHash = bcrypt.hashSync(defaultPassword, 10);

            const admin = {
                id: 1,
                username: 'admin',
                password_hash: passwordHash,
                created_at: new Date().toISOString(),
                last_login: null
            };

            data.admin_users.push(admin);
            this.writeData(data);

            console.log('⚠️  Default admin user created:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   ⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
        }
    }

    migrateExistingCoins() {
        const data = this.readData();

        if (data.coins.length === 0) {
            // Migrate existing coins from server.js
            const defaultCoins = [
                {
                    id: 'btc',
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    enabled: 1,
                    network: 'mainnet',
                    wallet_address: 'bc1qh5n4uall8hqeshtlklp3p2k02dz7zj2y96xkva',
                    api_url: 'https://blockstream.info/api',
                    api_key: null,
                    contract_address: null,
                    confirmations_required: 1,
                    icon: 'btc.png',
                    decimals: 8,
                    method_code: 'btc',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'usdt-avax',
                    name: 'USDT',
                    symbol: 'USDT',
                    enabled: 1,
                    network: 'mainnet',
                    wallet_address: '0x0029B302c6a0858b5648302dA5F4b24b67fBb364',
                    api_url: 'https://api.snowtrace.io/api',
                    api_key: 'rs_ce1e170ba51f9f9bbe4ce524',
                    contract_address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                    confirmations_required: 1,
                    icon: 'USDT.jfif',
                    decimals: 6,
                    method_code: 'usdt-avax',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'avax',
                    name: 'AVAX',
                    symbol: 'AVAX',
                    enabled: 1,
                    network: 'mainnet',
                    wallet_address: '0x91870B9c25C06E10Bcb88bdd0F7b43A13C2d7c41',
                    api_url: 'https://api.snowtrace.io/api',
                    api_key: 'rs_ce1e170ba51f9f9bbe4ce524',
                    contract_address: null,
                    confirmations_required: 1,
                    icon: 'avax.png',
                    decimals: 18,
                    method_code: 'avax',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'usdc-avax',
                    name: 'USDC',
                    symbol: 'USDC',
                    enabled: 1,
                    network: 'mainnet',
                    wallet_address: '0x91870B9c25C06E10Bcb88bdd0F7b43A13C2d7c41',
                    api_url: 'https://api.snowtrace.io/api',
                    api_key: 'rs_ce1e170ba51f9f9bbe4ce524',
                    contract_address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
                    confirmations_required: 1,
                    icon: 'usdc.svg',
                    decimals: 6,
                    method_code: 'usdc-avax',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            data.coins = defaultCoins;
            this.writeData(data);
            console.log('✅ Migrated existing coins to database');
        }
    }

    // Coin management methods
    getAllCoins() {
        const data = this.readData();
        return data.coins.sort((a, b) => a.name.localeCompare(b.name));
    }

    getEnabledCoins() {
        const data = this.readData();
        return data.coins.filter(coin => coin.enabled === 1).sort((a, b) => a.name.localeCompare(b.name));
    }

    getCoinById(id) {
        const data = this.readData();
        return data.coins.find(coin => coin.id === id) || null;
    }

    getCoinByMethodCode(methodCode) {
        const data = this.readData();
        return data.coins.find(coin => coin.method_code === methodCode && coin.enabled === 1) || null;
    }

    createCoin(coinData) {
        const data = this.readData();

        const coin = {
            id: coinData.id,
            name: coinData.name,
            symbol: coinData.symbol,
            enabled: coinData.enabled !== undefined ? coinData.enabled : 1,
            network: coinData.network || 'mainnet',
            wallet_address: coinData.wallet_address || null,
            api_url: coinData.api_url || null,
            api_key: coinData.api_key || null,
            contract_address: coinData.contract_address || null,
            confirmations_required: coinData.confirmations_required || 1,
            icon: coinData.icon || null,
            decimals: coinData.decimals || 18,
            method_code: coinData.method_code,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        data.coins.push(coin);
        this.writeData(data);

        return coin;
    }

    updateCoin(id, coinData) {
        const data = this.readData();
        const coinIndex = data.coins.findIndex(coin => coin.id === id);

        if (coinIndex === -1) {
            return null;
        }

        const coin = data.coins[coinIndex];
        Object.keys(coinData).forEach(key => {
            if (key !== 'id' && coinData[key] !== undefined) {
                coin[key] = coinData[key];
            }
        });
        coin.updated_at = new Date().toISOString();

        this.writeData(data);
        return coin;
    }

    deleteCoin(id) {
        const data = this.readData();
        const coinIndex = data.coins.findIndex(coin => coin.id === id);

        if (coinIndex === -1) {
            return false;
        }

        data.coins.splice(coinIndex, 1);
        this.writeData(data);
        return true;
    }

    toggleCoinEnabled(id, enabled) {
        const data = this.readData();
        const coin = data.coins.find(coin => coin.id === id);

        if (!coin) {
            return null;
        }

        coin.enabled = enabled ? 1 : 0;
        coin.updated_at = new Date().toISOString();
        this.writeData(data);

        return coin;
    }

    // Payment management methods
    createPayment(paymentData) {
        const data = this.readData();

        const payment = {
            id: paymentData.id || paymentData.paymentId,
            payment_id: paymentData.paymentId,
            coin_id: paymentData.coinId,
            method: paymentData.method,
            amount: paymentData.amount,
            address: paymentData.address,
            status: paymentData.status || 'pending',
            confirmed: paymentData.confirmed ? 1 : 0,
            tx_hash: null,
            created_at: new Date().toISOString(),
            confirmed_at: null
        };

        data.payments.push(payment);
        this.writeData(data);

        return payment;
    }

    getPaymentById(paymentId) {
        const data = this.readData();
        return data.payments.find(payment => payment.payment_id === paymentId) || null;
    }

    updatePayment(paymentId, updates) {
        const data = this.readData();
        const payment = data.payments.find(p => p.payment_id === paymentId);

        if (!payment) {
            return null;
        }

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                if (key === 'confirmed') {
                    payment[key] = updates[key] ? 1 : 0;
                } else {
                    payment[key] = updates[key];
                }
            }
        });

        this.writeData(data);
        return payment;
    }

    getPayments(limit = 100, offset = 0, filters = {}) {
        const data = this.readData();
        let payments = [...data.payments];

        // Apply filters
        if (filters.status) {
            payments = payments.filter(p => p.status === filters.status);
        }

        if (filters.coinId) {
            payments = payments.filter(p => p.coin_id === filters.coinId);
        }

        if (filters.startDate) {
            payments = payments.filter(p => p.created_at >= filters.startDate);
        }

        if (filters.endDate) {
            payments = payments.filter(p => p.created_at <= filters.endDate);
        }

        // Sort by created_at descending
        payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Add coin information
        payments = payments.map(payment => {
            const coin = data.coins.find(c => c.id === payment.coin_id);
            return {
                ...payment,
                coin_name: coin ? coin.name : null,
                symbol: coin ? coin.symbol : null
            };
        });

        // Apply limit and offset
        return payments.slice(offset, offset + limit);
    }

    getPaymentStats() {
        const data = this.readData();
        const payments = data.payments;

        const total = payments.length;
        const confirmed = payments.filter(p => p.confirmed === 1).length;
        const totalAmount = payments
            .filter(p => p.confirmed === 1)
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
            total,
            confirmed,
            pending: total - confirmed,
            totalAmount
        };
    }

    // Admin authentication methods
    authenticateAdmin(username, password) {
        const data = this.readData();
        const admin = data.admin_users.find(u => u.username === username);

        if (!admin) {
            return null;
        }

        if (bcrypt.compareSync(password, admin.password_hash)) {
            // Update last login
            admin.last_login = new Date().toISOString();
            this.writeData(data);

            return { id: admin.id, username: admin.username };
        }

        return null;
    }

    changeAdminPassword(adminId, newPassword) {
        const data = this.readData();
        const admin = data.admin_users.find(u => u.id === adminId);

        if (!admin) {
            return false;
        }

        const passwordHash = bcrypt.hashSync(newPassword, 10);
        admin.password_hash = passwordHash;
        this.writeData(data);

        return true;
    }

    // Admin logging
    logAdminAction(adminId, action, details, ipAddress) {
        const data = this.readData();

        // Get next ID
        const nextId = data.admin_logs.length > 0
            ? Math.max(...data.admin_logs.map(l => l.id)) + 1
            : 1;

        const log = {
            id: nextId,
            admin_id: adminId,
            action: action,
            details: typeof details === 'string' ? details : JSON.stringify(details),
            ip_address: ipAddress,
            created_at: new Date().toISOString()
        };

        data.admin_logs.push(log);
        this.writeData(data);
    }

    getAdminLogs(limit = 100) {
        const data = this.readData();
        let logs = [...data.admin_logs];

        // Sort by created_at descending
        logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Add username
        logs = logs.map(log => {
            const admin = data.admin_users.find(u => u.id === log.admin_id);
            return {
                ...log,
                username: admin ? admin.username : null
            };
        });

        return logs.slice(0, limit);
    }

    close() {
        // No-op for JSON storage
    }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
    if (!dbInstance) {
        dbInstance = new DatabaseManager();
    }
    return dbInstance;
}

module.exports = { getDatabase, DatabaseManager };
