const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RecentlyViewed = require('../models/RecentlyViewed');
const { authenticateToken } = require('../middleware/auth');

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 1. GET /api/user/me
 * Retrieve authenticated user profile from MongoDB
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || '👤',
                subscription: user.subscription || { plan: 'Free', status: 'active', billing: 'monthly' },
                created_at: user.createdAt,
                updated_at: user.updatedAt
            }
        });
    } catch (err) {
        console.error('❌ [GET /api/user/me Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching user profile.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 2. PUT /api/user/profile
 * Update authenticated user name or avatar in MongoDB
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updates = {};
        if (name && typeof name === 'string' && name.trim().length >= 2) {
            updates.name = name.trim();
        }
        if (avatar && typeof avatar === 'string') {
            updates.avatar = avatar.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid update fields provided.'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully ✓',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || '👤',
                subscription: user.subscription || { plan: 'Free', status: 'active', billing: 'monthly' },
                created_at: user.createdAt
            }
        });
    } catch (err) {
        console.error('❌ [PUT /api/user/profile Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 3. GET /api/user/recently-viewed
 * Retrieve latest recently viewed items for authenticated user
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/recently-viewed', authenticateToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
        const items = await RecentlyViewed.find({ userId: req.user.id })
            .sort({ viewed_at: -1 })
            .limit(limit);

        const formattedItems = items.map(item => ({
            id: item.tmdb_id,
            tmdb_id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            poster: item.poster,
            viewed_at: item.viewed_at
        }));

        return res.status(200).json({
            success: true,
            count: formattedItems.length,
            items: formattedItems
        });
    } catch (err) {
        console.error('❌ [GET /api/user/recently-viewed Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve recently viewed history.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 4. POST /api/user/recently-viewed
 * Record a viewed title in MongoDB
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/recently-viewed', authenticateToken, async (req, res) => {
    try {
        const { tmdb_id, media_type, title, poster } = req.body;
        if (!tmdb_id) {
            return res.status(400).json({
                success: false,
                message: 'tmdb_id is required.'
            });
        }

        const numericId = Number(tmdb_id);
        const userId = req.user.id;

        const item = await RecentlyViewed.findOneAndUpdate(
            { userId, tmdb_id: numericId },
            {
                userId,
                tmdb_id: numericId,
                media_type: media_type || 'movie',
                title: (title || 'Untitled').trim(),
                poster: poster || null,
                viewed_at: new Date()
            },
            { upsert: true, new: true }
        );

        return res.status(201).json({
            success: true,
            message: 'Recorded recently viewed',
            item
        });
    } catch (err) {
        console.error('❌ [POST /api/user/recently-viewed Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to record recently viewed item.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 5. DELETE /api/user/recently-viewed
 * Clear recently viewed history in MongoDB
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.delete('/recently-viewed', authenticateToken, async (req, res) => {
    try {
        await RecentlyViewed.deleteMany({ userId: req.user.id });
        return res.status(200).json({
            success: true,
            message: 'Recently viewed history cleared'
        });
    } catch (err) {
        console.error('❌ [DELETE /api/user/recently-viewed Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear recently viewed history.'
        });
    }
});

module.exports = router;
