const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ── 1. Load Environment Variables ───────────────────────────────────────────
const localEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
} else {
    require('dotenv').config();
}

// ── 2. Database Connection Module ───────────────────────────────────────────
const { connectDB, mongoose } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ── 3. CORS & Body Parser Middleware ────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://uni-vault-antc.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5500',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman, or file://)
        if (!origin) return callback(null, true);
        if (
            ALLOWED_ORIGINS.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            process.env.NODE_ENV !== 'production'
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// ── 4. Security & CSP Headers (Production-Safe for YouTube Embeds & TMDB) ───
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: https://image.tmdb.org https://images.unsplash.com https://i.ytimg.com https://*.ytimg.com https://*.youtube.com https://via.placeholder.com; " +
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; " +
        "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; " +
        "connect-src 'self' https://api.themoviedb.org https://image.tmdb.org https://www.youtube.com https://*.google.com https://*.googlevideo.com; " +
        "media-src 'self' https: blob:; " +
        "object-src 'none';"
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── 5. API Routes ───────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const watchlistRoutes = require('./routes/watchlist');
app.use('/api/watchlist', watchlistRoutes);

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// TMDB proxy route
try {
    const tmdbRoutes = require('../routes/tmdb');
    app.use('/api/tmdb', tmdbRoutes);
} catch (e) {
    console.warn('⚠️  [Server] TMDB proxy router not mounted:', e.message);
}

// ── 6. Health & Database Status Endpoints ────────────────────────────────────
app.get('/api/health', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = mongoose.connection.readyState;
    res.json({
        status: 'ok',
        service: 'UniVault Backend (MongoDB)',
        database: states[dbState] || 'unknown',
        databaseConnected: dbState === 1,
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/db-status', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;

    res.status(isConnected ? 200 : 503).json({
        success: isConnected,
        database: 'MongoDB Atlas',
        status: states[dbState] || 'unknown',
        readyState: dbState,
        host: isConnected ? mongoose.connection.host : null,
        databaseName: isConnected ? (mongoose.connection.name || 'univault') : null,
        timestamp: new Date().toISOString()
    });
});

// ── 7. Frontend SPA Fallback ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── 8. Start Server After Database Connection ───────────────────────────────
async function startServer() {
    console.log('🔄 [UniVault] Connecting to MongoDB Atlas before launching server...');
    const dbConn = await connectDB();

    if (!dbConn) {
        console.warn('⚠️  [UniVault WARNING] MongoDB is currently unavailable or connecting in degraded mode.');
        console.warn('👉 Please verify MONGODB_URI and MongoDB Atlas Network Access IP Whitelist (0.0.0.0/0).');
    }

    const server = app.listen(PORT, () => {
        console.log('====================================================');
        console.log(` 🚀 UniVault MongoDB Backend Running on port ${PORT}`);
        console.log(` 🌐 Local: http://localhost:${PORT}`);
        console.log(` 📊 Health Check: http://localhost:${PORT}/api/health`);
        console.log(` 💾 DB Status:    http://localhost:${PORT}/api/db-status`);
        console.log('====================================================');
    });

    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = { app, connectDB, startServer };
