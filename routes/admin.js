const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { requireAuth } = require('../middleware/auth');

// Admin login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const db = getDatabase();
        const admin = db.authenticateAdmin(username, password);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        req.session.adminId = admin.id;
        req.session.username = admin.username;

        // Log login action
        db.logAdminAction(admin.id, 'LOGIN', { username }, req.ip);

        // Explicitly save session (important for serverless environments)
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to create session' });
            }

            res.json({
                success: true,
                admin: {
                    id: admin.id,
                    username: admin.username
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin logout
router.post('/logout', requireAuth, (req, res) => {
    const sessionId = req.sessionID;
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        
        // Clear cookie explicitly
        res.clearCookie('crypto-pos.sid', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            path: '/'
        });
        
        res.json({ success: true });
    });
});

// Check authentication status
router.get('/auth/status', (req, res) => {
    // Debug logging (remove in production if needed)
    if (process.env.DEBUG_SESSIONS === 'true') {
        console.log('Session check:', {
            hasSession: !!req.session,
            adminId: req.session?.adminId,
            username: req.session?.username,
            cookie: req.headers.cookie ? 'present' : 'missing',
            protocol: req.protocol,
            secure: req.secure
        });
    }

    if (req.session && req.session.adminId) {
        // Touch session to reset expiration (rolling sessions)
        req.session.touch();
        
        res.json({
            authenticated: true,
            admin: {
                id: req.session.adminId,
                username: req.session.username
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Get all coins
router.get('/coins', requireAuth, (req, res) => {
    try {
        const db = getDatabase();
        const coins = db.getAllCoins();
        res.json({ coins });
    } catch (error) {
        console.error('Error fetching coins:', error);
        res.status(500).json({ error: 'Failed to fetch coins' });
    }
});

// Get single coin
router.get('/coins/:id', requireAuth, (req, res) => {
    try {
        const db = getDatabase();
        const coin = db.getCoinById(req.params.id);

        if (!coin) {
            return res.status(404).json({ error: 'Coin not found' });
        }

        res.json({ coin });
    } catch (error) {
        console.error('Error fetching coin:', error);
        res.status(500).json({ error: 'Failed to fetch coin' });
    }
});

// Create new coin
router.post('/coins', requireAuth, (req, res) => {
    try {
        const coinData = req.body;

        // Validation
        if (!coinData.id || !coinData.name || !coinData.symbol || !coinData.method_code) {
            return res.status(400).json({ error: 'Missing required fields: id, name, symbol, method_code' });
        }

        const db = getDatabase();

        // Check if coin already exists
        const existing = db.getCoinById(coinData.id);
        if (existing) {
            return res.status(400).json({ error: 'Coin with this ID already exists' });
        }

        const coin = db.createCoin(coinData);

        // Log action
        db.logAdminAction(req.session.adminId, 'CREATE_COIN', { coinId: coin.id }, req.ip);

        res.json({ coin, message: 'Coin created successfully' });
    } catch (error) {
        console.error('Error creating coin:', error);
        res.status(500).json({ error: 'Failed to create coin' });
    }
});

// Update coin
router.put('/coins/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const db = getDatabase();
        const existing = db.getCoinById(id);

        if (!existing) {
            return res.status(404).json({ error: 'Coin not found' });
        }

        const coin = db.updateCoin(id, updates);

        // Log action
        db.logAdminAction(req.session.adminId, 'UPDATE_COIN', { coinId: id, updates }, req.ip);

        res.json({ coin, message: 'Coin updated successfully' });
    } catch (error) {
        console.error('Error updating coin:', error);
        res.status(500).json({ error: 'Failed to update coin' });
    }
});

// Delete coin
router.delete('/coins/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const coin = db.getCoinById(id);
        if (!coin) {
            return res.status(404).json({ error: 'Coin not found' });
        }

        db.deleteCoin(id);

        // Log action
        db.logAdminAction(req.session.adminId, 'DELETE_COIN', { coinId: id }, req.ip);

        res.json({ message: 'Coin deleted successfully' });
    } catch (error) {
        console.error('Error deleting coin:', error);
        res.status(500).json({ error: 'Failed to delete coin' });
    }
});

// Toggle coin enabled status
router.post('/coins/:id/toggle', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const db = getDatabase();
        const coin = db.toggleCoinEnabled(id, enabled);

        if (!coin) {
            return res.status(404).json({ error: 'Coin not found' });
        }

        // Log action
        db.logAdminAction(req.session.adminId, 'TOGGLE_COIN', { coinId: id, enabled }, req.ip);

        res.json({ coin, message: `Coin ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
        console.error('Error toggling coin:', error);
        res.status(500).json({ error: 'Failed to toggle coin' });
    }
});

// Get payments
router.get('/payments', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const filters = {
            status: req.query.status,
            coinId: req.query.coinId,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const db = getDatabase();
        const payments = db.getPayments(limit, offset, filters);

        res.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get payment statistics
router.get('/stats', requireAuth, (req, res) => {
    try {
        const db = getDatabase();
        const stats = db.getPaymentStats();
        const coinCount = db.getAllCoins().length;
        const enabledCoinCount = db.getEnabledCoins().length;

        res.json({
            payments: stats,
            coins: {
                total: coinCount,
                enabled: enabledCoinCount,
                disabled: coinCount - enabledCoinCount
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Change admin password
router.post('/change-password', requireAuth, (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const db = getDatabase();
        const admin = db.authenticateAdmin(req.session.username, currentPassword);

        if (!admin) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        db.changeAdminPassword(req.session.adminId, newPassword);

        // Log action
        db.logAdminAction(req.session.adminId, 'CHANGE_PASSWORD', {}, req.ip);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Get admin logs
router.get('/logs', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const db = getDatabase();
        const logs = db.getAdminLogs(limit);

        res.json({ logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;

