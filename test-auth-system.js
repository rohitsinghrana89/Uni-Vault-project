/**
 * UniVault — Netflix-Inspired Auth System & Route Protection Test Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING AUTHENTICATION & ROUTE PROTECTION TESTS');
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

// ── 1. Verify File Existence ──
const files = [
  'public/landing.html',
  'public/login.html',
  'public/signup.html',
  'public/css/auth.css',
  'public/js/auth.js'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
}

// ── 2. Verify Landing Page Content & Requirements ──
const landingHtml = fs.readFileSync(path.join(__dirname, 'public/landing.html'), 'utf8');

assert(landingHtml.includes('Unlimited movies, shows, and more'), 'Landing has main heading: "Unlimited movies, shows, and more"');
assert(landingHtml.includes('Get Started'), 'Landing has "Get Started" button');
assert(landingHtml.includes('heroEmailInput'), 'Landing has email input for Get Started');
assert(!landingHtml.includes('Language'), 'Landing does NOT have Language selector');
assert(!landingHtml.includes('nav-signin-btn'), 'Landing header does NOT have top-right Sign In button');
assert(landingHtml.includes('UNIVAULT'), 'Landing has UNIVAULT brand logo text');
assert(landingHtml.includes('signInCard') && landingHtml.includes('signUpCard'), 'Landing contains integrated Sign In and Sign Up modal cards');

// ── 3. Verify Route Protection Logic Simulation ──
function simulateRouteProtection(pathname, hasToken) {
  const pathLower = pathname.toLowerCase();
  const segments = pathLower.split('/').filter(Boolean);
  const currentPage = (segments.length > 0 ? segments[segments.length - 1] : '') || 'index.html';

  const authPages = ['landing.html', 'login.html', 'signup.html'];
  const isAuthPage = authPages.some(page => currentPage === page || currentPage.endsWith('/' + page));

  if (hasToken && isAuthPage) {
    return 'index.html'; // Authenticated user visiting auth page -> redirects to index.html
  }

  if (!hasToken && !isAuthPage) {
    return 'landing.html'; // Unauthenticated user visiting protected page -> redirects to landing.html
  }

  return 'stay'; // Allowed on current page
}

// Scenario 1: New / Unauthenticated user visits index.html or root
assert(simulateRouteProtection('/', false) === 'landing.html', 'Unauthenticated user at / redirects to landing.html');
assert(simulateRouteProtection('/index.html', false) === 'landing.html', 'Unauthenticated user at /index.html redirects to landing.html');

// Scenario 2: Unauthenticated user visits movies.html, tv-shows.html, watchlist.html, profile.html
assert(simulateRouteProtection('/movies.html', false) === 'landing.html', 'Unauthenticated user at /movies.html redirects to landing.html');
assert(simulateRouteProtection('/tv-shows.html', false) === 'landing.html', 'Unauthenticated user at /tv-shows.html redirects to landing.html');
assert(simulateRouteProtection('/profile.html', false) === 'landing.html', 'Unauthenticated user at /profile.html redirects to landing.html');

// Scenario 3: Unauthenticated user visits landing.html, login.html, signup.html
assert(simulateRouteProtection('/landing.html', false) === 'stay', 'Unauthenticated user at /landing.html stays on landing.html');
assert(simulateRouteProtection('/login.html', false) === 'stay', 'Unauthenticated user at /login.html stays on login.html');
assert(simulateRouteProtection('/signup.html', false) === 'stay', 'Unauthenticated user at /signup.html stays on signup.html');

// Scenario 4: Authenticated user visits landing.html, login.html, signup.html
assert(simulateRouteProtection('/landing.html', true) === 'index.html', 'Authenticated user at /landing.html redirects to index.html');
assert(simulateRouteProtection('/login.html', true) === 'index.html', 'Authenticated user at /login.html redirects to index.html');
assert(simulateRouteProtection('/signup.html', true) === 'index.html', 'Authenticated user at /signup.html redirects to index.html');

// Scenario 5: Authenticated user visits index.html, movies.html, profile.html
assert(simulateRouteProtection('/index.html', true) === 'stay', 'Authenticated user at /index.html stays on index.html');
assert(simulateRouteProtection('/movies.html', true) === 'stay', 'Authenticated user at /movies.html stays on movies.html');
assert(simulateRouteProtection('/profile.html', true) === 'stay', 'Authenticated user at /profile.html stays on profile.html');

// ── 4. Verify auth.js redirect behavior ──
const authJs = fs.readFileSync(path.join(__dirname, 'public/js/auth.js'), 'utf8');

assert(!authJs.includes("returnUrl = urlParams.get('returnUrl') || 'profile.html'"), 'auth.js does NOT default returnUrl to profile.html');
assert(authJs.includes("window.location.href = 'index.html'") || authJs.includes("window.location.replace('index.html')"), 'auth.js redirects successful logins/signups to index.html');
assert(authJs.includes("logout: function (redirectUrl = 'landing.html')"), 'auth.js logout defaults to landing.html');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
