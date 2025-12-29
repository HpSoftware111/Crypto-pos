// Authentication middleware for admin routes

function requireAuth(req, res, next) {
    if (req.session && req.session.adminId) {
        // Touch session to reset expiration (rolling sessions)
        req.session.touch();
        return next();
    }
    
    res.status(401).json({ error: 'Authentication required' });
}

function requireAuthHTML(req, res, next) {
    if (req.session && req.session.adminId) {
        // Touch session to reset expiration (rolling sessions)
        req.session.touch();
        return next();
    }
    
    res.redirect('/admin/login');
}

module.exports = { requireAuth, requireAuthHTML };

