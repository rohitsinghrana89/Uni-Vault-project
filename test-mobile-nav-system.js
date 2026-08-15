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

// ── 2. Check Drawer Content & SVG Icon Buttons in components.js ──
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');

assert(componentsJs.includes('class="drawer-section-label">Navigation</div>'), 'components.js includes Navigation label in 3-bar drawer');
assert(componentsJs.includes('href="index.html"') && componentsJs.includes('Home</span>') && componentsJs.includes('icons.home'), 'drawer contains SVG Home button');
assert(componentsJs.includes('href="movies.html"') && componentsJs.includes('Movies</span>') && componentsJs.includes('icons.film'), 'drawer contains SVG Movies button');
assert(componentsJs.includes('href="tv-shows.html"') && componentsJs.includes('TV Shows</span>') && componentsJs.includes('icons.tv'), 'drawer contains SVG TV Shows button');
assert(componentsJs.includes('href="anime.html"') && componentsJs.includes('Anime</span>') && componentsJs.includes('icons.sparkles'), 'drawer contains SVG Anime button');
assert(componentsJs.includes('href="trailers.html"') && componentsJs.includes('icons.trailer'), 'drawer contains SVG Trailers button');
assert(componentsJs.includes('href="trending.html"') && componentsJs.includes('icons.trending'), 'drawer contains SVG Trending button');
assert(componentsJs.includes('href="watchlist.html"') && componentsJs.includes('icons.heart'), 'drawer contains SVG My List button');
assert(componentsJs.includes('href="search.html"') && componentsJs.includes('icons.search'), 'drawer contains SVG Search button');
assert(componentsJs.includes('href="profile.html"') && componentsJs.includes('icons.user'), 'drawer contains SVG Profile button');
assert(componentsJs.includes('href="subscription.html"') && componentsJs.includes('icons.vip'), 'drawer contains SVG VIP Subscription button');
assert(componentsJs.includes('id="drawerLogoutBtn"') && componentsJs.includes('icons.logout'), 'drawer contains SVG Sign Out button');

// ── 3. Check Drawer Interactions & 3-Bar Morphing ──
assert(componentsJs.includes("openMobileDrawer") && componentsJs.includes("closeMobileDrawer"), 'components.js implements drawer open/close controller');
assert(componentsJs.includes('aria-expanded') && componentsJs.includes('hamburger-bar'), 'components.js controls 3-bar morphing hamburger without emoji');
assert(componentsJs.includes("e.key === 'Escape'"), 'components.js closes drawer on Escape key');
assert(componentsJs.includes("document.querySelectorAll('.drawer-links a')"), 'components.js auto-closes drawer on link tap');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
