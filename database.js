const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

class DatabaseManager {
    constructor() {
        const dbPath = path.join(__dirname, 'crypto_pos.db');
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL'); // Better performance
        this.initDatabase();
    }

    initDatabase() {
        // Create coins table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS coins (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                symbol TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                network TEXT DEFAULT 'mainnet',
                wallet_address TEXT,
                api_url TEXT,
                api_key TEXT,
                contract_address TEXT,
                confirmations_required INTEGER DEFAULT 1,
                icon TEXT,
                decimals INTEGER DEFAULT 18,
                method_code TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create admin_users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )
        `);

        // Create payments table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                payment_id TEXT UNIQUE NOT NULL,
                coin_id TEXT NOT NULL,
                method TEXT NOT NULL,
                amount REAL NOT NULL,
                address TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                confirmed INTEGER DEFAULT 0,
                tx_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                confirmed_at DATETIME,
                FOREIGN KEY (coin_id) REFERENCES coins(id)
            )
        `);

        // Create admin_logs table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admin_users(id)
            )
        `);

        // Initialize default admin user if not exists
        this.initDefaultAdmin();

        // Migrate existing coins if database is empty
        this.migrateExistingCoins();
    }

    initDefaultAdmin() {
        const adminExists = this.db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
        
        if (adminExists.count === 0) {
            // Default admin: username='admin', password='admin123' (must be changed!)
            const defaultPassword = 'admin123';
            const passwordHash = bcrypt.hashSync(defaultPassword, 10);
            
            this.db.prepare(`
                INSERT INTO admin_users (username, password_hash)
                VALUES (?, ?)
            `).run('admin', passwordHash);
            
            console.log('⚠️  Default admin user created:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   ⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
        }
    }

    migrateExistingCoins() {
        const coinCount = this.db.prepare('SELECT COUNT(*) as count FROM coins').get();
        
        if (coinCount.count === 0) {
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
                    method_code: 'btc'
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
                    method_code: 'usdt-avax'
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
                    method_code: 'avax'
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
                    method_code: 'usdc-avax'
                }
            ];

            const insertCoin = this.db.prepare(`
                INSERT INTO coins (
                    id, name, symbol, enabled, network, wallet_address, api_url, api_key,
                    contract_address, confirmations_required, icon, decimals, method_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMany = this.db.transaction((coins) => {
                for (const coin of coins) {
                    insertCoin.run(
                        coin.id, coin.name, coin.symbol, coin.enabled, coin.network,
                        coin.wallet_address, coin.api_url, coin.api_key,
                        coin.contract_address, coin.confirmations_required,
                        coin.icon, coin.decimals, coin.method_code
                    );
                }
            });

            insertMany(defaultCoins);
            console.log('✅ Migrated existing coins to database');
        }
    }

    // Coin management methods
    getAllCoins() {
        return this.db.prepare('SELECT * FROM coins ORDER BY name').all();
    }

    getEnabledCoins() {
        return this.db.prepare('SELECT * FROM coins WHERE enabled = 1 ORDER BY name').all();
    }

    getCoinById(id) {
        return this.db.prepare('SELECT * FROM coins WHERE id = ?').get(id);
    }

    getCoinByMethodCode(methodCode) {
        return this.db.prepare('SELECT * FROM coins WHERE method_code = ? AND enabled = 1').get(methodCode);
    }

    createCoin(coinData) {
        const stmt = this.db.prepare(`
            INSERT INTO coins (
                id, name, symbol, enabled, network, wallet_address, api_url, api_key,
                contract_address, confirmations_required, icon, decimals, method_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            coinData.id, coinData.name, coinData.symbol, coinData.enabled || 1,
            coinData.network || 'mainnet', coinData.wallet_address, coinData.api_url,
            coinData.api_key, coinData.contract_address, coinData.confirmations_required || 1,
            coinData.icon, coinData.decimals || 18, coinData.method_code
        );

        return this.getCoinById(coinData.id);
    }

    updateCoin(id, coinData) {
        const fields = [];
        const values = [];

        Object.keys(coinData).forEach(key => {
            if (key !== 'id' && coinData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(coinData[key]);
            }
        });

        if (fields.length === 0) return this.getCoinById(id);

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE coins SET ${fields.join(', ')} WHERE id = ?`;
        this.db.prepare(sql).run(...values);

        return this.getCoinById(id);
    }

    deleteCoin(id) {
        return this.db.prepare('DELETE FROM coins WHERE id = ?').run(id);
    }

    toggleCoinEnabled(id, enabled) {
        this.db.prepare('UPDATE coins SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(enabled ? 1 : 0, id);
        return this.getCoinById(id);
    }

    // Payment management methods
    createPayment(paymentData) {
        const stmt = this.db.prepare(`
            INSERT INTO payments (
                id, payment_id, coin_id, method, amount, address, status, confirmed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            paymentData.id || paymentData.paymentId,
            paymentData.paymentId,
            paymentData.coinId,
            paymentData.method,
            paymentData.amount,
            paymentData.address,
            paymentData.status || 'pending',
            paymentData.confirmed ? 1 : 0
        );

        return this.getPaymentById(paymentData.paymentId);
    }

    getPaymentById(paymentId) {
        return this.db.prepare('SELECT * FROM payments WHERE payment_id = ?').get(paymentId);
    }

    updatePayment(paymentId, updates) {
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                if (key === 'confirmed') {
                    fields.push(`${key} = ?`);
                    values.push(updates[key] ? 1 : 0);
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            }
        });

        if (fields.length === 0) return this.getPaymentById(paymentId);

        values.push(paymentId);
        const sql = `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`;
        this.db.prepare(sql).run(...values);

        return this.getPaymentById(paymentId);
    }

    getPayments(limit = 100, offset = 0, filters = {}) {
        let sql = 'SELECT p.*, c.name as coin_name, c.symbol FROM payments p LEFT JOIN coins c ON p.coin_id = c.id WHERE 1=1';
        const params = [];

        if (filters.status) {
            sql += ' AND p.status = ?';
            params.push(filters.status);
        }

        if (filters.coinId) {
            sql += ' AND p.coin_id = ?';
            params.push(filters.coinId);
        }

        if (filters.startDate) {
            sql += ' AND p.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND p.created_at <= ?';
            params.push(filters.endDate);
        }

        sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return this.db.prepare(sql).all(...params);
    }

    getPaymentStats() {
        const total = this.db.prepare('SELECT COUNT(*) as count FROM payments').get();
        const confirmed = this.db.prepare('SELECT COUNT(*) as count FROM payments WHERE confirmed = 1').get();
        const totalAmount = this.db.prepare('SELECT SUM(amount) as total FROM payments WHERE confirmed = 1').get();

        return {
            total: total.count,
            confirmed: confirmed.count,
            pending: total.count - confirmed.count,
            totalAmount: totalAmount.total || 0
        };
    }

    // Admin authentication methods
    authenticateAdmin(username, password) {
        const admin = this.db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
        
        if (!admin) {
            return null;
        }

        if (bcrypt.compareSync(password, admin.password_hash)) {
            // Update last login
            this.db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
                .run(admin.id);
            return { id: admin.id, username: admin.username };
        }

        return null;
    }

    changeAdminPassword(adminId, newPassword) {
        const passwordHash = bcrypt.hashSync(newPassword, 10);
        this.db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?')
            .run(passwordHash, adminId);
    }

    // Admin logging
    logAdminAction(adminId, action, details, ipAddress) {
        this.db.prepare(`
            INSERT INTO admin_logs (admin_id, action, details, ip_address)
            VALUES (?, ?, ?, ?)
        `).run(adminId, action, JSON.stringify(details), ipAddress);
    }

    getAdminLogs(limit = 100) {
        return this.db.prepare(`
            SELECT l.*, u.username 
            FROM admin_logs l 
            LEFT JOIN admin_users u ON l.admin_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT ?
        `).all(limit);
    }

    close() {
        this.db.close();
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

