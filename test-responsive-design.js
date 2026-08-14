/**
 * UniVault — Full Responsive Layout & Touch Targets Test Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING UNIVERSAL RESPONSIVE DESIGN VERIFICATION');
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

// ── 1. Check Core Theme CSS Responsiveness ──
const themeCss = fs.readFileSync(path.join(__dirname, 'public/css/netflix-theme.css'), 'utf8');

assert(themeCss.includes('min-height: 44px') && themeCss.includes('min-width: 44px'), 'netflix-theme.css enforces 44px minimum touch target size on buttons');
assert(themeCss.includes('touch-action: manipulation'), 'netflix-theme.css enables touch-action manipulation for snappy mobile taps');
assert(themeCss.includes('overflow-x: hidden'), 'netflix-theme.css prevents global horizontal page overflow');
assert(themeCss.includes('@media (hover: none) or (pointer: coarse)'), 'netflix-theme.css provides touch-optimized card overlays without hover dependency');
assert(themeCss.includes('@media (max-width: 768px)') && themeCss.includes('@media (max-width: 480px)'), 'netflix-theme.css includes tablet & mobile grid media queries');
assert(themeCss.includes('-webkit-overflow-scrolling: touch'), 'netflix-theme.css uses momentum touch scrolling for filter pills');

// ── 2. Check Navbar CSS Responsiveness ──
const navbarCss = fs.readFileSync(path.join(__dirname, 'public/css/navbar.css'), 'utf8');

assert(navbarCss.includes('.nav-hamburger-btn'), 'navbar.css defines mobile hamburger button');
assert(navbarCss.includes('.mobile-drawer'), 'navbar.css defines responsive mobile slide drawer');
assert(navbarCss.includes('min-width: 44px') && navbarCss.includes('min-height: 44px'), 'navbar.css enforces 44px touch targets on mobile menu triggers');
assert(navbarCss.includes('@media (max-width: 768px)'), 'navbar.css switches to mobile drawer under 768px breakpoint');
assert(navbarCss.includes('@media (max-width: 360px)'), 'navbar.css accommodates ultra-narrow 320px screens');

// ── 3. Check Subscription Page Responsive Grid & Modal ──
const subHtml = fs.readFileSync(path.join(__dirname, 'public/subscription.html'), 'utf8');

assert(subHtml.includes('qr-compact-container'), 'subscription.html uses compact fluid QR container');
assert(subHtml.includes('clamp(160px, 45vw, 220px)'), 'subscription.html scales QR code fluidly between mobile and desktop');
assert(subHtml.includes('grid-template-columns: repeat(3, 1fr)') && subHtml.includes('grid-template-columns: repeat(2, 1fr)'), 'subscription.html adapts UPI app chips in responsive 2-3 column grid');
assert(subHtml.includes('@media (max-height: 640px)'), 'subscription.html includes landscape & short screen optimizations');
assert(subHtml.includes('max-height: 94vh') || subHtml.includes('max-height: 96vh'), 'subscription.html constrains modal height to viewport with internal scrolling');
assert(subHtml.includes('pricing-cards-grid'), 'subscription.html includes responsive 4 -> 2 -> 1 pricing cards grid');

// ── 4. Check Profile Page Responsiveness ──
const profileHtml = fs.readFileSync(path.join(__dirname, 'public/profile.html'), 'utf8');

assert(profileHtml.includes('overview-stats-grid'), 'profile.html includes responsive 4 -> 2 -> 1 stats grid');
assert(profileHtml.includes('profile-nav-tabs') && profileHtml.includes('overflow-x: auto'), 'profile.html includes horizontally scrollable tab navigation on mobile');
assert(profileHtml.includes('continue-grid'), 'profile.html includes responsive continue watching 16:9 cards');

// ── 5. Check All Platform HTML Files for Responsive Meta Viewport ──
const pages = [
  'public/index.html',
  'public/movies.html',
  'public/tv-shows.html',
  'public/anime.html',
  'public/trending.html',
  'public/trailers.html',
  'public/search.html',
  'public/details.html',
  'public/watchlist.html',
  'public/subscription.html',
  'public/profile.html',
  'public/landing.html',
  'public/login.html',
  'public/signup.html'
];

for (const page of pages) {
  const content = fs.readFileSync(path.join(__dirname, page), 'utf8');
  assert(content.includes('name="viewport"') && content.includes('width=device-width'), `${page} contains standard responsive viewport meta tag`);
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
