const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'univault-jwt-secret-dev';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the Authorization header
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authorization token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
}

module.exports = {
    authenticateToken,
    JWT_SECRET
};
