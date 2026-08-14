const path = require('path');
const fs = require('fs');

// ── Load Environment Variables ──────────────────────────────────────────────
const rootEnvPath = path.join(__dirname, '..', '.env');
const localEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
} else {
    require('dotenv').config();
}

const { connectDB, mongoose } = require('./db/database');

async function testConnection() {
    console.log('══════════════════════════════════════════════════════════');
    console.log(' 🧪 TESTING MONGODB ATLAS CONNECTION');
    console.log('══════════════════════════════════════════════════════════');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not set in your .env file.');
        console.error('👉 Please add MONGODB_URI to backend/.env and retry.');
        process.exit(1);
    }

    // Mask password in logs
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:******@');
    console.log(`🔌 Connecting to: ${maskedUri}`);

    try {
        const conn = await connectDB();
        if (!conn) {
            console.error('\n❌ Could not establish connection to MongoDB Atlas.');
            process.exit(1);
        }

        // Ping database admin to verify round-trip command execution
        const pingResult = await mongoose.connection.db.admin().ping();
        console.log('⚡ Ping result:', pingResult);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log(`📚 Existing Collections (${collectionNames.length}):`, collectionNames.length > 0 ? collectionNames.join(', ') : '(empty database ready for use)');

        console.log('\n══════════════════════════════════════════════════════════');
        console.log(' ✅ MongoDB Atlas is CONNECTED and READY for production!');
        console.log('══════════════════════════════════════════════════════════\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\n❌ MongoDB Connection Test Failed:', err.message || err);
        console.error('💡 Please verify:');
        console.error('   1. MongoDB Atlas Network Access whitelist (allow 0.0.0.0/0).');
        console.error('   2. Database username & password in backend/.env.');
        console.error('   3. Cluster hostname (e.g. cluster0.rlxyyrx.mongodb.net).\n');
        process.exit(1);
    }
}

testConnection();
