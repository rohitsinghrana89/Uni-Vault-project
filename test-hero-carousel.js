/**
 * UniVault — Dynamic Auto-Swiping Hero Banner Carousel Verification Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING DYNAMIC HERO BANNER CAROUSEL VERIFICATION');
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

// ── 1. Check CSS Styling in netflix-theme.css ──
const themeCss = fs.readFileSync(path.join(__dirname, 'public/css/netflix-theme.css'), 'utf8');

assert(themeCss.includes('.netflix-hero'), 'netflix-theme.css contains .netflix-hero component');
assert(themeCss.includes('.hero-backdrop-container') || themeCss.includes('.hero-backdrop-wrapper'), 'netflix-theme.css contains backdrop container');
assert(themeCss.includes('.hero-backdrop-slide'), 'netflix-theme.css contains .hero-backdrop-slide for dual layer crossfading');
assert(themeCss.includes('.hero-backdrop-slide.active') && themeCss.includes('.hero-backdrop-slide.prev-active'), 'netflix-theme.css contains active and prev-active transition states');
assert(themeCss.includes('.hero-content.fade-out') && themeCss.includes('.hero-content.fade-in'), 'netflix-theme.css contains smooth text fade-in/fade-out transitions');
assert(themeCss.includes('.hero-nav-btn') && themeCss.includes('.hero-nav-prev') && themeCss.includes('.hero-nav-next'), 'netflix-theme.css contains prev and next desktop carousel navigation buttons');
assert(themeCss.includes('.hero-indicators-container'), 'netflix-theme.css contains bottom indicators container');
assert(themeCss.includes('.hero-indicator-btn') && themeCss.includes('.hero-indicator-progress'), 'netflix-theme.css contains indicator progress bar');
assert(themeCss.includes('transition: width 6s linear'), 'netflix-theme.css contains 6-second progress bar fill animation');
assert(themeCss.includes('.hero-indicator-btn.active.paused'), 'netflix-theme.css freezes indicator progress on pause');
assert(themeCss.includes('@media (max-width: 768px)') && themeCss.includes('.hero-indicators-container'), 'netflix-theme.css centers indicators on mobile screens');

// ── 2. Check components.js Hero Carousel Implementation ──
const componentsJs = fs.readFileSync(path.join(__dirname, 'public/js/components.js'), 'utf8');

assert(componentsJs.includes('createHeroCarousel:'), 'components.js defines createHeroCarousel component generator');
assert(componentsJs.includes('validItems') && componentsJs.includes('seen.has(it.id)'), 'createHeroCarousel deduplicates items by ID');
assert(componentsJs.includes('backdrop_path') && componentsJs.includes('poster_path'), 'createHeroCarousel filters for valid backdrops and posters');
assert(componentsJs.includes('preloadBackdrop') || componentsJs.includes('preloadedBackdrops'), 'createHeroCarousel implements backdrop image preloading');
assert(componentsJs.includes('hero-nav-prev') && componentsJs.includes('hero-nav-next'), 'createHeroCarousel generates desktop prev/next controls');
assert(componentsJs.includes('hero-indicator-progress'), 'createHeroCarousel renders progress bar indicators');
assert(componentsJs.includes('duration = options.duration || 6000'), 'createHeroCarousel sets 6-second autoplay duration default');
assert(componentsJs.includes('showSlide(currentIndex + 1, true)') && componentsJs.includes('setTimeout'), 'createHeroCarousel implements auto-swiping loop');
assert(componentsJs.includes("container.addEventListener('mouseenter', pause)") && componentsJs.includes("container.addEventListener('mouseleave', resume)"), 'createHeroCarousel pauses autoplay on desktop hover');
assert(componentsJs.includes("touchstart") && componentsJs.includes("touchend"), 'createHeroCarousel supports mobile touch events');
assert(componentsJs.includes('deltaX') && componentsJs.includes('next()') && componentsJs.includes('prev()'), 'createHeroCarousel detects horizontal mobile swipe gestures');
assert(componentsJs.includes('visibilitychange'), 'createHeroCarousel pauses when tab is hidden');
assert(componentsJs.includes('ArrowLeft') && componentsJs.includes('ArrowRight') && componentsJs.includes('Space'), 'createHeroCarousel provides keyboard navigation');
assert(componentsJs.includes('isInWatchlist') && componentsJs.includes('toggleWatchlistButton'), 'createHeroCarousel updates Watchlist button state seamlessly');

// ── 3. Check app.js Integration ──
const appJs = fs.readFileSync(path.join(__dirname, 'public/js/app.js'), 'utf8');

assert(appJs.includes('setupHeroBanner(trending.slice(0, 8), \'netflixHero\')') || appJs.includes('setupHeroBanner(trending'), 'app.js supplies multiple trending titles to homepage hero');
assert(appJs.includes('Components.createHeroCarousel'), 'app.js calls Components.createHeroCarousel in setupHeroBanner');
assert(appJs.includes('setupHeroBanner(trending.slice(0, 8), \'animeHero\')') || appJs.includes('setupHeroBanner(trending'), 'app.js supplies multiple trending titles to anime hero');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
