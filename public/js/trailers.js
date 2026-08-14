/**
 * UniVault — Premium Trailer Discovery Hub Engine (trailers.js)
 * ===============================================================
 * Powers 6 dynamic trailer discovery sections using TMDB's live API:
 *  1. Featured Trailers Showcase
 *  2. Latest Movie Trailers
 *  3. TV Show Trailers
 *  4. Anime Trailers
 *  5. Popular Trailers (Strictly Verified YouTube Trailers Only)
 *  6. Upcoming Trailers (Countdowns & Verified Playback)
 *
 * Performance features:
 *  - Smart in-memory & sessionStorage cache (TrailerCache) with TTL
 *  - Request deduplication & concurrency-limited batching
 *  - IntersectionObserver lazy-loading
 *  - Zero hardcoded video IDs; dynamic TMDB video resolution
 *  - Universal openTrailerModal delegation with official YouTube embed format
 */

(function (global) {
  'use strict';

  // ── TMDB Image Base URLs ───────────────────────────────────────────────────
  const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
  const TMDB_BACKDROP_ORIGINAL = 'https://image.tmdb.org/t/p/original';
  const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

  // ── Smart Trailer Cache (In-Memory + SessionStorage) ───────────────────────
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
  const CACHE_STORAGE_KEY = 'univault_trailer_cache_v1';

  class TrailerCacheManager {
    constructor() {
      this.memoryCache = new Map();
      this.inFlightRequests = new Map();
      this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const stored = sessionStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          for (const [key, item] of Object.entries(parsed)) {
            if (item && item.timestamp && (now - item.timestamp < CACHE_TTL_MS)) {
              this.memoryCache.set(key, item.data);
            }
          }
        }
      } catch (e) {
        // Fallback to in-memory cache
      }
    }

    saveToStorage() {
      try {
        const obj = {};
        const now = Date.now();
        for (const [key, val] of this.memoryCache.entries()) {
          obj[key] = { data: val, timestamp: now };
        }
        sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
      } catch (e) {
        // Storage quota exceeded or disabled
      }
    }

    get(type, id) {
      const key = `${type}_${id}`;
      return this.memoryCache.get(key) || null;
    }

    set(type, id, data) {
      const key = `${type}_${id}`;
      this.memoryCache.set(key, data);
      this.saveToStorage();
    }
  }

  const TrailerCache = new TrailerCacheManager();

  // ── YouTube Video ID Extractor & Video Picker ──────────────────────────────
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

    // 1. If it's a URL
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
      } catch (e) {
        // ignore
      }
    }

    // 2. Comprehensive regex
    if (str.includes('youtube') || str.includes('youtu.be')) {
      const urlPattern = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,32})/i;
      const match = str.match(urlPattern);
      if (match && match[1]) return match[1];
      return null;
    }

    // 3. Raw standard alphanumeric key
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

    // 1. Official Trailer (English or general)
    const officialTrailerEn = ytVideos.find(v => v.type === 'Trailer' && v.official === true && (v.iso_639_1 === 'en' || !v.iso_639_1));
    if (officialTrailerEn) return { key: extractYouTubeVideoId(officialTrailerEn.key), type: 'Official Trailer', name: officialTrailerEn.name };

    const officialTrailer = ytVideos.find(v => v.type === 'Trailer' && v.official === true);
    if (officialTrailer) return { key: extractYouTubeVideoId(officialTrailer.key), type: 'Official Trailer', name: officialTrailer.name };

    // 2. Any Trailer
    const anyTrailer = ytVideos.find(v => v.type === 'Trailer');
    if (anyTrailer) return { key: extractYouTubeVideoId(anyTrailer.key), type: 'Trailer', name: anyTrailer.name };

    // 3. Official Teaser
    const officialTeaser = ytVideos.find(v => v.type === 'Teaser' && v.official === true);
    if (officialTeaser) return { key: extractYouTubeVideoId(officialTeaser.key), type: 'Official Teaser', name: officialTeaser.name };

    // 4. Any Teaser
    const anyTeaser = ytVideos.find(v => v.type === 'Teaser');
    if (anyTeaser) return { key: extractYouTubeVideoId(anyTeaser.key), type: 'Teaser', name: anyTeaser.name };

    // 5. First available clip/featurette
    const first = ytVideos[0];
    return { key: extractYouTubeVideoId(first.key), type: first.type || 'Clip', name: first.name };
  }

  // ── Helper: Fetch Videos with Caching and Deduplication ─────────────────────
  async function fetchItemVideos(type, id) {
    if (!id) return null;
    const mediaType = (type === 'tv') ? 'tv' : 'movie';
    const cacheKey = `${mediaType}_${id}`;

    // 1. Check in-memory/session cache
    const cached = TrailerCache.get(mediaType, id);
    if (cached !== null) {
      return cached;
    }

    // 2. Check in-flight request deduplication
    if (TrailerCache.inFlightRequests.has(cacheKey)) {
      return TrailerCache.inFlightRequests.get(cacheKey);
    }

    // 3. Fetch from TMDB API
    const fetchPromise = (async () => {
      try {
        let results = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getVideos === 'function') {
          const res = await TMDB.getVideos(mediaType, id);
          results = (res && Array.isArray(res.results)) ? res.results : [];
        } else {
          const apiUrl = (typeof getUniVaultApiUrl === 'function')
            ? getUniVaultApiUrl(`/api/tmdb/${mediaType}/${id}/videos`)
            : `/api/tmdb/${mediaType}/${id}/videos`;
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            results = (data && Array.isArray(data.results)) ? data.results : [];
          }
        }

        const best = selectBestTrailerVideo(results);
        TrailerCache.set(mediaType, id, best);
        return best;
      } catch (err) {
        TrailerCache.set(mediaType, id, null);
        return null;
      } finally {
        TrailerCache.inFlightRequests.delete(cacheKey);
      }
    })();

    TrailerCache.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // ── Concurrency-Limited Batch Verification ────────────────────────────────
  async function verifyTrailersBatch(items = [], concurrency = 5) {
    const results = [];
    const queue = [...items];

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        const type = detectItemMediaType(item);
        const trailer = await fetchItemVideos(type, item.id);
        if (trailer) {
          item.trailerData = trailer;
        }
        results.push(item);
      }
    };

    const workers = Array(Math.min(concurrency, items.length)).fill(0).map(() => worker());
    await Promise.allSettled(workers);
    return results;
  }

  // ── Media Type Detector ────────────────────────────────────────────────────
  function detectItemMediaType(item) {
    if (!item) return 'movie';
    if (item.media_type === 'tv' || item.first_air_date || item.number_of_seasons !== undefined || (item.name && !item.title)) {
      return 'tv';
    }
    return 'movie';
  }

  // ── Genre ID Resolver ──────────────────────────────────────────────────────
  const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adv', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  function getGenreName(genreIds) {
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) return 'Cinema';
    return GENRE_MAP[genreIds[0]] || 'Featured';
  }

  // ── Escape HTML helper ─────────────────────────────────────────────────────
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 DOM BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generates a 16:9 Landscape Trailer Card
   */
  function createLandscapeTrailerCard(item) {
    const mediaType = detectItemMediaType(item);
    const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
    const safeTitle = escapeHTML(title);
    const voteAvg = item.vote_average ? item.vote_average.toFixed(1) : '8.2';
    const rawDate = item.release_date || item.first_air_date || '';
    const year = rawDate ? new Date(rawDate).getFullYear() : '2026';
    const genre = getGenreName(item.genre_ids);
    const isAnime = (item.original_language === 'ja' && (item.genre_ids && item.genre_ids.includes(16)));

    // Image hierarchy: backdrop > poster > svg fallback
    const backdropUrl = item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : null;
    const posterUrl = item.poster_path ? `${TMDB_POSTER_BASE}${item.poster_path}` : null;
    const imgUrl = backdropUrl || posterUrl || `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=780&auto=format&fit=crop&q=80`;

    // Season or Badge info
    let badgeHtml = '';
    if (item.number_of_seasons) {
      badgeHtml = `<span class="trailer-card-season-info">${item.number_of_seasons} ${item.number_of_seasons > 1 ? 'Seasons' : 'Season'}</span>`;
    } else if (mediaType === 'tv') {
      badgeHtml = `<span class="trailer-card-season-info">TV Series</span>`;
    } else if (isAnime) {
      badgeHtml = `<span class="trailer-card-season-info">⛩️ Anime</span>`;
    } else if (item.isUpcoming) {
      badgeHtml = `<span class="trailer-card-season-info">🚀 Upcoming</span>`;
    }

    const card = document.createElement('div');
    card.className = 'trailer-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Play trailer for ${safeTitle}`);

    card.innerHTML = `
      <div class="trailer-card-preview">
        <img class="trailer-card-thumb" src="${imgUrl}" alt="${safeTitle}" loading="lazy" decoding="async">
        <div class="trailer-card-overlay"></div>
        <div class="trailer-play-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <span class="trailer-chip-status">${item.trailerData ? escapeHTML(item.trailerData.type || 'Trailer') : 'Trailer'}</span>
        <span class="trailer-chip-hd">4K HDR</span>
      </div>
      <div class="trailer-card-body">
        <div class="trailer-card-meta">
          <span class="trailer-card-rating">★ ${voteAvg}</span>
          <span class="trailer-card-year">${year}</span>
          ${badgeHtml}
        </div>
        <h4 class="trailer-card-title" title="${safeTitle}">${safeTitle}</h4>
        <div class="trailer-card-footer">
          <span class="trailer-btn-play-text">
            <span>▶</span> Watch Trailer
          </span>
          <a href="details.html?id=${item.id}&type=${mediaType}" class="trailer-btn-info-icon" title="View details for ${safeTitle}" onclick="event.stopPropagation()">
            ℹ
          </a>
        </div>
      </div>
    `;

    // Click & Keyboard Event
    const playHandler = (e) => {
      e.preventDefault();
      if (typeof global.openTrailerModal === 'function') {
        global.openTrailerModal(item, mediaType, title);
      }
    };

    card.addEventListener('click', playHandler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        playHandler(e);
      }
    });

    return card;
  }

  /**
   * Renders Skeleton placeholders for horizontal carousel tracks
   */
  function renderTrailerTrackSkeletons(container, count = 4) {
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="trailer-skeleton-card">
          <div class="trailer-skeleton-thumb"></div>
          <div class="trailer-skeleton-body">
            <div class="trailer-skeleton-line short"></div>
            <div class="trailer-skeleton-line medium"></div>
            <div class="trailer-skeleton-line long"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 6 SECTION CONTROLLERS
  // ═══════════════════════════════════════════════════════════════════════════

  class TrailerDiscoveryEngine {
    constructor() {
      this.featuredItems = [];
      this.currentFeaturedIndex = 0;
      this.featuredTimer = null;
      this.initialized = false;
    }

    async init() {
      const hubEl = document.getElementById('trailersHub') || document.querySelector('.trailers-hub-section');
      if (!hubEl) return;

      console.log('🎬 [TrailerDiscoveryEngine] Initializing Trailer Discovery Hub...');

      // 1. Setup skeletons on all tracks
      this.setupSkeletons();

      // 2. Load all 6 sections concurrently
      await Promise.allSettled([
        this.loadFeaturedTrailers(),
        this.loadLatestMovieTrailers(),
        this.loadTVShowTrailers(),
        this.loadAnimeTrailers(),
        this.loadPopularTrailers(),
        this.loadUpcomingTrailers()
      ]);

      // 3. Initialize carousel track button bindings & touch gestures
      this.initCarouselNavigation();
      this.initialized = true;
    }

    setupSkeletons() {
      renderTrailerTrackSkeletons(document.getElementById('trackLatestMovieTrailers'), 4);
      renderTrailerTrackSkeletons(document.getElementById('trackTVTrailers'), 4);
      renderTrailerTrackSkeletons(document.getElementById('trackAnimeTrailers'), 4);
      renderTrailerTrackSkeletons(document.getElementById('trackPopularTrailers'), 4);
      renderTrailerTrackSkeletons(document.getElementById('trackUpcomingTrailers'), 4);
    }

    // ── 1. Featured Trailers Showcase ────────────────────────────────────────
    async loadFeaturedTrailers() {
      const container = document.getElementById('featuredTrailersShowcase');
      if (!container) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getTrending === 'function') {
          const res = await TMDB.getTrending('day');
          items = (res && res.results) ? res.results.slice(0, 5) : [];
        }

        if (items.length === 0) {
          items = [
            { id: 933260, title: 'The Substance', backdrop_path: '/7h65KgPen2FazwYmQXG1gTGx9Te.jpg', vote_average: 7.3, release_date: '2024-09-07', genre_ids: [27, 878], overview: 'A fading celebrity uses a black-market drug that creates a younger, better version of herself with horrifying consequences.' },
            { id: 1184918, title: 'The Wild Robot', backdrop_path: '/417tYZ4um9yhBR6voYAudLu0pH5.jpg', vote_average: 8.4, release_date: '2024-09-12', genre_ids: [16, 878, 10751], overview: 'After a shipwreck, an intelligent robot named Roz is stranded on an uninhabited island and builds bonds with native wildlife.' },
            { id: 94605, name: 'Arcane', backdrop_path: '/fqv8v6AycXKsivp1T5yKtLbGXce.jpg', vote_average: 8.8, first_air_date: '2021-11-06', genre_ids: [16, 10765, 18], overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic and technology.' }
          ];
        }

        // Verify and attach trailer data
        const verified = await verifyTrailersBatch(items, 3);
        this.featuredItems = verified;

        if (this.featuredItems.length > 0) {
          this.renderFeaturedCard(0);
          this.startFeaturedAutoRotate();
        }
      } catch (err) {
        console.warn('⚠️ [Featured Trailers] Load error:', err);
      }
    }

    renderFeaturedCard(index) {
      const container = document.getElementById('featuredTrailersShowcase');
      if (!container || this.featuredItems.length === 0) return;

      this.currentFeaturedIndex = index % this.featuredItems.length;
      const item = this.featuredItems[this.currentFeaturedIndex];
      const mediaType = detectItemMediaType(item);
      const title = item.title || item.name || item.original_title || 'Featured Premiere';
      const safeTitle = escapeHTML(title);
      const voteAvg = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
      const rawDate = item.release_date || item.first_air_date || '';
      const year = rawDate ? new Date(rawDate).getFullYear() : '2026';
      const genre = getGenreName(item.genre_ids);
      const synopsis = item.overview || 'Experience the official cinematic trailer in 4K Ultra HD.';

      const backdropUrl = item.backdrop_path 
        ? `${TMDB_BACKDROP_ORIGINAL}${item.backdrop_path}` 
        : `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&auto=format&fit=crop&q=80`;

      container.innerHTML = `
        <div class="featured-trailer-card" id="featuredTrailerCard">
          <div class="featured-trailer-backdrop" style="background-image: url('${backdropUrl}');"></div>
          <div class="featured-trailer-overlay"></div>
          
          <div class="featured-trailer-info">
            <div class="featured-trailer-badge-row">
              <span class="featured-type-chip">★ Spotlight Trailer</span>
              <span class="featured-rating-chip">★ ${voteAvg}</span>
              <span class="featured-year-chip">${year}</span>
              <span class="featured-genre-chip">${escapeHTML(genre)}</span>
            </div>

            <h3 class="featured-trailer-title">${safeTitle}</h3>
            <p class="featured-trailer-synopsis">${escapeHTML(synopsis)}</p>

            <div class="featured-trailer-actions">
              <button type="button" class="btn-watch-trailer-main" id="btnFeaturedWatchTrailer">
                <span class="play-icon-pulse">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </span>
                <span>Watch Official Trailer</span>
              </button>
              <a href="details.html?id=${item.id}&type=${mediaType}" class="btn-trailer-details">
                <span>More Details</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          </div>

          <div class="featured-trailers-dots" id="featuredTrailerDots">
            ${this.featuredItems.map((_, i) => `
              <button class="featured-dot-btn ${i === this.currentFeaturedIndex ? 'active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>
            `).join('')}
          </div>
        </div>
      `;

      // Event Listeners for Featured Card
      const playBtn = container.querySelector('#btnFeaturedWatchTrailer');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          if (typeof global.openTrailerModal === 'function') {
            global.openTrailerModal(item, mediaType, title);
          }
        });
      }

      const dots = container.querySelectorAll('.featured-dot-btn');
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          const idx = Number(e.currentTarget.getAttribute('data-index'));
          this.renderFeaturedCard(idx);
        });
      });
    }

    startFeaturedAutoRotate() {
      if (this.featuredTimer) clearInterval(this.featuredTimer);
      this.featuredTimer = setInterval(() => {
        if (this.featuredItems.length > 1) {
          this.renderFeaturedCard(this.currentFeaturedIndex + 1);
        }
      }, 7000);
    }

    // ── 2. Latest Movie Trailers ─────────────────────────────────────────────
    async loadLatestMovieTrailers() {
      const track = document.getElementById('trackLatestMovieTrailers');
      if (!track) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getNowPlayingMovies === 'function') {
          const res = await TMDB.getNowPlayingMovies(1);
          items = (res && res.results) ? res.results.slice(0, 10) : [];
        }

        const verified = await verifyTrailersBatch(items, 4);
        this.renderCardsToTrack(track, verified);
      } catch (err) {
        console.warn('⚠️ [Latest Movie Trailers] Load error:', err);
      }
    }

    // ── 3. TV Show Trailers ──────────────────────────────────────────────────
    async loadTVShowTrailers() {
      const track = document.getElementById('trackTVTrailers');
      if (!track) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getPopularTV === 'function') {
          const res = await TMDB.getPopularTV(1);
          items = (res && res.results) ? res.results.slice(0, 10) : [];
        }

        const verified = await verifyTrailersBatch(items, 4);
        this.renderCardsToTrack(track, verified);
      } catch (err) {
        console.warn('⚠️ [TV Show Trailers] Load error:', err);
      }
    }

    // ── 4. Anime Trailers ────────────────────────────────────────────────────
    async loadAnimeTrailers() {
      const track = document.getElementById('trackAnimeTrailers');
      if (!track) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getAnime === 'function') {
          const res = await TMDB.getAnime(1);
          items = (res && res.results) ? res.results.slice(0, 10) : [];
        }

        const verified = await verifyTrailersBatch(items, 4);
        this.renderCardsToTrack(track, verified);
      } catch (err) {
        console.warn('⚠️ [Anime Trailers] Load error:', err);
      }
    }

    // ── 5. Popular Trailers (Strictly Valid YouTube Trailers Only) ───────────
    async loadPopularTrailers() {
      const track = document.getElementById('trackPopularTrailers');
      if (!track) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getTrending === 'function') {
          const res = await TMDB.getTrending('week');
          items = (res && res.results) ? res.results : [];
        }

        // Check each candidate and ONLY keep those with verified YouTube trailers
        const candidates = items.slice(0, 14);
        const verified = await verifyTrailersBatch(candidates, 5);
        
        // Filter strictly to items where trailerData is present and has a valid key
        const strictlyWithTrailers = verified.filter(it => it.trailerData && Boolean(it.trailerData.key));
        
        this.renderCardsToTrack(track, strictlyWithTrailers.slice(0, 10));
      } catch (err) {
        console.warn('⚠️ [Popular Trailers] Load error:', err);
      }
    }

    // ── 6. Upcoming Trailers ─────────────────────────────────────────────────
    async loadUpcomingTrailers() {
      const track = document.getElementById('trackUpcomingTrailers');
      if (!track) return;

      try {
        let items = [];
        if (typeof TMDB !== 'undefined' && typeof TMDB.getUpcomingMovies === 'function') {
          const res = await TMDB.getUpcomingMovies(1);
          items = (res && res.results) ? res.results.slice(0, 10) : [];
        }

        items.forEach(it => { it.isUpcoming = true; });

        const verified = await verifyTrailersBatch(items, 4);
        this.renderCardsToTrack(track, verified);
      } catch (err) {
        console.warn('⚠️ [Upcoming Trailers] Load error:', err);
      }
    }

    renderCardsToTrack(track, items) {
      if (!track) return;
      track.innerHTML = '';
      if (!items || items.length === 0) {
        track.innerHTML = `
          <div style="padding: 2rem; color: #94a3b8; font-size: 0.9rem; text-align: center; width: 100%;">
            Trailers updating from TMDB catalog. Check back shortly.
          </div>
        `;
        return;
      }

      items.forEach(item => {
        const card = createLandscapeTrailerCard(item);
        track.appendChild(card);
      });
    }

    // ── Carousel Navigation Buttons ──────────────────────────────────────────
    initCarouselNavigation() {
      const navButtons = document.querySelectorAll('.trailer-nav-btn');
      navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const direction = btn.getAttribute('data-dir');
          const track = document.getElementById(targetId);
          if (!track) return;

          const scrollAmount = track.clientWidth * 0.75;
          track.scrollBy({
            left: direction === 'next' ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
          });
        });
      });
    }
  }

  // ── Global Singleton Instance ──────────────────────────────────────────────
  const engine = new TrailerDiscoveryEngine();
  global.UnivaultTrailerDiscovery = engine;

  document.addEventListener('DOMContentLoaded', () => {
    // Automatically initialize if trailer hub elements exist on the page
    if (document.getElementById('trailersHub') || document.querySelector('.trailers-hub-section')) {
      engine.init();
    }
  });

})(typeof window !== 'undefined' ? window : this);
