/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UniVault — Dedicated Cinema Trailer Controller (public/js/trailer.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles TMDB metadata resolution, trailer stream extraction, YouTube
 * player embed, keyboard navigation, and ambient backdrop lighting.
 */

(function (global) {
  'use strict';

  // ── TMDB Client Config ───────────────────────────────────────────────────
  const TMDB_CONFIG = {
    READ_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTA1MWUwNmVkMjAzMmU5ZjE2OThiNWJmMjc0YzY1MyIsIm5iZiI6MTc4MzUwNjQ1MS45NTgwMDAyLCJzdWIiOiI2YTRlMjYxMzE3NWMzMjExNTMyNGE2NzciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.nF6iucTxiPVq8lSNFztm4GWjnMwEKZvClbecQnKrMNE',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
    BACKDROP_BASE_URL: 'https://image.tmdb.org/t/p/original'
  };

  const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics'
  };

  /**
   * Universal YouTube video key extractor
   */
  function extractYouTubeVideoId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    const patterns = [
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
      /^[a-zA-Z0-9_-]{11}$/
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  /**
   * Fetch helper for TMDB with Bearer authentication
   */
  async function fetchTMDB(endpoint, params = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${TMDB_CONFIG.BASE_URL}${cleanEndpoint}`);

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const res = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TMDB_CONFIG.READ_ACCESS_TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error(`TMDB HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Trailer Priority Sorter
   */
  function pickBestTrailer(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return null;

    const ytVideos = videos.filter(v => {
      const isYt = !v.site || v.site.toLowerCase() === 'youtube';
      const key = v.key || v.url || v.id;
      return isYt && extractYouTubeVideoId(key);
    });

    if (ytVideos.length === 0) {
      const anyYt = videos.find(v => extractYouTubeVideoId(v.key || v.url || v.id));
      if (anyYt) {
        return { key: extractYouTubeVideoId(anyYt.key || anyYt.url || anyYt.id), type: anyYt.type || 'Trailer', name: anyYt.name };
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
    if (officialTeaser) return { ...officialTeaser, key: extractYouTubeVideoId(officialTeaser.key), type: 'Official Teaser' };

    // 5. Any Teaser
    const anyTeaser = ytVideos.find(v => v.type === 'Teaser');
    if (anyTeaser) return { ...anyTeaser, key: extractYouTubeVideoId(anyTeaser.key), type: 'Teaser' };

    // 6. Clip or Featurette
    const anyClip = ytVideos.find(v => v.type === 'Clip' || v.type === 'Featurette' || v.type === 'Behind the Scenes');
    if (anyClip) return { ...anyClip, key: extractYouTubeVideoId(anyClip.key), type: anyClip.type || 'Clip' };

    // 7. First available YouTube video
    const first = ytVideos[0];
    return { ...first, key: extractYouTubeVideoId(first.key), type: first.type || 'Trailer' };
  }

  // ── Cinema Controller ────────────────────────────────────────────────────
  class CinemaTrailerController {
    constructor() {
      this.params = new URLSearchParams(window.location.search);
      this.id = this.params.get('id') || '';
      this.mediaType = (this.params.get('type') || 'movie').toLowerCase();
      this.rawTitle = this.params.get('title') || '';
      this.directKey = this.params.get('key') || '';

      this.itemData = null;
      this.trailerData = null;

      this.cacheDOM();
      this.bindEvents();
    }

    cacheDOM() {
      this.backdropImgEl = document.getElementById('cinemaBackdropImg');
      this.playerBoxEl = document.getElementById('cinemaPlayerBox');
      this.loaderOverlayEl = document.getElementById('cinemaLoader');
      this.loaderTextEl = document.getElementById('cinemaLoaderText');
      this.errorOverlayEl = document.getElementById('cinemaError');
      this.errorTitleEl = document.getElementById('cinemaErrorTitle');
      this.errorDescEl = document.getElementById('cinemaErrorDesc');
      this.errorYtSearchBtn = document.getElementById('cinemaErrorYtSearchBtn');

      // Topbar elements
      this.topbarTitleEl = document.getElementById('cinemaTitle');
      this.topbarBadgeEl = document.getElementById('cinemaBadge');
      this.topbarYearEl = document.getElementById('cinemaYear');
      this.topbarRatingEl = document.getElementById('cinemaRating');
      this.topbarWatchlistBtn = document.getElementById('cinemaWatchlistBtn');
      this.topbarDetailsLink = document.getElementById('cinemaDetailsLink');
      this.topbarCloseBtn = document.getElementById('cinemaCloseBtn');
      this.backBtn = document.getElementById('cinemaBackBtn');

      // Metabar elements
      this.metaTagsRowEl = document.getElementById('cinemaMetaTags');
      this.metaGenresEl = document.getElementById('cinemaGenres');
      this.metaOverviewEl = document.getElementById('cinemaOverview');
      this.directYtLinkEl = document.getElementById('cinemaDirectYtLink');
    }

    bindEvents() {
      // 1. Back button
      if (this.backBtn) {
        this.backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        });
      }

      // 2. Close Tab / Window button
      if (this.topbarCloseBtn) {
        this.topbarCloseBtn.addEventListener('click', () => {
          if (window.opener && !window.opener.closed) {
            window.close();
          } else if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        });
      }

      // 3. Watchlist Toggle button
      if (this.topbarWatchlistBtn) {
        this.topbarWatchlistBtn.addEventListener('click', () => this.toggleWatchlist());
      }

      // 4. Keyboard Shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (window.opener && !window.opener.closed) {
            window.close();
          } else if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        } else if (e.key === 'd' || e.key === 'D') {
          if (this.id) {
            window.location.href = `details.html?id=${this.id}&type=${this.mediaType}`;
          }
        } else if (e.key === 'w' || e.key === 'W') {
          this.toggleWatchlist();
        }
      });
    }

    async init() {
      if (this.rawTitle) {
        if (this.topbarTitleEl) this.topbarTitleEl.textContent = this.rawTitle;
        document.title = `Watch Trailer: ${this.rawTitle} — UniVault Cinema`;
      }

      // If direct YouTube key was provided in URL query
      if (this.directKey) {
        const key = extractYouTubeVideoId(this.directKey);
        if (key) {
          this.embedPlayer(key, 'Official Trailer');
          if (!this.id) {
            this.hideLoader();
            return;
          }
        }
      }

      if (!this.id) {
        this.showError(
          'No Media Specified',
          'A valid movie or TV show ID is required to stream the official trailer. Please select a title from UniVault.'
        );
        return;
      }

      await this.loadMediaAndTrailer();
    }

    async loadMediaAndTrailer() {
      try {
        if (this.loaderTextEl) this.loaderTextEl.textContent = 'Connecting to TMDB Cinema Feed…';

        const tmdbType = (this.mediaType === 'tv' || this.mediaType === 'anime') ? 'tv' : 'movie';

        // Fetch details & videos in parallel
        const [details, videoData] = await Promise.allSettled([
          fetchTMDB(`/${tmdbType}/${this.id}`),
          fetchTMDB(`/${tmdbType}/${this.id}/videos`)
        ]);

        if (details.status === 'fulfilled' && details.value) {
          this.itemData = details.value;
          this.renderMetadata(this.itemData);
        }

        const videos = (videoData.status === 'fulfilled' && videoData.value && Array.isArray(videoData.value.results))
          ? videoData.value.results
          : [];

        const selectedTrailer = pickBestTrailer(videos);

        if (!selectedTrailer || !selectedTrailer.key) {
          const title = (this.itemData && (this.itemData.title || this.itemData.name)) || this.rawTitle || 'Title';
          this.showError(
            'Official Trailer Unavailable',
            `We couldn't find an official streamed trailer for "${title}" in the TMDB catalog. You can search directly on YouTube.`,
            title
          );
          return;
        }

        this.trailerData = selectedTrailer;
        this.embedPlayer(selectedTrailer.key, selectedTrailer.type || 'Trailer');
        this.hideLoader();

      } catch (err) {
        console.error('❌ [Cinema Trailer Error]', err);
        const title = this.rawTitle || 'this title';
        this.showError(
          'Unable to Load Trailer',
          `We encountered a network issue loading the trailer for ${title}. Please check your connection.`,
          title
        );
      }
    }

    renderMetadata(item) {
      if (!item) return;

      const title = item.title || item.name || item.original_title || item.original_name || this.rawTitle || 'Untitled';
      const releaseDate = item.release_date || item.first_air_date || '';
      const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
      const voteAvg = item.vote_average ? Number(item.vote_average).toFixed(1) : null;
      const overview = item.overview || 'No synopsis available for this title.';

      // Detect anime vs tv vs movie
      let mediaLabel = 'MOVIE';
      let badgeClass = '';
      if (this.mediaType === 'anime' || (item.original_language === 'ja' && item.genres && item.genres.some(g => g.id === 16))) {
        mediaLabel = 'ANIME';
        badgeClass = 'badge-anime';
      } else if (this.mediaType === 'tv' || item.first_air_date) {
        mediaLabel = 'TV SERIES';
        badgeClass = 'badge-tv';
      }

      // 1. Update Title & Badges
      if (this.topbarTitleEl) this.topbarTitleEl.textContent = title;
      if (this.topbarBadgeEl) {
        this.topbarBadgeEl.textContent = mediaLabel;
        this.topbarBadgeEl.className = `topbar-media-badge ${badgeClass}`;
      }
      if (this.topbarYearEl && year) this.topbarYearEl.textContent = `(${year})`;
      if (this.topbarRatingEl && voteAvg && voteAvg > 0) {
        this.topbarRatingEl.innerHTML = `★ ${voteAvg}`;
        this.topbarRatingEl.style.display = 'inline-flex';
      }

      document.title = `Watch Trailer: ${title} ${year ? `(${year})` : ''} — UniVault Cinema`;

      // 2. Set Details link
      if (this.topbarDetailsLink) {
        this.topbarDetailsLink.href = `details.html?id=${this.id}&type=${this.mediaType}`;
      }

      // 3. Update Backdrop Image
      if (item.backdrop_path && this.backdropImgEl) {
        const backdropUrl = `${TMDB_CONFIG.BACKDROP_BASE_URL}${item.backdrop_path}`;
        const img = new Image();
        img.src = backdropUrl;
        img.onload = () => {
          this.backdropImgEl.style.backgroundImage = `url('${backdropUrl}')`;
          this.backdropImgEl.classList.add('loaded');
        };
      }

      // 4. Update Metabar Tags & Genres
      if (this.metaTagsRowEl) {
        let tagHtml = '';
        if (year) tagHtml += `<span class="meta-pill">${year}</span>`;
        if (item.runtime) tagHtml += `<span class="meta-pill">${item.runtime}m</span>`;
        if (item.number_of_seasons) tagHtml += `<span class="meta-pill">${item.number_of_seasons} Season${item.number_of_seasons > 1 ? 's' : ''}</span>`;
        if (item.status) tagHtml += `<span class="meta-pill">${item.status}</span>`;
        this.metaTagsRowEl.innerHTML = tagHtml;
      }

      if (this.metaGenresEl && Array.isArray(item.genres)) {
        this.metaGenresEl.innerHTML = item.genres
          .slice(0, 4)
          .map(g => `<span class="meta-genre-pill">${g.name}</span>`)
          .join('');
      }

      if (this.metaOverviewEl) {
        this.metaOverviewEl.textContent = overview;
      }

      // 5. Check Watchlist state
      this.syncWatchlistUI();
    }

    embedPlayer(youtubeKey, typeName = 'Official Trailer') {
      if (!this.playerBoxEl || !youtubeKey) return;

      const origin = window.location.origin || 'http://localhost:5000';
      const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;

      // Update direct YouTube link
      if (this.directYtLinkEl) {
        this.directYtLinkEl.href = `https://www.youtube.com/watch?v=${youtubeKey}`;
        this.directYtLinkEl.style.display = 'inline-flex';
      }

      // Create pristine iframe
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = `${this.rawTitle || 'Title'} ${typeName}`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.setAttribute('frameborder', '0');

      // Clear any prior player
      const oldIframes = this.playerBoxEl.querySelectorAll('iframe');
      oldIframes.forEach(el => el.remove());

      this.playerBoxEl.appendChild(iframe);
      this.hideError();
    }

    hideLoader() {
      if (this.loaderOverlayEl) {
        this.loaderOverlayEl.classList.add('hidden');
      }
    }

    showError(title, message, queryTitle = '') {
      this.hideLoader();
      if (this.errorOverlayEl) {
        this.errorOverlayEl.style.display = 'flex';
        if (this.errorTitleEl) this.errorTitleEl.textContent = title;
        if (this.errorDescEl) this.errorDescEl.textContent = message;

        const q = queryTitle || this.rawTitle || (this.itemData && (this.itemData.title || this.itemData.name)) || '';
        if (this.errorYtSearchBtn) {
          this.errorYtSearchBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' official trailer')}`;
        }
      }
    }

    hideError() {
      if (this.errorOverlayEl) {
        this.errorOverlayEl.style.display = 'none';
      }
    }

    // ── Watchlist Integration ────────────────────────────────────────────────
    isItemInWatchlist() {
      try {
        const stored = JSON.parse(localStorage.getItem('univault_watchlist') || '[]');
        return stored.some(i => String(i.id || i.tmdb_id) === String(this.id));
      } catch (e) {
        return false;
      }
    }

    syncWatchlistUI() {
      if (!this.topbarWatchlistBtn) return;
      const inWl = this.isItemInWatchlist();
      this.topbarWatchlistBtn.classList.toggle('active', inWl);
      this.topbarWatchlistBtn.innerHTML = inWl
        ? '<span>✓</span> In Watchlist'
        : '<span>🔖</span> Watchlist';
    }

    toggleWatchlist() {
      if (!this.id) return;
      try {
        let stored = JSON.parse(localStorage.getItem('univault_watchlist') || '[]');
        const existingIdx = stored.findIndex(i => String(i.id || i.tmdb_id) === String(this.id));

        if (existingIdx >= 0) {
          stored.splice(existingIdx, 1);
        } else {
          const title = (this.itemData && (this.itemData.title || this.itemData.name)) || this.rawTitle || 'Untitled';
          const poster = this.itemData ? this.itemData.poster_path : null;
          stored.push({
            id: Number(this.id),
            tmdb_id: Number(this.id),
            media_type: this.mediaType,
            title,
            poster
          });
        }
        localStorage.setItem('univault_watchlist', JSON.stringify(stored));
        this.syncWatchlistUI();

        // Optional Backend Watchlist Sync
        const token = localStorage.getItem('univault_auth_token') || sessionStorage.getItem('univault_auth_token');
        if (token) {
          const method = existingIdx >= 0 ? 'DELETE' : 'POST';
          const url = existingIdx >= 0 ? `/api/watchlist/${this.id}` : '/api/watchlist';
          const body = existingIdx >= 0 ? null : JSON.stringify({
            tmdb_id: Number(this.id),
            media_type: this.mediaType,
            title: (this.itemData && (this.itemData.title || this.itemData.name)) || this.rawTitle,
            poster: this.itemData ? this.itemData.poster_path : null
          });

          fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            ...(body ? { body } : {})
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('Watchlist sync error:', e);
      }
    }
  }

  // ── Auto-initialize on DOM ready ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    window.univaultCinema = new CinemaTrailerController();
    window.univaultCinema.init();
  });

})(typeof window !== 'undefined' ? window : this);
