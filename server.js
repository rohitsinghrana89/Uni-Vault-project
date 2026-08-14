/**
 * UniVault Server Entry Point
 * Delegates to MongoDB backend server (backend/server.js)
 */
const { app, connectDB, startServer } = require('./backend/server.js');

if (require.main === module) {
    startServer();
}

module.exports = { app, connectDB, startServer };
