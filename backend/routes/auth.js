const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'univault-jwt-secret-dev';

/**
 * Helper to verify database connectivity
 */
function isDatabaseConnected() {
    return mongoose.connection.readyState === 1;
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * POST /api/auth/signup
 * Register a new user in MongoDB
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/signup', async (req, res) => {
    try {
        if (!isDatabaseConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database is connecting or unreachable. Please check MongoDB Atlas Network Access (IP Whitelist 0.0.0.0/0).'
            });
        }

        const { name, email, password } = req.body;

        // 1. Validation: Name
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        // 2. Validation: Email
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // 3. Validation: Password
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // 4. Check for existing user with the same email
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // 5. Create new user (password is automatically hashed via Mongoose pre-save hook)
        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password
        });

        await user.save();

        // 6. Generate JWT for the newly created user
        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 7. Return response with token and user details (no password/hash)
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        // Handle MongoDB duplicate key error (code 11000)
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const firstError = Object.values(err.errors)[0]?.message || 'Validation error';
            return res.status(400).json({
                success: false,
                message: firstError
            });
        }

        console.error('❌ [Signup Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating account'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * POST /api/auth/login
 * Authenticate user credentials and return JWT token
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/login', async (req, res) => {
    try {
        if (!isDatabaseConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database is connecting or unreachable. Please check MongoDB Atlas Network Access (IP Whitelist 0.0.0.0/0).'
            });
        }

        const { email, password } = req.body;

        // 1. Validation: Email and Password
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || email.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find user by email in MongoDB
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 3. Compare candidate password with hashed password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 4. Generate JWT Token
        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Return success payload
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error('❌ [Login Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * GET /api/auth/me
 * Retrieve currently authenticated user profile
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                created_at: user.createdAt
            }
        });
    } catch (err) {
        console.error('❌ [Profile /me Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
