/**
 * UniVault — Mobile 3-Bar Navigation & Icon Button Verification Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING MOBILE 3-BAR NAVIGATION & ICON VERIFICATION');
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

// ── 1. Check CSS Breakpoints & Default Hidden Visibility ──
const navbarCss = fs.readFileSync(path.join(__dirname, 'public/css/navbar.css'), 'utf8');

assert(navbarCss.includes('@media (max-width: 768px)'), 'navbar.css contains 768px mobile breakpoint');
assert(navbarCss.includes('.nav-links-desktop') && navbarCss.includes('display: none !important'), 'navbar.css immediately hides desktop navigation on mobile with CSS (zero flash)');
assert(navbarCss.includes('.nav-hamburger-btn') && navbarCss.includes('display: inline-flex !important'), 'navbar.css shows 3-bar hamburger on mobile');
assert(navbarCss.includes('@media (min-width: 769px)'), 'navbar.css defines desktop breakpoint');
assert(navbarCss.includes('display: none !important') && navbarCss.includes('.nav-hamburger-btn'), 'navbar.css hides hamburger on desktop');
assert(navbarCss.includes('.mobile-drawer-overlay') && navbarCss.includes('visibility: hidden'), 'navbar.css hides mobile drawer overlay by default');
assert(navbarCss.includes('.mobile-drawer-overlay.active') && navbarCss.includes('visibility: visible'), 'navbar.css reveals mobile drawer when active');
assert(navbarCss.includes('.drawer-link-icon'), 'navbar.css styles dedicated .drawer-link-icon badge');

// ── 2. Check Drawer Content & Icon Buttons in components.js ──
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');

assert(componentsJs.includes('class="drawer-section-label">Navigation</div>'), 'components.js includes Navigation label in 3-bar drawer');
assert(componentsJs.includes('drawer-link-icon">🏠</span>') && componentsJs.includes('Home</span>'), 'drawer contains 🏠 Home button');
assert(componentsJs.includes('drawer-link-icon">🎬</span>') && componentsJs.includes('Movies</span>'), 'drawer contains 🎬 Movies button');
assert(componentsJs.includes('drawer-link-icon">📺</span>') && componentsJs.includes('TV Shows</span>'), 'drawer contains 📺 TV Shows button');
assert(componentsJs.includes('drawer-link-icon">⚡</span>') && componentsJs.includes('Anime</span>'), 'drawer contains ⚡ Anime button');
assert(componentsJs.includes('drawer-link-icon">🎥</span>') && componentsJs.includes('Trailers</span>'), 'drawer contains 🎥 Trailers button');
assert(componentsJs.includes('drawer-link-icon">🔥</span>') && componentsJs.includes('Trending</span>'), 'drawer contains 🔥 Trending button');
assert(componentsJs.includes('drawer-link-icon">❤️</span>') && componentsJs.includes('My List</span>'), 'drawer contains ❤️ My List button');
assert(componentsJs.includes('drawer-link-icon">🔍</span>') && componentsJs.includes('Search</span>'), 'drawer contains 🔍 Search button');
assert(componentsJs.includes('drawer-link-icon">👤</span>') && componentsJs.includes('Profile</span>'), 'drawer contains 👤 Profile button');
assert(componentsJs.includes('drawer-link-icon">⏱️</span>') && componentsJs.includes('Watch History</span>'), 'drawer contains ⏱️ Watch History button');
assert(componentsJs.includes('drawer-link-icon">⭐</span>') && componentsJs.includes('VIP Subscription</span>'), 'drawer contains ⭐ VIP Subscription button');
assert(componentsJs.includes('id="drawerLogoutBtn"') && componentsJs.includes('🚪'), 'drawer contains 🚪 Sign Out button');

// ── 3. Check Drawer Interactions ──
assert(componentsJs.includes("openMobileDrawer") && componentsJs.includes("closeMobileDrawer"), 'components.js implements drawer open/close controller');
assert(componentsJs.includes("icon.textContent = '✕'") && componentsJs.includes("icon.textContent = '☰'"), 'components.js toggles hamburger between ☰ and ✕');
assert(componentsJs.includes("e.key === 'Escape'"), 'components.js closes drawer on Escape key');
assert(componentsJs.includes("document.querySelectorAll('.drawer-links a')"), 'components.js auto-closes drawer on link tap');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
