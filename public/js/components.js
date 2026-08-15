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

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRALIZED PROFESSIONAL SVG ICON SYSTEM (Standard 24x24 viewBox)
  // ═══════════════════════════════════════════════════════════════════════════
  const icons = {
    search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
    plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    star: `<svg width="15" height="15" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" stroke-width="1" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    film: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
    tv: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
    sparkles: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path></svg>`,
    trailer: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect width="14" height="14" x="1" y="5" rx="2" ry="2"></rect></svg>`,
    trending: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
    heart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    vip: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>`,
    logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    chevronDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    chevronLeft: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    chevronRight: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    arrowRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    twitter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>`,
    youtube: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>`,
    instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
    discord: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path></svg>`
  };

  const Components = {
    icons,

    // ═════════════════════════════════════════════════════════════════════════
    // 1. GLOBAL NAVBAR COMPONENT (Netflix Style)
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
            <ul class="nav-links-desktop desktop-nav" role="list">
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
                ${icons.search}
              </button>
              <input 
                type="text" 
                class="nav-search-input" 
                id="navSearchInput" 
                placeholder="Search movies, TV shows, anime..." 
                autocomplete="off"
              >
              <button type="button" class="nav-search-clear-btn" id="navSearchClearBtn" aria-label="Clear">${icons.close}</button>
            </div>

            <!-- Profile Menu Dropdown -->
            <div class="nav-profile-menu" id="navProfileMenu">
              <div class="nav-profile-trigger" id="navProfileTrigger" role="button" tabindex="0" aria-label="User Profile">
                <div class="nav-profile-avatar" id="navAvatarBadge">${avatarDisplay}</div>
                <span class="nav-profile-chevron" aria-hidden="true">${icons.chevronDown}</span>
              </div>
              <div class="nav-profile-dropdown" id="navProfileDropdown">
                <div class="dropdown-user-header">
                  <div class="dropdown-user-name">${escapeHTML(user.name || 'UniVault Member')}</div>
                  <div class="dropdown-user-email">${escapeHTML(user.email || '')}</div>
                </div>
                <a href="profile.html" class="dropdown-link">
                  <span class="dropdown-link-icon">${icons.user}</span> My Profile
                </a>
                <a href="watchlist.html" class="dropdown-link">
                  <span class="dropdown-link-icon">${icons.heart}</span> My List
                </a>
                <a href="profile.html#recent" class="dropdown-link">
                  <span class="dropdown-link-icon">${icons.clock}</span> Watch History
                </a>
                <a href="subscription.html" class="dropdown-link">
                  <span class="dropdown-link-icon">${icons.vip}</span> Subscription Plans
                </a>
                <div class="dropdown-divider"></div>
                <button type="button" class="dropdown-logout-btn" id="navLogoutBtn">
                  <span class="dropdown-link-icon">${icons.logout}</span> Sign Out
                </button>
              </div>
            </div>

            <!-- 3-Bar Netflix-Style Hamburger Menu Button (Animated SVG/CSS bars) -->
            <button type="button" class="nav-hamburger-btn hamburger-btn" id="navHamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
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
              <button type="button" class="drawer-close-btn" id="drawerCloseBtn" aria-label="Close menu">${icons.close}</button>
            </div>

            <!-- Navigation Section in Drawer -->
            <div class="drawer-section-label">Navigation</div>
            <ul class="drawer-links">
              <li>
                <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.home}</span>
                    <span class="drawer-link-text">Home</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="movies.html" class="${activePage === 'movies' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.film}</span>
                    <span class="drawer-link-text">Movies</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="tv-shows.html" class="${activePage === 'tv' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.tv}</span>
                    <span class="drawer-link-text">TV Shows</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="anime.html" class="${activePage === 'anime' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.sparkles}</span>
                    <span class="drawer-link-text">Anime</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="trailers.html" class="${activePage === 'trailers' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.trailer}</span>
                    <span class="drawer-link-text">Trailers</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="trending.html" class="${activePage === 'trending' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.trending}</span>
                    <span class="drawer-link-text">Trending</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="watchlist.html" class="${activePage === 'watchlist' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.heart}</span>
                    <span class="drawer-link-text">My List</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="search.html" class="${activePage === 'search' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.search}</span>
                    <span class="drawer-link-text">Search</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="profile.html" class="${activePage === 'profile' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.user}</span>
                    <span class="drawer-link-text">Profile</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
            </ul>

            <!-- Vault Section -->
            <div class="drawer-section-label" style="margin-top: 1rem;">Personal Vault</div>
            <ul class="drawer-links">
              <li>
                <a href="profile.html#recent">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.clock}</span>
                    <span class="drawer-link-text">Watch History</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
              <li>
                <a href="subscription.html" class="${activePage === 'subscription' ? 'active' : ''}">
                  <span class="drawer-link-left">
                    <span class="drawer-link-icon">${icons.vip}</span>
                    <span class="drawer-link-text">VIP Subscription</span>
                  </span>
                  <span class="drawer-link-arrow">${icons.arrowRight}</span>
                </a>
              </li>
            </ul>

            <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);">
              <button type="button" class="btn-netflix btn-netflix-red" style="width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 0.6rem;" id="drawerLogoutBtn">
                <span>${icons.logout}</span> Sign Out
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
        }
        document.body.style.overflow = 'hidden';
      };

      const closeMobileDrawer = () => {
        if (!drawerOverlay) return;
        drawerOverlay.classList.remove('active');
        drawerOverlay.setAttribute('aria-hidden', 'true');
        if (hamburgerBtn) {
          hamburgerBtn.setAttribute('aria-expanded', 'false');
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
              <li><a href="trailers.html">Trending &amp; Trailers</a></li>
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
            <h4 class="footer-col-title">Help &amp; Support</h4>
            <ul class="footer-links">
              <li><a href="#">FAQ &amp; Help Center</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookie Preferences</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} UniVault Streaming Inc. All rights reserved.</p>
          <div class="footer-social-icons">
            <a href="#" class="footer-social-link" aria-label="Twitter">${icons.twitter}</a>
            <a href="#" class="footer-social-link" aria-label="YouTube">${icons.youtube}</a>
            <a href="#" class="footer-social-link" aria-label="Instagram">${icons.instagram}</a>
            <a href="#" class="footer-social-link" aria-label="Discord">${icons.discord}</a>
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 2.5 DYNAMIC & AUTO-SWIPING HERO BANNER CAROUSEL
    // ═════════════════════════════════════════════════════════════════════════
    createHeroCarousel: function (containerIdOrEl, items = [], options = {}) {
      const container = typeof containerIdOrEl === 'string' 
        ? document.getElementById(containerIdOrEl) 
        : containerIdOrEl;
      if (!container) return null;

      // 1. Deduplicate items by ID & filter valid media
      const rawList = Array.isArray(items) ? items : [items];
      const seen = new Set();
      const validItems = [];
      for (const it of rawList) {
        if (it && it.id && !seen.has(it.id)) {
          seen.add(it.id);
          if ((it.title || it.name) && (it.backdrop_path || it.poster_path)) {
            validItems.push(it);
          }
        }
      }

      // Fallback if no valid items
      if (validItems.length === 0) {
        validItems.push({
          id: 550,
          title: 'UniVault 4K Cinema',
          overview: 'Stream unlimited movies, television series, and anime in 4K Ultra HD on UniVault.',
          backdrop_path: null,
          vote_average: 8.8,
          release_date: '2026-01-01',
          genre_ids: [28, 878]
        });
      }

      const isAnime = (container.id === 'animeHero') || options.isAnime;
      const duration = options.duration || 6000;
      const count = validItems.length;

      // 2. Controlled initial shuffle / rotation so refresh starts fresh
      let currentIndex = options.startIndex !== undefined 
        ? options.startIndex 
        : (count > 1 ? Math.floor(Math.random() * count) : 0);

      let timer = null;
      let isPaused = false;
      let activeBackdropLayer = 0; // 0 or 1 for dual layer crossfade

      // Preloaded image URLs cache
      const preloadedBackdrops = new Set();
      function preloadBackdrop(it) {
        if (!it) return;
        const url = it.backdrop_path 
          ? TMDB_API.getBackdropUrl(it.backdrop_path, 'original')
          : (it.poster_path ? TMDB_API.getImageUrl(it.poster_path, 'w500') : null);
        if (url && !preloadedBackdrops.has(url)) {
          const img = new Image();
          img.src = url;
          preloadedBackdrops.add(url);
        }
      }

      // Initial preloading for current and next item
      preloadBackdrop(validItems[currentIndex]);
      if (count > 1) {
        preloadBackdrop(validItems[(currentIndex + 1) % count]);
      }

      // 3. Render Shell Container
      container.className = 'netflix-hero';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-roledescription', 'carousel');
      container.setAttribute('aria-label', isAnime ? 'Featured Anime Carousel' : 'Featured Titles Carousel');
      container.setAttribute('tabindex', '0');

      // Clear any prior timer stored on this element
      if (container._heroCarouselInstance) {
        container._heroCarouselInstance.destroy();
      }

      container.innerHTML = `
        <div class="hero-backdrop-container" aria-hidden="true">
          <div class="hero-backdrop-slide active" id="${container.id}_layer0"></div>
          <div class="hero-backdrop-slide" id="${container.id}_layer1"></div>
          <div class="hero-gradient-overlay"></div>
        </div>

        <div class="hero-content" id="${container.id}_content" aria-live="polite"></div>

        ${count > 1 ? `
          <!-- Prev / Next Desktop Controls -->
          <button type="button" class="hero-nav-btn hero-nav-prev" id="${container.id}_prevBtn" aria-label="Previous Featured Title">
            ${icons.chevronLeft}
          </button>
          <button type="button" class="hero-nav-btn hero-nav-next" id="${container.id}_nextBtn" aria-label="Next Featured Title">
            ${icons.chevronRight}
          </button>

          <!-- Bottom Progress Bar Indicators -->
          <div class="hero-indicators-container" id="${container.id}_indicators" role="tablist" aria-label="Featured slides">
            ${validItems.map((_, i) => `
              <button 
                type="button" 
                class="hero-indicator-btn ${i === currentIndex ? 'active' : ''}" 
                data-index="${i}" 
                role="tab" 
                aria-selected="${i === currentIndex ? 'true' : 'false'}" 
                aria-label="Slide ${i + 1} of ${count}"
              >
                <div class="hero-indicator-progress"></div>
              </button>
            `).join('')}
          </div>
        ` : ''}
      `;

      const layer0 = document.getElementById(`${container.id}_layer0`);
      const layer1 = document.getElementById(`${container.id}_layer1`);
      const contentEl = document.getElementById(`${container.id}_content`);
      const prevBtn = document.getElementById(`${container.id}_prevBtn`);
      const nextBtn = document.getElementById(`${container.id}_nextBtn`);
      const indicatorsContainer = document.getElementById(`${container.id}_indicators`);

      // 4. Update Slide View
      function showSlide(index, animate = true) {
        currentIndex = (index + count) % count;
        const item = validItems[currentIndex];
        if (!item) return;

        const id = item.id;
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        const title = item.title || item.name || 'Featured Title';
        const overview = item.overview || 'Stream this title in 4K Ultra HD on UniVault.';
        const rating = TMDB_API.formatRating(item.vote_average);
        const year = TMDB_API.formatYear(item.release_date || item.first_air_date);
        const genres = TMDB_API.getGenreNames(item.genre_ids, mediaType).slice(0, 3).join(' • ') || (isAnime ? 'Anime • Action' : 'Action • 4K');
        const isSaved = Components.isInWatchlist(id, mediaType);

        const backdropUrl = item.backdrop_path 
          ? TMDB_API.getBackdropUrl(item.backdrop_path, 'original')
          : (item.poster_path ? TMDB_API.getImageUrl(item.poster_path, 'w500') : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80');

        // Preload upcoming slide
        preloadBackdrop(validItems[(currentIndex + 1) % count]);

        // Dual Layer Crossfade
        const currentLayer = activeBackdropLayer === 0 ? layer0 : layer1;
        const nextLayer = activeBackdropLayer === 0 ? layer1 : layer0;

        if (nextLayer) {
          nextLayer.style.backgroundImage = `url('${backdropUrl}')`;
          nextLayer.classList.remove('prev-active');
          nextLayer.classList.add('active');
        }
        if (currentLayer) {
          currentLayer.classList.remove('active');
          currentLayer.classList.add('prev-active');
        }
        activeBackdropLayer = activeBackdropLayer === 0 ? 1 : 0;

        // Content Update with Smooth Fade
        function updateContentDOM() {
          if (!contentEl) return;
          contentEl.innerHTML = `
            <div class="hero-pill-tag">${isAnime ? 'Featured Anime' : 'Featured on UniVault'}</div>
            <h1 class="hero-title">${escapeHTML(title)}</h1>
            <div class="hero-meta-row">
              <span class="hero-rating-badge">${icons.star} ${rating}</span>
              <span class="hero-quality-badge">4K ULTRA HD</span>
              <span class="hero-quality-badge">HDR10+</span>
              <span>${year}</span>
              <span>•</span>
              <span>${genres}</span>
            </div>
            <p class="hero-overview">${escapeHTML(overview)}</p>
            <div class="hero-actions">
              <button 
                type="button" 
                class="btn-netflix btn-netflix-primary" 
                id="heroWatchBtn_${container.id}"
              >
                ${icons.play} <span>Watch Trailer</span>
              </button>
              <button 
                type="button" 
                class="btn-netflix btn-netflix-secondary" 
                id="heroListBtn_${container.id}"
              >
                ${isSaved ? icons.check : icons.plus} <span>${isSaved ? 'In My List' : 'My List'}</span>
              </button>
              <a href="details.html?type=${mediaType}&id=${id}" class="btn-netflix btn-netflix-secondary">
                ${icons.info} <span>More Info</span>
              </a>
            </div>
          `;

          // Watch Trailer Click
          const watchBtn = document.getElementById(`heroWatchBtn_${container.id}`);
          if (watchBtn) {
            watchBtn.addEventListener('click', () => {
              Components.openTrailerModal(mediaType, id, title);
            });
          }

          // Watchlist Toggle Click
          const listBtn = document.getElementById(`heroListBtn_${container.id}`);
          if (listBtn) {
            listBtn.addEventListener('click', () => {
              Components.toggleWatchlistButton(listBtn, item);
              const nowSaved = Components.isInWatchlist(id, mediaType);
              listBtn.innerHTML = `${nowSaved ? icons.check : icons.plus} <span>${nowSaved ? 'In My List' : 'My List'}</span>`;
            });
          }
        }

        if (animate && contentEl) {
          contentEl.classList.remove('fade-in');
          contentEl.classList.add('fade-out');
          setTimeout(() => {
            updateContentDOM();
            contentEl.classList.remove('fade-out');
            contentEl.classList.add('fade-in');
          }, 200);
        } else {
          updateContentDOM();
        }

        // Indicators update
        if (indicatorsContainer) {
          const btns = indicatorsContainer.querySelectorAll('.hero-indicator-btn');
          btns.forEach((b, i) => {
            const isActive = i === currentIndex;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', isActive ? 'true' : 'false');
            const progress = b.querySelector('.hero-indicator-progress');
            if (progress) {
              progress.style.transition = 'none';
              progress.style.width = '0%';
              if (isActive && !isPaused) {
                void progress.offsetWidth; // force reflow
                progress.style.transition = `width ${duration}ms linear`;
                progress.style.width = '100%';
              }
            }
          });
        }
      }

      // 5. Autoplay Timer Engine
      function resetTimer() {
        if (timer) clearTimeout(timer);
        if (count <= 1 || isPaused) return;

        timer = setTimeout(() => {
          showSlide(currentIndex + 1, true);
          resetTimer();
        }, duration);
      }

      function pause() {
        isPaused = true;
        if (timer) clearTimeout(timer);
        if (indicatorsContainer) {
          const activeBtn = indicatorsContainer.querySelector('.hero-indicator-btn.active');
          if (activeBtn) activeBtn.classList.add('paused');
        }
      }

      function resume() {
        if (!isPaused) return;
        isPaused = false;
        if (indicatorsContainer) {
          const activeBtn = indicatorsContainer.querySelector('.hero-indicator-btn.active');
          if (activeBtn) activeBtn.classList.remove('paused');
        }
        resetTimer();
      }

      function next() {
        showSlide(currentIndex + 1, true);
        resetTimer();
      }

      function prev() {
        showSlide(currentIndex - 1, true);
        resetTimer();
      }

      function goTo(idx) {
        showSlide(idx, true);
        resetTimer();
      }

      // 6. Attach Controls & Interaction Listeners
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          prev();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          next();
        });
      }

      if (indicatorsContainer) {
        indicatorsContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.hero-indicator-btn');
          if (btn) {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            if (!isNaN(idx) && idx !== currentIndex) {
              goTo(idx);
            }
          }
        });
      }

      // Desktop Hover Pause
      container.addEventListener('mouseenter', pause);
      container.addEventListener('mouseleave', resume);

      // Tab Visibility Pause
      function onVisibilityChange() {
        if (document.hidden) {
          pause();
        } else {
          resume();
        }
      }
      document.addEventListener('visibilitychange', onVisibilityChange);

      // Keyboard Controls (Left, Right, Space)
      function onKeyDown(e) {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
          return;
        }
        if (e.key === 'ArrowLeft') {
          prev();
        } else if (e.key === 'ArrowRight') {
          next();
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          if (isPaused) resume(); else pause();
        }
      }
      container.addEventListener('keydown', onKeyDown);

      // Mobile Touch Swipe Handling
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;

      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
          pause();
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          const touchEndX = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;
          const deltaX = touchEndX - touchStartX;
          const deltaY = touchEndY - touchStartY;
          const deltaTime = Date.now() - touchStartTime;

          // Horizontal swipe threshold: >45px and predominantly horizontal
          if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && deltaTime < 800) {
            if (deltaX < 0) {
              next();
            } else {
              prev();
            }
          }
          resume();
        }
      }, { passive: true });

      // Initial Slide Render (No fade on first paint)
      showSlide(currentIndex, false);
      resetTimer();

      // Instance Controller object
      const instance = {
        next,
        prev,
        goTo,
        pause,
        resume,
        destroy: function () {
          if (timer) clearTimeout(timer);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          container.removeEventListener('mouseenter', pause);
          container.removeEventListener('mouseleave', resume);
          container.removeEventListener('keydown', onKeyDown);
        }
      };

      container._heroCarouselInstance = instance;
      return instance;
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
          <img src="${poster}" alt="${escapeHTML(title)}" class="netflix-card-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750/161622/4B5563?text=No+Poster'">
          <span class="netflix-card-badge">${mediaType === 'tv' ? 'Series' : 'Movie'}</span>
          <span class="netflix-card-quality">4K HDR</span>

          <div class="netflix-card-overlay">
            <h4 class="netflix-card-title" title="${escapeHTML(title)}">${escapeHTML(title)}</h4>
            <div class="netflix-card-meta">
              <span class="netflix-card-rating">${icons.star} ${rating}</span>
              <span>${year}</span>
            </div>
            <div class="netflix-card-actions">
              <button 
                type="button" 
                class="card-action-btn play" 
                onclick="event.stopPropagation(); Components.openTrailerModal('${mediaType}', ${id}, '${escapeQuotes(title)}')"
                aria-label="Play Trailer"
                title="Play Trailer"
              >${icons.play}</button>
              <button 
                type="button" 
                class="card-action-btn watchlist ${isSaved ? 'active' : ''}" 
                onclick="event.stopPropagation(); Components.toggleWatchlistButton(this, ${JSON.stringify(item).replace(/"/g, '&quot;')})"
                aria-label="${isSaved ? 'Remove from My List' : 'Add to My List'}"
                title="${isSaved ? 'Remove from My List' : 'Add to My List'}"
              >${isSaved ? icons.check : icons.plus}</button>
              <button 
                type="button" 
                class="card-action-btn info" 
                onclick="event.stopPropagation(); window.location.href='details.html?type=${mediaType}&id=${id}'"
                aria-label="More Info"
                title="More Details"
              >${icons.info}</button>
            </div>
          </div>
        </div>
      `;
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4. RANKED TOP 10 CARD COMPONENT (01, 02, 03... 10)
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
          <span class="ranked-number" aria-hidden="true">${rankFormatted}</span>
          <div class="ranked-card-poster-box">
            <img src="${poster}" alt="${escapeHTML(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750/161622/4B5563?text=No+Poster'">
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
          <img src="${backdrop}" alt="${escapeHTML(title)}" class="continue-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80'">
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
          ${viewAllHref ? `<a href="${viewAllHref}" class="section-view-all">Explore All <span class="view-all-arrow">${icons.arrowRight}</span></a>` : ''}
        </div>
        <div class="netflix-carousel-wrapper">
          <button type="button" class="carousel-btn left" aria-label="Scroll left">${icons.chevronLeft}</button>
          <div class="netflix-carousel-track" id="${containerId}_track">
            ${cardsHtml}
          </div>
          <button type="button" class="carousel-btn right" aria-label="Scroll right">${icons.chevronRight}</button>
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
            <button type="button" class="netflix-modal-close" id="modalCloseBtn" aria-label="Close">${icons.close}</button>
            <div class="netflix-modal-video-wrapper">
              <iframe id="modalTrailerIframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
            </div>
            <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
              <h3 id="modalTrailerTitle" style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">${escapeHTML(title)} — Official Trailer</h3>
              <a id="modalFullDetailsLink" href="details.html?type=${mediaType}&id=${id}" class="btn-netflix btn-netflix-red" style="padding: 0.5rem 1.1rem; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                View Full Details <span class="view-details-arrow">${icons.arrowRight}</span>
              </a>
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
            Movies
          </a>
          <a href="tv-shows.html" class="category-3bar-tab ${activeTab === 'tv' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            TV Shows
          </a>
          <a href="anime.html" class="category-3bar-tab ${activeTab === 'anime' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            Anime
          </a>
          <a href="trailers.html" class="category-3bar-tab ${activeTab === 'trailers' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            Trailers
          </a>
          <a href="trending.html" class="category-3bar-tab ${activeTab === 'trending' ? 'active' : ''}">
            <span class="section-3bar" style="margin-right: 4px;"><span></span><span></span><span></span></span>
            Trending
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
