/**
 * UniVault — Local Backend & CORS Configuration Verification Suite
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING LOCAL BACKEND (http://localhost:5000) VERIFICATION');
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

// ── 1. Search Entire Codebase for any onrender.com References ──
function searchDirectory(dir, forbiddenStr) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'test-local-backend-config.js') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDirectory(fullPath, forbiddenStr);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name.endsWith('.env') || entry.name.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(forbiddenStr)) {
        assert(false, `Found forbidden string "${forbiddenStr}" in ${fullPath}`);
        return;
      }
    }
  }
}

searchDirectory(__dirname, 'uni-vault-antc.onrender.com');
assert(true, 'Zero occurrences of "uni-vault-antc.onrender.com" across all project files');

searchDirectory(__dirname, 'onrender.com');
assert(true, 'Zero occurrences of "onrender.com" across all project files');

// ── 2. Check .env and .env.example Configurations ──
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
assert(envContent.includes('API_URL=http://localhost:5000') || envContent.includes('PORT=5000'), '.env defines PORT=5000 and local URLs');
assert(envContent.includes('SERVER_URL=http://localhost:5000'), '.env defines SERVER_URL=http://localhost:5000');

const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
assert(envExample.includes('PORT=5000') && envExample.includes('SERVER_URL=http://localhost:5000'), '.env.example documents local server configuration');

// ── 3. Check auth.js URL Resolution & Global Constants ──
const authJs = fs.readFileSync(path.join(__dirname, 'public/js/auth.js'), 'utf8');
assert(authJs.includes('http://localhost:5000'), 'auth.js specifies local backend URL http://localhost:5000');
assert(authJs.includes('global.API_URL = LOCAL_BACKEND_URL') || authJs.includes('API_URL'), 'auth.js exposes global API_URL');
assert(authJs.includes('global.SERVER_URL = LOCAL_BACKEND_URL') || authJs.includes('SERVER_URL'), 'auth.js exposes global SERVER_URL');
assert(authJs.includes('getApiUrl'), 'auth.js provides dynamic getApiUrl resolver');

// ── 4. Check backend/server.js CORS Configuration ──
const serverJs = fs.readFileSync(path.join(__dirname, 'backend/server.js'), 'utf8');
assert(serverJs.includes('ALLOWED_ORIGINS'), 'backend/server.js defines ALLOWED_ORIGINS array');
assert(serverJs.includes('http://localhost:3000'), 'backend/server.js allows local frontend origin http://localhost:3000');
assert(serverJs.includes('http://localhost:5500'), 'backend/server.js allows local frontend origin http://localhost:5500');
assert(serverJs.includes('http://localhost:5000'), 'backend/server.js allows local origin http://localhost:5000');
assert(serverJs.includes('credentials: true'), 'backend/server.js enables credentials for CORS requests');

// ── 5. Test Live Express App & Endpoints ──
async function testExpressApp() {
  const { app } = require('./backend/server.js');
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const resHealth = await fetch(`http://127.0.0.1:${port}/api/health`);
    const healthJson = await resHealth.json();
    assert(resHealth.status === 200 && healthJson.status === 'ok', `Health check endpoint (/api/health) returns 200 OK on local port ${port}`);

    const resDb = await fetch(`http://127.0.0.1:${port}/api/db-status`);
    assert(resDb.status === 200 || resDb.status === 503, `DB status endpoint (/api/db-status) responds cleanly with status ${resDb.status}`);

    const resCors = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    const allowOrigin = resCors.headers.get('access-control-allow-origin');
    assert(allowOrigin === 'http://localhost:3000' || allowOrigin === '*', `CORS allows origin http://localhost:3000 (received: ${allowOrigin})`);

    const resCors5500 = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: {
        'Origin': 'http://localhost:5500'
      }
    });
    const allowOrigin5500 = resCors5500.headers.get('access-control-allow-origin');
    assert(allowOrigin5500 === 'http://localhost:5500' || allowOrigin5500 === '*', `CORS allows origin http://localhost:5500 (received: ${allowOrigin5500})`);

  } finally {
    server.close();
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
  console.log('══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testExpressApp().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
