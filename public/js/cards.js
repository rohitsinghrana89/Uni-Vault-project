/**
 * UniVault — Reusable Content Card System (cards.js)
 * ============================================================
 * Generates premium, interactive media cards for Movies, TV Shows,
 * and Anime from TMDB API response objects.
 *
 * Features:
 *  - Responsive 2:3 aspect ratio poster with lazy loading
 *  - Media Type Detection (Movie / TV / Anime)
 *  - Ratings chip & Release year badge
 *  - Elegant SVG Fallback poster if TMDB poster is missing or fails
 *  - Dark gradient hover overlay with Play, Watchlist, and More Info actions
 *  - LocalStorage Watchlist sync integration
 */

(function (global) {
  'use strict';

  // ── TMDB Image Base URLs ───────────────────────────────────────────────────
  const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

  // ── LocalStorage Watchlist Helper ──────────────────────────────────────────
  const WATCHLIST_KEY = 'univault_watchlist';

  function getWatchlist() {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function isInWatchlist(id, type) {
    const list = getWatchlist();
    return list.some(item => String(item.id) === String(id) && item.media_type === type);
  }

  function toggleWatchlist(item) {
    const list = getWatchlist();
    const mediaType = detectMediaType(item);
    const itemId = String(item.id);
    const index = list.findIndex(i => String(i.id) === itemId && i.media_type === mediaType);

    let isAdded = false;
    if (index >= 0) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.push({
        id: item.id,
        media_type: mediaType,
        title: item.title || item.name || item.original_title || item.original_name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        added_at: Date.now()
      });
      isAdded = true;
    }

    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[Watchlist] Storage quota exceeded or unavailable', e);
    }

    // Dispatch global event for other components to listen
    window.dispatchEvent(new CustomEvent('watchlistUpdated', {
      detail: { id: item.id, mediaType, isAdded, item }
    }));

    return isAdded;
  }

  // ── Media Type Detector ────────────────────────────────────────────────────
  /**
   * Determines whether an item is a Movie, TV Show, or Anime
   *
   * @param {Object} item - TMDB media item
   * @returns {'movie' | 'tv' | 'anime'}
   */
  function detectMediaType(item) {
    if (!item) return 'movie';

    // Explicit override if provided
    if (item.media_type === 'anime' || item.type === 'anime') return 'anime';

    // Anime Detection heuristics:
    // 1. Japanese original language + Animation Genre ID (16)
    // 2. Japanese original language + TV / Movie with anime keywords
    const isJapanese = item.original_language === 'ja';
    const genreIds = item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []);
    const isAnimation = genreIds.includes(16);

    if (isJapanese && isAnimation) {
      return 'anime';
    }

    // TV Show Detection
    if (
      item.media_type === 'tv' ||
      item.first_air_date ||
      item.number_of_seasons !== undefined ||
      item.name !== undefined
    ) {
      return 'tv';
    }

    // Default to Movie
    return 'movie';
  }

  // ── Card Data Formatter ─────────────────────────────────────────────────────
  function formatCardData(item) {
    const mediaType = detectMediaType(item);

    // Title resolution
    const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';

    // Year resolution
    const dateStr = item.release_date || item.first_air_date || '';
    const year = dateStr ? new Date(dateStr).getFullYear() : (item.year || 'TBA');

    // Rating resolution
    const rawRating = item.vote_average;
    const rating = (rawRating !== undefined && rawRating !== null && rawRating > 0)
      ? Number(rawRating).toFixed(1)
      : 'NR';

    // Poster URL
    const posterUrl = item.poster_path
      ? `${TMDB_IMAGE_BASE}${item.poster_path}`
      : null;

    // Badge configuration
    let badgeText = 'MOVIE';
    let badgeClass = 'badge-accent';

    if (mediaType === 'anime') {
      badgeText = 'ANIME';
      badgeClass = 'badge-anime';
    } else if (mediaType === 'tv') {
      badgeText = 'TV SHOW';
      badgeClass = 'badge-tv';
    }

    const isSaved = isInWatchlist(item.id, mediaType);

    return {
      id: item.id,
      title,
      year,
      rating,
      posterUrl,
      mediaType,
      badgeText,
      badgeClass,
      isSaved,
      rawItem: item
    };
  }

  // ── Create Fallback Poster SVG/HTML ────────────────────────────────────────
  function createFallbackHTML(title, badgeText) {
    const iconSvg = badgeText === 'ANIME'
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18"/><path d="M12 8l4 4-4 4"/></svg>`
      : badgeText === 'TV SHOW'
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="13" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`
      : `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;

    return `
      <div class="poster-fallback-container">
        <div class="poster-fallback-pattern"></div>
        <div class="poster-fallback-content">
          <div class="poster-fallback-icon">${iconSvg}</div>
          <div class="poster-fallback-title">${escapeHTML(title)}</div>
          <div class="poster-fallback-badge">${badgeText}</div>
        </div>
      </div>
    `;
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Main Card Creator Function ─────────────────────────────────────────────
  /**
   * Generates a premium media card DOM element.
   *
   * @param {Object} item - TMDB movie/tv/anime item
   * @param {Object} [options] - Additional options (e.g. onClick, onPlay)
   * @returns {HTMLElement} The card element (<article class="media-card">)
   */
  function createMediaCard(item, options = {}) {
    if (!item) return document.createElement('div');

    const data = formatCardData(item);
    const card = document.createElement('article');
    card.className = 'media-card';
    card.setAttribute('data-id', data.id);
    card.setAttribute('data-type', data.mediaType);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `${data.title} (${data.year}), Rating ${data.rating} out of 10`);

    // Build Poster Section
    let posterInner = '';
    if (data.posterUrl) {
      posterInner = `
        <img
          src="${data.posterUrl}"
          alt="${escapeHTML(data.title)} official poster"
          class="card-poster-img"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.classList.add('visible');"
        />
        <div class="poster-fallback-wrapper">
          ${createFallbackHTML(data.title, data.badgeText)}
        </div>
      `;
    } else {
      posterInner = `
        <div class="poster-fallback-wrapper visible">
          ${createFallbackHTML(data.title, data.badgeText)}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="media-poster">
        ${posterInner}

        <!-- Top Badges -->
        <span class="card-badge ${data.badgeClass}">${data.badgeText}</span>
        
        <div class="card-rating-chip" aria-label="Rating: ${data.rating}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#F5C842" stroke="none" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>${data.rating}</span>
        </div>

        <!-- Hover Overlay -->
        <div class="card-overlay">
          <div class="card-overlay-bg"></div>
          
          <!-- Play / Trailer Center Action -->
          <button class="card-play-btn" aria-label="Play trailer for ${escapeHTML(data.title)}" data-action="play">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </button>

          <!-- Bottom Actions Bar -->
          <div class="card-actions-bar">
            <button class="card-btn btn-watchlist ${data.isSaved ? 'in-watchlist' : ''}" 
                    aria-label="${data.isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}" 
                    title="${data.isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}"
                    data-action="watchlist">
              <svg class="icon-plus" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <svg class="icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span class="btn-label">${data.isSaved ? 'Saved' : 'Watchlist'}</span>
            </button>

            <a href="details.html?id=${data.id}&type=${data.mediaType}" 
               class="card-btn btn-info" 
               aria-label="View details and synopsis for ${escapeHTML(data.title)}"
               data-action="info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Info</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Below Poster Card Content -->
      <div class="media-info">
        <h3 class="media-title" title="${escapeHTML(data.title)}">${escapeHTML(data.title)}</h3>
        <div class="media-meta">
          <span class="meta-year">${data.year}</span>
          <span class="meta-dot" aria-hidden="true">•</span>
          <span class="meta-type">${data.badgeText}</span>
          <span class="meta-dot" aria-hidden="true">•</span>
          <span class="meta-rating">★ ${data.rating}</span>
        </div>
      </div>
    `;

    // ── Bind Event Listeners ─────────────────────────────────────────────────

    // 1. Watchlist Button
    const watchlistBtn = card.querySelector('[data-action="watchlist"]');
    if (watchlistBtn) {
      watchlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const isNowSaved = toggleWatchlist(item);
        
        if (isNowSaved) {
          watchlistBtn.classList.add('in-watchlist');
          watchlistBtn.querySelector('.btn-label').textContent = 'Saved';
          watchlistBtn.title = 'Remove from Watchlist';
          watchlistBtn.setAttribute('aria-label', 'Remove from Watchlist');
        } else {
          watchlistBtn.classList.remove('in-watchlist');
          watchlistBtn.querySelector('.btn-label').textContent = 'Watchlist';
          watchlistBtn.title = 'Add to Watchlist';
          watchlistBtn.setAttribute('aria-label', 'Add to Watchlist');
        }
      });
    }

    // 2. Play Button
    const playBtn = card.querySelector('[data-action="play"]');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (typeof options.onPlay === 'function') {
          options.onPlay(item);
        } else if (typeof global.openTrailerModal === 'function') {
          global.openTrailerModal(data.id, data.mediaType, data.title);
        } else {
          const trailerUrl = `trailer.html?id=${encodeURIComponent(data.id)}&type=${encodeURIComponent(data.mediaType)}&title=${encodeURIComponent(data.title)}`;
          window.open(trailerUrl, '_blank');
        }
      });
    }

    // 3. Card click (navigate to details unless button clicked)
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      
      if (typeof options.onClick === 'function') {
        options.onClick(item);
      } else {
        window.location.href = `details.html?id=${data.id}&type=${data.mediaType}`;
      }
    });

    // 4. Keyboard Navigation (Enter or Space to activate)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target === card) {
          e.preventDefault();
          if (typeof options.onClick === 'function') {
            options.onClick(item);
          } else {
            window.location.href = `details.html?id=${data.id}&type=${data.mediaType}`;
          }
        }
      }
    });

    return card;
  }

  // ── Grid Renderer Helper Function ──────────────────────────────────────────
  /**
   * Renders an array of TMDB items into a target container element.
   *
   * @param {HTMLElement|string} container - Target container element or CSS selector
   * @param {Array<Object>} items - Array of TMDB items
   * @param {Object} [options] - Optional settings (append, onPlay, etc.)
   */
  function renderCardGrid(container, items = [], options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) {
      console.warn('[UniVaultCards] Container not found:', container);
      return;
    }

    if (!options.append) {
      target.innerHTML = '';
    }

    if (!Array.isArray(items) || items.length === 0) {
      if (!options.append) {
        renderEmptyState(target, {
          title: options.emptyTitle || 'No Titles Found',
          message: options.emptyMessage || 'No titles found matching your request. Try browsing trending catalog.',
          actionText: options.emptyActionText || 'Explore Trending',
          actionHref: options.emptyActionHref || 'index.html'
        });
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const card = createMediaCard(item, options);
      fragment.appendChild(card);
    });

    target.appendChild(fragment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌟 REUSABLE SKELETONS (Card, Hero, Details, Cast)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 1. Render Card Skeletons
   */
  function renderCardSkeletons(container, count = 12) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="uv-card-skeleton uv-shimmer" aria-hidden="true">
          <div class="uv-card-skeleton-badge uv-shimmer"></div>
          <div class="uv-card-skeleton-rating uv-shimmer"></div>
          <div class="uv-card-skeleton-title uv-shimmer"></div>
          <div class="uv-card-skeleton-meta uv-shimmer"></div>
        </div>
      `;
    }
    target.innerHTML = html;
  }

  /**
   * 2. Render Hero Skeleton
   */
  function renderHeroSkeleton(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    target.innerHTML = `
      <div class="uv-hero-skeleton uv-shimmer" aria-hidden="true">
        <div class="uv-hero-skeleton-backdrop uv-shimmer"></div>
        <div class="uv-hero-skeleton-overlay"></div>
        <div class="uv-hero-skeleton-content">
          <div class="uv-hero-skeleton-pill uv-shimmer"></div>
          <div class="uv-hero-skeleton-title uv-shimmer"></div>
          <div class="uv-hero-skeleton-desc uv-shimmer"></div>
          <div class="uv-hero-skeleton-desc short uv-shimmer"></div>
          <div class="uv-hero-skeleton-actions">
            <div class="uv-hero-skeleton-btn uv-shimmer"></div>
            <div class="uv-hero-skeleton-btn uv-shimmer" style="background: rgba(255,255,255,0.05);"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 3. Render Details Page Skeleton
   */
  function renderDetailsSkeleton(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    target.innerHTML = `
      <div class="uv-details-skeleton" aria-hidden="true">
        <div class="uv-hero-skeleton-backdrop uv-shimmer" style="height: 480px; position: absolute; top: 0; left: 0; right: 0;"></div>
        <div class="container" style="position: relative; z-index: 3; padding-top: 5rem;">
          <div class="uv-details-skeleton-grid">
            <div class="uv-details-skeleton-poster uv-shimmer"></div>
            <div class="uv-details-skeleton-info">
              <div class="uv-details-skeleton-h1 uv-shimmer"></div>
              <div class="uv-details-skeleton-chips">
                <div class="uv-details-skeleton-chip uv-shimmer"></div>
                <div class="uv-details-skeleton-chip uv-shimmer"></div>
                <div class="uv-details-skeleton-chip uv-shimmer"></div>
              </div>
              <div class="uv-details-skeleton-body uv-shimmer" style="margin-top: 1rem;"></div>
              <div class="uv-details-skeleton-body uv-shimmer"></div>
              <div class="uv-details-skeleton-body uv-shimmer" style="width: 70%;"></div>
              <div class="uv-hero-skeleton-actions" style="margin-top: 1.5rem;">
                <div class="uv-hero-skeleton-btn uv-shimmer"></div>
                <div class="uv-hero-skeleton-btn uv-shimmer" style="background: rgba(255,255,255,0.05);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 4. Render Cast Skeletons
   */
  function renderCastSkeletons(container, count = 8) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="uv-cast-skeleton-card" aria-hidden="true">
          <div class="uv-cast-skeleton-avatar uv-shimmer"></div>
          <div class="uv-cast-skeleton-name uv-shimmer"></div>
          <div class="uv-cast-skeleton-role uv-shimmer"></div>
        </div>
      `;
    }
    target.innerHTML = html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛡️ REUSABLE RESILIENT ERROR & EMPTY STATES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 1. No Results / Empty State
   */
  function renderEmptyState(container, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const icon = options.icon || '🔍';
    const title = options.title || 'No Results Found';
    const message = options.message || 'We couldn\'t find any titles matching your current filter. Try adjusting your query or filters.';
    const actionText = options.actionText || 'Browse Movies';
    const actionHref = options.actionHref || 'movies.html';

    target.innerHTML = `
      <div class="uv-state-card">
        <div class="uv-state-icon">${icon}</div>
        <h3 class="uv-state-title">${escapeHTML(title)}</h3>
        <p class="uv-state-desc">${escapeHTML(message)}</p>
        <div class="uv-state-actions">
          <a href="${actionHref}" class="uv-state-btn uv-state-btn-primary">${escapeHTML(actionText)}</a>
        </div>
      </div>
    `;
  }

  /**
   * 2. API Error State
   */
  function renderApiError(container, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const icon = options.icon || '⚠️';
    const title = options.title || 'Unable to Load Catalog';
    const message = options.message || 'We encountered an error connecting to the media catalog. Please try again.';
    const retryText = options.retryText || 'Try Again ↻';

    target.innerHTML = `
      <div class="uv-state-card uv-state-api-error">
        <div class="uv-state-icon">${icon}</div>
        <h3 class="uv-state-title">${escapeHTML(title)}</h3>
        <p class="uv-state-desc">${escapeHTML(message)}</p>
        <div class="uv-state-actions">
          <button class="uv-state-btn uv-state-btn-primary" id="uvRetryBtn">${escapeHTML(retryText)}</button>
          <a href="index.html" class="uv-state-btn uv-state-btn-glass">Go to Homepage</a>
        </div>
      </div>
    `;

    if (typeof options.onRetry === 'function') {
      const btn = target.querySelector('#uvRetryBtn');
      if (btn) btn.addEventListener('click', () => options.onRetry());
    }
  }

  /**
   * 3. Network Disconnected / Timeout Error State
   */
  function renderNetworkError(container, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const icon = options.icon || '📡';
    const title = options.title || 'Network Connection Error';
    const message = options.message || 'Unable to reach the streaming servers. Please check your internet connection and retry.';
    const retryText = options.retryText || 'Reconnect ↻';

    target.innerHTML = `
      <div class="uv-state-card uv-state-network-error">
        <div class="uv-state-icon">${icon}</div>
        <h3 class="uv-state-title">${escapeHTML(title)}</h3>
        <p class="uv-state-desc">${escapeHTML(message)}</p>
        <div class="uv-state-actions">
          <button class="uv-state-btn uv-state-btn-primary" id="uvNetRetryBtn">${escapeHTML(retryText)}</button>
          <a href="index.html" class="uv-state-btn uv-state-btn-glass">Return Home</a>
        </div>
      </div>
    `;

    if (typeof options.onRetry === 'function') {
      const btn = target.querySelector('#uvNetRetryBtn');
      if (btn) btn.addEventListener('click', () => options.onRetry());
    }
  }

  /**
   * 4. Content Not Found (404)
   */
  function renderNotFoundError(container, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const icon = options.icon || '🎬';
    const title = options.title || 'Title Not Found (404)';
    const message = options.message || 'The movie, series, or video you are looking for is no longer available in the catalog.';

    target.innerHTML = `
      <div class="uv-state-card">
        <div class="uv-state-icon">${icon}</div>
        <h3 class="uv-state-title">${escapeHTML(title)}</h3>
        <p class="uv-state-desc">${escapeHTML(message)}</p>
        <div class="uv-state-actions">
          <a href="movies.html" class="uv-state-btn uv-state-btn-primary">Explore Movies</a>
          <a href="tv-shows.html" class="uv-state-btn uv-state-btn-glass">Explore TV Shows</a>
        </div>
      </div>
    `;
  }

  /**
   * 5. Universal Async State Lifecycle Manager
   * Handles: Loading → Success → Error → Empty with ZERO blank screen flashes
   */
  async function withAsyncState(container, fetchFn, renderSuccessFn, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    // 1. Loading State
    if (options.skeletonType === 'hero') {
      renderHeroSkeleton(target);
    } else if (options.skeletonType === 'details') {
      renderDetailsSkeleton(target);
    } else if (options.skeletonType === 'cast') {
      renderCastSkeletons(target, options.skeletonCount || 8);
    } else {
      renderCardSkeletons(target, options.skeletonCount || 12);
    }

    try {
      // 2. Execute Async Data Fetch
      const data = await fetchFn();
      const results = Array.isArray(data) ? data : (data && data.results ? data.results : []);

      // 3. Empty State
      if (!results || results.length === 0) {
        renderEmptyState(target, {
          title: options.emptyTitle,
          message: options.emptyMessage,
          actionText: options.emptyActionText,
          actionHref: options.emptyActionHref
        });
        return;
      }

      // 4. Success State
      renderSuccessFn(results, target);

    } catch (err) {
      console.error('[withAsyncState Error]', err);
      if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('network'))) {
        renderNetworkError(target, {
          onRetry: () => withAsyncState(container, fetchFn, renderSuccessFn, options)
        });
      } else if (err.status === 404) {
        renderNotFoundError(target);
      } else {
        renderApiError(target, {
          message: err.message,
          onRetry: () => withAsyncState(container, fetchFn, renderSuccessFn, options)
        });
      }
    }
  }

  // ── Global Export ──────────────────────────────────────────────────────────
  const UniVaultCards = {
    createCard: createMediaCard,
    renderGrid: renderCardGrid,
    detectType: detectMediaType,
    isInWatchlist,
    toggleWatchlist,

    // Skeletons
    renderSkeletons: renderCardSkeletons,
    renderHeroSkeleton,
    renderDetailsSkeleton,
    renderCastSkeletons,

    // States
    renderEmptyState,
    renderApiError,
    renderNetworkError,
    renderNotFoundError,
    withAsyncState
  };

  global.UniVaultCards = UniVaultCards;
  global.createMediaCard = createMediaCard;
  global.renderCardGrid = renderCardGrid;

})(typeof window !== 'undefined' ? window : this);

