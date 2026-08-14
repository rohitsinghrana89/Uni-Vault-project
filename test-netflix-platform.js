/**
 * UniVault — Netflix-Style Platform Full Verification Test Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING UNIVAULT NETFLIX PLATFORM VERIFICATION SUITE');
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

// ── 1. Check all Rebuilt Platform Pages & Assets ──
const platformFiles = [
  'public/index.html',
  'public/movies.html',
  'public/tv-shows.html',
  'public/anime.html',
  'public/trending.html',
  'public/trailers.html',
  'public/search.html',
  'public/details.html',
  'public/watchlist.html',
  'public/profile.html',
  'public/landing.html',
  'public/login.html',
  'public/signup.html',
  'public/css/netflix-theme.css',
  'public/css/navbar.css',
  'public/css/auth.css',
  'public/js/tmdb-api.js',
  'public/js/components.js',
  'public/js/app.js',
  'public/js/auth.js',
  'public/images/logo.png'
];

for (const file of platformFiles) {
  const filePath = path.join(__dirname, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
}

// ── 2. Check CSS Theme Tokens ──
const themeCss = fs.readFileSync(path.join(__dirname, 'public/css/netflix-theme.css'), 'utf8');
assert(themeCss.includes('--bg-canvas: #0b0b0f') || themeCss.includes('--bg-canvas'), 'netflix-theme.css has dark background tokens');
assert(themeCss.includes('--accent-red: #E50914'), 'netflix-theme.css has signature red accent');
assert(themeCss.includes('.netflix-card'), 'netflix-theme.css contains .netflix-card component');
assert(themeCss.includes('.ranked-card'), 'netflix-theme.css contains .ranked-card component');
assert(themeCss.includes('.netflix-hero'), 'netflix-theme.css contains .netflix-hero component');
assert(themeCss.includes('.skeleton-shimmer'), 'netflix-theme.css contains skeleton shimmer animations');

// ── 3. Check Navbar Consistency ──
const navbarCss = fs.readFileSync(path.join(__dirname, 'public/css/navbar.css'), 'utf8');
assert(navbarCss.includes('.nav-search-box'), 'navbar.css has expandable search box styling');
assert(navbarCss.includes('.nav-profile-dropdown'), 'navbar.css has profile dropdown menu styling');
assert(navbarCss.includes('.mobile-drawer'), 'navbar.css has responsive mobile drawer');

// ── 4. Check TMDB Client Methods ──
const tmdbApiJs = fs.readFileSync(path.join(__dirname, 'public/js/tmdb-api.js'), 'utf8');
assert(tmdbApiJs.includes('getTrending:'), 'tmdb-api.js provides getTrending()');
assert(tmdbApiJs.includes('getPopularMovies:'), 'tmdb-api.js provides getPopularMovies()');
assert(tmdbApiJs.includes('getPopularTV:'), 'tmdb-api.js provides getPopularTV()');
assert(tmdbApiJs.includes('getAnime:'), 'tmdb-api.js provides getAnime()');
assert(tmdbApiJs.includes('getGenreContent:'), 'tmdb-api.js provides getGenreContent()');
assert(tmdbApiJs.includes('searchMulti:'), 'tmdb-api.js provides searchMulti()');
assert(tmdbApiJs.includes('getMovieDetails:') && tmdbApiJs.includes('getTVDetails:'), 'tmdb-api.js provides detail lookup methods');
assert(tmdbApiJs.includes('getTVSeasonEpisodes:'), 'tmdb-api.js provides TV season & episode lookup');

// ── 5. Check Components Module ──
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');
assert(componentsJs.includes('renderNavbar:'), 'components.js provides renderNavbar()');
assert(componentsJs.includes('renderFooter:'), 'components.js provides renderFooter()');
assert(componentsJs.includes('createMovieCard:'), 'components.js provides createMovieCard()');
assert(componentsJs.includes('createRankedCard:'), 'components.js provides createRankedCard()');
assert(componentsJs.includes('createCarousel:'), 'components.js provides createCarousel()');
assert(componentsJs.includes('openTrailerModal:'), 'components.js provides YouTube trailer modal');
assert(componentsJs.includes('toggleWatchlistButton:'), 'components.js provides watchlist toggle');

// ── 6. Check App Controller Page Routing ──
const appJs = fs.readFileSync(path.join(__dirname, 'public/js/app.js'), 'utf8');
assert(appJs.includes('initHomePage'), 'app.js includes homepage initializer');
assert(appJs.includes('initMoviesPage'), 'app.js includes movies page initializer');
assert(appJs.includes('initTVShowsPage'), 'app.js includes TV shows page initializer');
assert(appJs.includes('initAnimePage'), 'app.js includes anime page initializer');
assert(appJs.includes('initSearchPage'), 'app.js includes search page initializer');
assert(appJs.includes('initDetailsPage'), 'app.js includes details page initializer');
assert(appJs.includes('initWatchlistPage'), 'app.js includes watchlist page initializer');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
