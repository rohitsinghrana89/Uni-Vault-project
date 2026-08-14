/**
 * UniVault — Cinematic Hero Controller (hero.js)
 * =============================================
 * Handles TMDB trending data fetching, auto-rotation carousel, crossfade animations,
 * interactive watch trailer modal, watchlist state, skeleton loaders, and fallbacks.
 */

// ── Genre ID Lookup Table ──────────────────────────────────────────────────
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

// ── Curated Fallback Data (used if TMDB API is offline/unreachable) ───────
const FALLBACK_ITEMS = [
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
  }
];

class HeroController {
  constructor() {
    this.items = [];
    this.currentIndex = 0;
    this.rotationTimer = null;
    this.rotationIntervalMs = 7000;
    this.isPaused = false;
    this.watchlist = this.loadWatchlist();

    // DOM Elements
    this.section = document.getElementById('heroSection');
    this.backdropEl = document.getElementById('heroBackdrop');
    this.contentEl = document.getElementById('heroContent');
    this.controlsEl = document.getElementById('heroControls');
    this.modalEl = document.getElementById('heroTrailerModal');
    this.modalIframeEl = document.getElementById('heroTrailerIframe');
    this.modalErrorEl = document.getElementById('heroTrailerError');

    this.init();
  }

  async init() {
    this.renderSkeleton();
    this.bindEvents();

    try {
      let data = null;
      if (window.TMDB && typeof window.TMDB.getTrending === 'function') {
        data = await window.TMDB.getTrending('day');
      } else {
        data = await this.fetchTrendingData();
      }

      if (data && Array.isArray(data.results) && data.results.length > 0) {
        // Filter items that have backdrop & overview
        this.items = data.results
          .filter(item => item.backdrop_path && item.overview)
          .slice(0, 7);
        this.hideFallbackNotice();
      }
    } catch (err) {
      console.warn('⚠️ [Hero] TMDB trending fetch failed, activating fallback catalog:', err.message);
    }

    // Use fallback if items list is empty
    if (!this.items || this.items.length === 0) {
      this.items = FALLBACK_ITEMS;
      this.showFallbackNotice();
    } else {
      this.hideFallbackNotice();
    }

    this.renderSlide(0);
    this.renderIndicators();
    this.startAutoRotation();
  }

  async fetchTrendingData() {
    const token = (window.TMDB_CONFIG && window.TMDB_CONFIG.READ_ACCESS_TOKEN) || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmOTA1MWUwNmVkMjAzMmU5ZjE2OThiNWJmMjc0YzY1MyIsIm5iZiI6MTc4MzUwNjQ1MS45NTgwMDAyLCJzdWIiOiI2YTRlMjYxMzE3NWMzMjExNTMyNGE2NzciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.nF6iucTxiPVq8lSNFztm4GWjnMwEKZvClbecQnKrMNE';
    const isPlaceholder = !token || token === 'YOUR_TMDB_READ_ACCESS_TOKEN' || token === 'YOUR_ACCESS_TOKEN';

    let res;
    // Try direct TMDB API if token is configured
    if (!isPlaceholder) {
      try {
        res = await fetch('https://api.themoviedb.org/3/trending/all/day', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json;charset=utf-8'
          }
        });
      } catch (directErr) {
        console.error('❌ [Hero] Network error connecting directly to TMDB API:', directErr.message);
        throw directErr;
      }
    } else {
      // Fall back to server proxy
      try {
        const proxyUrl = (typeof getUniVaultApiUrl === 'function')
          ? getUniVaultApiUrl('/api/tmdb/trending?type=all&time=day')
          : '/api/tmdb/trending?type=all&time=day';
        res = await fetch(proxyUrl);
      } catch (networkErr) {
        console.error(
          '❌ [Hero] TMDB Read Access Token is not set and local server proxy is unreachable.\n' +
          '   Please insert your TMDB Read Access Token in script.js to connect directly to TMDB API.\n' +
          `   Raw error: ${networkErr.message}`
        );
        throw new Error(`Network error: ${networkErr.message}`);
      }
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status} (${res.statusText})`;
      let tmdbMessage = '';
      try {
        const body = await res.json();
        tmdbMessage = body.status_message || '';
        detail = tmdbMessage || detail;
      } catch { /* ignore parse errors */ }

      if (res.status === 401) {
        console.error(
          '❌ [Hero] TMDB API — 401 Unauthorized.\n' +
          '   Your TMDB API Read Access Token is invalid, expired, or missing.\n' +
          `   Detail: ${detail}\n` +
          '   👉 Fix: Obtain your API Read Access Token from https://www.themoviedb.org/settings/api and paste it into script.js.'
        );
      } else if (res.status === 403) {
        console.error(`❌ [Hero] TMDB API — 403 Forbidden. Check API permissions. Detail: ${detail}`);
      } else if (res.status === 404) {
        console.error(`❌ [Hero] TMDB API — 404 Not Found. The endpoint or resource was not found. Detail: ${detail}`);
      } else if (res.status === 429) {
        console.error(`❌ [Hero] TMDB API — 429 Rate Limited. Too many requests. Detail: ${detail}`);
      } else {
        console.error(`❌ [Hero] TMDB API — HTTP Error ${res.status}. Detail: ${detail}`);
      }
      throw new Error(detail);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.results)) {
      console.error('❌ [Hero] TMDB returned unexpected data shape:', data);
      throw new Error('Unexpected TMDB response shape');
    }

    console.info(`✅ [Hero] TMDB trending fetched — ${data.results.length} items received.`);
    return data;
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

  // ── Slide Renderer ────────────────────────────────────────────────────────
  renderSlide(index, isManual = false) {
    if (!this.items || this.items.length === 0) return;
    
    this.currentIndex = index;
    const item = this.items[index];

    // 1. Update Backdrop with crossfade
    // NOTE: TMDB image base is https://image.tmdb.org/t/p/ (NOT t5/p/)
    const backdropUrl = item.backdrop_path.startsWith('http')
      ? item.backdrop_path
      : `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

    if (this.backdropEl) {
      this.backdropEl.classList.remove('active-slide');
      this.backdropEl.classList.add('fade-out');
      
      setTimeout(() => {
        this.backdropEl.style.backgroundImage = `url('${backdropUrl}')`;
        this.backdropEl.classList.remove('fade-out');
        this.backdropEl.classList.add('active-slide');
      }, 150);
    }

    // 2. Prepare Data
    const title = item.title || item.name || 'Untitled';
    const mediaType = (item.media_type || 'movie').toUpperCase();
    const releaseDate = item.release_date || item.first_air_date || '';
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '2026';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    
    // NOTE: TMDB image base is https://image.tmdb.org/t/p/ (NOT t5/p/)
    const posterUrl = item.poster_path
      ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

    const genreNames = (item.genre_ids || [])
      .map(id => GENRE_MAP[id])
      .filter(Boolean)
      .slice(0, 3);

    const isInWatchlist = this.isItemInWatchlist(item.id);

    // 3. Render Content Grid
    if (this.contentEl) {
      this.contentEl.innerHTML = `
        <div class="hero-grid">
          <div class="hero-details">
            <div class="hero-badge-row">
              <span class="hero-badge">🔥 #${index + 1} Trending</span>
              <span class="hero-badge hero-badge-type">${mediaType}</span>
            </div>

            <h1 class="hero-title">${this.escapeHtml(title)}</h1>

            <div class="hero-meta-row">
              <span class="hero-rating-chip">⭐ ${rating}</span>
              <span class="hero-year-chip">${releaseYear}</span>
              <div class="hero-genres-container">
                ${genreNames.map(g => `<span class="hero-genre-pill">${g}</span>`).join('')}
              </div>
            </div>

            <p class="hero-overview">${this.escapeHtml(item.overview)}</p>

            <div class="hero-actions">
              <button class="btn-hero-play" id="heroPlayBtn" data-id="${item.id}" data-type="${item.media_type || 'movie'}">
                <span aria-hidden="true">▶</span> Watch Trailer
              </button>

              <a href="details.html?id=${item.id}&type=${item.media_type || 'movie'}" class="btn-hero-secondary">
                <span aria-hidden="true">ℹ️</span> More Info
              </a>

              <button class="btn-hero-watchlist ${isInWatchlist ? 'in-watchlist' : ''}" id="heroWatchlistBtn" data-id="${item.id}">
                <span aria-hidden="true">${isInWatchlist ? '✓' : '🔖'}</span>
                <span>${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>

          <div class="hero-poster-column">
            <div class="hero-poster-card">
              <img src="${posterUrl}" alt="${this.escapeHtml(title)} poster" class="hero-poster-img" loading="eager">
            </div>
          </div>
        </div>
      `;

      // Attach button event listeners
      const playBtn = document.getElementById('heroPlayBtn');
      if (playBtn) {
        playBtn.addEventListener('click', () => this.openTrailer(item));
      }

      const watchlistBtn = document.getElementById('heroWatchlistBtn');
      if (watchlistBtn) {
        watchlistBtn.addEventListener('click', () => this.toggleWatchlist(item, watchlistBtn));
      }
    }

    // 4. Update Indicators
    this.updateIndicators(index);

    if (isManual) {
      this.restartAutoRotation();
    }
  }

  // ── Indicators / Slide Dots ───────────────────────────────────────────────
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

  // ── Auto Rotation ────────────────────────────────────────────────────────
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
      this.section.addEventListener('focusin', () => { this.isPaused = true; });
      this.section.addEventListener('focusout', () => { this.isPaused = false; });
    }

    // Modal close events
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

  // ── Trailer Modal Logic ──────────────────────────────────────────────────
  async openTrailer(item) {
    this.isPaused = true;
    if (typeof global.openTrailerModal === 'function') {
      global.openTrailerModal(item);
      return;
    }
    if (typeof window !== 'undefined' && typeof window.openTrailerModal === 'function') {
      window.openTrailerModal(item);
      return;
    }
  }

  closeTrailer() {
    if (typeof global.closeTrailerModal === 'function') {
      global.closeTrailerModal();
    } else if (typeof window !== 'undefined' && typeof window.closeTrailerModal === 'function') {
      window.closeTrailerModal();
    }
    this.isPaused = false;
  }

  // ── Watchlist Management ──────────────────────────────────────────────────
  loadWatchlist() {
    try {
      const saved = localStorage.getItem('univault_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveWatchlist() {
    try {
      localStorage.setItem('univault_watchlist', JSON.stringify(this.watchlist));
    } catch (err) {
      console.error('Failed to save watchlist:', err);
    }
  }

  isItemInWatchlist(id) {
    return this.watchlist.some(item => String(item.id) === String(id));
  }

  toggleWatchlist(item, btnEl) {
    const index = this.watchlist.findIndex(w => String(w.id) === String(item.id));
    if (index >= 0) {
      this.watchlist.splice(index, 1);
      btnEl.classList.remove('in-watchlist');
      btnEl.innerHTML = `<span aria-hidden="true">🔖</span> <span>Add to Watchlist</span>`;
    } else {
      this.watchlist.push({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        media_type: item.media_type || 'movie',
        addedAt: new Date().toISOString()
      });
      btnEl.classList.add('in-watchlist');
      btnEl.innerHTML = `<span aria-hidden="true">✓</span> <span>In Watchlist</span>`;
    }
    this.saveWatchlist();
  }

  // ── Utilities ────────────────────────────────────────────────────────────
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

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Initialize Hero when DOM is ready (singleton guard)
document.addEventListener('DOMContentLoaded', () => {
  if (!window.univaultHero && document.getElementById('heroSection')) {
    window.univaultHero = new HeroController();
  }
});
