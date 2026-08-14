/**
 * UniVault — 3-Bar Section & Category Navigation Verification Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING UNIVAULT 3-BAR SYSTEM VERIFICATION');
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

// ── 1. Check CSS for 3-Bar Styling ──
const themeCss = fs.readFileSync(path.join(__dirname, 'public/css/netflix-theme.css'), 'utf8');

assert(themeCss.includes('.section-3bar'), 'netflix-theme.css defines .section-3bar component');
assert(themeCss.includes('.section-3bar span:nth-child(1)') && themeCss.includes('.section-3bar span:nth-child(2)') && themeCss.includes('.section-3bar span:nth-child(3)'), 'netflix-theme.css styles 3 distinct stacked accent bars');
assert(themeCss.includes('.category-3bar-nav'), 'netflix-theme.css defines .category-3bar-nav container');
assert(themeCss.includes('.category-3bar-tab'), 'netflix-theme.css defines .category-3bar-tab pills');

// ── 2. Check components.js ──
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');

assert(componentsJs.includes('section-3bar'), 'components.js renders .section-3bar in carousel section headers');
assert(componentsJs.includes('renderCategory3BarNav:'), 'components.js implements renderCategory3BarNav helper');
assert(componentsJs.includes('trailers.html') && componentsJs.includes('trending.html'), 'components.js drawer includes Trailers and Trending routes');

// ── 3. Check Section HTML Pages for 3-Bar Integration ──
const pages = [
  { file: 'public/index.html', name: 'Homepage' },
  { file: 'public/movies.html', name: 'Movies' },
  { file: 'public/tv-shows.html', name: 'TV Shows' },
  { file: 'public/anime.html', name: 'Anime' },
  { file: 'public/trailers.html', name: 'Trailers' },
  { file: 'public/trending.html', name: 'Trending' }
];

for (const p of pages) {
  const content = fs.readFileSync(path.join(__dirname, p.file), 'utf8');
  assert(content.includes('category3BarNav'), `${p.name} (${p.file}) includes #category3BarNav container`);
}

// ── 4. Check app.js Invocation ──
const appJs = fs.readFileSync(path.join(__dirname, 'public/js/app.js'), 'utf8');

assert(appJs.includes("Components.renderCategory3BarNav('category3BarNav', 'home')"), 'app.js renders 3-bar nav in initHomePage');
assert(appJs.includes("Components.renderCategory3BarNav('category3BarNav', 'movies')"), 'app.js renders 3-bar nav in initMoviesPage');
assert(appJs.includes("Components.renderCategory3BarNav('category3BarNav', 'tv')"), 'app.js renders 3-bar nav in initTVShowsPage');
assert(appJs.includes("Components.renderCategory3BarNav('category3BarNav', 'anime')"), 'app.js renders 3-bar nav in initAnimePage');
assert(appJs.includes("Components.renderCategory3BarNav('category3BarNav'"), 'app.js renders 3-bar nav in initTrendingPage');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
