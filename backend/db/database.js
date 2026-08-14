const mongoose = require('mongoose');

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🍃 MongoDB Atlas Connection Module (backend/db/database.js)
 * ═════════════════════════════════════════════════════════════════════════════
 * Connects to MongoDB Atlas using Mongoose with robust error handling,
 * automatic reconnects, timeout guards, and clear terminal logging.
 */

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI || mongoURI.includes('<db_username>') || mongoURI.includes('USERNAME:PASSWORD')) {
        console.error('❌ [MongoDB] MONGODB_URI is missing or contains placeholder values in .env.');
        console.error('👉 Please configure backend/.env with your valid MongoDB Atlas connection string:');
        console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.rlxyyrx.mongodb.net/univault?retryWrites=true&w=majority&appName=Cluster0');
        return null;
    }

    try {
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 45000
        });

        console.log(`✅ [MongoDB] Connected successfully to MongoDB Atlas!`);
        console.log(`📡 [MongoDB] Host: ${conn.connection.host} | Database: ${conn.connection.name || 'univault'}`);
        return conn;
    } catch (err) {
        console.error('❌ [MongoDB] Connection error:', err.message || err);
        console.error('💡 [MongoDB Troubleshooting Tips]:');
        console.error('   1. Verify your database username and password in .env.');
        console.error('   2. Ensure IP whitelist in MongoDB Atlas is set to allow access (Network Access -> 0.0.0.0/0).');
        console.error('   3. Ensure your internet connection is active.');
        return null;
    }
};

// ── Connection Event Handlers ────────────────────────────────────────────────
mongoose.connection.on('connected', () => {
    // Already logged on initial connect, but fires on reconnects
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  [MongoDB] Connection disconnected.');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ [MongoDB] Runtime connection error:', err.message || err);
});

module.exports = {
    connectDB,
    mongoose
};
