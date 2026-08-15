/**
 * ===========================================================================
 * UniVault — Reusable Netflix UI Components Generator (components.js)
 * ===========================================================================
 * Generates and manages the Global Navbar, Movie Cards, Ranked Top 10 Cards,
 * Horizontal Carousels, Skeletons, Video Modal Player, Toasts, and Watchlist.
 */

(function (global) {
  'use strict';

  const WATCHLIST_KEY = 'univault_watchlist';
  const RECENT_KEY = 'univault_recent_history';

  const Components = {
    // ═════════════════════════════════════════════════════════════════════════
    // 1. GLOBAL NAVBAR COMPONENT
    // ═════════════════════════════════════════════════════════════════════════
    renderNavbar: function (activePage = 'home') {
      const navContainer = document.getElementById('globalNavbar') || document.querySelector('.navbar');
      if (!navContainer) return;

      const user = (global.UniVaultAuth && global.UniVaultAuth.getUser()) || { name: 'User', email: '' };
      const customAvatar = localStorage.getItem('univault_custom_avatar');
      const avatarDisplay = customAvatar || ((user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U');

      navContainer.className = 'navbar';
      navContainer.innerHTML = `
        <div class="nav-inner">
          <div class="nav-left">
            <a href="index.html" class="nav-brand" aria-label="UniVault Home">
              <img src="images/logo.png" alt="UniVault" class="nav-logo-img">
              <span class="nav-brand-name">UniVault</span>
            </a>
            <ul class="nav-links-desktop" role="list">
              <li class="nav-link-item"><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
              <li class="nav-link-item"><a href="movies.html" class="${activePage === 'movies' ? 'active' : ''}">Movies</a></li>
              <li class="nav-link-item"><a href="tv-shows.html" class="${activePage === 'tv' ? 'active' : ''}">TV Shows</a></li>
              <li class="nav-link-item"><a href="anime.html" class="${activePage === 'anime' ? 'active' : ''}">Anime</a></li>
              <li class="nav-link-item"><a href="trailers.html" class="${activePage === 'trailers' ? 'active' : ''}">Trailers</a></li>
              <li class="nav-link-item"><a href="trending.html" class="${activePage === 'trending' ? 'active' : ''}">Trending</a></li>
              <li class="nav-link-item"><a href="watchlist.html" class="${activePage === 'watchlist' ? 'active' : ''}">My List</a></li>
            </ul>
          </div>

          <div class="nav-right">
            <!-- Expandable Search Box -->
            <div class="nav-search-box" id="navSearchBox">
              <button type="button" class="nav-search-toggle-btn" id="navSearchToggleBtn" aria-label="Search">
                🔍
              </button>
              <input 
                type="text" 
                class="nav-search-input" 
                id="navSearchInput" 
                placeholder="Titles, people, genres..." 
                autocomplete="off"
              >
              <button type="button" class="nav-search-clear-btn" id="navSearchClearBtn" aria-label="Clear">✕</button>
            </div>

            <!-- Profile Menu Dropdown -->
            <div class="nav-profile-menu" id="navProfileMenu">
              <div class="nav-profile-trigger" id="navProfileTrigger" role="button" tabindex="0" aria-label="User Profile">
                <div class="nav-profile-avatar" id="navAvatarBadge">${avatarDisplay}</div>
                <span class="nav-profile-chevron" aria-hidden="true">▼</span>
              </div>
              <div class="nav-profile-dropdown" id="navProfileDropdown">
                <div class="dropdown-user-header">
                  <div class="dropdown-user-name">${escapeHTML(user.name || 'UniVault Member')}</div>
                  <div class="dropdown-user-email">${escapeHTML(user.email || '')}</div>
                </div>
                <a href="profile.html" class="dropdown-link">👤 My Profile</a>
                <a href="watchlist.html" class="dropdown-link">❤️ My List</a>
                <a href="profile.html#recent" class="dropdown-link">⏱️ Watch History</a>
                <a href="subscription.html" class="dropdown-link">⭐ Subscription Plans</a>
                <div class="dropdown-divider"></div>
                <button type="button" class="dropdown-logout-btn" id="navLogoutBtn">🚪 Sign Out</button>
              </div>
            </div>

            <!-- 3-Bar Mobile Hamburger Menu Button -->
            <button type="button" class="nav-hamburger-btn" id="navHamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false">
              <span class="hamburger-icon">☰</span>
            </button>
          </div>
        </div>

        <!-- Mobile Drawer Overlay -->
        <div class="mobile-drawer-overlay" id="mobileDrawerOverlay" aria-hidden="true">
          <div class="mobile-drawer" id="mobileDrawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <div class="drawer-header">
              <a href="index.html" class="nav-brand">
                <img src="images/logo.png" alt="UniVault" class="nav-logo-img">
                <span class="nav-brand-name">UniVault</span>
              </a>
              <button type="button" class="drawer-close-btn" id="drawerCloseBtn" aria-label="Close menu">✕</button>
            </div>

            <!-- Navigation Section in 3-Bar Drawer -->
            <div class="drawer-section-label">Navigation</div>
            <ul class="drawer-links">
              <li>
                <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">🏠</span>
                    <span class="drawer-link-text">Home</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="movies.html" class="${activePage === 'movies' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">🎬</span>
                    <span class="drawer-link-text">Movies</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="tv-shows.html" class="${activePage === 'tv' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">📺</span>
                    <span class="drawer-link-text">TV Shows</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="anime.html" class="${activePage === 'anime' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">⛩️</span>
                    <span class="drawer-link-text">Anime</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="trailers.html" class="${activePage === 'trailers' || activePage === 'trending' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">🎞️</span>
                    <span class="drawer-link-text">Trailer &amp; Trending</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="trending.html" class="${activePage === 'trending' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">🔥</span>
                    <span class="drawer-link-text">Trending</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="watchlist.html" class="${activePage === 'watchlist' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">❤️</span>
                    <span class="drawer-link-text">My List</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="search.html" class="${activePage === 'search' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">🔍</span>
                    <span class="drawer-link-text">Search</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="profile.html" class="${activePage === 'profile' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">👤</span>
                    <span class="drawer-link-text">Profile</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
            </ul>

            <!-- Vault Section -->
            <div class="drawer-section-label" style="margin-top: 1rem;">Personal Vault</div>
            <ul class="drawer-links">
              <li>
                <a href="profile.html#recent">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">⏱️</span>
                    <span class="drawer-link-text">Watch History</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
              <li>
                <a href="subscription.html" class="${activePage === 'subscription' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">⭐</span>
                    <span class="drawer-link-text">VIP Subscription</span>
                  </span>
                  <span class="drawer-link-arrow">›</span>
                </a>
              </li>
            </ul>

            <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);">
              <button type="button" class="btn-netflix btn-netflix-red" style="width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 0.6rem;" id="drawerLogoutBtn">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      `;

      // Ensure mobile drawer is attached directly to document.body so navbar containing block does not constrain it
      const drawerOverlay = document.getElementById('mobileDrawerOverlay');
      if (drawerOverlay && drawerOverlay.parentElement !== document.body) {
        document.body.appendChild(drawerOverlay);
      }

      // ── Attach Navbar Interactions ──
      this.initNavbarListeners();
    },

    initNavbarListeners: function () {
      const navbar = document.querySelector('.navbar');
      const searchBox = document.getElementById('navSearchBox');
      const searchToggleBtn = document.getElementById('navSearchToggleBtn');
      const searchInput = document.getElementById('navSearchInput');
      const searchClearBtn = document.getElementById('navSearchClearBtn');

      const profileMenu = document.getElementById('navProfileMenu');
      const profileTrigger = document.getElementById('navProfileTrigger');
      const navLogoutBtn = document.getElementById('navLogoutBtn');
      const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');

      const hamburgerBtn = document.getElementById('navHamburgerBtn');
      const drawerOverlay = document.getElementById('mobileDrawerOverlay');
      const drawerCloseBtn = document.getElementById('drawerCloseBtn');

      // Scroll glass transition
      const onScroll = () => {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 20);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Search Box expand/collapse
      if (searchToggleBtn && searchBox && searchInput) {
        searchToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = searchBox.classList.contains('open');
          if (isOpen && !searchInput.value.trim()) {
            searchBox.classList.remove('open');
          } else if (!isOpen) {
            searchBox.classList.add('open');
            setTimeout(() => searchInput.focus(), 150);
          } else if (isOpen && searchInput.value.trim()) {
            window.location.href = `search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
          }
        });

        searchInput.addEventListener('input', () => {
          searchBox.classList.toggle('has-query', searchInput.value.trim().length > 0);
        });

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && searchInput.value.trim()) {
            window.location.href = `search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
          }
          if (e.key === 'Escape') {
            searchBox.classList.remove('open');
          }
        });

        if (searchClearBtn) {
          searchClearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            searchBox.classList.remove('has-query');
            searchInput.focus();
          });
        }
      }

      // Profile Dropdown Toggle
      if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          profileMenu.classList.toggle('open');
        });
      }

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        if (profileMenu && !profileMenu.contains(e.target)) {
          profileMenu.classList.remove('open');
        }
        if (searchBox && !searchBox.contains(e.target) && searchInput && !searchInput.value.trim()) {
          searchBox.classList.remove('open');
        }
      });

      // Logout triggers
      const doLogout = (e) => {
        e.preventDefault();
        if (global.UniVaultAuth) {
          global.UniVaultAuth.logout('landing.html');
        } else {
          localStorage.removeItem('univault_token');
          localStorage.removeItem('univault_user');
          window.location.href = 'landing.html';
        }
      };
      if (navLogoutBtn) navLogoutBtn.addEventListener('click', doLogout);
      if (drawerLogoutBtn) drawerLogoutBtn.addEventListener('click', doLogout);

      // Mobile Drawer open/close controller
      const openMobileDrawer = () => {
        if (!drawerOverlay) return;
        drawerOverlay.classList.add('active');
        drawerOverlay.setAttribute('aria-hidden', 'false');
        if (hamburgerBtn) {
          hamburgerBtn.setAttribute('aria-expanded', 'true');
          const icon = hamburgerBtn.querySelector('.hamburger-icon');
          if (icon) icon.textContent = '✕';
        }
        document.body.style.overflow = 'hidden';
      };

      const closeMobileDrawer = () => {
        if (!drawerOverlay) return;
        drawerOverlay.classList.remove('active');
        drawerOverlay.setAttribute('aria-hidden', 'true');
        if (hamburgerBtn) {
          hamburgerBtn.setAttribute('aria-expanded', 'false');
          const icon = hamburgerBtn.querySelector('.hamburger-icon');
          if (icon) icon.textContent = '☰';
        }
        document.body.style.overflow = '';
      };

      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = drawerOverlay && drawerOverlay.classList.contains('active');
          isOpen ? closeMobileDrawer() : openMobileDrawer();
        });
      }

      if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeMobileDrawer();
        });
      }

      if (drawerOverlay) {
        drawerOverlay.addEventListener('click', (e) => {
          if (e.target === drawerOverlay) closeMobileDrawer();
        });
      }

      // Close drawer on any drawer link click
      document.querySelectorAll('.drawer-links a').forEach(link => {
        link.addEventListener('click', () => {
          closeMobileDrawer();
        });
      });

      // Escape key closes drawer
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawerOverlay && drawerOverlay.classList.contains('active')) {
          closeMobileDrawer();
        }
      });
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 2. GLOBAL STREAMING FOOTER
    // ═════════════════════════════════════════════════════════════════════════
    renderFooter: function (containerId = 'globalFooter') {
      const el = document.getElementById(containerId) || document.querySelector('.netflix-footer');
      if (!el) return;

      el.className = 'netflix-footer';
      el.innerHTML = `
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="footer-brand-logo">
              <img src="images/logo.png" alt="UniVault">
              <span>UniVault</span>
            </a>
            <p>The ultimate 4K Ultra HD streaming platform for movies, television series, and anime. Watch anywhere. Cancel anytime.</p>
          </div>
          <div class="footer-nav-col">
            <h4 class="footer-col-title">Navigation</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="movies.html">Movies</a></li>
              <li><a href="tv-shows.html">TV Shows</a></li>
              <li><a href="anime.html">Anime</a></li>
              <li><a href="trailers.html">Trending & Trailers</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-col-title">Personal Vault</h4>
            <ul class="footer-links">
              <li><a href="watchlist.html">My List</a></li>
              <li><a href="profile.html">Account Settings</a></li>
              <li><a href="profile.html#recent">Watch History</a></li>
              <li><a href="subscription.html">VIP Membership</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-col-title">Help & Support</h4>
            <ul class="footer-links">
              <li><a href="#">FAQ & Help Center</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookie Preferences</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} UniVault Streaming Inc. All rights reserved.</p>
          <div class="footer-social-icons">
            <a href="#" class="footer-social-link" aria-label="Twitter">𝕏</a>
            <a href="#" class="footer-social-link" aria-label="YouTube">▶</a>
            <a href="#" class="footer-social-link" aria-label="Instagram">📸</a>
            <a href="#" class="footer-social-link" aria-label="Discord">💬</a>
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 3. MOVIE & TV CARD COMPONENT
    // ═════════════════════════════════════════════════════════════════════════
    createMovieCard: function (item) {
      if (!item) return '';

      const id = item.id;
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const title = item.title || item.name || 'Untitled';
      const rating = TMDB_API.formatRating(item.vote_average);
      const year = TMDB_API.formatYear(item.release_date || item.first_air_date);
      const poster = TMDB_API.getImageUrl(item.poster_path, 'w500');
      const isSaved = this.isInWatchlist(id, mediaType);

      return `
        <div class="netflix-card" data-id="${id}" data-type="${mediaType}" onclick="window.location.href='details.html?type=${mediaType}&id=${id}'">
          <img src="${poster}" alt="${escapeHTML(title)}" class="netflix-card-poster" loading="lazy">
          <span class="netflix-card-badge">${mediaType === 'tv' ? 'Series' : 'Movie'}</span>
          <span class="netflix-card-quality">4K HDR</span>

          <div class="netflix-card-overlay">
            <h4 class="netflix-card-title" title="${escapeHTML(title)}">${escapeHTML(title)}</h4>
            <div class="netflix-card-meta">
              <span class="netflix-card-rating">★ ${rating}</span>
              <span>${year}</span>
            </div>
            <div class="netflix-card-actions">
              <button 
                type="button" 
                class="card-action-btn play" 
                onclick="event.stopPropagation(); Components.openTrailerModal('${mediaType}', ${id}, '${escapeQuotes(title)}')"
                aria-label="Play Trailer"
                title="Play Trailer"
              >▶</button>
              <button 
                type="button" 
                class="card-action-btn watchlist ${isSaved ? 'active' : ''}" 
                onclick="event.stopPropagation(); Components.toggleWatchlistButton(this, ${JSON.stringify(item).replace(/"/g, '&quot;')})"
                aria-label="Add to Watchlist"
                title="${isSaved ? 'Remove from My List' : 'Add to My List'}"
              >${isSaved ? '✓' : '+'}</button>
              <button 
                type="button" 
                class="card-action-btn info" 
                onclick="event.stopPropagation(); window.location.href='details.html?type=${mediaType}&id=${id}'"
                aria-label="More Info"
                title="More Details"
              >ℹ</button>
            </div>
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4. RANKED TOP 10 CARD COMPONENT (01, 02, 03...)
    // ═════════════════════════════════════════════════════════════════════════
    createRankedCard: function (item, rank) {
      if (!item) return '';

      const id = item.id;
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const title = item.title || item.name || 'Untitled';
      const poster = TMDB_API.getImageUrl(item.poster_path, 'w500');
      const rankFormatted = rank < 10 ? `0${rank}` : String(rank);

      return `
        <div class="ranked-card" data-id="${id}" data-type="${mediaType}" onclick="window.location.href='details.html?type=${mediaType}&id=${id}'">
          <span class="ranked-number">${rankFormatted}</span>
          <div class="ranked-card-poster-box">
            <img src="${poster}" alt="${escapeHTML(title)}" loading="lazy">
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 5. CONTINUE WATCHING CARD COMPONENT (16:9)
    // ═════════════════════════════════════════════════════════════════════════
    createContinueCard: function (item) {
      if (!item) return '';

      const id = item.id || item.tmdb_id;
      const mediaType = item.media_type || 'movie';
      const title = item.title || item.name || 'Untitled';
      const backdrop = item.backdrop || (item.backdrop_path ? TMDB_API.getBackdropUrl(item.backdrop_path, 'w780') : TMDB_API.getImageUrl(item.poster_path, 'w500'));
      const progress = item.progress || Math.floor(35 + Math.random() * 50);

      return `
        <div class="continue-card" onclick="window.location.href='details.html?type=${mediaType}&id=${id}'">
          <img src="${backdrop}" alt="${escapeHTML(title)}" class="continue-card-img" loading="lazy">
          <div class="continue-card-overlay">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; text-shadow: 0 2px 8px #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(title)}</h4>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #D1D5DB; margin-top: 0.2rem;">
              <span>Resume ${mediaType === 'tv' ? 'Episode' : 'Movie'}</span>
              <span style="color: #fff; font-weight: 700;">${progress}%</span>
            </div>
            <div class="continue-progress-track">
              <div class="continue-progress-bar" style="width: ${progress}%;"></div>
            </div>
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 6. HORIZONTAL CAROUSEL BUILDER
    // ═════════════════════════════════════════════════════════════════════════
    createCarousel: function (containerId, title, items = [], isRanked = false, viewAllHref = null) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (!items || items.length === 0) {
        container.style.display = 'none';
        return;
      }
      container.style.display = 'block';

      const cardsHtml = items.map((item, index) => {
        if (isRanked) {
          return this.createRankedCard(item, index + 1);
        }
        return this.createMovieCard(item);
      }).join('');

      container.className = 'section-container';
      container.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-3bar" aria-hidden="true"><span></span><span></span><span></span></span>
            ${escapeHTML(title)}
            ${isRanked ? '<span class="section-title-badge">Top 10</span>' : ''}
          </h2>
          ${viewAllHref ? `<a href="${viewAllHref}" class="section-view-all">Explore All ›</a>` : ''}
        </div>
        <div class="netflix-carousel-wrapper">
          <button type="button" class="carousel-btn left" aria-label="Scroll left">‹</button>
          <div class="netflix-carousel-track" id="${containerId}_track">
            ${cardsHtml}
          </div>
          <button type="button" class="carousel-btn right" aria-label="Scroll right">›</button>
        </div>
      `;

      // Attach scroll arrow listeners
      const track = document.getElementById(`${containerId}_track`);
      const leftBtn = container.querySelector('.carousel-btn.left');
      const rightBtn = container.querySelector('.carousel-btn.right');

      if (track && leftBtn && rightBtn) {
        leftBtn.addEventListener('click', () => {
          track.scrollBy({ left: -track.clientWidth * 0.75, behavior: 'smooth' });
        });
        rightBtn.addEventListener('click', () => {
          track.scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' });
        });
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 7. SKELETON LOADERS
    // ═════════════════════════════════════════════════════════════════════════
    createSkeletonCarousel: function (containerId, count = 7) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const skeletons = Array(count).fill(0).map(() => `
        <div class="netflix-card skeleton-shimmer skeleton-card"></div>
      `).join('');

      container.innerHTML = `
        <div class="section-header">
          <div class="skeleton-shimmer" style="width: 220px; height: 28px; border-radius: 6px;"></div>
        </div>
        <div class="netflix-carousel-wrapper">
          <div class="netflix-carousel-track">
            ${skeletons}
          </div>
        </div>
      `;
    },

    createSkeletonGrid: function (containerId, count = 12) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const skeletons = Array(count).fill(0).map(() => `
        <div class="netflix-card skeleton-shimmer" style="width: 100%;"></div>
      `).join('');

      container.innerHTML = skeletons;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 8. WATCHLIST SYSTEM SYNC (MongoDB Atlas & LocalStorage)
    // ═════════════════════════════════════════════════════════════════════════
    getWatchlist: function () {
      try {
        const raw = localStorage.getItem(WATCHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },

    isInWatchlist: function (id, mediaType) {
      const list = this.getWatchlist();
      return list.some(item => String(item.id || item.tmdb_id) === String(id) && (item.media_type === mediaType || !item.media_type));
    },

    toggleWatchlistButton: async function (btnEl, item) {
      const id = String(item.id || item.tmdb_id);
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const title = item.title || item.name || 'Untitled';
      const list = this.getWatchlist();
      const existingIdx = list.findIndex(i => String(i.id || i.tmdb_id) === id);

      let isAdded = false;

      if (existingIdx >= 0) {
        list.splice(existingIdx, 1);
        isAdded = false;
      } else {
        list.push({
          id: item.id,
          tmdb_id: item.id,
          media_type: mediaType,
          title: title,
          poster: item.poster_path || item.poster,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date,
          added_at: Date.now()
        });
        isAdded = true;
      }

      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));

      if (btnEl) {
        btnEl.classList.toggle('active', isAdded);
        btnEl.textContent = isAdded ? '✓' : '+';
        btnEl.title = isAdded ? 'Remove from My List' : 'Add to My List';
      }

      this.showToast(isAdded ? `Added "${title}" to My List` : `Removed "${title}" from My List`);

      // Sync with MongoDB backend if user is authenticated
      if (global.UniVaultAuth && global.UniVaultAuth.isAuthenticated()) {
        try {
          const token = global.UniVaultAuth.getToken();
          const endpoint = global.getUniVaultApiUrl ? global.getUniVaultApiUrl('/api/watchlist') : '/api/watchlist';
          
          if (isAdded) {
            await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                tmdb_id: item.id,
                media_type: mediaType,
                title: title,
                poster: item.poster_path,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date
              })
            });
          } else {
            await fetch(`${endpoint}/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        } catch (err) {
          console.warn('[Watchlist Sync Error]:', err);
        }
      }

      window.dispatchEvent(new CustomEvent('watchlistUpdated', { detail: { id, isAdded, item } }));
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 9. YOUTUBE TRAILER MODAL PLAYER
    // ═════════════════════════════════════════════════════════════════════════
    openTrailerModal: async function (mediaType, id, title = 'Trailer') {
      let modalBackdrop = document.getElementById('globalTrailerModal');
      if (!modalBackdrop) {
        modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'globalTrailerModal';
        modalBackdrop.className = 'netflix-modal-backdrop';
        modalBackdrop.innerHTML = `
          <div class="netflix-modal-content">
            <button type="button" class="netflix-modal-close" id="modalCloseBtn" aria-label="Close">✕</button>
            <div class="netflix-modal-video-wrapper">
              <iframe id="modalTrailerIframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
            </div>
            <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
              <h3 id="modalTrailerTitle" style="font-size: 1.2rem; font-weight: 800; color: #fff;">${escapeHTML(title)}</h3>
              <a id="modalFullDetailsLink" href="details.html?type=${mediaType}&id=${id}" class="btn-netflix btn-netflix-red" style="padding: 0.5rem 1rem; font-size: 0.85rem;">View Full Details ›</a>
            </div>
          </div>
        `;
        document.body.appendChild(modalBackdrop);

        const closeBtn = document.getElementById('modalCloseBtn');
        const closeModal = () => {
          modalBackdrop.classList.remove('active');
          const iframe = document.getElementById('modalTrailerIframe');
          if (iframe) iframe.src = '';
        };

        closeBtn.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', (e) => {
          if (e.target === modalBackdrop) closeModal();
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
        });
      }

      const iframe = document.getElementById('modalTrailerIframe');
      const modalTitle = document.getElementById('modalTrailerTitle');
      const detailsLink = document.getElementById('modalFullDetailsLink');

      if (modalTitle) modalTitle.textContent = `${title} — Official Trailer`;
      if (detailsLink) detailsLink.href = `details.html?type=${mediaType}&id=${id}`;

      try {
        const videos = await TMDB_API.getVideos(mediaType, id);
        let key = null;

        if (Array.isArray(videos) && videos.length > 0) {
          const ytVideos = videos.filter(v => v.site === 'YouTube' && v.key);
          const trailer = ytVideos.find(v => v.type === 'Trailer' && v.name && v.name.toLowerCase().includes('official')) 
            || ytVideos.find(v => v.type === 'Trailer') 
            || ytVideos[0];
          if (trailer) key = trailer.key;
        }

        if (!key) {
          // Fallback popular cinematic trailer
          key = 'LNlrGhBpYjc';
        }

        if (iframe) {
          iframe.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`;
        }
        modalBackdrop.classList.add('active');
      } catch (err) {
        console.error('Failed to resolve trailer:', err);
        this.showToast('Trailer unavailable at this moment.');
      }
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 10. TOAST NOTIFICATIONS
    // ═════════════════════════════════════════════════════════════════════════
    showToast: function (msg) {
      let toast = document.getElementById('netflixGlobalToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'netflixGlobalToast';
        toast.className = 'netflix-toast';
        document.body.appendChild(toast);
      }

      toast.textContent = msg;
      toast.classList.add('show');

      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 3200);
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 11. 3-BAR CATEGORY NAVIGATION BAR BUILDER
    // ═════════════════════════════════════════════════════════════════════════
    renderCategory3BarNav: function (containerId, activeTab = 'movies') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="category-3bar-nav" role="navigation" aria-label="Category switch">
          <a href="movies.html" class="category-3bar-tab ${activeTab === 'movies' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            🎬 Movies
          </a>
          <a href="tv-shows.html" class="category-3bar-tab ${activeTab === 'tv' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            📺 TV Shows
          </a>
          <a href="anime.html" class="category-3bar-tab ${activeTab === 'anime' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            ⛩️ Anime
          </a>
          <a href="trailers.html" class="category-3bar-tab ${activeTab === 'trailers' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            🎞️ Trailers
          </a>
          <a href="trending.html" class="category-3bar-tab ${activeTab === 'trending' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            🔥 Trending
          </a>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 12. RESPONSIVE SMART STREAMING PAGINATION BUILDER
    // ═════════════════════════════════════════════════════════════════════════
    renderPagination: function (containerId, options = {}) {
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return;

      const currentPage = Math.max(1, parseInt(options.currentPage || 1, 10));
      const totalPages = Math.max(1, Math.min(parseInt(options.totalPages || 1, 10), 500));
      const onPageChange = typeof options.onPageChange === 'function' ? options.onPageChange : () => {};

      if (totalPages <= 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }
      container.style.display = 'flex';

      const delta = 2; // around current page
      const range = [];
      const rangeWithDots = [];
      let l;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      let html = '<div class="pagination-container" role="navigation" aria-label="Pagination">';

      // Previous Button
      const prevDisabled = currentPage <= 1 ? 'disabled' : '';
      html += `
        <button type="button" class="pagination-btn pagination-nav-btn prev-btn" data-page="${currentPage - 1}" ${prevDisabled} aria-label="Previous Page">
          <span class="nav-arrow">←</span> <span class="nav-text">Previous</span>
        </button>
      `;

      // Page Numbers
      for (const item of rangeWithDots) {
        if (item === '...') {
          html += `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
        } else {
          const isActive = item === currentPage;
          const activeClass = isActive ? 'active' : '';
          const ariaCurrent = isActive ? 'aria-current="page"' : '';
          const isOuter = (item !== 1 && item !== totalPages && Math.abs(item - currentPage) > 1);
          const outerClass = isOuter ? 'pagination-desktop-only' : '';
          html += `
            <button type="button" class="pagination-btn ${activeClass} ${outerClass}" data-page="${item}" ${ariaCurrent} aria-label="Page ${item}">
              ${item}
            </button>
          `;
        }
      }

      // Next Button
      const nextDisabled = currentPage >= totalPages ? 'disabled' : '';
      html += `
        <button type="button" class="pagination-btn pagination-nav-btn next-btn" data-page="${currentPage + 1}" ${nextDisabled} aria-label="Next Page">
          <span class="nav-text">Next</span> <span class="nav-arrow">→</span>
        </button>
      `;

      html += '</div>';
      container.innerHTML = html;

      // Attach click events
      const buttons = container.querySelectorAll('.pagination-btn[data-page]');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (btn.disabled || btn.classList.contains('active')) return;
          const targetPage = parseInt(btn.getAttribute('data-page'), 10);
          if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
            onPageChange(targetPage);
          }
        });
      });
    }
  };

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeQuotes(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  global.Components = Components;

})(typeof window !== 'undefined' ? window : this);
