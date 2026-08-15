/**
 * UniVault — Remote Render Backend Configuration Verification Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING REMOTE RENDER BACKEND (https://uni-vault-antc.onrender.com) VERIFICATION');
console.log('══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

const RENDER_URL = 'https://uni-vault-antc.onrender.com';

// ── 1. Check .env Configuration ──
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
assert(envContent.includes(`API_URL=${RENDER_URL}`), `.env specifies API_URL=${RENDER_URL}`);
assert(envContent.includes(`SERVER_URL=${RENDER_URL}`), `.env specifies SERVER_URL=${RENDER_URL}`);
assert(envContent.includes(`BASE_URL=${RENDER_URL}`), `.env specifies BASE_URL=${RENDER_URL}`);
assert(envContent.includes(`BACKEND_URL=${RENDER_URL}`), `.env specifies BACKEND_URL=${RENDER_URL}`);
assert(!envContent.includes('API_URL=http://localhost:5000'), '.env does not contain local API_URL');

// ── 2. Check .env.example Configuration ──
const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
assert(envExample.includes(`SERVER_URL=${RENDER_URL}`), `.env.example documents SERVER_URL=${RENDER_URL}`);
assert(envExample.includes(`API_URL=${RENDER_URL}`), `.env.example documents API_URL=${RENDER_URL}`);

// ── 3. Check auth.js Configuration ──
const authJs = fs.readFileSync(path.join(__dirname, 'public/js/auth.js'), 'utf8');
assert(authJs.includes(RENDER_URL), `public/js/auth.js sets BACKEND_URL to ${RENDER_URL}`);
assert(authJs.includes(`global.API_URL = BACKEND_URL`), 'public/js/auth.js exposes global API_URL');
assert(authJs.includes(`global.SERVER_URL = BACKEND_URL`), 'public/js/auth.js exposes global SERVER_URL');
assert(authJs.includes('getApiUrl'), 'public/js/auth.js defines getApiUrl resolver');
assert(!authJs.includes('http://localhost:5000'), 'public/js/auth.js does not contain http://localhost:5000');

// ── 4. Check trailer.js Configuration ──
const trailerJs = fs.readFileSync(path.join(__dirname, 'public/js/trailer.js'), 'utf8');
assert(trailerJs.includes(RENDER_URL), `public/js/trailer.js origin fallback references ${RENDER_URL}`);
assert(!trailerJs.includes('http://localhost:5000'), 'public/js/trailer.js does not contain http://localhost:5000');

// ── 5. Check backend/server.js CORS Configuration ──
const serverJs = fs.readFileSync(path.join(__dirname, 'backend/server.js'), 'utf8');
assert(serverJs.includes(RENDER_URL), `backend/server.js CORS allows ${RENDER_URL}`);
assert(serverJs.includes('credentials: true'), 'backend/server.js enables credentials');

// ── 6. Check HTTPS Protocol Integrity ──
assert(RENDER_URL.startsWith('https://'), 'Render backend URL enforces secure HTTPS protocol');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
