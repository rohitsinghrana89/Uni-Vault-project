/**
 * ===========================================================================
 * UniVault — Pagination & Responsive Grid Verification Test Suite
 * ===========================================================================
 * Verifies:
 * 1. Pagination component and markup generation in components.js
 * 2. TMDB API client pagination metadata enrichment in tmdb-api.js
 * 3. Page controllers in app.js for Movies, TV Shows, and Anime
 * 4. Containers in movies.html, tv-shows.html, anime.html
 * 5. CSS Grid column breakpoints (6 -> 5 -> 4 -> 3 -> 2) in netflix-theme.css
 * 6. Responsive pagination styles and horizontal overflow protection
 * 7. Global 3-bar navbar and zero-flash CSS media queries
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING UNIVAULT PAGINATION & RESPONSIVE GRID TESTS');
console.log('══════════════════════════════════════════════════════════\n');

// 1. Check components.js for renderPagination
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');
assert(componentsJs.includes('renderPagination:'), 'components.js defines renderPagination helper');
assert(componentsJs.includes('pagination-container'), 'renderPagination renders .pagination-container');
assert(componentsJs.includes('pagination-btn'), 'renderPagination renders .pagination-btn items');
assert(componentsJs.includes('prev-btn'), 'renderPagination generates Previous button');
assert(componentsJs.includes('next-btn'), 'renderPagination generates Next button');
assert(componentsJs.includes('pagination-ellipsis'), 'renderPagination generates ellipsis for long page lists');
assert(componentsJs.includes('pagination-desktop-only'), 'renderPagination tags outer pages with pagination-desktop-only for mobile responsiveness');

// 2. Check tmdb-api.js for pagination enrichment
const tmdbApiJs = fs.readFileSync(path.join(__dirname, 'public/js/tmdb-api.js'), 'utf8');
assert(tmdbApiJs.includes('_wrapResults:'), 'tmdb-api.js defines _wrapResults helper');
assert(tmdbApiJs.includes('total_pages'), 'tmdb-api.js enriches results with total_pages');
assert(tmdbApiJs.includes('getPopularMovies: async function (page'), 'getPopularMovies accepts page parameter');
assert(tmdbApiJs.includes('getPopularTV: async function (page'), 'getPopularTV accepts page parameter');
assert(tmdbApiJs.includes('getAnime: async function (category = \'popular\', page'), 'getAnime accepts category, page, and sortBy parameters');
assert(tmdbApiJs.includes('getGenreContent: async function (mediaType'), 'getGenreContent supports mediaType, genreId, page, sortBy');

// 3. Check app.js for controllers and URL sync
const appJs = fs.readFileSync(path.join(__dirname, 'public/js/app.js'), 'utf8');
assert(appJs.includes('moviesPagination'), 'app.js manages #moviesPagination');
assert(appJs.includes('tvPagination'), 'app.js manages #tvPagination');
assert(appJs.includes('animePagination'), 'app.js manages #animePagination');
assert(appJs.includes('URLSearchParams(window.location.search)'), 'app.js synchronizes state from URL query parameters');
assert(appJs.includes('window.history.pushState'), 'app.js updates URL with pushState on page/filter change');
assert(appJs.includes('popstate'), 'app.js listens to popstate for browser Back/Forward navigation');
assert(appJs.includes('requestSeq'), 'app.js prevents duplicate or stale requests with sequence tokens');

// 4. Check HTML templates for pagination and grids
const moviesHtml = fs.readFileSync(path.join(__dirname, 'public/movies.html'), 'utf8');
assert(moviesHtml.includes('id="moviesGrid"'), 'movies.html contains #moviesGrid');
assert(moviesHtml.includes('id="moviesPagination"'), 'movies.html contains #moviesPagination');

const tvHtml = fs.readFileSync(path.join(__dirname, 'public/tv-shows.html'), 'utf8');
assert(tvHtml.includes('id="tvGrid"'), 'tv-shows.html contains #tvGrid');
assert(tvHtml.includes('id="tvPagination"'), 'tv-shows.html contains #tvPagination');

const animeHtml = fs.readFileSync(path.join(__dirname, 'public/anime.html'), 'utf8');
assert(animeHtml.includes('id="animeGrid"'), 'anime.html contains #animeGrid');
assert(animeHtml.includes('id="animePagination"'), 'anime.html contains #animePagination');
assert(animeHtml.includes('data-category='), 'anime.html contains category filter pills');

// 5. Check netflix-theme.css for responsive grid and pagination styling
const themeCss = fs.readFileSync(path.join(__dirname, 'public/css/netflix-theme.css'), 'utf8');
assert(themeCss.includes('grid-template-columns: repeat(6, 1fr)'), 'netflix-theme.css defines 6 cards per row for large screens');
assert(themeCss.includes('grid-template-columns: repeat(5, 1fr)'), 'netflix-theme.css defines 5 cards per row for 1440px breakpoint');
assert(themeCss.includes('grid-template-columns: repeat(4, 1fr)'), 'netflix-theme.css defines 4 cards per row for 1024px breakpoint');
assert(themeCss.includes('grid-template-columns: repeat(3, 1fr)'), 'netflix-theme.css defines 3 cards per row for 768px breakpoint');
assert(themeCss.includes('grid-template-columns: repeat(2, 1fr)'), 'netflix-theme.css defines 2 cards per row for mobile <=540px');
assert(themeCss.includes('.pagination-container'), 'netflix-theme.css styles .pagination-container');
assert(themeCss.includes('.pagination-btn'), 'netflix-theme.css styles .pagination-btn');
assert(themeCss.includes('.pagination-btn.active'), 'netflix-theme.css styles active page highlight');
assert(themeCss.includes('.pagination-desktop-only'), 'netflix-theme.css defines mobile-hiding for outer pagination buttons');
assert(themeCss.includes('overflow-x: auto'), 'netflix-theme.css enables self-contained horizontal scrolling on mobile filter pills');

// 6. Check navbar.css for zero-flash rules
const navbarCss = fs.readFileSync(path.join(__dirname, 'public/css/navbar.css'), 'utf8');
assert(navbarCss.includes('.nav-links-desktop') && navbarCss.includes('display: none !important'), 'navbar.css hides desktop nav at <=768px breakpoint');
assert(navbarCss.includes('.nav-hamburger-btn') && navbarCss.includes('display: inline-flex !important'), 'navbar.css shows hamburger at <=768px breakpoint');
assert(navbarCss.includes('.mobile-drawer-overlay') && navbarCss.includes('z-index: 99999'), 'navbar.css assigns proper root z-index to mobile drawer');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passedTests} Passed, ${totalTests - passedTests} Failed out of ${totalTests} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
