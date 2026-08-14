/**
 * ===========================================================================
 * UniVault — Centralized TMDB API Service Client (tmdb-api.js)
 * ===========================================================================
 * High-performance, cached, fault-tolerant client for all TMDB operations.
 * Supports direct TMDB v4 Bearer Token authentication with automatic proxy fallback.
 */

(function (global) {
  'use strict';

  const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTA1MWUwNmVkMjAzMmU5ZjE2OThiNWJmMjc0YzY1MyIsIm5iZiI6MTc4MzUwNjQ1MS45NTgwMDAyLCJzdWIiOiI2YTRlMjYxMzE3NWMzMjExNTMyNGE2NzciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.nF6iucTxiPVq8lSNFztm4GWjnMwEKZvClbecQnKrMNE';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const PROXY_BASE = '/api/tmdb';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p';

  // ── Genre ID Mapping ───────────────────────────────────────────────────────
  const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  // ── In-Memory Request Cache ────────────────────────────────────────────────
  const _cache = new Map();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // ── Curated Fallback Data (Guarantees zero-blank UI even offline) ───────────
  const FALLBACK_ITEMS = [
    {
      id: 933260,
      title: 'The Substance',
      name: 'The Substance',
      media_type: 'movie',
      overview: 'A fading celebrity decides to use a black-market drug, a cell-replicating substance that temporarily creates a younger, better version of herself.',
      vote_average: 7.3,
      release_date: '2024-09-07',
      backdrop_path: '/7h6509oMsdmaYIR4kH3iQnOocqg.jpg',
      poster_path: '/lqoMzCcZYEFK729Fc6rRAl30btF.jpg',
      genre_ids: [27, 878, 18]
    },
    {
      id: 1184918,
      title: 'The Wild Robot',
      name: 'The Wild Robot',
      media_type: 'movie',
      overview: 'After a shipwreck, an intelligent robot named Roz is stranded on an uninhabited island and must learn to adapt to the harsh surroundings.',
      vote_average: 8.5,
      release_date: '2024-09-12',
      backdrop_path: '/417tYZ4AcRDgqAwQUflENFg09yW.jpg',
      poster_path: '/wTnV3PCVW5O92JMrFvvrRil3RsH.jpg',
      genre_ids: [16, 878, 10751]
    },
    {
      id: 94605,
      title: 'Arcane',
      name: 'Arcane',
      media_type: 'tv',
      overview: 'Amid the conflict between two cities, two sisters fight on opposing sides of a war between magic technologies and incompatible convictions.',
      vote_average: 9.0,
      first_air_date: '2021-11-06',
      backdrop_path: '/fqv8v6AycXKsivp1T5yKtLbGXce.jpg',
      poster_path: '/abf8tZvngEG9fBDVJaYPnTC9kRo.jpg',
      genre_ids: [16, 10765, 10759]
    },
    {
      id: 550,
      title: 'Fight Club',
      name: 'Fight Club',
      media_type: 'movie',
      overview: 'An insomniac office worker looking for a way to change his life crosses paths with a devil-may-care soap maker and forms an underground fight club.',
      vote_average: 8.4,
      release_date: '1999-10-15',
      backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      genre_ids: [18]
    },
    {
      id: 27205,
      title: 'Inception',
      name: 'Inception',
      media_type: 'movie',
      overview: 'Cobb, a skilled thief who steals corporate secrets through dream-sharing technology, is given the chance to have his criminal history erased.',
      vote_average: 8.4,
      release_date: '2010-07-15',
      backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
      poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      genre_ids: [28, 878, 12]
    }
  ];

  /**
   * Internal HTTP Fetcher with Dual-Route (Direct TMDB -> Local Backend Proxy)
   */
  async function tmdbFetch(endpoint, params = {}) {
    const queryStr = new URLSearchParams(params).toString();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cacheKey = `${cleanEndpoint}?${queryStr}`;

    // 1. Check in-memory cache
    if (_cache.has(cacheKey)) {
      const cached = _cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
      _cache.delete(cacheKey);
    }

    // 2. Primary Route: Direct TMDB API with Read Token
    try {
      const directUrl = `${BASE_URL}${cleanEndpoint}${queryStr ? '?' + queryStr : ''}`;
      const res = await fetch(directUrl, {
        headers: {
          'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        _cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    } catch (directErr) {
      console.warn(`[TMDB Direct] Failed on ${endpoint}:`, directErr.message);
    }

    // 3. Fallback Route: Local Backend Proxy
    try {
      const proxyUrl = `${PROXY_BASE}${cleanEndpoint}${queryStr ? '?' + queryStr : ''}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const data = await res.json();
        _cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    } catch (proxyErr) {
      console.warn(`[TMDB Proxy] Failed on ${endpoint}:`, proxyErr.message);
    }

    // 4. Return Fallback Structure if both networks fail
    return { results: FALLBACK_ITEMS, page: 1, total_pages: 1, total_results: FALLBACK_ITEMS.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API CLIENT
  // ═══════════════════════════════════════════════════════════════════════════
  const TMDB_API = {
    GENRE_MAP,

    // Image URL Helpers
    getImageUrl: (path, size = 'w500') => {
      if (!path) return 'https://via.placeholder.com/500x750/161622/4B5563?text=No+Poster';
      if (path.startsWith('http')) return path;
      return `${IMAGE_BASE}/${size}${path}`;
    },

    getBackdropUrl: (path, size = 'original') => {
      if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';
      if (path.startsWith('http')) return path;
      return `${IMAGE_BASE}/${size}${path}`;
    },

    getGenreNames: (genreIds = [], mediaType = 'movie') => {
      if (!Array.isArray(genreIds)) return [];
      return genreIds.map(id => GENRE_MAP[id]).filter(Boolean);
    },

    formatRating: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num.toFixed(1) : 'NR';
    },

    formatYear: (dateStr) => {
      return dateStr ? String(dateStr).split('-')[0] : '';
    },

    formatRuntime: (minutes) => {
      if (!minutes || isNaN(minutes)) return '';
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },

    // ── Homepage & Browse Feeds ──────────────────────────────────────────────
    getTrending: async (type = 'all', time = 'day', page = 1) => {
      const data = await tmdbFetch(`/trending/${type}/${time}`, { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getPopularMovies: async (page = 1) => {
      const data = await tmdbFetch('/movie/popular', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getPopularTV: async (page = 1) => {
      const data = await tmdbFetch('/tv/popular', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getTopRatedMovies: async (page = 1) => {
      const data = await tmdbFetch('/movie/top_rated', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getTopRatedTV: async (page = 1) => {
      const data = await tmdbFetch('/tv/top_rated', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getNowPlayingMovies: async (page = 1) => {
      const data = await tmdbFetch('/movie/now_playing', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    getUpcomingMovies: async (page = 1) => {
      const data = await tmdbFetch('/movie/upcoming', { page });
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    // ── Anime Category (Animation + JP origin or keyword) ───────────────────
    getAnime: async (category = 'popular', page = 1) => {
      let endpoint = '/discover/tv';
      let params = {
        with_genres: '16',
        with_original_language: 'ja',
        page,
        sort_by: 'popularity.desc'
      };

      if (category === 'top_rated') {
        params.sort_by = 'vote_average.desc';
        params['vote_count.gte'] = '200';
      } else if (category === 'action') {
        params.with_genres = '16,10759';
      } else if (category === 'romance') {
        params.with_genres = '16,18';
      } else if (category === 'fantasy') {
        params.with_genres = '16,10765';
      }

      const data = await tmdbFetch(endpoint, params);
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    // ── Genre Exploration ───────────────────────────────────────────────────
    getGenreContent: async (mediaType = 'movie', genreId, page = 1, sortBy = 'popularity.desc') => {
      const endpoint = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';
      const params = {
        with_genres: String(genreId),
        sort_by: sortBy,
        page
      };
      const data = await tmdbFetch(endpoint, params);
      return (data && data.results) ? data.results : FALLBACK_ITEMS;
    },

    // ── Search Multi (Movies, Shows, Anime, Cast) ───────────────────────────
    searchMulti: async (query, page = 1) => {
      if (!query || !query.trim()) return [];
      const data = await tmdbFetch('/search/multi', { query: query.trim(), page, include_adult: false });
      return (data && data.results) ? data.results : [];
    },

    // ── Details & Deep Exploration ──────────────────────────────────────────
    getMovieDetails: async (id) => {
      return await tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,recommendations,similar' });
    },

    getTVDetails: async (id) => {
      return await tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,recommendations,similar' });
    },

    getTVSeasonEpisodes: async (tvId, seasonNumber = 1) => {
      return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
    },

    getVideos: async (mediaType = 'movie', id) => {
      const data = await tmdbFetch(`/${mediaType}/${id}/videos`);
      return (data && data.results) ? data.results : [];
    },

    getRecommendations: async (mediaType = 'movie', id) => {
      const data = await tmdbFetch(`/${mediaType}/${id}/recommendations`);
      return (data && data.results) ? data.results : [];
    },

    getSimilar: async (mediaType = 'movie', id) => {
      const data = await tmdbFetch(`/${mediaType}/${id}/similar`);
      return (data && data.results) ? data.results : [];
    }
  };

  global.TMDB_API = TMDB_API;

})(typeof window !== 'undefined' ? window : this);
