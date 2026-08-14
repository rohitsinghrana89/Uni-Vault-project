/**
 * ===========================================================================
 * UniVault — Main Application & TMDB API Controller (script.js)
 * ===========================================================================
 * Complete TMDB client supporting Bearer token authentication, HTTP error
 * diagnostics (401, 403, 404, 429, 500), request deduplication, fallback
 * catalog management, cinematic hero carousel, and cards rendering.
 */

(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔑 1. TMDB API CONFIGURATION — INSERT YOUR READ ACCESS TOKEN HERE
  // ═══════════════════════════════════════════════════════════════════════════
  // Instructions:
  // 1. Log in to https://www.themoviedb.org/
  // 2. Go to: Settings -> API (https://www.themoviedb.org/settings/api)
  // 3. Copy the "API Read Access Token" (v4 auth - long string starting with eyJ...)
  // 4. Replace 'YOUR_TMDB_READ_ACCESS_TOKEN' below with your actual token.
  // ═══════════════════════════════════════════════════════════════════════════
  const TMDB_CONFIG = {
    READ_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTA1MWUwNmVkMjAzMmU5ZjE2OThiNWJmMjc0YzY1MyIsIm5iZiI6MTc4MzUwNjQ1MS45NTgwMDAyLCJzdWIiOiI2YTRlMjYxMzE3NWMzMjExNTMyNGE2NzciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.nF6iucTxiPVq8lSNFztm4GWjnMwEKZvClbecQnKrMNE',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
    BACKDROP_BASE_URL: 'https://image.tmdb.org/t/p/original',
    TIMEOUT_MS: 9000,
    FALLBACK_PROXY_URL: '/api/tmdb' // Optional local proxy if backend server is running
  };

  // ── Genre ID Lookup Table ──────────────────────────────────────────────────
  const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  // ── Curated Fallback Catalog (Used ONLY when TMDB API genuinely fails) ───────
  const FALLBACK_CATALOG = [
    {
      id: 933260,
      title: 'The Substance',
      name: 'The Substance',
      media_type: 'movie',
      overview: 'A fading celebrity decides to use a black-market drug, a cell-replicating substance that temporarily creates a younger, better version of herself.',
      vote_average: 7.3,
      release_date: '2024-09-07',
      backdrop_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80',
      poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      genre_ids: [27, 878, 18],
      isFallback: true
    },
    {
      id: 1184918,
      title: 'The Wild Robot',
      name: 'The Wild Robot',
      media_type: 'movie',
      overview: 'After a shipwreck, an intelligent robot named Roz is stranded on an uninhabited island and must learn to adapt to the harsh surroundings.',
      vote_average: 8.5,
      release_date: '2024-09-12',
      backdrop_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
      poster_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      genre_ids: [16, 878, 10751],
      isFallback: true
    },
    {
      id: 94605,
      title: 'Arcane',
      name: 'Arcane',
      media_type: 'tv',
      overview: 'Amid the conflict between two cities, two sisters fight on opposing sides of a war between magic technologies and incompatible convictions.',
      vote_average: 9.0,
      first_air_date: '2021-11-06',
      backdrop_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
      poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      genre_ids: [16, 10765, 10759],
      isFallback: true
    },
    {
      id: 693134,
      title: 'Dune: Part Two',
      name: 'Dune: Part Two',
      media_type: 'movie',
      overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      vote_average: 8.2,
      release_date: '2024-02-27',
      backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      genre_ids: [878, 12],
      isFallback: true
    },
    {
      id: 823464,
      title: 'Godzilla x Kong: The New Empire',
      name: 'Godzilla x Kong: The New Empire',
      media_type: 'movie',
      overview: 'An explosive confrontation unfolds as the all-powerful Kong and the fearsome Godzilla face a colossal undiscovered threat hidden within our world.',
      vote_average: 7.1,
      release_date: '2024-03-27',
      backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
      poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      genre_ids: [28, 878, 12],
      isFallback: true
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ 2. IN-MEMORY REQUEST CACHE & DEDUPLICATION LAYER
  // ═══════════════════════════════════════════════════════════════════════════
  const requestCache = new Map();

  /**
   * Helper to perform authenticated TMDB API requests with Bearer token,
   * comprehensive HTTP error diagnostics, and deduplication.
   *
   * @param {string} endpoint - API path (e.g. '/trending/all/day')
   * @param {object} [params] - Query parameters
   * @returns {Promise<object>} Parsed JSON response
   */
  async function tmdbFetch(endpoint, params = {}) {
    const token = (TMDB_CONFIG.READ_ACCESS_TOKEN || '').trim();
    const isPlaceholder = !token || token === 'YOUR_TMDB_READ_ACCESS_TOKEN' || token === 'YOUR_ACCESS_TOKEN';

    // Build URL query string
    const queryParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        queryParams.set(k, String(v));
      }
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Cache key for deduplication
    const cacheKey = `${endpoint}${queryString}`;
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const fetchPromise = (async () => {
      // 1. If a valid Read Access Token is provided, fetch directly from TMDB
      if (!isPlaceholder) {
        const fullUrl = `${TMDB_CONFIG.BASE_URL}${endpoint}${queryString}`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json;charset=utf-8'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TMDB_CONFIG.TIMEOUT_MS);

        try {
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorDetails = `HTTP ${response.status} (${response.statusText})`;
            let tmdbMessage = '';
            try {
              const errBody = await response.json();
              tmdbMessage = errBody.status_message || '';
            } catch {
              // Ignore body parse errors on failed requests
            }

            // Detailed console error reporting according to requirements
            if (response.status === 401) {
              console.error(
                `❌ [TMDB API Error 401 - Unauthorized]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Reason: The TMDB API Read Access Token is invalid, expired, or unauthorized.\n` +
                `   TMDB Message: "${tmdbMessage || 'Invalid API key'}"\n` +
                `   👉 Fix: Generate an API Read Access Token in https://www.themoviedb.org/settings/api and paste it into TMDB_CONFIG.READ_ACCESS_TOKEN in script.js.`
              );
            } else if (response.status === 403) {
              console.error(
                `❌ [TMDB API Error 403 - Forbidden]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Reason: Access denied for this resource.\n` +
                `   TMDB Message: "${tmdbMessage}"`
              );
            } else if (response.status === 404) {
              console.error(
                `❌ [TMDB API Error 404 - Not Found]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Reason: The requested TMDB endpoint or media ID does not exist.\n` +
                `   TMDB Message: "${tmdbMessage}"`
              );
            } else if (response.status === 429) {
              console.error(
                `❌ [TMDB API Error 429 - Rate Limit Exceeded]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Reason: Too many requests sent to TMDB. Please wait before retrying.`
              );
            } else if (response.status >= 500) {
              console.error(
                `❌ [TMDB API Error ${response.status} - Server Error]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Reason: TMDB servers are currently encountering an error. Detail: "${tmdbMessage}"`
              );
            } else {
              console.error(
                `❌ [TMDB API Error ${response.status}]\n` +
                `   Endpoint: ${fullUrl}\n` +
                `   Message: "${tmdbMessage || errorDetails}"`
              );
            }

            const error = new Error(`TMDB HTTP ${response.status}: ${tmdbMessage || errorDetails}`);
            error.status = response.status;
            error.endpoint = endpoint;
            throw error;
          }

          const data = await response.json();
          return data;

        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn(`⚠️ [TMDB API Timeout] Direct request to ${fullUrl} timed out after ${TMDB_CONFIG.TIMEOUT_MS}ms. Attempting server proxy fallback...`);
          } else if (!fetchErr.status) {
            console.warn(`⚠️ [TMDB Direct Network Error] Failed to connect directly to ${fullUrl}: ${fetchErr.message}. Attempting server proxy fallback...`);
          } else {
            throw fetchErr;
          }
        }
      }

      // 2. Secondary Strategy: Try local server proxy (/api/tmdb/*) if direct fetch failed or token is placeholder
      try {
        const rawProxyPath = `${TMDB_CONFIG.FALLBACK_PROXY_URL}${endpoint}${queryString}`;
        const proxyUrl = (typeof getUniVaultApiUrl === 'function') ? getUniVaultApiUrl(rawProxyPath) : rawProxyPath;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          return data;
        }
      } catch (proxyErr) {
        // Local server proxy not reachable or failed
      }

      // 3. If both direct fetch and proxy fail, log actionable guide and throw error to trigger curated catalog fallback
      console.warn(
        `⚠️ [TMDB API Offline] Unable to reach TMDB API directly or via proxy.\n` +
        `   Endpoint: ${endpoint}${queryString}\n` +
        `   Activating curated offline featured catalog.`
      );

      const networkError = new Error('TMDB API is currently offline or unreachable.');
      networkError.status = 503;
      throw networkError;
    })();

    // Store in cache
    requestCache.set(cacheKey, fetchPromise);

    // If request fails, remove from cache so subsequent retries can succeed
    fetchPromise.catch(() => {
      requestCache.delete(cacheKey);
    });

    return fetchPromise;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 3. TMDB API SERVICE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  const TMDB = {
    getTrending: (timeWindow = 'day', page = 1) => tmdbFetch(`/trending/all/${timeWindow}`, { page }),
    getTrendingMovies: (timeWindow = 'day', page = 1) => tmdbFetch(`/trending/movie/${timeWindow}`, { page }),
    getTrendingTV: (timeWindow = 'day', page = 1) => tmdbFetch(`/trending/tv/${timeWindow}`, { page }),

    getPopularMovies: (page = 1) => tmdbFetch('/movie/popular', { page }),
    getTopRatedMovies: (page = 1) => tmdbFetch('/movie/top_rated', { page }),
    getUpcomingMovies: (page = 1) => tmdbFetch('/movie/upcoming', { page }),
    getNowPlayingMovies: (page = 1) => tmdbFetch('/movie/now_playing', { page }),

    getPopularTV: (page = 1) => tmdbFetch('/tv/popular', { page }),
    getTopRatedTV: (page = 1) => tmdbFetch('/tv/top_rated', { page }),
    getAiringTodayTV: (page = 1) => tmdbFetch('/tv/airing_today', { page }),
    getOnTheAirTV: (page = 1) => tmdbFetch('/tv/on_the_air', { page }),

    getAnime: (page = 1) => tmdbFetch('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page
    }),

    getAnimeMovies: (page = 1, extra = {}) => tmdbFetch('/discover/movie', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page,
      ...extra
    }),

    getAnimeTV: (page = 1, extra = {}) => tmdbFetch('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page,
      ...extra
    }),

    getTopRatedAnime: (page = 1, type = 'tv') => tmdbFetch(type === 'movie' ? '/discover/movie' : '/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
      page
    }),

    getMoviesByGenre: (genreId, page = 1) => tmdbFetch('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page
    }),

    getTVByGenre: (genreId, page = 1) => tmdbFetch('/discover/tv', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page
    }),

    getPopularActors: (page = 1) => tmdbFetch('/person/popular', { page }),
    getMovieGenres: () => tmdbFetch('/genre/movie/list'),
    getTVGenres: () => tmdbFetch('/genre/tv/list'),

    getVideos: (type = 'movie', id) => tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}/videos`),
    getDetails: (type = 'movie', id, append = 'credits,videos,similar,recommendations') => {
      const params = append ? { append_to_response: append } : {};
      return tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}`, params);
    },
    getCredits: (type = 'movie', id) => tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}/credits`),
    getSimilar: (type = 'movie', id, page = 1) => tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}/similar`, { page }),
    getRecommendations: (type = 'movie', id, page = 1) => tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${id}/recommendations`, { page }),

    searchMulti: (query, page = 1) => {
      if (!query || !query.trim()) return Promise.resolve({ results: [] });
      return tmdbFetch('/search/multi', { query: query.trim(), page });
    },

    searchMovies: (query, page = 1) => {
      if (!query || !query.trim()) return Promise.resolve({ results: [] });
      return tmdbFetch('/search/movie', { query: query.trim(), page });
    },

    searchTV: (query, page = 1) => {
      if (!query || !query.trim()) return Promise.resolve({ results: [] });
      return tmdbFetch('/search/tv', { query: query.trim(), page });
    },

    getImageUrl: (path, size = 'w500') => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `https://image.tmdb.org/t/p/${size}${path}`;
    },
    getBackdropUrl: (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `https://image.tmdb.org/t/p/original${path}`;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏷️ 4. WATCHLIST LOCAL STORAGE HELPER
  // ═══════════════════════════════════════════════════════════════════════════
  const WATCHLIST_KEY = 'univault_watchlist';

  function getWatchlist() {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function isInWatchlist(id) {
    const list = getWatchlist();
    return list.some(item => String(item.id) === String(id));
  }

  // ── Universal Toast Notification System ──────────────────────────────────
  function showToast(message, type = 'success', duration = 3000) {
    let container = document.getElementById('uvToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'uvToastContainer';
      container.className = 'uv-toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `uv-toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const iconMap = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    const icon = iconMap[type] || '✓';
    toast.innerHTML = `
      <span style="font-weight: 900; font-size: 1.15rem; line-height: 1;" aria-hidden="true">${icon}</span>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 320);
    }, duration);
  }

  function showWatchlistToast(message, isAdded = true) {
    showToast(message, isAdded ? 'success' : 'info', 2800);
  }

  function toggleWatchlist(item) {
    const list = getWatchlist();
    const itemId = String(item.id || item.tmdb_id);
    const index = list.findIndex(i => String(i.id || i.tmdb_id) === itemId);

    let isAdded = false;
    if (index >= 0) {
      list.splice(index, 1);
      isAdded = false;
      showWatchlistToast('Removed from Watchlist', false);
    } else {
      const mediaType = detectMediaType(item);
      const title = item.title || item.name || 'Untitled';
      const posterPath = item.poster_path || (item.poster && item.poster.startsWith('/') ? item.poster : item.poster_path);
      list.push({
        id: item.id || item.tmdb_id,
        tmdb_id: item.id || item.tmdb_id,
        media_type: mediaType,
        title: title,
        poster_path: posterPath,
        poster: posterPath,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        added_at: Date.now()
      });
      isAdded = true;
      showWatchlistToast('Added to Watchlist ✓', true);
    }

    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Watchlist localStorage quota exceeded:', e);
    }

    // Sync with backend API if authenticated
    if (typeof UniVaultAuth !== 'undefined' && typeof UniVaultAuth.isAuthenticated === 'function' && UniVaultAuth.isAuthenticated()) {
      const token = UniVaultAuth.getToken();
      if (token) {
        try {
          const apiResolver = (typeof getUniVaultApiUrl === 'function') ? getUniVaultApiUrl : (p => p);
          if (isAdded) {
            fetch(apiResolver('/api/watchlist'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                tmdb_id: item.id || item.tmdb_id,
                media_type: detectMediaType(item),
                title: item.title || item.name || 'Untitled',
                poster: item.poster_path || item.poster || null
              })
            }).catch(() => {});
          } else {
            fetch(apiResolver(`/api/watchlist/${item.id || item.tmdb_id}`), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }).catch(() => {});
          }
        } catch (err) {
          console.warn('Watchlist API sync issue:', err);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('watchlistUpdated', {
      detail: { id: item.id || item.tmdb_id, isAdded, item }
    }));

    return isAdded;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 5. UNIVERSAL TRAILER MODAL CONTROLLER & YOUTUBE EMBED HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Robust utility to extract a clean YouTube 11-character Video ID from:
   * - Direct 11-char keys (e.g., "LNlrGhBpYjc", "dQw4w9WgXcQ")
   * - Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID (&t=10s, &feature=...)
   * - Shortened URLs: https://youtu.be/VIDEO_ID (?si=...)
   * - Embed URLs: https://www.youtube.com/embed/VIDEO_ID
   * - Shorts URLs: https://www.youtube.com/shorts/VIDEO_ID
   * - YouTube No-Cookie URLs: https://www.youtube-nocookie.com/embed/VIDEO_ID
   * - Objects: { site: 'YouTube', type: 'Trailer', key: 'VIDEO_ID' }
   */
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

    // 1. If it's a URL (contains :// or starts with //)
    if (str.includes('://') || str.startsWith('//')) {
      try {
        const parsed = new URL(str.startsWith('//') ? `https:${str}` : str);
        const host = parsed.hostname.toLowerCase();
        const isYouTubeHost = host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com');
        
        if (!isYouTubeHost) {
          return null; // Not a YouTube URL
        }

        // Check ?v= parameter
        const vParam = parsed.searchParams.get('v');
        if (vParam && /^[a-zA-Z0-9_-]{6,32}$/.test(vParam)) {
          return vParam;
        }

        // Check path segments (e.g. youtu.be/ID, /embed/ID, /v/ID, /shorts/ID)
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const lastSeg = segments[segments.length - 1];
          if (/^[a-zA-Z0-9_-]{6,32}$/.test(lastSeg)) {
            return lastSeg;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Comprehensive YouTube URL regex (for partial URLs or strings containing youtube / youtu.be)
    if (str.includes('youtube') || str.includes('youtu.be')) {
      const urlPattern = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,32})/i;
      const match = str.match(urlPattern);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }

    // 3. Raw standard key (direct alphanumeric key without slashes, spaces, query symbols)
    if (/^[a-zA-Z0-9_-]{6,32}$/.test(str)) {
      return str;
    }

    return null;
  }

  class TrailerModalController {
    constructor() {
      this.modalEl = null;
      this.contentEl = null;
      this.ratioWrapEl = null;
      this.iframeEl = null;
      this.loadingEl = null;
      this.loadingTextEl = null;
      this.errorEl = null;
      this.errorTitleEl = null;
      this.errorDescEl = null;
      this.fallbackBtn = null;
      this.errorCloseBtn = null;
      this.titleTextEl = null;
      this.badgeEl = null;
      this.directYtLink = null;
      this.closeBtn = null;
      this.currentRequestId = 0;

      this.ensureModalDOM();
      this.bindEvents();
    }

    ensureModalDOM() {
      let modal = document.getElementById('heroTrailerModal') || document.querySelector('.univault-trailer-modal');
      
      const fullMarkup = `
        <div class="hero-modal-content univault-trailer-content">
          <div class="hero-modal-header">
            <div class="hero-modal-title">
              <span>🎬</span>
              <span class="hero-modal-title-text" id="heroTrailerTitle">Watch Trailer</span>
              <span class="hero-modal-badge" id="heroTrailerBadge">Official Trailer</span>
            </div>
            <button class="hero-modal-close univault-trailer-close" id="closeHeroTrailerModal" aria-label="Close trailer player">&times;</button>
          </div>
          <div class="hero-video-ratio" id="heroTrailerRatioWrap">
            <div class="hero-modal-loading" id="heroTrailerLoading" style="display: none;">
              <div class="hero-modal-spinner"></div>
              <p class="hero-modal-loading-text" id="heroTrailerLoadingText">Loading trailer...</p>
            </div>
            <div class="hero-modal-error" id="heroTrailerError" style="display: none;">
              <div class="hero-modal-error-icon">🎬</div>
              <h3 class="hero-modal-error-title" id="heroTrailerErrorTitle">Trailer unavailable</h3>
              <p class="hero-modal-error-desc" id="heroTrailerErrorDesc">Sorry, no official YouTube trailer is currently available for this title in the TMDB catalog.</p>
              <div class="hero-modal-error-actions">
                <a id="heroTrailerFallbackBtn" href="#" target="_blank" rel="noopener noreferrer" class="hero-modal-fallback-btn">
                  <span>▶</span> Watch on YouTube
                </a>
                <button type="button" class="hero-modal-fallback-close" id="heroTrailerErrorCloseBtn">Close</button>
              </div>
            </div>
          </div>
          <div class="hero-modal-footer" id="heroTrailerFooter">
            <span style="color: #71717a; font-size: 0.8rem;">Powered by TMDB & YouTube Player API</span>
            <a id="heroTrailerDirectYtLink" href="#" target="_blank" rel="noopener noreferrer" class="hero-modal-yt-link" style="display: none;">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="vertical-align: middle;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>Watch on YouTube ↗</span>
            </a>
          </div>
        </div>
      `;

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'heroTrailerModal';
        modal.className = 'hero-modal-backdrop univault-trailer-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Trailer Video Player');
        modal.innerHTML = fullMarkup;
        document.body.appendChild(modal);
      } else if (!modal.querySelector('#heroTrailerLoading') || !modal.querySelector('#heroTrailerTitle')) {
        modal.className = 'hero-modal-backdrop univault-trailer-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Trailer Video Player');
        modal.innerHTML = fullMarkup;
      }

      this.modalEl = modal;
      this.contentEl = modal.querySelector('.hero-modal-content');
      this.ratioWrapEl = modal.querySelector('#heroTrailerRatioWrap');
      this.loadingEl = modal.querySelector('#heroTrailerLoading');
      this.loadingTextEl = modal.querySelector('#heroTrailerLoadingText');
      this.errorEl = modal.querySelector('#heroTrailerError');
      this.errorTitleEl = modal.querySelector('#heroTrailerErrorTitle');
      this.errorDescEl = modal.querySelector('#heroTrailerErrorDesc');
      this.fallbackBtn = modal.querySelector('#heroTrailerFallbackBtn');
      this.errorCloseBtn = modal.querySelector('#heroTrailerErrorCloseBtn');
      this.titleTextEl = modal.querySelector('#heroTrailerTitle');
      this.badgeEl = modal.querySelector('#heroTrailerBadge');
      this.directYtLink = modal.querySelector('#heroTrailerDirectYtLink');
      this.closeBtn = modal.querySelector('#closeHeroTrailerModal') || modal.querySelector('.hero-modal-close');
    }

    bindEvents() {
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      }

      if (this.errorCloseBtn) {
        this.errorCloseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      }

      if (this.modalEl) {
        this.modalEl.addEventListener('click', (e) => {
          if (e.target === this.modalEl) {
            this.close();
          }
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modalEl && this.modalEl.classList.contains('open')) {
          this.close();
        }
      });
    }

    showLoading(title) {
      if (this.loadingEl) {
        this.loadingEl.style.display = 'flex';
      }
      if (this.loadingTextEl) {
        this.loadingTextEl.textContent = title ? `Loading trailer for "${title}"...` : 'Loading trailer...';
      }
      if (this.errorEl) {
        this.errorEl.style.display = 'none';
      }
    }

    hideLoading() {
      if (this.loadingEl) {
        this.loadingEl.style.display = 'none';
      }
    }

    showError(title, videoId) {
      this.hideLoading();
      
      // Clean up any existing iframe
      if (this.ratioWrapEl) {
        const iframes = this.ratioWrapEl.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.src = 'about:blank';
            iframe.remove();
          } catch (e) {}
        });
      }
      this.iframeEl = null;

      if (this.errorEl) {
        this.errorEl.style.display = 'flex';
        if (this.errorTitleEl) {
          this.errorTitleEl.textContent = 'Trailer unavailable';
        }
        if (this.errorDescEl) {
          this.errorDescEl.textContent = title
            ? `Sorry, no official YouTube trailer is currently available for "${title}" in the TMDB catalog.`
            : 'Sorry, no official YouTube trailer is currently available for this title in the TMDB catalog.';
        }
        if (this.fallbackBtn) {
          if (videoId) {
            this.fallbackBtn.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
            this.fallbackBtn.innerHTML = '<span>▶</span> Watch on YouTube';
          } else if (title) {
            this.fallbackBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;
            this.fallbackBtn.innerHTML = '<span>▶</span> Watch on YouTube';
          } else {
            this.fallbackBtn.href = 'https://www.youtube.com';
            this.fallbackBtn.innerHTML = '<span>▶</span> Watch on YouTube';
          }
          this.fallbackBtn.style.display = 'inline-flex';
        }
      }
      if (this.directYtLink) {
        this.directYtLink.style.display = 'none';
      }
    }

    selectBestVideo(videos = []) {
      if (!Array.isArray(videos) || videos.length === 0) return null;

      // Filter only YouTube site videos
      const ytVideos = videos.filter(v => {
        const isYt = v && v.site && String(v.site).toLowerCase() === 'youtube';
        const hasKey = Boolean(extractYouTubeVideoId(v.key || v.url || v.youtube_id || v.id));
        return isYt && hasKey;
      });

      if (ytVideos.length === 0) {
        // Fallback check if any entry has a parseable key/url
        const anyYt = videos.find(v => extractYouTubeVideoId(v.key || v.url || v.id));
        if (anyYt) {
          const key = extractYouTubeVideoId(anyYt.key || anyYt.url || anyYt.id);
          return { key, type: anyYt.type || 'Trailer', name: anyYt.name, site: 'YouTube' };
        }
        return null;
      }

      // 1. Official Trailer (English or default)
      const officialTrailerEn = ytVideos.find(v => v.type === 'Trailer' && v.official === true && (v.iso_639_1 === 'en' || !v.iso_639_1));
      if (officialTrailerEn) return { ...officialTrailerEn, key: extractYouTubeVideoId(officialTrailerEn.key), type: 'Official Trailer' };

      // 2. Any Official Trailer
      const officialTrailer = ytVideos.find(v => v.type === 'Trailer' && v.official === true);
      if (officialTrailer) return { ...officialTrailer, key: extractYouTubeVideoId(officialTrailer.key), type: 'Official Trailer' };

      // 3. Any Trailer
      const anyTrailer = ytVideos.find(v => v.type === 'Trailer');
      if (anyTrailer) return { ...anyTrailer, key: extractYouTubeVideoId(anyTrailer.key), type: 'Trailer' };

      // 4. Official Teaser
      const officialTeaser = ytVideos.find(v => v.type === 'Teaser' && v.official === true);
      if (officialTeaser) return { ...officialTeaser, key: extractYouTubeVideoId(officialTeaser.key), type: 'Teaser' };

      // 5. Any Teaser
      const anyTeaser = ytVideos.find(v => v.type === 'Teaser');
      if (anyTeaser) return { ...anyTeaser, key: extractYouTubeVideoId(anyTeaser.key), type: 'Teaser' };

      // 6. Featurette or Clip
      const anyClip = ytVideos.find(v => v.type === 'Clip' || v.type === 'Featurette' || v.type === 'Behind the Scenes');
      if (anyClip) return { ...anyClip, key: extractYouTubeVideoId(anyClip.key), type: anyClip.type || 'Clip' };

      // 7. First available YouTube entry
      const first = ytVideos[0];
      return { ...first, key: extractYouTubeVideoId(first.key), type: first.type || 'Trailer' };
    }

    async open(itemOrId, mediaType = 'movie', title = '') {
      const isObj = (typeof itemOrId === 'object' && itemOrId !== null);
      const id = isObj ? (itemOrId.id || itemOrId.tmdb_id) : itemOrId;
      const type = isObj ? detectMediaType(itemOrId) : (mediaType || 'movie');
      const itemTitle = isObj ? (itemOrId.title || itemOrId.name || itemOrId.original_title || itemOrId.original_name || '') : (title || '');

      // Open the dedicated 100vh cinema trailer page in a new tab
      if (id || (typeof itemOrId === 'string' && itemOrId)) {
        const params = new URLSearchParams();
        if (id) params.set('id', id);
        if (type) params.set('type', type);
        if (itemTitle) params.set('title', itemTitle);
        if (typeof itemOrId === 'string' && (itemOrId.includes('youtube') || /^[a-zA-Z0-9_-]{11}$/.test(itemOrId.trim()))) {
          const directKey = extractYouTubeVideoId(itemOrId);
          if (directKey) params.set('key', directKey);
        }

        const trailerUrl = `trailer.html?${params.toString()}`;
        try {
          const newTab = window.open(trailerUrl, '_blank');
          if (newTab && !newTab.closed) {
            return;
          }
        } catch (e) {
          // If popup is blocked by browser policy, fall through to in-page modal
        }
      }

      this.ensureModalDOM();
      if (!this.modalEl) return;

      const requestId = ++this.currentRequestId;

      // Clean up previous iframe
      if (this.ratioWrapEl) {
        const oldIframes = this.ratioWrapEl.querySelectorAll('iframe');
        oldIframes.forEach(iframe => {
          try {
            iframe.src = 'about:blank';
            iframe.remove();
          } catch (e) {}
        });
      }
      this.iframeEl = null;

      // Set header title
      if (this.titleTextEl) {
        this.titleTextEl.textContent = itemTitle ? `${itemTitle}` : 'Watch Trailer';
      }
      if (this.badgeEl) {
        this.badgeEl.textContent = 'Trailer';
      }
      if (this.directYtLink) {
        this.directYtLink.style.display = 'none';
      }

      // Open modal and show loading state
      this.showLoading(itemTitle);
      this.modalEl.classList.add('open');
      this.modalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Pause Hero carousel auto-rotation while trailer plays
      if (window.univaultHero) window.univaultHero.isPaused = true;

      try {
        let trailer = null;
        let videoType = 'Official Trailer';

        // Case A: itemOrId is a direct YouTube URL or raw video ID
        if (typeof itemOrId === 'string' && (itemOrId.includes('youtube') || itemOrId.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(itemOrId.trim()))) {
          const directKey = extractYouTubeVideoId(itemOrId);
          if (directKey) {
            trailer = { key: directKey, site: 'YouTube', type: 'Trailer' };
          }
        }

        // Case B: Item object already has preloaded videos
        if (!trailer && isObj && itemOrId.videos && Array.isArray(itemOrId.videos.results)) {
          const selected = this.selectBestVideo(itemOrId.videos.results);
          if (selected) {
            trailer = selected;
            videoType = selected.type;
          }
        }

        // Case C: Fetch from TMDB API (/movie/{movie_id}/videos or /tv/{tv_id}/videos)
        if (!trailer && id && typeof TMDB !== 'undefined' && typeof TMDB.getVideos === 'function') {
          try {
            const videoData = await TMDB.getVideos(type === 'tv' ? 'tv' : 'movie', id);
            const videos = (videoData && Array.isArray(videoData.results)) ? videoData.results : [];
            const selected = this.selectBestVideo(videos);
            if (selected) {
              trailer = selected;
              videoType = selected.type;
            }
          } catch (fetchErr) {
            console.warn(`⚠️ [Trailer] TMDB getVideos fetch error for ${type}/${id}:`, fetchErr.message);
          }
        }

        // Case D: Fallback curated catalog IDs (offline resilience)
        if (!trailer && id) {
          const numId = Number(id);
          let fallbackKey = null;
          if (numId === 933260) fallbackKey = 'LNlrGhBpYjc'; // The Substance
          else if (numId === 1184918) fallbackKey = '677i4vpVywE'; // The Wild Robot
          else if (numId === 94605) fallbackKey = 'fXmAurh012s'; // Arcane
          else if (numId === 693134) fallbackKey = 'Way9Dexny3w'; // Dune Part 2
          else if (numId === 823464) fallbackKey = 'lV1OOlGwExg'; // Godzilla x Kong
          else if (numId === 550) fallbackKey = 'O1nDozs-L4o'; // Fight Club
          else if (numId === 27205) fallbackKey = 'YoHD9XEInc0'; // Inception

          if (fallbackKey) {
            trailer = { key: fallbackKey, site: 'YouTube', type: 'Official Trailer' };
          }
        }

        // Validate that request hasn't been superseded or closed while async loading
        if (requestId !== this.currentRequestId || !this.modalEl.classList.contains('open')) {
          return;
        }

        // Extract YouTube video ID from trailer key
        const videoId = trailer ? trailer.key : null;
        const validVideoId = extractYouTubeVideoId(videoId);

        if (validVideoId) {
          // Official YouTube Embed Format
          const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(validVideoId)}?autoplay=1&rel=0`;
          const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(validVideoId)}`;

          // ── Mandatory Production Debugging Logs ──
          console.log("Trailer data:", trailer);
          console.log("YouTube video ID:", trailer?.key);
          console.log("YouTube embed URL:", embedUrl);
          console.log("Current origin:", window.location.origin);

          if (this.badgeEl) {
            this.badgeEl.textContent = videoType || 'Trailer';
          }

          if (this.directYtLink) {
            this.directYtLink.href = watchUrl;
            this.directYtLink.style.display = 'inline-flex';
          }

          if (this.fallbackBtn) {
            this.fallbackBtn.href = watchUrl;
            this.fallbackBtn.innerHTML = '<span>▶</span> Watch on YouTube';
          }

          // Dynamically create the iframe ONLY after valid trailer key exists
          const iframe = document.createElement('iframe');
          iframe.id = 'heroTrailerIframe';
          iframe.className = 'hero-trailer-iframe';
          iframe.src = embedUrl;
          iframe.title = 'YouTube trailer';
          iframe.frameBorder = '0';
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          iframe.style.display = 'none';

          // Hook onload for smooth transition
          iframe.onload = () => {
            if (requestId === this.currentRequestId && this.modalEl.classList.contains('open')) {
              this.hideLoading();
              iframe.style.display = 'block';
            }
          };

          iframe.onerror = () => {
            if (requestId === this.currentRequestId && this.modalEl.classList.contains('open')) {
              console.warn(`⚠️ [Trailer] Iframe failed loading: ${embedUrl}`);
              this.showError(itemTitle, validVideoId);
            }
          };

          if (this.ratioWrapEl) {
            this.ratioWrapEl.appendChild(iframe);
          }
          this.iframeEl = iframe;

          // Safety timeout in case iframe onload event is delayed by network
          setTimeout(() => {
            if (requestId === this.currentRequestId && this.modalEl.classList.contains('open') && iframe.style.display === 'none') {
              this.hideLoading();
              iframe.style.display = 'block';
            }
          }, 1200);

        } else {
          console.warn(`⚠️ [Trailer] No valid YouTube trailer available for: "${itemTitle}" (${type}/${id})`);
          this.showError(itemTitle, null);
        }

      } catch (err) {
        console.error('❌ [Trailer] Modal playback exception:', err);
        if (requestId === this.currentRequestId) {
          this.showError(itemTitle, null);
        }
      }
    }

    close() {
      this.currentRequestId++;
      if (!this.modalEl) return;

      this.modalEl.classList.remove('open');
      this.modalEl.setAttribute('aria-hidden', 'true');

      // Teardown and destroy iframe
      if (this.ratioWrapEl) {
        const iframes = this.ratioWrapEl.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.src = 'about:blank';
            iframe.remove();
          } catch (e) {}
        });
      }
      this.iframeEl = null;

      this.hideLoading();

      if (this.errorEl) {
        this.errorEl.style.display = 'none';
      }

      document.body.style.overflow = '';

      if (window.univaultHero) {
        window.univaultHero.isPaused = false;
      }
    }
  }

  let globalTrailerManager = null;
  function getTrailerManager() {
    if (!globalTrailerManager) {
      globalTrailerManager = new TrailerModalController();
    }
    return globalTrailerManager;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎴 6. CONTENT CARD BUILDER SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  function detectMediaType(item) {
    if (!item) return 'movie';
    if (item.media_type === 'anime' || item.type === 'anime') return 'anime';

    // Strictly identify authentic Japanese anime:
    // Must be Japanese language or Japanese origin country + Animation genre (16)
    const isJapanese = item.original_language === 'ja' ||
      (Array.isArray(item.origin_country) && item.origin_country.includes('JP')) ||
      (Array.isArray(item.production_countries) && item.production_countries.some(c => c.iso_3166_1 === 'JP'));

    const genreIds = item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []);
    const isAnimation = genreIds.includes(16);

    if (isJapanese && isAnimation) return 'anime';
    if (item.media_type === 'tv' || item.first_air_date || item.name) return 'tv';
    return 'movie';
  }

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function createCardElement(item, options = {}) {
    if (!item) return document.createElement('div');

    const mediaType = detectMediaType(item);
    const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
    const dateStr = item.release_date || item.first_air_date || '';
    const year = dateStr ? new Date(dateStr).getFullYear() : (item.year || '2026');
    const rawRating = item.vote_average;
    const rating = (rawRating !== undefined && rawRating !== null && rawRating > 0)
      ? Number(rawRating).toFixed(1)
      : 'NR';

    // Form w500 poster image URL
    const posterUrl = item.poster_path ? TMDB.getImageUrl(item.poster_path, 'w500') : null;

    let badgeText = 'MOVIE';
    let badgeClass = 'badge-accent';
    if (mediaType === 'anime') {
      badgeText = 'ANIME';
      badgeClass = 'badge-anime';
    } else if (mediaType === 'tv') {
      badgeText = 'TV SHOW';
      badgeClass = 'badge-tv';
    }

    const isSaved = isInWatchlist(item.id);

    const card = document.createElement('article');
    card.className = 'media-card';
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', mediaType);

    const fallbackSvg = `
      <div class="poster-fallback-container">
        <div class="poster-fallback-pattern"></div>
        <div class="poster-fallback-content">
          <div class="poster-fallback-icon">🎬</div>
          <div class="poster-fallback-title">${escapeHTML(title)}</div>
          <div class="poster-fallback-badge">${badgeText}</div>
        </div>
      </div>
    `;

    const posterInner = posterUrl
      ? `<img
          src="${posterUrl}"
          alt="${escapeHTML(title)} poster"
          class="card-poster-img"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.classList.add('visible');"
         />
         <div class="poster-fallback-wrapper">${fallbackSvg}</div>`
      : `<div class="poster-fallback-wrapper visible">${fallbackSvg}</div>`;

    card.innerHTML = `
      <div class="media-poster">
        ${posterInner}
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        <div class="card-rating-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#F5C842" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>${rating}</span>
        </div>
        <div class="card-overlay">
          <div class="card-overlay-bg"></div>
          <button class="card-play-btn" aria-label="Play trailer for ${escapeHTML(title)}" data-action="play">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </button>
          <div class="card-actions-bar">
            <button class="card-btn btn-watchlist ${isSaved ? 'in-watchlist' : ''}" 
                    aria-label="Add ${escapeHTML(title)} to watchlist" 
                    data-action="watchlist">
              <svg class="icon-plus" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <svg class="icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span class="btn-label">${isSaved ? 'Saved' : 'Watchlist'}</span>
            </button>
            <a href="details.html?id=${item.id}&type=${mediaType}" class="card-btn btn-info" data-action="info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Info</span>
            </a>
          </div>
        </div>
      </div>
      <div class="media-info">
        <h3 class="media-title" title="${escapeHTML(title)}">${escapeHTML(title)}</h3>
        <div class="media-meta">
          <span class="meta-year">${year}</span>
          <span class="meta-dot">•</span>
          <span class="meta-type">${badgeText}</span>
          <span class="meta-dot">•</span>
          <span class="meta-rating">★ ${rating}</span>
        </div>
      </div>
    `;

    const watchlistBtn = card.querySelector('[data-action="watchlist"]');
    if (watchlistBtn) {
      watchlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const saved = toggleWatchlist(item);
        if (saved) {
          watchlistBtn.classList.add('in-watchlist');
          watchlistBtn.querySelector('.btn-label').textContent = 'Saved';
        } else {
          watchlistBtn.classList.remove('in-watchlist');
          watchlistBtn.querySelector('.btn-label').textContent = 'Watchlist';
        }
      });
    }

    const playBtn = card.querySelector('[data-action="play"]');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        getTrailerManager().open(item);
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      window.location.href = `details.html?id=${item.id}&type=${mediaType}`;
    });

    return card;
  }

  function renderGrid(container, items = []) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    target.innerHTML = '';
    if (!items || items.length === 0) {
      target.innerHTML = `
        <div class="cards-empty-state">
          <p>No titles found matching your request.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      fragment.appendChild(createCardElement(item));
    });
    target.appendChild(fragment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌟 6. CINEMATIC HERO CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  class HeroController {
    constructor() {
      this.items = [];
      this.currentIndex = 0;
      this.rotationTimer = null;
      this.rotationIntervalMs = 7000;
      this.isPaused = false;
      this.isOfflineMode = false;

      this.section = document.getElementById('heroSection');
      this.backdropEl = document.getElementById('heroBackdrop');
      this.contentEl = document.getElementById('heroContent');
      this.controlsEl = document.getElementById('heroControls');
      this.modalEl = document.getElementById('heroTrailerModal');
      this.modalIframeEl = document.getElementById('heroTrailerIframe');
      this.modalErrorEl = document.getElementById('heroTrailerError');

      if (this.section) {
        this.init();
      }
    }

    async init() {
      this.renderSkeleton();
      this.bindEvents();

      try {
        const data = await TMDB.getTrending('day');
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          this.items = data.results
            .filter(item => item.backdrop_path && item.overview)
            .slice(0, 7);
          this.isOfflineMode = false;
          this.hideFallbackNotice();
          console.info(`✅ [Hero] Loaded ${this.items.length} live trending titles from TMDB.`);
        } else {
          throw new Error('TMDB response contained no trending results.');
        }
      } catch (err) {
        console.warn('⚠️ [Hero] TMDB API unavailable, activating featured catalog:', err.message);
        this.items = FALLBACK_CATALOG;
        this.isOfflineMode = true;
        this.showFallbackNotice();
      }

      if (!this.items || this.items.length === 0) {
        this.items = FALLBACK_CATALOG;
        this.isOfflineMode = true;
        this.showFallbackNotice();
      }

      this.renderSlide(0);
      this.renderIndicators();
      this.startAutoRotation();
    }

    // ── Skeleton Loader ──────────────────────────────────────────────────────
    renderSkeleton() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = `
        <div class="hero-grid">
          <div class="hero-details">
            <div class="hero-badge-row">
              <div class="skeleton-box skeleton-badge"></div>
            </div>
            <div class="skeleton-box skeleton-title"></div>
            <div class="skeleton-box skeleton-meta"></div>
            <div class="skeleton-box skeleton-text"></div>
            <div class="skeleton-box skeleton-text"></div>
            <div class="skeleton-box skeleton-text short"></div>
            <div class="hero-actions" style="margin-top: 1.5rem;">
              <div class="skeleton-box skeleton-btn"></div>
              <div class="skeleton-box skeleton-btn"></div>
              <div class="skeleton-box skeleton-btn"></div>
            </div>
          </div>
          <div class="hero-poster-column">
            <div class="hero-poster-card">
              <div class="skeleton-box skeleton-poster"></div>
            </div>
          </div>
        </div>
      `;
    }

    // ── Render Individual Slide ──────────────────────────────────────────────
    renderSlide(index, isManual = false) {
      if (!this.items || this.items.length === 0) return;

      this.currentIndex = index;
      const item = this.items[index];

      // Backdrop Image
      const backdropUrl = TMDB.getBackdropUrl(item.backdrop_path) ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

      if (this.backdropEl) {
        this.backdropEl.classList.remove('active-slide');
        this.backdropEl.classList.add('fade-out');

        setTimeout(() => {
          this.backdropEl.style.backgroundImage = `url('${backdropUrl}')`;
          this.backdropEl.classList.remove('fade-out');
          this.backdropEl.classList.add('active-slide');
        }, 150);
      }

      // Title & Metadata
      const title = item.title || item.name || 'Untitled';
      const mediaType = (item.media_type || (item.title ? 'movie' : 'tv')).toUpperCase();
      const releaseDate = item.release_date || item.first_air_date || '';
      const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '2026';
      const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : 'N/A';

      // Poster Image
      const posterUrl = TMDB.getImageUrl(item.poster_path, 'w500') ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

      const genreNames = (item.genre_ids || [])
        .map(id => GENRE_MAP[id])
        .filter(Boolean)
        .slice(0, 3);

      const isInList = isInWatchlist(item.id);

      if (this.contentEl) {
        this.contentEl.innerHTML = `
          <div class="hero-grid">
            <div class="hero-details">
              <div class="hero-badge-row">
                <span class="hero-badge">🔥 #${index + 1} Trending</span>
                <span class="hero-badge hero-badge-type">${mediaType}</span>
              </div>

              <h1 class="hero-title">${escapeHTML(title)}</h1>

              <div class="hero-meta-row">
                <span class="hero-rating-chip">⭐ ${rating}</span>
                <span class="hero-year-chip">${releaseYear}</span>
                <div class="hero-genres-container">
                  ${genreNames.map(g => `<span class="hero-genre-pill">${escapeHTML(g)}</span>`).join('')}
                </div>
              </div>

              <p class="hero-overview">${escapeHTML(item.overview)}</p>

              <div class="hero-actions">
                <button class="btn-hero-play" id="heroPlayBtn" data-id="${item.id}">
                  <span aria-hidden="true">▶</span> Watch Trailer
                </button>

                <a href="details.html?id=${item.id}&type=${(item.media_type || 'movie').toLowerCase()}" class="btn-hero-secondary">
                  <span aria-hidden="true">ℹ️</span> More Info
                </a>

                <button class="btn-hero-watchlist ${isInList ? 'in-watchlist' : ''}" id="heroWatchlistBtn" data-id="${item.id}">
                  <span aria-hidden="true">${isInList ? '✓' : '🔖'}</span>
                  <span>${isInList ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>

            <div class="hero-poster-column">
              <div class="hero-poster-card">
                <img src="${posterUrl}" alt="${escapeHTML(title)} poster" class="hero-poster-img" loading="eager" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'">
              </div>
            </div>
          </div>
        `;

        const playBtn = document.getElementById('heroPlayBtn');
        if (playBtn) {
          playBtn.addEventListener('click', () => this.openTrailer(item));
        }

        const watchlistBtn = document.getElementById('heroWatchlistBtn');
        if (watchlistBtn) {
          watchlistBtn.addEventListener('click', () => {
            const added = toggleWatchlist(item);
            if (added) {
              watchlistBtn.classList.add('in-watchlist');
              watchlistBtn.innerHTML = `<span aria-hidden="true">✓</span> <span>In Watchlist</span>`;
            } else {
              watchlistBtn.classList.remove('in-watchlist');
              watchlistBtn.innerHTML = `<span aria-hidden="true">🔖</span> <span>Add to Watchlist</span>`;
            }
          });
        }
      }

      this.updateIndicators(index);

      if (isManual) {
        this.restartAutoRotation();
      }
    }

    // ── Carousel Controls ────────────────────────────────────────────────────
    renderIndicators() {
      if (!this.controlsEl || !this.items.length) return;
      this.controlsEl.innerHTML = `
        <div class="hero-indicators-container" role="tablist" aria-label="Hero Carousel Navigation">
          ${this.items.map((_, i) => `
            <button class="hero-dot ${i === 0 ? 'active' : ''}" 
                    data-index="${i}" 
                    aria-label="Go to slide ${i + 1}"
                    role="tab" 
                    aria-selected="${i === 0}">
              <div class="hero-dot-progress"></div>
            </button>
          `).join('')}
        </div>
      `;

      const dots = this.controlsEl.querySelectorAll('.hero-dot');
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          this.renderSlide(idx, true);
        });
      });
    }

    updateIndicators(activeIndex) {
      if (!this.controlsEl) return;
      const dots = this.controlsEl.querySelectorAll('.hero-dot');
      dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
          dot.classList.add('active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.classList.remove('active');
          dot.setAttribute('aria-selected', 'false');
        }
      });
    }

    startAutoRotation() {
      this.stopAutoRotation();
      this.rotationTimer = setInterval(() => {
        if (!this.isPaused) {
          const nextIndex = (this.currentIndex + 1) % this.items.length;
          this.renderSlide(nextIndex);
        }
      }, this.rotationIntervalMs);
    }

    stopAutoRotation() {
      if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = null;
      }
    }

    restartAutoRotation() {
      this.stopAutoRotation();
      this.startAutoRotation();
    }

    bindEvents() {
      if (this.section) {
        this.section.addEventListener('mouseenter', () => { this.isPaused = true; });
        this.section.addEventListener('mouseleave', () => { this.isPaused = false; });
      }

      const closeBtn = document.getElementById('closeHeroTrailerModal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeTrailer());
      }

      if (this.modalEl) {
        this.modalEl.addEventListener('click', (e) => {
          if (e.target === this.modalEl) this.closeTrailer();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modalEl && this.modalEl.classList.contains('open')) {
          this.closeTrailer();
        }
      });
    }

    // ── Trailer Modal ────────────────────────────────────────────────────────
    async openTrailer(item) {
      this.isPaused = true;
      await getTrailerManager().open(item);
    }

    closeTrailer() {
      getTrailerManager().close();
      this.isPaused = false;
    }

    // ── Offline Warning Banner Management ────────────────────────────────────
    showFallbackNotice() {
      if (!this.section) return;
      let notice = this.section.querySelector('.hero-fallback-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'hero-fallback-notice';
        notice.innerHTML = '⚠️ TMDB API Offline — Showing Featured Catalog';
        this.section.appendChild(notice);
      }
      notice.style.display = 'block';
    }

    hideFallbackNotice() {
      if (!this.section) return;
      const notice = this.section.querySelector('.hero-fallback-notice');
      if (notice) {
        notice.remove();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎭 6. ACTOR & GENRE CARD CREATORS
  // ═══════════════════════════════════════════════════════════════════════════
  const GENRE_CATALOG = [
    { id: 28, name: 'Action', icon: '🎬', gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' },
    { id: 878, name: 'Sci-Fi', icon: '🚀', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4338ca 100%)' },
    { id: 27, name: 'Horror', icon: '💀', gradient: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)' },
    { id: 35, name: 'Comedy', icon: '😂', gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' },
    { id: 16, name: 'Anime', icon: '⛩️', gradient: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)' },
    { id: 18, name: 'Drama', icon: '📺', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
    { id: 80, name: 'Crime', icon: '🔍', gradient: 'linear-gradient(135deg, #64748b 0%, #1e293b 100%)' },
    { id: 99, name: 'Documentary', icon: '🏆', gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)' },
    { id: 10749, name: 'Romance', icon: '💖', gradient: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)' },
    { id: 14, name: 'Fantasy', icon: '🔮', gradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)' },
    { id: 53, name: 'Thriller', icon: '⚡', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #075985 100%)' },
    { id: 12, name: 'Adventure', icon: '🗺️', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' }
  ];

  function createActorCard(actor) {
    const name = actor.name || 'Unknown Actor';
    const profileUrl = actor.profile_path
      ? TMDB.getImageUrl(actor.profile_path, 'w500')
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80';
    const knownFor = (actor.known_for || [])
      .map(k => k.title || k.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ') || 'Film & Television';
    const popularity = actor.popularity ? Number(actor.popularity).toFixed(0) : '85';

    const card = document.createElement('article');
    card.className = 'actor-card';
    card.innerHTML = `
      <div class="actor-poster">
        <img src="${profileUrl}" alt="${escapeHTML(name)}" class="actor-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'">
        <div class="actor-popularity-chip">⭐ ${popularity}</div>
      </div>
      <div class="actor-info">
        <h3 class="actor-name" title="${escapeHTML(name)}">${escapeHTML(name)}</h3>
        <span class="actor-known-for" title="${escapeHTML(knownFor)}">${escapeHTML(knownFor)}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `search.html?query=${encodeURIComponent(name)}`;
    });

    return card;
  }

  function createGenreCard(g) {
    const card = document.createElement('a');
    card.className = 'genre-card';
    card.href = g.name === 'Anime' ? 'anime.html' : `movies.html?genre=${g.id}`;
    card.innerHTML = `
      <div class="genre-card-bg" style="background: ${g.gradient};"></div>
      <div class="genre-card-content">
        <span class="genre-card-icon">${g.icon}</span>
        <div>
          <h3 class="genre-card-title">${g.name}</h3>
          <span class="genre-card-arrow">Explore <span>→</span></span>
        </div>
      </div>
    `;
    return card;
  }

  function renderCarouselSkeletons(trackEl, count = 6) {
    if (!trackEl) return;
    trackEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'uv-card-skeleton uv-shimmer';
      sk.setAttribute('aria-hidden', 'true');
      sk.innerHTML = `
        <div class="uv-card-skeleton-badge uv-shimmer"></div>
        <div class="uv-card-skeleton-rating uv-shimmer"></div>
        <div class="uv-card-skeleton-title uv-shimmer"></div>
        <div class="uv-card-skeleton-meta uv-shimmer"></div>
      `;
      fragment.appendChild(sk);
    }
    trackEl.appendChild(fragment);
  }

  function populateCarouselTrack(trackId, items = [], customCreator = null) {
    const track = typeof trackId === 'string' ? document.getElementById(trackId) : trackId;
    if (!track) return;
    track.innerHTML = '';

    if (!items || items.length === 0) {
      track.innerHTML = `
        <div class="uv-state-card" style="padding: 1.75rem; margin: 0 auto; width: 100%;">
          <div class="uv-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">🎬</div>
          <h4 class="uv-state-title" style="font-size: 1.1rem;">Titles Currently Unavailable</h4>
          <p class="uv-state-desc" style="font-size: 0.85rem; margin-bottom: 0;">Check back shortly for updated streaming titles.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const card = customCreator ? customCreator(item) : createCardElement(item);
      fragment.appendChild(card);
    });
    track.appendChild(fragment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎡 7. CAROUSEL ARROW CONTROLS & SMOOTH SCROLLING
  // ═══════════════════════════════════════════════════════════════════════════
  function initCarouselControls() {
    // Arrow button click listeners
    document.querySelectorAll('.carousel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        if (!targetId) return;
        const track = document.getElementById(targetId);
        if (!track) return;

        const isPrev = btn.classList.contains('carousel-prev') || btn.getAttribute('data-direction') === 'prev';
        const scrollAmount = track.clientWidth * 0.75;
        track.scrollBy({
          left: isPrev ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      });
    });

    // Touch & scroll monitoring for button disable states
    document.querySelectorAll('.carousel-track').forEach(track => {
      const updateArrows = () => {
        const parent = track.closest('.content-section');
        if (!parent) return;
        const prevBtn = parent.querySelector('.carousel-prev');
        const nextBtn = parent.querySelector('.carousel-next');
        if (prevBtn) prevBtn.disabled = track.scrollLeft <= 5;
        if (nextBtn) nextBtn.disabled = (track.scrollLeft + track.clientWidth) >= (track.scrollWidth - 10);
      };

      track.addEventListener('scroll', updateArrows, { passive: true });
      setTimeout(updateArrows, 400);

      // Desktop mouse drag scrolling
      let isDown = false;
      let startX = 0;
      let scrollStart = 0;

      track.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - track.offsetLeft;
        scrollStart = track.scrollLeft;
      });
      track.addEventListener('mouseleave', () => { isDown = false; });
      track.addEventListener('mouseup', () => { isDown = false; });
      track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.5;
        track.scrollLeft = scrollStart - walk;
      });

      // Mobile touch-swipe gesture support
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartScroll = 0;

      track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartScroll = track.scrollLeft;
      }, { passive: true });

      track.addEventListener('touchmove', (e) => {
        const deltaX = touchStartX - e.touches[0].clientX;
        const deltaY = touchStartY - e.touches[0].clientY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
          track.scrollLeft = touchStartScroll + deltaX;
        }
      }, { passive: true });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏠 8. HOMEPAGE 10-SECTION DATA LOADER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initHomepageSections() {
    const isHomepage = document.getElementById('carouselTrending') !== null;
    if (!isHomepage) return;

    const sections = [
      { id: 'carouselTrending', fetcher: () => TMDB.getTrending('day') },
      { id: 'carouselPopularMovies', fetcher: () => TMDB.getPopularMovies(1) },
      { id: 'carouselPopularTV', fetcher: () => TMDB.getPopularTV(1) },
      { id: 'carouselAnime', fetcher: () => TMDB.getAnime(1) },
      { id: 'carouselNowPlaying', fetcher: () => TMDB.getNowPlayingMovies(1) },
      { id: 'carouselTopRatedMovies', fetcher: () => TMDB.getTopRatedMovies(1) },
      { id: 'carouselTopRatedTV', fetcher: () => TMDB.getTopRatedTV(1) },
      { id: 'carouselUpcoming', fetcher: () => TMDB.getUpcomingMovies(1) },
      { id: 'carouselActors', fetcher: () => TMDB.getPopularActors(1), creator: createActorCard },
      { id: 'carouselGenres', staticData: GENRE_CATALOG, creator: createGenreCard }
    ];

    // 1. Render immediate skeletons
    sections.forEach(sec => {
      const track = document.getElementById(sec.id);
      if (track) renderCarouselSkeletons(track, 6);
    });

    // 2. Fetch live data concurrently
    const loadPromises = sections.map(async (sec) => {
      const track = document.getElementById(sec.id);
      if (!track) return;

      if (sec.staticData) {
        populateCarouselTrack(track, sec.staticData, sec.creator);
        return;
      }

      try {
        const data = await sec.fetcher();
        const results = (data && data.results) ? data.results : [];
        if (results.length > 0) {
          populateCarouselTrack(track, results, sec.creator);
        } else {
          populateCarouselTrack(track, FALLBACK_CATALOG);
        }
      } catch (err) {
        console.warn(`⚠️ [Section ${sec.id}] TMDB load failed, using fallback:`, err.message);
        populateCarouselTrack(track, FALLBACK_CATALOG);
      }
    });

    await Promise.allSettled(loadPromises);

    // 3. Initialize carousel navigation
    initCarouselControls();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 9. MOVIES PAGE CONTROLLER (movies.html)
  // ═══════════════════════════════════════════════════════════════════════════
  const MOVIE_GENRES_META = {
    '28': { name: 'Action', desc: 'High-octane blockbusters, adrenaline-fueled stunts, and explosive adventures.' },
    '12': { name: 'Adventure', desc: 'Epic quests, uncharted worlds, and thrilling journeys across the globe.' },
    '16': { name: 'Animation', desc: 'Groundbreaking animation masterpieces, anime sagas, and family favorites.' },
    '35': { name: 'Comedy', desc: 'Side-splitting laughs, witty parodies, and feel-good cinematic humor.' },
    '80': { name: 'Crime', desc: 'Gritty underworld stories, mafia epics, and mastermind heist thrillers.' },
    '99': { name: 'Documentary', desc: 'Real-world exposés, historical accounts, and fascinating true stories.' },
    '18': { name: 'Drama', desc: 'Emotional depth, powerful human stories, and award-winning performances.' },
    '14': { name: 'Fantasy', desc: 'Mythical creatures, arcane sorcery, and enchanting magical universes.' },
    '27': { name: 'Horror', desc: 'Spine-chilling scares, supernatural mysteries, and terrifying survival.' },
    '9648': { name: 'Mystery', desc: 'Unravel baffling enigmas, detective cases, and psychological twists.' },
    '10749': { name: 'Romance', desc: 'Heartwarming love stories, emotional bonds, and unforgettable romance.' },
    '878': { name: 'Science Fiction', desc: 'Futuristic visionaries, cyber worlds, alien encounters, and space epics.' },
    '53': { name: 'Thriller', desc: 'Edge-of-your-seat suspense, tension-fueled cat-and-mouse mysteries.' },
    '10752': { name: 'War', desc: 'Historic battlefields, heroic sacrifices, and gripping military drama.' },
    '37': { name: 'Western', desc: 'Frontier legends, outlaw shootouts, and rugged wilderness sagas.' }
  };

  const MOVIE_SECTIONS_META = {
    'popular': { title: 'Popular Movies', subtitle: 'Discover the most popular movies worldwide today' },
    'trending': { title: 'Trending Movies', subtitle: 'Hottest films making waves across the globe right now' },
    'now_playing': { title: 'Now Playing in Theaters', subtitle: 'Current box-office hits streaming in 4K Ultra HD' },
    'top_rated': { title: 'Top Rated Movies', subtitle: 'All-time cinematic masterpieces with highest global ratings' },
    'upcoming': { title: 'Upcoming Movies', subtitle: 'Highly anticipated blockbusters arriving in theaters soon' }
  };

  function initMoviesPage() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    const headingTitle = document.getElementById('catalogHeadingTitle');
    const headingSubtitle = document.getElementById('catalogHeadingSubtitle');
    const resultsCount = document.getElementById('catalogResultsCount');
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationPages = document.getElementById('paginationPages');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const clearGenreBtn = document.getElementById('clearGenreBtn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const genrePills = document.querySelectorAll('.genre-pill');

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    let currentSection = urlParams.get('section') || 'popular';
    let currentGenreId = urlParams.get('genre') || '';
    let currentPage = parseInt(urlParams.get('page'), 10) || 1;
    let totalPages = 1;
    let totalResults = 0;

    // Validate section
    if (!MOVIE_SECTIONS_META[currentSection]) {
      currentSection = 'popular';
    }

    // Set initial active tabs in UI
    function syncUIFilters() {
      categoryTabs.forEach(tab => {
        const isMatch = tab.getAttribute('data-section') === currentSection && !currentGenreId;
        tab.classList.toggle('active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      genrePills.forEach(pill => {
        const pillGenre = pill.getAttribute('data-genre') || '';
        const isMatch = pillGenre === currentGenreId;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });

      if (clearGenreBtn) {
        clearGenreBtn.style.display = currentGenreId ? 'inline-block' : 'none';
      }
    }

    function renderSkeletonGrid(count = 18) {
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const sk = document.createElement('div');
        sk.className = 'uv-card-skeleton uv-shimmer';
        sk.setAttribute('aria-hidden', 'true');
        sk.innerHTML = `
          <div class="uv-card-skeleton-badge uv-shimmer"></div>
          <div class="uv-card-skeleton-rating uv-shimmer"></div>
          <div class="uv-card-skeleton-title uv-shimmer"></div>
          <div class="uv-card-skeleton-meta uv-shimmer"></div>
        `;
        fragment.appendChild(sk);
      }
      grid.appendChild(fragment);
    }

    function renderPaginationUI(page, total) {
      if (!paginationContainer || !paginationPages) return;
      if (total <= 1) {
        paginationContainer.style.display = 'none';
        return;
      }
      paginationContainer.style.display = 'flex';

      const maxTMDBPages = Math.min(total, 500); // TMDB API limits pagination to 500
      totalPages = maxTMDBPages;

      prevBtn.disabled = (page <= 1);
      nextBtn.disabled = (page >= maxTMDBPages);

      // Generate page number sequence
      paginationPages.innerHTML = '';
      const fragment = document.createDocumentFragment();

      let pagesToRender = [];
      if (maxTMDBPages <= 7) {
        for (let i = 1; i <= maxTMDBPages; i++) pagesToRender.push(i);
      } else {
        pagesToRender.push(1);
        if (page > 3) pagesToRender.push('...');
        const start = Math.max(2, page - 1);
        const end = Math.min(maxTMDBPages - 1, page + 1);
        for (let i = start; i <= end; i++) {
          if (!pagesToRender.includes(i)) pagesToRender.push(i);
        }
        if (page < maxTMDBPages - 2) pagesToRender.push('...');
        if (!pagesToRender.includes(maxTMDBPages)) pagesToRender.push(maxTMDBPages);
      }

      pagesToRender.forEach(p => {
        if (p === '...') {
          const dot = document.createElement('span');
          dot.className = 'pagination-dots';
          dot.textContent = '…';
          fragment.appendChild(dot);
        } else {
          const numBtn = document.createElement('button');
          numBtn.className = `pagination-num ${p === page ? 'active' : ''}`;
          numBtn.textContent = p;
          numBtn.setAttribute('aria-label', `Page ${p}`);
          numBtn.addEventListener('click', () => {
            if (p !== currentPage) {
              currentPage = p;
              loadMovies(currentPage, true);
            }
          });
          fragment.appendChild(numBtn);
        }
      });

      paginationPages.appendChild(fragment);
    }

    function updateUrlState() {
      const params = new URLSearchParams();
      if (currentGenreId) {
        params.set('genre', currentGenreId);
      } else {
        params.set('section', currentSection);
      }
      if (currentPage > 1) {
        params.set('page', currentPage);
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }

    async function loadMovies(page = 1, shouldScroll = false) {
      renderSkeletonGrid(18);
      syncUIFilters();

      if (resultsCount) {
        resultsCount.innerHTML = `Fetching page ${page}…`;
      }

      try {
        let data;
        let activeTitle = '';
        let activeSubtitle = '';

        if (currentGenreId) {
          const meta = MOVIE_GENRES_META[currentGenreId] || { name: 'Genre Movies', desc: 'Curated genre cinema' };
          activeTitle = `${meta.name} Movies`;
          activeSubtitle = meta.desc;
          data = await TMDB.getMoviesByGenre(currentGenreId, page);
        } else {
          const meta = MOVIE_SECTIONS_META[currentSection] || MOVIE_SECTIONS_META['popular'];
          activeTitle = meta.title;
          activeSubtitle = meta.subtitle;

          if (currentSection === 'trending') {
            data = await TMDB.getTrendingMovies('day', page);
          } else if (currentSection === 'now_playing') {
            data = await TMDB.getNowPlayingMovies(page);
          } else if (currentSection === 'top_rated') {
            data = await TMDB.getTopRatedMovies(page);
          } else if (currentSection === 'upcoming') {
            data = await TMDB.getUpcomingMovies(page);
          } else {
            data = await TMDB.getPopularMovies(page);
          }
        }

        if (headingTitle) headingTitle.textContent = activeTitle;
        if (headingSubtitle) headingSubtitle.textContent = activeSubtitle;

        const results = (data && Array.isArray(data.results)) ? data.results : [];
        totalResults = data && data.total_results ? data.total_results : results.length;
        totalPages = data && data.total_pages ? data.total_pages : 1;

        if (results.length === 0) {
          // Empty State
          grid.innerHTML = `
            <div class="uv-state-card">
              <div class="uv-state-icon">🎬</div>
              <h3 class="uv-state-title">No Movies Found</h3>
              <p class="uv-state-desc">We couldn't find any movies matching your selected genre. Try exploring our popular catalog.</p>
              <div class="uv-state-actions">
                <button class="uv-state-btn uv-state-btn-primary" id="resetMoviesFilterBtn">Explore Popular Movies</button>
              </div>
            </div>
          `;
          const resetBtn = document.getElementById('resetMoviesFilterBtn');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => {
              currentGenreId = '';
              currentSection = 'popular';
              currentPage = 1;
              updateUrlState();
              loadMovies(1);
            });
          }
          if (paginationContainer) paginationContainer.style.display = 'none';
          if (resultsCount) resultsCount.textContent = '0 titles found';
          return;
        }

        // Render Movie Cards
        renderGrid(grid, results);

        // Update Counter
        if (resultsCount) {
          resultsCount.innerHTML = `Page <strong>${page}</strong> of <strong>${Math.min(totalPages, 500).toLocaleString()}</strong> (${totalResults.toLocaleString()} titles)`;
        }

        // Render Pagination
        renderPaginationUI(page, totalPages);

        // Scroll up smoothly if changing page
        if (shouldScroll) {
          const targetY = grid.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

      } catch (err) {
        console.error('❌ [Movies Catalog Error]', err);
        const isNetwork = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'));
        grid.innerHTML = `
          <div class="uv-state-card ${isNetwork ? 'uv-state-network-error' : 'uv-state-api-error'}">
            <div class="uv-state-icon">${isNetwork ? '📡' : '⚠️'}</div>
            <h3 class="uv-state-title">${isNetwork ? 'Network Connection Error' : 'Unable to Load Movies'}</h3>
            <p class="uv-state-desc">${escapeHTML(err.message || 'We encountered an error connecting to the TMDB API. Please verify your internet connection and retry.')}</p>
            <div class="uv-state-actions">
              <button class="uv-state-btn uv-state-btn-primary" id="retryMoviesBtn">${isNetwork ? 'Reconnect ↻' : 'Try Again ↻'}</button>
              <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
            </div>
          </div>
        `;
        const retryBtn = document.getElementById('retryMoviesBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => loadMovies(currentPage));
        }
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (resultsCount) resultsCount.textContent = 'Error loading results';
      }
    }

    // ── Bind Category Section Tabs ───────────────────────────────────────────
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = tab.getAttribute('data-section');
        if (sec === currentSection && !currentGenreId) return;

        currentSection = sec;
        currentGenreId = '';
        currentPage = 1;
        updateUrlState();
        loadMovies(1);
      });
    });

    // ── Bind Genre Filter Pills ──────────────────────────────────────────────
    genrePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const gId = pill.getAttribute('data-genre') || '';
        if (gId === currentGenreId) return;

        currentGenreId = gId;
        currentPage = 1;
        updateUrlState();
        loadMovies(1);
      });
    });

    if (clearGenreBtn) {
      clearGenreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentGenreId = '';
        currentPage = 1;
        updateUrlState();
        loadMovies(1);
      });
    }

    // ── Bind Pagination Next / Prev ──────────────────────────────────────────
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateUrlState();
          loadMovies(currentPage, true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateUrlState();
          loadMovies(currentPage, true);
        }
      });
    }

    // ── Browser Back / Forward Handling ──────────────────────────────────────
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentSection = p.get('section') || 'popular';
      currentGenreId = p.get('genre') || '';
      currentPage = parseInt(p.get('page'), 10) || 1;
      loadMovies(currentPage, false);
    });

    // Initial Load
    loadMovies(currentPage);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📺 10. TV SHOWS PAGE CONTROLLER (tv-shows.html)
  // ═══════════════════════════════════════════════════════════════════════════
  const TV_GENRES_META = {
    '18': { name: 'Drama', desc: 'Captivating narrative arcs, complex characters, and powerful emotional drama.' },
    '35': { name: 'Comedy', desc: 'Sitcoms, stand-up specials, satirical comedies, and laugh-out-loud episodes.' },
    '10759': { name: 'Action & Adventure', desc: 'High-stakes missions, superhero sagas, and epic world expeditions.' },
    '16': { name: 'Animation', desc: 'Acclaimed animated series, anime adaptations, and family entertainment.' },
    '80': { name: 'Crime', desc: 'True crime exposés, detective mysteries, mafia chronicles, and police procedurals.' },
    '99': { name: 'Documentary', desc: 'Docuseries, wildlife spectacles, history investigations, and real stories.' },
    '10751': { name: 'Family', desc: 'Wholesome entertainment, heartwarming stories, and fun for all ages.' },
    '9648': { name: 'Mystery', desc: 'Baffling whodunits, psychological thrillers, and twist-filled serials.' },
    '10765': { name: 'Sci-Fi & Fantasy', desc: 'Time travel, magical realms, interstellar fleets, and dystopian worlds.' },
    '10762': { name: 'Kids', desc: 'Playful adventures, animated fun, and educational children’s shows.' },
    '10764': { name: 'Reality', desc: 'Reality competitions, lifestyle series, survival challenges, and unscripted drama.' },
    '10767': { name: 'Talk', desc: 'Late-night interviews, insightful panel debates, and celebrity discussions.' },
    '10768': { name: 'War & Politics', desc: 'Political intrigue, statecraft sagas, war journalism, and historic conflicts.' },
    '37': { name: 'Western', desc: 'Frontier outlaws, ranch dynasties, and lawless territory showdowns.' }
  };

  const TV_SECTIONS_META = {
    'popular': { title: 'Popular TV Shows', subtitle: 'Most-watched television series and binge-worthy phenomena worldwide' },
    'trending': { title: 'Trending TV Shows', subtitle: 'Global trending television series making waves today' },
    'top_rated': { title: 'Top Rated TV Shows', subtitle: 'Critically acclaimed hall-of-fame series with the highest ratings' },
    'airing_today': { title: 'Airing Today', subtitle: 'Fresh episodes broadcasting on television networks and streaming today' },
    'on_the_air': { title: 'On The Air', subtitle: 'Current television seasons airing new episodes this week' }
  };

  function initTVShowsPage() {
    const grid = document.getElementById('tvGrid');
    if (!grid) return;

    const headingTitle = document.getElementById('tvHeadingTitle');
    const headingSubtitle = document.getElementById('tvHeadingSubtitle');
    const resultsCount = document.getElementById('tvResultsCount');
    const paginationContainer = document.getElementById('tvPaginationContainer');
    const paginationPages = document.getElementById('tvPaginationPages');
    const prevBtn = document.getElementById('prevTvPageBtn');
    const nextBtn = document.getElementById('nextTvPageBtn');
    const clearGenreBtn = document.getElementById('clearTvGenreBtn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const genrePills = document.querySelectorAll('.genre-pill');

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    let currentSection = urlParams.get('section') || 'popular';
    let currentGenreId = urlParams.get('genre') || '';
    let currentPage = parseInt(urlParams.get('page'), 10) || 1;
    let totalPages = 1;
    let totalResults = 0;

    // Validate section
    if (!TV_SECTIONS_META[currentSection]) {
      currentSection = 'popular';
    }

    function syncUIFilters() {
      categoryTabs.forEach(tab => {
        const isMatch = tab.getAttribute('data-section') === currentSection && !currentGenreId;
        tab.classList.toggle('active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      genrePills.forEach(pill => {
        const pillGenre = pill.getAttribute('data-genre') || '';
        const isMatch = pillGenre === currentGenreId;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });

      if (clearGenreBtn) {
        clearGenreBtn.style.display = currentGenreId ? 'inline-block' : 'none';
      }
    }

    function renderSkeletonGrid(count = 18) {
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const sk = document.createElement('div');
        sk.className = 'uv-card-skeleton uv-shimmer';
        sk.setAttribute('aria-hidden', 'true');
        sk.innerHTML = `
          <div class="uv-card-skeleton-badge uv-shimmer"></div>
          <div class="uv-card-skeleton-rating uv-shimmer"></div>
          <div class="uv-card-skeleton-title uv-shimmer"></div>
          <div class="uv-card-skeleton-meta uv-shimmer"></div>
        `;
        fragment.appendChild(sk);
      }
      grid.appendChild(fragment);
    }

    function renderPaginationUI(page, total) {
      if (!paginationContainer || !paginationPages) return;
      if (total <= 1) {
        paginationContainer.style.display = 'none';
        return;
      }
      paginationContainer.style.display = 'flex';

      const maxTMDBPages = Math.min(total, 500);
      totalPages = maxTMDBPages;

      if (prevBtn) prevBtn.disabled = (page <= 1);
      if (nextBtn) nextBtn.disabled = (page >= maxTMDBPages);

      paginationPages.innerHTML = '';
      const fragment = document.createDocumentFragment();

      let pagesToRender = [];
      if (maxTMDBPages <= 7) {
        for (let i = 1; i <= maxTMDBPages; i++) pagesToRender.push(i);
      } else {
        pagesToRender.push(1);
        if (page > 3) pagesToRender.push('...');
        const start = Math.max(2, page - 1);
        const end = Math.min(maxTMDBPages - 1, page + 1);
        for (let i = start; i <= end; i++) {
          if (!pagesToRender.includes(i)) pagesToRender.push(i);
        }
        if (page < maxTMDBPages - 2) pagesToRender.push('...');
        if (!pagesToRender.includes(maxTMDBPages)) pagesToRender.push(maxTMDBPages);
      }

      pagesToRender.forEach(p => {
        if (p === '...') {
          const dot = document.createElement('span');
          dot.className = 'pagination-dots';
          dot.textContent = '…';
          fragment.appendChild(dot);
        } else {
          const numBtn = document.createElement('button');
          numBtn.className = `pagination-num ${p === page ? 'active' : ''}`;
          numBtn.textContent = p;
          numBtn.setAttribute('aria-label', `Page ${p}`);
          numBtn.addEventListener('click', () => {
            if (p !== currentPage) {
              currentPage = p;
              loadTVShows(currentPage, true);
            }
          });
          fragment.appendChild(numBtn);
        }
      });

      paginationPages.appendChild(fragment);
    }

    function updateUrlState() {
      const params = new URLSearchParams();
      if (currentGenreId) {
        params.set('genre', currentGenreId);
      } else {
        params.set('section', currentSection);
      }
      if (currentPage > 1) {
        params.set('page', currentPage);
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }

    async function loadTVShows(page = 1, shouldScroll = false) {
      renderSkeletonGrid(18);
      syncUIFilters();

      if (resultsCount) {
        resultsCount.innerHTML = `Fetching page ${page}…`;
      }

      try {
        let data;
        let activeTitle = '';
        let activeSubtitle = '';

        if (currentGenreId) {
          const meta = TV_GENRES_META[currentGenreId] || { name: 'Genre Series', desc: 'Curated TV shows' };
          activeTitle = `${meta.name} TV Shows`;
          activeSubtitle = meta.desc;
          data = await TMDB.getTVByGenre(currentGenreId, page);
        } else {
          const meta = TV_SECTIONS_META[currentSection] || TV_SECTIONS_META['popular'];
          activeTitle = meta.title;
          activeSubtitle = meta.subtitle;

          if (currentSection === 'trending') {
            data = await TMDB.getTrendingTV('day', page);
          } else if (currentSection === 'top_rated') {
            data = await TMDB.getTopRatedTV(page);
          } else if (currentSection === 'airing_today') {
            data = await TMDB.getAiringTodayTV(page);
          } else if (currentSection === 'on_the_air') {
            data = await TMDB.getOnTheAirTV(page);
          } else {
            data = await TMDB.getPopularTV(page);
          }
        }

        if (headingTitle) headingTitle.textContent = activeTitle;
        if (headingSubtitle) headingSubtitle.textContent = activeSubtitle;

        const results = (data && Array.isArray(data.results)) ? data.results : [];
        totalResults = data && data.total_results ? data.total_results : results.length;
        totalPages = data && data.total_pages ? data.total_pages : 1;

        if (results.length === 0) {
          grid.innerHTML = `
            <div class="uv-state-card">
              <div class="uv-state-icon">📺</div>
              <h3 class="uv-state-title">No TV Shows Found</h3>
              <p class="uv-state-desc">We couldn't find any TV shows matching your selected filter. Try exploring our popular catalog.</p>
              <div class="uv-state-actions">
                <button class="uv-state-btn uv-state-btn-primary" id="resetTvFilterBtn">Explore Popular TV Shows</button>
              </div>
            </div>
          `;
          const resetBtn = document.getElementById('resetTvFilterBtn');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => {
              currentGenreId = '';
              currentSection = 'popular';
              currentPage = 1;
              updateUrlState();
              loadTVShows(1);
            });
          }
          if (paginationContainer) paginationContainer.style.display = 'none';
          if (resultsCount) resultsCount.textContent = '0 titles found';
          return;
        }

        renderGrid(grid, results);

        if (resultsCount) {
          resultsCount.innerHTML = `Page <strong>${page}</strong> of <strong>${Math.min(totalPages, 500).toLocaleString()}</strong> (${totalResults.toLocaleString()} series)`;
        }

        renderPaginationUI(page, totalPages);

        if (shouldScroll) {
          const targetY = grid.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

      } catch (err) {
        console.error('❌ [TV Shows Catalog Error]', err);
        const isNetwork = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'));
        grid.innerHTML = `
          <div class="uv-state-card ${isNetwork ? 'uv-state-network-error' : 'uv-state-api-error'}">
            <div class="uv-state-icon">${isNetwork ? '📡' : '⚠️'}</div>
            <h3 class="uv-state-title">${isNetwork ? 'Network Connection Error' : 'Unable to Load TV Shows'}</h3>
            <p class="uv-state-desc">${escapeHTML(err.message || 'We encountered an error connecting to the TMDB API. Please verify your internet connection and retry.')}</p>
            <div class="uv-state-actions">
              <button class="uv-state-btn uv-state-btn-primary" id="retryTvBtn">${isNetwork ? 'Reconnect ↻' : 'Try Again ↻'}</button>
              <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
            </div>
          </div>
        `;
        const retryBtn = document.getElementById('retryTvBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => loadTVShows(currentPage));
        }
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (resultsCount) resultsCount.textContent = 'Error loading results';
      }
    }

    // ── Bind Category Section Tabs ───────────────────────────────────────────
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = tab.getAttribute('data-section');
        if (sec === currentSection && !currentGenreId) return;

        currentSection = sec;
        currentGenreId = '';
        currentPage = 1;
        updateUrlState();
        loadTVShows(1);
      });
    });

    // ── Bind Genre Filter Pills ──────────────────────────────────────────────
    genrePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const gId = pill.getAttribute('data-genre') || '';
        if (gId === currentGenreId) return;

        currentGenreId = gId;
        currentPage = 1;
        updateUrlState();
        loadTVShows(1);
      });
    });

    if (clearGenreBtn) {
      clearGenreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentGenreId = '';
        currentPage = 1;
        updateUrlState();
        loadTVShows(1);
      });
    }

    // ── Bind Pagination Next / Prev ──────────────────────────────────────────
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateUrlState();
          loadTVShows(currentPage, true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateUrlState();
          loadTVShows(currentPage, true);
        }
      });
    }

    // ── Browser Back / Forward Handling ──────────────────────────────────────
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentSection = p.get('section') || 'popular';
      currentGenreId = p.get('genre') || '';
      currentPage = parseInt(p.get('page'), 10) || 1;
      loadTVShows(currentPage, false);
    });

    // Initial Load
    loadTVShows(currentPage);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⛩️ 11. ANIME PAGE CONTROLLER (anime.html)
  // ═══════════════════════════════════════════════════════════════════════════
  const ANIME_SECTIONS_META = {
    'trending': { title: 'Trending Anime', subtitle: 'Hottest Japanese animated series and theatrical films trending globally' },
    'popular': { title: 'Popular Anime', subtitle: 'Most popular Japanese animation series and simulcasts worldwide' },
    'top_rated': { title: 'Top Rated Anime', subtitle: 'Highest-rated anime masterpieces and critically acclaimed sagas' },
    'movies': { title: 'Anime Movies', subtitle: 'Japanese animated theatrical films, standalone features, and Studio Ghibli classics' },
    'tv': { title: 'Anime TV Series', subtitle: 'Full-season Japanese anime broadcasts, seasonal simulcasts, and multi-arc shows' },
    'japanese_animation': { title: 'Japanese Animation Classics', subtitle: 'Legendary and historic Japanese animation cinema' }
  };

  const ANIME_THEMES_META = {
    'action': { name: 'Shonen / Action', movieGenre: '28', tvGenre: '10759', desc: 'High-octane battles, martial arts tournament arcs, and superpower duels.' },
    'fantasy': { name: 'Fantasy / Isekai', movieGenre: '14', tvGenre: '10765', desc: 'Reincarnation adventures, magic academies, and mystical fantasy worlds.' },
    'scifi': { name: 'Sci-Fi & Mecha', movieGenre: '878', tvGenre: '10765', desc: 'Giant robot mechas, cybernetic futures, and interstellar space battles.' },
    'drama': { name: 'Drama & Slice of Life', movieGenre: '18', tvGenre: '18', desc: 'Emotional character journeys, school life, and heartfelt human experiences.' },
    'comedy': { name: 'Comedy', movieGenre: '35', tvGenre: '35', desc: 'Hilarious anime parodies, comedic chaos, and feel-good antics.' },
    'romance': { name: 'Romance', movieGenre: '10749', tvGenre: '18', desc: 'Heart-fluttering love stories, school confessions, and tender bonds.' },
    'mystery': { name: 'Mystery / Psychological', movieGenre: '9648', tvGenre: '9648', desc: 'Mind-bending death games, supernatural investigations, and plot twists.' },
    'horror': { name: 'Horror / Dark Fantasy', movieGenre: '27', tvGenre: '10765', desc: 'Gory curses, demonic threats, and grim survival horror.' },
    'adventure': { name: 'Adventure', movieGenre: '12', tvGenre: '10759', desc: 'Epic voyages, treasure hunts, and explorations of uncharted continents.' }
  };

  function initAnimePage() {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;

    const headingTitle = document.getElementById('animeHeadingTitle');
    const headingSubtitle = document.getElementById('animeHeadingSubtitle');
    const resultsCount = document.getElementById('animeResultsCount');
    const paginationContainer = document.getElementById('animePaginationContainer');
    const paginationPages = document.getElementById('animePaginationPages');
    const prevBtn = document.getElementById('prevAnimePageBtn');
    const nextBtn = document.getElementById('nextAnimePageBtn');
    const clearGenreBtn = document.getElementById('clearAnimeGenreBtn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const genrePills = document.querySelectorAll('.genre-pill');

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    let currentSection = urlParams.get('section') || 'trending';
    let currentGenreKey = urlParams.get('genre') || '';
    let currentPage = parseInt(urlParams.get('page'), 10) || 1;
    let totalPages = 1;
    let totalResults = 0;

    // Validate section
    if (!ANIME_SECTIONS_META[currentSection]) {
      currentSection = 'trending';
    }

    function syncUIFilters() {
      categoryTabs.forEach(tab => {
        const isMatch = tab.getAttribute('data-section') === currentSection && !currentGenreKey;
        tab.classList.toggle('active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      genrePills.forEach(pill => {
        const pillGenre = pill.getAttribute('data-genre') || '';
        const isMatch = pillGenre === currentGenreKey;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });

      if (clearGenreBtn) {
        clearGenreBtn.style.display = currentGenreKey ? 'inline-block' : 'none';
      }
    }

    function renderSkeletonGrid(count = 18) {
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const sk = document.createElement('div');
        sk.className = 'uv-card-skeleton uv-shimmer';
        sk.setAttribute('aria-hidden', 'true');
        sk.innerHTML = `
          <div class="uv-card-skeleton-badge uv-shimmer"></div>
          <div class="uv-card-skeleton-rating uv-shimmer"></div>
          <div class="uv-card-skeleton-title uv-shimmer"></div>
          <div class="uv-card-skeleton-meta uv-shimmer"></div>
        `;
        fragment.appendChild(sk);
      }
      grid.appendChild(fragment);
    }

    function renderPaginationUI(page, total) {
      if (!paginationContainer || !paginationPages) return;
      if (total <= 1) {
        paginationContainer.style.display = 'none';
        return;
      }
      paginationContainer.style.display = 'flex';

      const maxTMDBPages = Math.min(total, 500);
      totalPages = maxTMDBPages;

      if (prevBtn) prevBtn.disabled = (page <= 1);
      if (nextBtn) nextBtn.disabled = (page >= maxTMDBPages);

      paginationPages.innerHTML = '';
      const fragment = document.createDocumentFragment();

      let pagesToRender = [];
      if (maxTMDBPages <= 7) {
        for (let i = 1; i <= maxTMDBPages; i++) pagesToRender.push(i);
      } else {
        pagesToRender.push(1);
        if (page > 3) pagesToRender.push('...');
        const start = Math.max(2, page - 1);
        const end = Math.min(maxTMDBPages - 1, page + 1);
        for (let i = start; i <= end; i++) {
          if (!pagesToRender.includes(i)) pagesToRender.push(i);
        }
        if (page < maxTMDBPages - 2) pagesToRender.push('...');
        if (!pagesToRender.includes(maxTMDBPages)) pagesToRender.push(maxTMDBPages);
      }

      pagesToRender.forEach(p => {
        if (p === '...') {
          const dot = document.createElement('span');
          dot.className = 'pagination-dots';
          dot.textContent = '…';
          fragment.appendChild(dot);
        } else {
          const numBtn = document.createElement('button');
          numBtn.className = `pagination-num ${p === page ? 'active' : ''}`;
          numBtn.textContent = p;
          numBtn.setAttribute('aria-label', `Page ${p}`);
          numBtn.addEventListener('click', () => {
            if (p !== currentPage) {
              currentPage = p;
              loadAnime(currentPage, true);
            }
          });
          fragment.appendChild(numBtn);
        }
      });

      paginationPages.appendChild(fragment);
    }

    function updateUrlState() {
      const params = new URLSearchParams();
      if (currentGenreKey) {
        params.set('genre', currentGenreKey);
      } else {
        params.set('section', currentSection);
      }
      if (currentPage > 1) {
        params.set('page', currentPage);
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }

    async function loadAnime(page = 1, shouldScroll = false) {
      renderSkeletonGrid(18);
      syncUIFilters();

      if (resultsCount) {
        resultsCount.innerHTML = `Fetching page ${page}…`;
      }

      try {
        let data;
        let activeTitle = '';
        let activeSubtitle = '';

        if (currentGenreKey && ANIME_THEMES_META[currentGenreKey]) {
          const theme = ANIME_THEMES_META[currentGenreKey];
          activeTitle = `${theme.name} Anime`;
          activeSubtitle = theme.desc;

          // Query TV anime with theme genre + Japanese origin
          data = await tmdbFetch('/discover/tv', {
            with_genres: `16,${theme.tvGenre}`,
            with_original_language: 'ja',
            sort_by: 'popularity.desc',
            page
          });
        } else {
          const sec = ANIME_SECTIONS_META[currentSection] || ANIME_SECTIONS_META['trending'];
          activeTitle = sec.title;
          activeSubtitle = sec.subtitle;

          if (currentSection === 'movies') {
            // Authentic Japanese anime movies
            data = await TMDB.getAnimeMovies(page);
          } else if (currentSection === 'top_rated') {
            // Top rated Japanese anime
            data = await TMDB.getTopRatedAnime(page, 'tv');
          } else if (currentSection === 'japanese_animation') {
            // Classic Japanese animated features
            data = await TMDB.getAnimeMovies(page, {
              sort_by: 'vote_average.desc',
              'vote_count.gte': 80
            });
          } else if (currentSection === 'popular') {
            // Popular TV anime
            data = await TMDB.getAnimeTV(page);
          } else {
            // Trending Anime
            data = await TMDB.getAnimeTV(page);
          }
        }

        if (headingTitle) headingTitle.textContent = activeTitle;
        if (headingSubtitle) headingSubtitle.textContent = activeSubtitle;

        // Strictly verify that items are Japanese Anime
        const rawResults = (data && Array.isArray(data.results)) ? data.results : [];
        const results = rawResults.filter(item => {
          const isJapanese = item.original_language === 'ja' ||
            (Array.isArray(item.origin_country) && item.origin_country.includes('JP'));
          return isJapanese;
        });

        totalResults = data && data.total_results ? data.total_results : results.length;
        totalPages = data && data.total_pages ? data.total_pages : 1;

        if (results.length === 0) {
          // Requirement: "No enough anime results found."
          grid.innerHTML = `
            <div class="uv-state-card">
              <div class="uv-state-icon">⛩️</div>
              <h3 class="uv-state-title">No enough anime results found.</h3>
              <p class="uv-state-desc">We couldn't find sufficient Japanese anime matching your filter criteria. Try exploring trending or popular anime titles.</p>
              <div class="uv-state-actions">
                <button class="uv-state-btn uv-state-btn-primary" id="resetAnimeFilterBtn">Explore Trending Anime</button>
              </div>
            </div>
          `;
          const resetBtn = document.getElementById('resetAnimeFilterBtn');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => {
              currentGenreKey = '';
              currentSection = 'trending';
              currentPage = 1;
              updateUrlState();
              loadAnime(1);
            });
          }
          if (paginationContainer) paginationContainer.style.display = 'none';
          if (resultsCount) resultsCount.textContent = '0 titles found';
          return;
        }

        // Render Cards with ANIME badge & metadata
        renderGrid(grid, results);

        if (resultsCount) {
          resultsCount.innerHTML = `Page <strong>${page}</strong> of <strong>${Math.min(totalPages, 500).toLocaleString()}</strong> (${totalResults.toLocaleString()} anime titles)`;
        }

        renderPaginationUI(page, totalPages);

        if (shouldScroll) {
          const targetY = grid.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

      } catch (err) {
        console.error('❌ [Anime Catalog Error]', err);
        const isNetwork = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'));
        grid.innerHTML = `
          <div class="uv-state-card ${isNetwork ? 'uv-state-network-error' : 'uv-state-api-error'}">
            <div class="uv-state-icon">${isNetwork ? '📡' : '⚠️'}</div>
            <h3 class="uv-state-title">${isNetwork ? 'Network Connection Error' : 'Unable to Load Anime'}</h3>
            <p class="uv-state-desc">${escapeHTML(err.message || 'We encountered an error connecting to the TMDB API. Please verify your internet connection and retry.')}</p>
            <div class="uv-state-actions">
              <button class="uv-state-btn uv-state-btn-primary" id="retryAnimeBtn">${isNetwork ? 'Reconnect ↻' : 'Try Again ↻'}</button>
              <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
            </div>
          </div>
        `;
        const retryBtn = document.getElementById('retryAnimeBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => loadAnime(currentPage));
        }
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (resultsCount) resultsCount.textContent = 'Error loading results';
      }
    }

    // ── Bind Category Section Tabs ───────────────────────────────────────────
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = tab.getAttribute('data-section');
        if (sec === currentSection && !currentGenreKey) return;

        currentSection = sec;
        currentGenreKey = '';
        currentPage = 1;
        updateUrlState();
        loadAnime(1);
      });
    });

    // ── Bind Theme & Genre Filter Pills ──────────────────────────────────────
    genrePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const gKey = pill.getAttribute('data-genre') || '';
        if (gKey === currentGenreKey) return;

        currentGenreKey = gKey;
        currentPage = 1;
        updateUrlState();
        loadAnime(1);
      });
    });

    if (clearGenreBtn) {
      clearGenreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentGenreKey = '';
        currentPage = 1;
        updateUrlState();
        loadAnime(1);
      });
    }

    // ── Bind Pagination Next / Prev ──────────────────────────────────────────
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateUrlState();
          loadAnime(currentPage, true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateUrlState();
          loadAnime(currentPage, true);
        }
      });
    }

    // ── Browser Back / Forward Handling ──────────────────────────────────────
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentSection = p.get('section') || 'trending';
      currentGenreKey = p.get('genre') || '';
      currentPage = parseInt(p.get('page'), 10) || 1;
      loadAnime(currentPage, false);
    });

    // Initial Load
    loadAnime(currentPage);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 12. UNIVERSAL SEARCH CONTROLLER (search.html)
  // ═══════════════════════════════════════════════════════════════════════════
  function initSearchPage() {
    const searchInput = document.getElementById('searchInput');
    const searchSubmitBtn = document.getElementById('searchSubmitBtn');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const suggestionsBox = document.getElementById('searchSuggestionsBox');
    const resultsTitle = document.getElementById('searchResultsTitle');
    const resultsSubtitle = document.getElementById('searchResultsSubtitle');
    const resultsCount = document.getElementById('searchResultsCount');
    const grid = document.getElementById('searchResultsGrid');
    const paginationContainer = document.getElementById('searchPaginationContainer');
    const paginationPages = document.getElementById('searchPaginationPages');
    const prevBtn = document.getElementById('prevSearchPageBtn');
    const nextBtn = document.getElementById('nextSearchPageBtn');
    const typePills = document.querySelectorAll('#searchTypePills .genre-pill');
    const sortSelect = document.getElementById('searchSortSelect');

    if (!searchInput || !grid) return;

    // State
    const urlParams = new URLSearchParams(window.location.search);
    let currentQuery = urlParams.get('query') || '';
    let currentType = urlParams.get('type') || 'all';
    let currentSort = urlParams.get('sort') || 'popularity.desc';
    let currentPage = parseInt(urlParams.get('page'), 10) || 1;
    let totalPages = 1;
    let totalResults = 0;
    let debounceTimer = null;
    let focusedSuggestionIndex = -1;

    // Set initial values
    if (currentQuery) {
      searchInput.value = currentQuery;
      if (searchClearBtn) searchClearBtn.style.display = 'inline-block';
    }
    if (sortSelect) sortSelect.value = currentSort;

    function syncTypePills() {
      typePills.forEach(pill => {
        const pType = pill.getAttribute('data-type') || 'all';
        const isMatch = pType === currentType;
        pill.classList.toggle('active', isMatch);
        pill.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });
    }

    function renderSkeletonGrid(count = 12) {
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const sk = document.createElement('div');
        sk.className = 'uv-card-skeleton uv-shimmer';
        sk.setAttribute('aria-hidden', 'true');
        sk.innerHTML = `
          <div class="uv-card-skeleton-badge uv-shimmer"></div>
          <div class="uv-card-skeleton-rating uv-shimmer"></div>
          <div class="uv-card-skeleton-title uv-shimmer"></div>
          <div class="uv-card-skeleton-meta uv-shimmer"></div>
        `;
        fragment.appendChild(sk);
      }
      grid.appendChild(fragment);
    }

    function renderPaginationUI(page, total) {
      if (!paginationContainer || !paginationPages) return;
      if (total <= 1) {
        paginationContainer.style.display = 'none';
        return;
      }
      paginationContainer.style.display = 'flex';

      const maxTMDBPages = Math.min(total, 500);
      totalPages = maxTMDBPages;

      if (prevBtn) prevBtn.disabled = (page <= 1);
      if (nextBtn) nextBtn.disabled = (page >= maxTMDBPages);

      paginationPages.innerHTML = '';
      const fragment = document.createDocumentFragment();

      let pagesToRender = [];
      if (maxTMDBPages <= 7) {
        for (let i = 1; i <= maxTMDBPages; i++) pagesToRender.push(i);
      } else {
        pagesToRender.push(1);
        if (page > 3) pagesToRender.push('...');
        const start = Math.max(2, page - 1);
        const end = Math.min(maxTMDBPages - 1, page + 1);
        for (let i = start; i <= end; i++) {
          if (!pagesToRender.includes(i)) pagesToRender.push(i);
        }
        if (page < maxTMDBPages - 2) pagesToRender.push('...');
        if (!pagesToRender.includes(maxTMDBPages)) pagesToRender.push(maxTMDBPages);
      }

      pagesToRender.forEach(p => {
        if (p === '...') {
          const dot = document.createElement('span');
          dot.className = 'pagination-dots';
          dot.textContent = '…';
          fragment.appendChild(dot);
        } else {
          const numBtn = document.createElement('button');
          numBtn.className = `pagination-num ${p === page ? 'active' : ''}`;
          numBtn.textContent = p;
          numBtn.setAttribute('aria-label', `Page ${p}`);
          numBtn.addEventListener('click', () => {
            if (p !== currentPage) {
              currentPage = p;
              performSearch(currentQuery, currentPage, true);
            }
          });
          fragment.appendChild(numBtn);
        }
      });

      paginationPages.appendChild(fragment);
    }

    function updateUrlState() {
      const params = new URLSearchParams();
      if (currentQuery) params.set('query', currentQuery);
      if (currentType && currentType !== 'all') params.set('type', currentType);
      if (currentSort && currentSort !== 'popularity.desc') params.set('sort', currentSort);
      if (currentPage > 1) params.set('page', currentPage);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }

    // ── Live Autocomplete Suggestions ────────────────────────────────────────
    async function fetchLiveSuggestions(query) {
      if (!query || !query.trim() || query.trim().length < 2) {
        closeSuggestions();
        return;
      }

      try {
        const data = await TMDB.searchMulti(query.trim(), 1);
        const rawResults = (data && Array.isArray(data.results)) ? data.results : [];
        const items = rawResults
          .filter(r => (r.title || r.name) && (r.poster_path || r.profile_path || r.backdrop_path))
          .slice(0, 6);

        if (items.length === 0) {
          closeSuggestions();
          return;
        }

        renderSuggestionsDropdown(items, query.trim());
      } catch (e) {
        closeSuggestions();
      }
    }

    function renderSuggestionsDropdown(items, query) {
      if (!suggestionsBox) return;
      focusedSuggestionIndex = -1;

      let html = `
        <div class="search-suggestions-header">
          <span>Top Matches</span>
          <span>Press ↵ to view all</span>
        </div>
      `;

      items.forEach((item, index) => {
        const mType = detectMediaType(item);
        const title = item.title || item.name || 'Untitled';
        const dateStr = item.release_date || item.first_air_date || '';
        const year = dateStr ? new Date(dateStr).getFullYear() : '';
        const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : 'NR';
        const posterUrl = item.poster_path ? TMDB.getImageUrl(item.poster_path, 'w92') : null;

        let badgeClass = 'badge-accent';
        let badgeLabel = 'MOVIE';
        if (mType === 'anime') {
          badgeClass = 'badge-anime';
          badgeLabel = 'ANIME';
        } else if (mType === 'tv') {
          badgeClass = 'badge-tv';
          badgeLabel = 'TV';
        }

        const thumbHtml = posterUrl
          ? `<img src="${posterUrl}" alt="${escapeHTML(title)}" class="search-thumb" loading="lazy" onerror="this.outerHTML='<div class=\\'search-thumb-fallback\\'>🎬</div>'">`
          : `<div class="search-thumb-fallback">🎬</div>`;

        html += `
          <a href="details.html?id=${item.id}&type=${mType}" class="search-suggestion-item" data-index="${index}" role="option">
            ${thumbHtml}
            <div class="search-suggestion-info">
              <div class="search-suggestion-title">${escapeHTML(title)}</div>
              <div class="search-suggestion-meta">
                <span class="card-badge ${badgeClass}">${badgeLabel}</span>
                ${year ? `<span>${year}</span>` : ''}
                <span>★ ${rating}</span>
              </div>
            </div>
          </a>
        `;
      });

      html += `
        <a href="#" class="search-suggestion-view-all" id="suggestionViewAllBtn">
          View all results for "<strong>${escapeHTML(query)}</strong>" →
        </a>
      `;

      suggestionsBox.innerHTML = html;
      suggestionsBox.classList.add('open');
      searchInput.setAttribute('aria-expanded', 'true');

      const viewAllBtn = document.getElementById('suggestionViewAllBtn');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
          e.preventDefault();
          closeSuggestions();
          currentQuery = query;
          currentPage = 1;
          performSearch(currentQuery, 1);
        });
      }
    }

    function closeSuggestions() {
      if (suggestionsBox) {
        suggestionsBox.classList.remove('open');
        suggestionsBox.innerHTML = '';
      }
      if (searchInput) searchInput.setAttribute('aria-expanded', 'false');
      focusedSuggestionIndex = -1;
    }

    function updateFocusedSuggestion() {
      if (!suggestionsBox) return;
      const items = suggestionsBox.querySelectorAll('.search-suggestion-item, .search-suggestion-view-all');
      items.forEach((it, idx) => {
        it.classList.toggle('focused', idx === focusedSuggestionIndex);
      });
      if (focusedSuggestionIndex >= 0 && items[focusedSuggestionIndex]) {
        items[focusedSuggestionIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    // ── Perform Full Catalog Search ──────────────────────────────────────────
    async function performSearch(query, page = 1, shouldScroll = false) {
      closeSuggestions();
      syncTypePills();
      renderSkeletonGrid(12);

      if (resultsCount) {
        resultsCount.innerHTML = `Searching…`;
      }

      try {
        let results = [];
        let totalCount = 0;
        let pagesCount = 1;

        if (!query || !query.trim()) {
          // Default: Trending Discoveries
          if (resultsTitle) resultsTitle.textContent = 'Trending Discoveries';
          if (resultsSubtitle) resultsSubtitle.textContent = 'Popular movies, TV series, and anime trending right now';

          const data = await TMDB.getTrending('day');
          results = (data && Array.isArray(data.results)) ? data.results : [];
          totalCount = results.length;
          pagesCount = 1;
        } else {
          // Live Query Search
          const cleanQuery = query.trim();
          if (resultsTitle) resultsTitle.innerHTML = `Results for "<span class="text-gradient">${escapeHTML(cleanQuery)}</span>"`;
          if (resultsSubtitle) resultsSubtitle.textContent = `Showing titles matching "${cleanQuery}"`;

          let data;
          if (currentType === 'movie') {
            data = await TMDB.searchMovies(cleanQuery, page);
          } else if (currentType === 'tv') {
            data = await TMDB.searchTV(cleanQuery, page);
          } else {
            data = await TMDB.searchMulti(cleanQuery, page);
          }

          let rawResults = (data && Array.isArray(data.results)) ? data.results : [];

          // If filtering by Anime
          if (currentType === 'anime') {
            results = rawResults.filter(item => detectMediaType(item) === 'anime');
          } else {
            results = rawResults.filter(item => item.title || item.name);
          }

          totalCount = (data && data.total_results) ? data.total_results : results.length;
          pagesCount = (data && data.total_pages) ? data.total_pages : 1;
        }

        // Apply Sorting
        if (currentSort === 'vote_average.desc') {
          results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        } else if (currentSort === 'release_date.desc') {
          results.sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          });
        } else if (currentSort === 'release_date.asc') {
          results.sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateA - dateB;
          });
        }

        totalResults = totalCount;
        totalPages = pagesCount;

        if (results.length === 0) {
          // Empty State Handling
          grid.innerHTML = `
            <div class="uv-state-card">
              <div class="uv-state-icon">🔍</div>
              <h3 class="uv-state-title">No Results Found</h3>
              <p class="uv-state-desc">We couldn't find any titles matching "${escapeHTML(query)}". Check your spelling or try searching for a different movie, show, or actor.</p>
              <div class="uv-state-actions">
                <button class="uv-state-btn uv-state-btn-primary" id="clearSearchStateBtn">Explore Trending Titles</button>
              </div>
            </div>
          `;
          const clearStateBtn = document.getElementById('clearSearchStateBtn');
          if (clearStateBtn) {
            clearStateBtn.addEventListener('click', () => {
              searchInput.value = '';
              currentQuery = '';
              currentType = 'all';
              currentPage = 1;
              updateUrlState();
              performSearch('', 1);
            });
          }
          if (paginationContainer) paginationContainer.style.display = 'none';
          if (resultsCount) resultsCount.textContent = '0 titles found';
          return;
        }

        // Render Movie / TV Cards
        renderGrid(grid, results);

        if (resultsCount) {
          if (!query || !query.trim()) {
            resultsCount.innerHTML = `Top <strong>${results.length}</strong> trending titles today`;
          } else {
            resultsCount.innerHTML = `Found <strong>${totalCount.toLocaleString()}</strong> titles (Page ${page} of ${Math.min(totalPages, 500)})`;
          }
        }

        renderPaginationUI(page, totalPages);

        if (shouldScroll) {
          const targetY = grid.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

      } catch (err) {
        console.error('❌ [Search Error]', err);
        const isNetwork = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'));
        grid.innerHTML = `
          <div class="uv-state-card ${isNetwork ? 'uv-state-network-error' : 'uv-state-api-error'}">
            <div class="uv-state-icon">${isNetwork ? '📡' : '⚠️'}</div>
            <h3 class="uv-state-title">${isNetwork ? 'Network Connection Error' : 'Unable to Load Search Results'}</h3>
            <p class="uv-state-desc">${escapeHTML(err.message || 'We encountered an issue communicating with the TMDB API. Please verify your connection and retry.')}</p>
            <div class="uv-state-actions">
              <button class="uv-state-btn uv-state-btn-primary" id="retrySearchBtn">${isNetwork ? 'Reconnect ↻' : 'Try Again ↻'}</button>
              <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
            </div>
          </div>
        `;
        const retryBtn = document.getElementById('retrySearchBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => performSearch(currentQuery, currentPage));
        }
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (resultsCount) resultsCount.textContent = 'Error loading results';
      }
    }

    // ── Bind Search Input Events ─────────────────────────────────────────────
    searchInput.addEventListener('input', () => {
      const q = searchInput.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = q ? 'inline-block' : 'none';
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchLiveSuggestions(q);
      }, 250);
    });

    searchInput.addEventListener('keydown', (e) => {
      const items = suggestionsBox ? suggestionsBox.querySelectorAll('.search-suggestion-item, .search-suggestion-view-all') : [];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          focusedSuggestionIndex = (focusedSuggestionIndex + 1) % items.length;
          updateFocusedSuggestion();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          focusedSuggestionIndex = (focusedSuggestionIndex - 1 + items.length) % items.length;
          updateFocusedSuggestion();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedSuggestionIndex >= 0 && items[focusedSuggestionIndex]) {
          items[focusedSuggestionIndex].click();
        } else {
          currentQuery = searchInput.value;
          currentPage = 1;
          updateUrlState();
          performSearch(currentQuery, 1);
        }
      } else if (e.key === 'Escape') {
        closeSuggestions();
      }
    });

    if (searchSubmitBtn) {
      searchSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentQuery = searchInput.value;
        currentPage = 1;
        updateUrlState();
        performSearch(currentQuery, 1);
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        closeSuggestions();
        currentQuery = '';
        currentPage = 1;
        updateUrlState();
        performSearch('', 1);
      });
    }

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper-relative')) {
        closeSuggestions();
      }
    });

    // ── Bind Content Type Filter Pills ───────────────────────────────────────
    typePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const t = pill.getAttribute('data-type') || 'all';
        if (t === currentType) return;

        currentType = t;
        currentPage = 1;
        updateUrlState();
        performSearch(currentQuery, 1);
      });
    });

    // ── Bind Sort Select ─────────────────────────────────────────────────────
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        updateUrlState();
        performSearch(currentQuery, currentPage);
      });
    }

    // ── Bind Pagination Next / Prev ──────────────────────────────────────────
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateUrlState();
          performSearch(currentQuery, currentPage, true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateUrlState();
          performSearch(currentQuery, currentPage, true);
        }
      });
    }

    // ── Browser Back / Forward Handling ──────────────────────────────────────
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentQuery = p.get('query') || '';
      currentType = p.get('type') || 'all';
      currentSort = p.get('sort') || 'popularity.desc';
      currentPage = parseInt(p.get('page'), 10) || 1;

      searchInput.value = currentQuery;
      if (searchClearBtn) searchClearBtn.style.display = currentQuery ? 'inline-block' : 'none';
      if (sortSelect) sortSelect.value = currentSort;

      performSearch(currentQuery, currentPage, false);
    });

    // Initial Search
    performSearch(currentQuery, currentPage);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 13. DETAILS PAGE CONTROLLER (details.html)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initDetailsPage() {
    const detailsContainer = document.getElementById('detailsContainer');
    if (!detailsContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get('id') || '933260';
    let mediaType = (urlParams.get('type') || 'movie').toLowerCase();
    const autoPlay = urlParams.get('play') === '1';

    if (mediaType !== 'tv' && mediaType !== 'movie') {
      mediaType = 'movie';
    }

    // Elements
    const backdropEl = document.getElementById('detailsBackdrop');
    const posterEl = document.getElementById('detailsPoster');
    const posterSkeleton = document.getElementById('detailsPosterSkeleton');
    const titleEl = document.getElementById('detailsTitle');
    const originalTitleEl = document.getElementById('detailsOriginalTitle');
    const taglineEl = document.getElementById('detailsTagline');
    const typeBadgeEl = document.getElementById('detailsTypeBadge');
    const ratingEl = document.getElementById('detailsRating');
    const voteCountEl = document.getElementById('detailsVoteCount');
    const yearEl = document.getElementById('detailsYear');
    const runtimeEl = document.getElementById('detailsRuntime');
    const overviewEl = document.getElementById('detailsOverview');
    const genresEl = document.getElementById('detailsGenres');
    const languagesEl = document.getElementById('detailsLanguages');
    const countriesEl = document.getElementById('detailsCountries');
    const releaseDateEl = document.getElementById('detailsReleaseDate');
    const companiesEl = document.getElementById('detailsCompanies');
    const companiesWrap = document.getElementById('detailsCompaniesWrap');
    const playBtn = document.getElementById('detailsPlayBtn');
    const watchlistBtn = document.getElementById('detailsWatchlistBtn');
    const shareBtn = document.getElementById('detailsShareBtn');
    const shareToast = document.getElementById('shareToast');
    const breadcrumbCatalog = document.getElementById('breadcrumbCatalog');
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    const castTrack = document.getElementById('detailsCastTrack');
    const crewGrid = document.getElementById('detailsCrewGrid');
    const similarTrack = document.getElementById('detailsSimilarTrack');
    const recsTrack = document.getElementById('detailsRecsTrack');

    // Render initial track skeletons while fetching details
    if (castTrack && typeof renderCastSkeletons === 'function') renderCastSkeletons(castTrack, 8);
    if (similarTrack) renderCarouselSkeletons(similarTrack, 6);
    if (recsTrack) renderCarouselSkeletons(recsTrack, 6);

    try {
      const item = await TMDB.getDetails(mediaType, mediaId);
      if (!item || !item.id) throw new Error('Invalid title data returned from TMDB.');

      const detectedType = detectMediaType(item);
      const title = item.title || item.name || 'Untitled';
      const originalTitle = item.original_title || item.original_name || '';
      const releaseDate = item.release_date || item.first_air_date || '';
      const year = releaseDate ? new Date(releaseDate).getFullYear() : '—';
      const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : 'NR';
      const voteCount = item.vote_count ? `(${item.vote_count.toLocaleString()} votes)` : '';

      // Update Page Title
      document.title = `${title} (${year}) — UniVault 4K`;

      // 1. Backdrop
      if (backdropEl && item.backdrop_path) {
        const backdropUrl = TMDB.getBackdropUrl(item.backdrop_path);
        backdropEl.style.backgroundImage = `url('${backdropUrl}')`;
      }

      // 2. Poster
      if (posterEl && item.poster_path) {
        posterEl.src = TMDB.getImageUrl(item.poster_path, 'w500');
        posterEl.alt = `${title} Poster`;
        posterEl.style.display = 'block';
        if (posterSkeleton) posterSkeleton.style.display = 'none';
      }

      // 3. Breadcrumbs
      if (breadcrumbCatalog) {
        breadcrumbCatalog.textContent = detectedType === 'anime' ? 'Anime' : (mediaType === 'tv' ? 'TV Shows' : 'Movies');
        breadcrumbCatalog.href = detectedType === 'anime' ? 'anime.html' : (mediaType === 'tv' ? 'tv-shows.html' : 'movies.html');
      }
      if (breadcrumbTitle) breadcrumbTitle.textContent = title;

      // 4. Type Badge
      if (typeBadgeEl) {
        if (detectedType === 'anime') {
          typeBadgeEl.textContent = 'ANIME';
          typeBadgeEl.className = 'card-badge badge-anime';
        } else if (mediaType === 'tv') {
          typeBadgeEl.textContent = 'TV SHOW';
          typeBadgeEl.className = 'card-badge badge-tv';
        } else {
          typeBadgeEl.textContent = 'MOVIE';
          typeBadgeEl.className = 'card-badge badge-accent';
        }
      }

      // 5. Title & Original Title
      if (titleEl) titleEl.textContent = title;
      if (originalTitleEl) {
        if (originalTitle && originalTitle.toLowerCase() !== title.toLowerCase()) {
          originalTitleEl.textContent = `Original Title: ${originalTitle}`;
          originalTitleEl.style.display = 'block';
        }
      }

      // 6. Tagline
      if (taglineEl && item.tagline) {
        taglineEl.textContent = `“${item.tagline}”`;
        taglineEl.style.display = 'block';
      }

      // 7. Meta chips (Rating, Year, Runtime)
      if (ratingEl) ratingEl.textContent = rating;
      if (voteCountEl) voteCountEl.textContent = voteCount;
      if (yearEl) yearEl.textContent = year;

      if (runtimeEl) {
        if (mediaType === 'tv') {
          const seasons = item.number_of_seasons || 1;
          const episodes = item.number_of_episodes || 1;
          runtimeEl.textContent = `${seasons} Season${seasons > 1 ? 's' : ''} • ${episodes} Episode${episodes > 1 ? 's' : ''}`;
        } else {
          const runtime = item.runtime || 0;
          if (runtime > 0) {
            const h = Math.floor(runtime / 60);
            const m = runtime % 60;
            runtimeEl.textContent = `${h}h ${m}m`;
          } else {
            runtimeEl.textContent = 'Feature Film';
          }
        }
      }

      // 8. Overview
      if (overviewEl) overviewEl.textContent = item.overview || 'No synopsis available for this title.';

      // Track in Recently Viewed history (local + SQLite backend)
      const posterPath = item.poster_path || (item.poster && item.poster.startsWith('/') ? item.poster : item.poster_path);
      const recentEntry = {
        id: item.id,
        tmdb_id: item.id,
        media_type: mediaType,
        title: title,
        poster_path: posterPath,
        poster: posterPath,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        viewed_at: Date.now()
      };

      try {
        const RECENT_KEY = 'univault_recent_history';
        const raw = localStorage.getItem(RECENT_KEY);
        let recentList = raw ? JSON.parse(raw) : [];
        recentList = recentList.filter(i => String(i.id || i.tmdb_id) !== String(item.id));
        recentList.unshift(recentEntry);
        if (recentList.length > 24) recentList = recentList.slice(0, 24);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recentList));
      } catch (e) {
        console.warn('Recently viewed storage quota exceeded:', e);
      }

      // Sync with MongoDB backend if authenticated
      if (typeof UniVaultAuth !== 'undefined' && typeof UniVaultAuth.isAuthenticated === 'function' && UniVaultAuth.isAuthenticated()) {
        const token = UniVaultAuth.getToken();
        if (token) {
          const apiResolver = (typeof getUniVaultApiUrl === 'function') ? getUniVaultApiUrl : (p => p);
          fetch(apiResolver('/api/user/recently-viewed'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              tmdb_id: item.id,
              media_type: mediaType,
              title: title,
              poster: posterPath || null
            })
          }).catch(err => console.warn('Recently viewed API sync error:', err));
        }
      }

      // 9. Genres
      if (genresEl && Array.isArray(item.genres) && item.genres.length > 0) {
        genresEl.innerHTML = item.genres.map(g => {
          const targetUrl = detectedType === 'anime'
            ? `anime.html?genre=${encodeURIComponent(g.name.toLowerCase())}`
            : (mediaType === 'tv' ? `tv-shows.html?genre=${g.id}` : `movies.html?genre=${g.id}`);
          return `<a href="${targetUrl}" class="details-genre-tag">${escapeHTML(g.name)}</a>`;
        }).join('');
      }

      // 10. Languages
      if (languagesEl) {
        const langs = (item.spoken_languages || []).map(l => l.english_name || l.name).filter(Boolean);
        languagesEl.textContent = langs.length > 0 ? langs.join(', ') : 'English';
      }

      // 11. Countries
      if (countriesEl) {
        const countries = (item.production_countries || []).map(c => c.name).filter(Boolean);
        countriesEl.textContent = countries.length > 0 ? countries.join(', ') : 'United States';
      }

      // 12. Release Date
      if (releaseDateEl && releaseDate) {
        try {
          const formattedDate = new Date(releaseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          releaseDateEl.textContent = formattedDate;
        } catch {
          releaseDateEl.textContent = releaseDate;
        }
      }

      // 13. Production Companies
      if (companiesEl && Array.isArray(item.production_companies) && item.production_companies.length > 0) {
        if (companiesWrap) companiesWrap.style.display = 'block';
        companiesEl.innerHTML = item.production_companies.slice(0, 5).map(c => {
          const logoUrl = c.logo_path ? TMDB.getImageUrl(c.logo_path, 'w185') : null;
          const logoTag = logoUrl ? `<img src="${logoUrl}" alt="${escapeHTML(c.name)}" class="details-company-logo">` : '';
          return `
            <div class="details-company-pill">
              ${logoTag}
              <span>${escapeHTML(c.name)}</span>
            </div>
          `;
        }).join('');
      }

      // 14. Watchlist Toggle
      if (watchlistBtn) {
        const updateWatchlistBtnUI = () => {
          const isSaved = isInWatchlist(item.id);
          watchlistBtn.classList.toggle('in-watchlist', isSaved);
          const icon = watchlistBtn.querySelector('.btn-icon');
          const text = watchlistBtn.querySelector('.btn-text');
          if (icon) icon.textContent = isSaved ? '✓' : '🔖';
          if (text) text.textContent = isSaved ? 'In Watchlist' : 'Add to Watchlist';
        };
        updateWatchlistBtnUI();

        watchlistBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleWatchlist(item);
          updateWatchlistBtnUI();
        });
      }

      // 15. Trailer Action
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.preventDefault();
          getTrailerManager().open(item);
        });
      }

      // 16. Share Action
      if (shareBtn) {
        shareBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const shareUrl = window.location.href;
          if (navigator.share) {
            try {
              await navigator.share({
                title: `${title} on UniVault`,
                text: `Watch ${title} in 4K on UniVault!`,
                url: shareUrl
              });
              return;
            } catch (err) {
              // Share cancelled or not supported
            }
          }

          // Fallback: Copy to clipboard
          try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link copied to clipboard! ✓', 'success');
          } catch {
            prompt('Copy this link:', shareUrl);
          }
        });
      }

      // 17. Cast Section
      const castList = item.credits && Array.isArray(item.credits.cast) ? item.credits.cast.slice(0, 12) : [];
      if (castTrack && castList.length > 0) {
        castTrack.innerHTML = castList.map(actor => {
          const name = actor.name || 'Unknown Actor';
          const char = actor.character || 'Cast';
          const profileUrl = actor.profile_path
            ? TMDB.getImageUrl(actor.profile_path, 'w185')
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
          return `
            <div class="cast-card" onclick="window.location.href='search.html?query=${encodeURIComponent(name)}'">
              <div class="cast-photo-wrap">
                <img src="${profileUrl}" alt="${escapeHTML(name)}" class="cast-photo" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'">
              </div>
              <div class="cast-info">
                <div class="cast-name" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
                <div class="cast-character" title="${escapeHTML(char)}">${escapeHTML(char)}</div>
              </div>
            </div>
          `;
        }).join('');
      } else if (castTrack) {
        document.getElementById('castSection').style.display = 'none';
      }

      // 18. Crew Section
      const crewList = item.credits && Array.isArray(item.credits.crew) ? item.credits.crew : [];
      if (crewGrid && crewList.length > 0) {
        const keyJobs = ['Director', 'Screenplay', 'Writer', 'Producer', 'Executive Producer', 'Original Music Composer', 'Director of Photography'];
        const filteredCrew = [];
        const seenNames = new Set();

        crewList.forEach(c => {
          if (keyJobs.includes(c.job) && !seenNames.has(c.name)) {
            seenNames.add(c.name);
            filteredCrew.push(c);
          }
        });

        if (filteredCrew.length > 0) {
          crewGrid.innerHTML = filteredCrew.slice(0, 8).map(c => `
            <div class="crew-item-card">
              <div class="crew-role">${escapeHTML(c.job)}</div>
              <div class="crew-name">${escapeHTML(c.name)}</div>
            </div>
          `).join('');
        } else {
          document.getElementById('crewSection').style.display = 'none';
        }
      } else if (crewGrid) {
        document.getElementById('crewSection').style.display = 'none';
      }

      // 19. Similar Titles Section
      const similarItems = item.similar && Array.isArray(item.similar.results) ? item.similar.results.slice(0, 10) : [];
      if (similarTrack && similarItems.length > 0) {
        populateCarouselTrack(similarTrack, similarItems);
      } else {
        const sec = document.getElementById('similarSection');
        if (sec) sec.style.display = 'none';
      }

      // 20. Recommendations Section
      const recItems = item.recommendations && Array.isArray(item.recommendations.results) ? item.recommendations.results.slice(0, 10) : [];
      if (recsTrack && recItems.length > 0) {
        populateCarouselTrack(recsTrack, recItems);
      } else {
        const sec = document.getElementById('recommendationsSection');
        if (sec) sec.style.display = 'none';
      }

      // Re-init carousel controllers for the new tracks
      initCarouselControls();

      // If autoplay requested via URL parameter
      if (autoPlay) {
        setTimeout(() => getTrailerManager().open(item), 400);
      }

    } catch (err) {
      console.error('❌ [Details Page Error]', err);
      const isNetwork = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'));
      const is404 = err.status === 404 || (err.message && err.message.includes('404'));
      if (is404) {
        detailsContainer.innerHTML = `
          <div class="container" style="padding-top: 5rem; padding-bottom: 5rem;">
            <div class="uv-state-card">
              <div class="uv-state-icon">🎬</div>
              <h3 class="uv-state-title">Title Not Found (404)</h3>
              <p class="uv-state-desc">The movie or series you requested could not be located in the TMDB catalog.</p>
              <div class="uv-state-actions">
                <a href="movies.html" class="uv-state-btn uv-state-btn-primary">Browse Movies</a>
                <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
              </div>
            </div>
          </div>
        `;
      } else {
        detailsContainer.innerHTML = `
          <div class="container" style="padding-top: 5rem; padding-bottom: 5rem;">
            <div class="uv-state-card ${isNetwork ? 'uv-state-network-error' : 'uv-state-api-error'}">
              <div class="uv-state-icon">${isNetwork ? '📡' : '⚠️'}</div>
              <h3 class="uv-state-title">${isNetwork ? 'Network Connection Error' : 'Unable to Load Title Details'}</h3>
              <p class="uv-state-desc">${escapeHTML(err.message || 'We encountered an error connecting to TMDB. Please verify your connection or retry.')}</p>
              <div class="uv-state-actions">
                <button class="uv-state-btn uv-state-btn-primary" id="retryDetailsBtn">${isNetwork ? 'Reconnect ↻' : 'Try Again ↻'}</button>
                <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
              </div>
            </div>
          </div>
        `;
        const retryBtn = document.getElementById('retryDetailsBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => initDetailsPage());
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔖 14. WATCHLIST PAGE CONTROLLER (watchlist.html)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initWatchlistPage() {
    const grid = document.getElementById('watchlistGrid');
    const emptyState = document.getElementById('watchlistEmptyState');
    const filterPills = document.querySelectorAll('#watchlistFilterPills .genre-pill');
    const countAll = document.getElementById('countAll');
    const countMovie = document.getElementById('countMovie');
    const countTv = document.getElementById('countTv');
    const countAnime = document.getElementById('countAnime');
    const clearBtn = document.getElementById('clearWatchlistBtn');

    let currentFilter = 'all';

    // If authenticated, sync with backend API
    if (typeof UniVaultAuth !== 'undefined' && typeof UniVaultAuth.isAuthenticated === 'function' && UniVaultAuth.isAuthenticated()) {
      const token = UniVaultAuth.getToken();
      if (token) {
        try {
          const apiResolver = (typeof getUniVaultApiUrl === 'function') ? getUniVaultApiUrl : (p => p);
          const res = await fetch(apiResolver('/api/watchlist'), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.items)) {
            const localList = getWatchlist();
            const mergedMap = new Map();
            localList.forEach(item => mergedMap.set(String(item.id || item.tmdb_id), item));
            data.items.forEach(item => {
              const id = String(item.tmdb_id || item.id);
              if (!mergedMap.has(id)) {
                mergedMap.set(id, {
                  id: item.tmdb_id,
                  tmdb_id: item.tmdb_id,
                  media_type: item.media_type,
                  title: item.title,
                  poster_path: item.poster,
                  poster: item.poster,
                  added_at: item.created_at
                });
              }
            });
            const mergedList = Array.from(mergedMap.values());
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(mergedList));
          }
        } catch (err) {
          console.warn('Watchlist sync error:', err);
        }
      }
    }

    function renderWatchlist() {
      const allItems = getWatchlist();

      const movies = allItems.filter(i => detectMediaType(i) === 'movie');
      const tvs = allItems.filter(i => detectMediaType(i) === 'tv');
      const animes = allItems.filter(i => detectMediaType(i) === 'anime');

      if (countAll) countAll.textContent = allItems.length;
      if (countMovie) countMovie.textContent = movies.length;
      if (countTv) countTv.textContent = tvs.length;
      if (countAnime) countAnime.textContent = animes.length;

      if (clearBtn) {
        clearBtn.style.display = allItems.length > 0 ? 'inline-block' : 'none';
      }

      let filteredItems = allItems;
      if (currentFilter === 'movie') filteredItems = movies;
      else if (currentFilter === 'tv') filteredItems = tvs;
      else if (currentFilter === 'anime') filteredItems = animes;

      if (!grid) return;

      if (filteredItems.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
      } else {
        if (emptyState) emptyState.style.display = 'none';
        renderGrid(grid, filteredItems);
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const type = pill.getAttribute('data-type') || 'all';
        currentFilter = type;
        filterPills.forEach(p => p.classList.toggle('active', p === pill));
        renderWatchlist();
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire watchlist?')) {
          localStorage.removeItem(WATCHLIST_KEY);
          window.dispatchEvent(new CustomEvent('watchlistUpdated', { detail: { id: null, isAdded: false } }));
          renderWatchlist();
        }
      });
    }

    window.addEventListener('watchlistUpdated', () => {
      renderWatchlist();
    });

    renderWatchlist();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📄 15. SUBPAGE-SPECIFIC DATA LOADERS
  // ═══════════════════════════════════════════════════════════════════════════
  async function initPageCatalog() {
    const pathname = window.location.pathname.toLowerCase();

    // 1. Movies Page Controller
    if (pathname.includes('movies.html')) {
      initMoviesPage();
      return;
    }

    // 2. TV Shows Page Controller
    else if (pathname.includes('tv-shows.html')) {
      initTVShowsPage();
      return;
    }

    // 3. Anime Page Controller
    else if (pathname.includes('anime.html')) {
      initAnimePage();
      return;
    }

    // 4. Search Page Controller
    else if (pathname.includes('search.html')) {
      initSearchPage();
      return;
    }

    // 5. Details Page Controller
    else if (pathname.includes('details.html')) {
      initDetailsPage();
      return;
    }

    // 6. Watchlist Page Controller
    else if (pathname.includes('watchlist.html')) {
      initWatchlistPage();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 10. GLOBAL EXPORTS & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  global.TMDB = TMDB;
  global.TMDB_CONFIG = TMDB_CONFIG;
  global.openTrailerModal = (itemOrId, mediaType, title) => getTrailerManager().open(itemOrId, mediaType, title);
  global.closeTrailerModal = () => getTrailerManager().close();
  // Expose renderGrid as a direct global so auth.js and other scripts can call it
  global.renderGrid = renderGrid;
  global.UniVaultCards = {
    createCard: createCardElement,
    createActorCard: createActorCard,
    createGenreCard: createGenreCard,
    renderGrid: renderGrid,
    populateCarousel: populateCarouselTrack,
    detectType: detectMediaType,
    isInWatchlist: isInWatchlist,
    toggleWatchlist: toggleWatchlist,
    openTrailer: (item) => getTrailerManager().open(item)
  };

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Hero Carousel
    if (document.getElementById('heroSection')) {
      window.univaultHero = new HeroController();
    }
    // 2. Initialize Homepage 10 Content Sections
    initHomepageSections();
    // 3. Initialize Specific Subpages
    initPageCatalog();
  });

})(typeof window !== 'undefined' ? window : this);
