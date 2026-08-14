/**
 * UniVault Database Adapter (db/database.js)
 * Bridges legacy calls to MongoDB Atlas Mongoose Models
 */
const User = require('../backend/models/User');
const Watchlist = require('../backend/models/Watchlist');
const RecentlyViewed = require('../backend/models/RecentlyViewed');
const { connectDB, mongoose } = require('../backend/db/database');

const db = {
    connectDB,
    mongoose,

    // ── User Methods ─────────────────────────────────────────────────────────
    findUserByEmail: async (email) => {
        if (!email) return null;
        return User.findOne({ email: email.trim().toLowerCase() });
    },

    findUserById: async (id) => {
        if (!id) return null;
        return User.findById(id).select('-password');
    },

    createUser: async ({ name, email, password }) => {
        const user = new User({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
        });
        return user.save();
    },

    // ── Watchlist Methods ───────────────────────────────────────────────────
    getWatchlist: async (userId) => {
        if (!userId) return [];
        return Watchlist.find({ userId }).sort({ createdAt: -1 });
    },

    addToWatchlist: async (userId, { tmdb_id, media_type = 'movie', title, poster }) => {
        if (!userId || !tmdb_id) throw new Error('userId and tmdb_id are required');
        return Watchlist.findOneAndUpdate(
            { userId, tmdb_id: Number(tmdb_id) },
            {
                userId,
                tmdb_id: Number(tmdb_id),
                media_type: media_type || 'movie',
                title: (title || 'Untitled').trim(),
                poster: poster || null
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    },

    removeFromWatchlist: async (userId, idOrTmdbId) => {
        if (!userId || !idOrTmdbId) return false;
        const numericId = Number(idOrTmdbId);
        const query = {
            userId,
            $or: [
                ...(isNaN(numericId) ? [] : [{ tmdb_id: numericId }]),
                ...(String(idOrTmdbId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: idOrTmdbId }] : [])
            ]
        };
        const result = await Watchlist.findOneAndDelete(query);
        return Boolean(result);
    },

    isInWatchlist: async (userId, tmdbId) => {
        if (!userId || !tmdbId) return false;
        const item = await Watchlist.findOne({ userId, tmdb_id: Number(tmdbId) });
        return Boolean(item);
    },

    // ── Recently Viewed Methods ─────────────────────────────────────────────
    addRecentlyViewed: async (userId, { tmdb_id, media_type = 'movie', title, poster }) => {
        if (!userId || !tmdb_id) throw new Error('userId and tmdb_id are required');
        return RecentlyViewed.findOneAndUpdate(
            { userId, tmdb_id: Number(tmdb_id) },
            {
                userId,
                tmdb_id: Number(tmdb_id),
                media_type: media_type || 'movie',
                title: (title || 'Untitled').trim(),
                poster: poster || null,
                viewed_at: new Date()
            },
            { upsert: true, new: true }
        );
    },

    getRecentlyViewed: async (userId, limit = 10) => {
        if (!userId) return [];
        return RecentlyViewed.find({ userId })
            .sort({ viewed_at: -1 })
            .limit(Number(limit) || 10);
    },

    clearRecentlyViewed: async (userId) => {
        if (!userId) return false;
        const res = await RecentlyViewed.deleteMany({ userId });
        return res.acknowledged;
    }
};

module.exports = db;
