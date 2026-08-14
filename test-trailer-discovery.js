/**
 * UniVault Trailer Discovery Engine Unit & Integration Test Suite
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const assert = require('assert');

// ── 1. Cache Manager Test ───────────────────────────────────────────────────
class TestTrailerCacheManager {
  constructor() {
    this.memoryCache = new Map();
  }
  get(type, id) {
    const key = `${type}_${id}`;
    return this.memoryCache.get(key) || null;
  }
  set(type, id, data) {
    const key = `${type}_${id}`;
    this.memoryCache.set(key, data);
  }
}

// ── 2. Extractor & Video Selector ──────────────────────────────────────────
function extractYouTubeVideoId(input) {
  if (!input) return null;

  if (typeof input === 'object') {
    if (typeof input.key === 'string') return extractYouTubeVideoId(input.key);
    if (typeof input.youtube_id === 'string') return extractYouTubeVideoId(input.youtube_id);
    if (typeof input.video_id === 'string') return extractYouTubeVideoId(input.video_id);
    if (typeof input.id === 'string' && /^[a-zA-Z0-9_-]{6,32}$/.test(input.id.trim())) return input.id.trim();
    return null;
  }

  if (typeof input !== 'string') return null;
  const str = input.trim();
  if (!str) return null;

  if (str.includes('://') || str.startsWith('//')) {
    try {
      const parsed = new URL(str.startsWith('//') ? `https:${str}` : str);
      const host = parsed.hostname.toLowerCase();
      const isYouTubeHost = host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com');
      if (!isYouTubeHost) return null;

      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{6,32}$/.test(vParam)) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        if (/^[a-zA-Z0-9_-]{6,32}$/.test(lastSeg)) return lastSeg;
      }
    } catch (e) {}
  }

  if (str.includes('youtube') || str.includes('youtu.be')) {
    const urlPattern = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,32})/i;
    const match = str.match(urlPattern);
    if (match && match[1]) return match[1];
    return null;
  }

  if (/^[a-zA-Z0-9_-]{6,32}$/.test(str)) {
    return str;
  }

  return null;
}

function selectBestTrailerVideo(videos = []) {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const ytVideos = videos.filter(v => {
    const isYt = v && v.site && v.site.toLowerCase() === 'youtube';
    const hasKey = Boolean(extractYouTubeVideoId(v.key || v.url || v.id));
    return isYt && hasKey;
  });

  if (ytVideos.length === 0) return null;

  const officialTrailerEn = ytVideos.find(v => v.type === 'Trailer' && v.official === true && (v.iso_639_1 === 'en' || !v.iso_639_1));
  if (officialTrailerEn) return { key: extractYouTubeVideoId(officialTrailerEn.key), type: 'Official Trailer', name: officialTrailerEn.name };

  const officialTrailer = ytVideos.find(v => v.type === 'Trailer' && v.official === true);
  if (officialTrailer) return { key: extractYouTubeVideoId(officialTrailer.key), type: 'Official Trailer', name: officialTrailer.name };

  const anyTrailer = ytVideos.find(v => v.type === 'Trailer');
  if (anyTrailer) return { key: extractYouTubeVideoId(anyTrailer.key), type: 'Trailer', name: anyTrailer.name };

  const officialTeaser = ytVideos.find(v => v.type === 'Teaser' && v.official === true);
  if (officialTeaser) return { key: extractYouTubeVideoId(officialTeaser.key), type: 'Official Teaser', name: officialTeaser.name };

  const anyTeaser = ytVideos.find(v => v.type === 'Teaser');
  if (anyTeaser) return { key: extractYouTubeVideoId(anyTeaser.key), type: 'Teaser', name: anyTeaser.name };

  const first = ytVideos[0];
  return { key: extractYouTubeVideoId(first.key), type: first.type || 'Clip', name: first.name };
}

console.log('══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING TRAILER DISCOVERY ENGINE VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Test Cache
test('TrailerCache saves and retrieves correctly', () => {
  const cache = new TestTrailerCacheManager();
  cache.set('movie', 550, { key: 'O1nDozs-L4o', type: 'Official Trailer' });
  const result = cache.get('movie', 550);
  assert.deepStrictEqual(result, { key: 'O1nDozs-L4o', type: 'Official Trailer' });
  assert.strictEqual(cache.get('movie', 999), null);
});

// 2. Test Priority Hierarchy
test('selectBestTrailerVideo prioritizes Official English Trailer over standard clip', () => {
  const sampleVideos = [
    { site: 'YouTube', type: 'Behind the Scenes', key: 'bts12345678' },
    { site: 'YouTube', type: 'Teaser', official: false, key: 'teaser12345' },
    { site: 'YouTube', type: 'Trailer', official: false, key: 'trailer1234' },
    { site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en', key: 'officialEn12' }
  ];
  const best = selectBestTrailerVideo(sampleVideos);
  assert.strictEqual(best.key, 'officialEn12');
  assert.strictEqual(best.type, 'Official Trailer');
});

// 3. Test Filter Non-YouTube Videos
test('selectBestTrailerVideo ignores non-YouTube providers (Vimeo, etc.)', () => {
  const nonYt = [
    { site: 'Vimeo', type: 'Trailer', key: '987654321' },
    { site: 'Dailymotion', type: 'Trailer', key: 'dm12345678' }
  ];
  const best = selectBestTrailerVideo(nonYt);
  assert.strictEqual(best, null);
});

// 4. Test Popular Section Filtering
test('Popular section strictly filters out items without valid YouTube trailers', () => {
  const mockItems = [
    { id: 101, title: 'Has Trailer', trailerData: { key: 'abc12345678', type: 'Official Trailer' } },
    { id: 102, title: 'No Trailer Available', trailerData: null },
    { id: 103, title: 'Empty Key', trailerData: { key: null } },
    { id: 104, title: 'Another Has Trailer', trailerData: { key: 'xyz98765432', type: 'Trailer' } }
  ];

  const popularFiltered = mockItems.filter(it => it.trailerData && Boolean(it.trailerData.key));
  assert.strictEqual(popularFiltered.length, 2);
  assert.strictEqual(popularFiltered[0].id, 101);
  assert.strictEqual(popularFiltered[1].id, 104);
});

// 5. Test Live TMDB Integration
async function runAsyncTests() {
  console.log('\n--- Running Live TMDB Backend Video Resolution Tests ---');

  const tmdbService = require('./services/tmdbService');

  // Test Movie 550 (Fight Club)
  try {
    const videoData = await tmdbService.getVideos('movie', 550);
    const videos = (videoData && Array.isArray(videoData.results)) ? videoData.results : [];
    const best = selectBestTrailerVideo(videos);
    if (best && best.key) {
      console.log(`✅ [PASS] Live TMDB Movie 550 (Fight Club) video resolution: ${best.type} (${best.key})`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Live TMDB Movie 550 returned no valid video:`, videoData);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [FAIL] TMDB getVideos exception:`, e.message);
    failed++;
  }

  // Test Movie 27205 (Inception)
  try {
    const videoData = await tmdbService.getVideos('movie', 27205);
    const videos = (videoData && Array.isArray(videoData.results)) ? videoData.results : [];
    const best = selectBestTrailerVideo(videos);
    if (best && best.key) {
      console.log(`✅ [PASS] Live TMDB Movie 27205 (Inception) video resolution: ${best.type} (${best.key})`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Live TMDB Movie 27205 returned no valid video`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [FAIL] TMDB getVideos exception:`, e.message);
    failed++;
  }

  // Test TV Show 94605 (Arcane)
  try {
    const videoData = await tmdbService.getVideos('tv', 94605);
    const videos = (videoData && Array.isArray(videoData.results)) ? videoData.results : [];
    const best = selectBestTrailerVideo(videos);
    if (best && best.key) {
      console.log(`✅ [PASS] Live TMDB TV 94605 (Arcane) video resolution: ${best.type} (${best.key})`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Live TMDB TV 94605 returned no valid video`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [FAIL] TMDB getVideos exception:`, e.message);
    failed++;
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`📊 Trailer Discovery Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
  console.log('══════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runAsyncTests();
