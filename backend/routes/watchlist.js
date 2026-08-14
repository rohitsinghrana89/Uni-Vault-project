const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const { authenticateToken } = require('../middleware/auth');

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 1. POST /api/watchlist
 * Add a title to the authenticated user's MongoDB watchlist
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { tmdb_id, media_type, title, poster } = req.body;

        if (!tmdb_id) {
            return res.status(400).json({
                success: false,
                message: 'tmdb_id is required to bookmark title.'
            });
        }

        const numericTmdbId = Number(tmdb_id);
        const userId = req.user.id;

        // Upsert to handle existing bookmark gracefully without duplicate errors
        const item = await Watchlist.findOneAndUpdate(
            { userId, tmdb_id: numericTmdbId },
            {
                userId,
                tmdb_id: numericTmdbId,
                media_type: media_type || 'movie',
                title: (title || 'Untitled').trim(),
                poster: poster || null
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({
            success: true,
            message: 'Added to Watchlist ✓',
            item: {
                id: item._id.toString(),
                tmdb_id: item.tmdb_id,
                media_type: item.media_type,
                title: item.title,
                poster: item.poster,
                created_at: item.createdAt
            }
        });
    } catch (err) {
        console.error('❌ [Add to Watchlist Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to add title to watchlist.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 2. GET /api/watchlist
 * Fetch all watchlist titles for the authenticated user only
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Watchlist.find({ userId }).sort({ createdAt: -1 });

        const formattedItems = items.map(item => ({
            id: item._id.toString(),
            tmdb_id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            poster: item.poster,
            created_at: item.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formattedItems.length,
            items: formattedItems
        });
    } catch (err) {
        console.error('❌ [Get Watchlist Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve watchlist.'
        });
    }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 3. DELETE /api/watchlist/:tmdb_id
 * Remove a title from the authenticated user's MongoDB watchlist
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.delete('/:tmdb_id', authenticateToken, async (req, res) => {
    try {
        const rawId = req.params.tmdb_id;
        if (!rawId) {
            return res.status(400).json({
                success: false,
                message: 'Target tmdb_id is required.'
            });
        }

        const userId = req.user.id;
        const numericId = Number(rawId);

        // Delete by tmdb_id (or _id if passed) belonging exclusively to this user
        const query = {
            userId,
            $or: [
                ...(isNaN(numericId) ? [] : [{ tmdb_id: numericId }]),
                ...(rawId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: rawId }] : [])
            ]
        };

        const result = await Watchlist.findOneAndDelete(query);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Watchlist entry not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Removed from Watchlist'
        });
    } catch (err) {
        console.error('❌ [Remove Watchlist Error]:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove title from watchlist.'
        });
    }
});

module.exports = router;
