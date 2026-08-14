/**
 * UniVault Client-Side Authentication Service
 * Powered by SQLite + JWT + bcrypt REST API
 */
(function (global) {
  'use strict';

  const TOKEN_KEY = 'univault_token';
  const USER_KEY  = 'univault_user';
  const AVATAR_KEY = 'univault_custom_avatar';
  const RECENT_KEY = 'univault_recent_history';
  const FAV_KEY    = 'univault_favorites';
  const WATCHLIST_KEY = 'univault_watchlist';

  /**
   * Dynamic API Base URL Resolver
   * Production-safe: Uses relative paths on any deployed HTTP/HTTPS domain.
   * Only falls back to localhost:5000 when developing locally via file:// or static Live Server.
   */
  function getApiUrl(endpoint) {
    const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      
      // If opened directly from file system
      if (protocol === 'file:') {
        return `http://localhost:5000${clean}`;
      }
      // If developing locally on a non-5000 dev server (e.g. VS Code Live Server 5500, Vite 5173)
      if (isLocalHost && port && port !== '5000') {
        return `http://localhost:5000${clean}`;
      }
    }
    // Production deployments (and same-origin local servers) always use clean relative paths
    return clean;
  }
  global.getUniVaultApiUrl = getApiUrl;

  const Auth = {
    /**
     * Retrieve the stored JWT token
     */
    getToken: function () {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    },

    /**
     * Retrieve stored user object
     */
    getUser: function () {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated: function () {
      return Boolean(this.getToken());
    },

    /**
     * Save authentication session
     */
    setSession: function (token, user) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        window.dispatchEvent(new CustomEvent('univault_auth_changed', { detail: { user } }));
      } catch (err) {
        console.error('Failed to persist auth session:', err);
      }
    },

    /**
     * Clear auth session (Logout)
     */
    clearSession: function () {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        syncNavbarAuthState();
        window.dispatchEvent(new CustomEvent('univault_auth_changed', { detail: { user: null } }));
      } catch (err) {
        console.error('Failed to clear auth session:', err);
      }
    },

    /**
     * Register a new user
     * POST /api/auth/signup
     */
    signup: async function (name, email, password) {
      const url = getApiUrl('/api/auth/signup');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Registration failed. Please try again.');
      }

      if (data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    },

    /**
     * Authenticate user
     * POST /api/auth/login
     */
    login: async function (email, password) {
      const url = getApiUrl('/api/auth/login');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Login failed. Invalid email or password.');
      }

      if (data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    },

    /**
     * Fetch protected profile of logged in user from MongoDB
     * GET /api/user/me
     */
    getProfile: async function () {
      const token = this.getToken();
      if (!token) {
        this.clearSession();
        throw new Error('No authentication token found.');
      }

      try {
        let res = await fetch(getApiUrl('/api/user/me'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Fallback to /api/auth/me if /api/user/me not found
        if (res.status === 404) {
          res = await fetch(getApiUrl('/api/auth/me'), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }

        const data = await res.json();
        if (!res.ok || !data.success || !data.user) {
          if (res.status === 401 || res.status === 403) {
            this.clearSession();
          }
          throw new Error(data.message || data.error || 'Failed to authenticate profile.');
        }

        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      } catch (err) {
        if (err.message.includes('401') || err.message.includes('token') || err.message.includes('expired')) {
          this.clearSession();
        }
        throw err;
      }
    },

    /**
     * Logout and redirect
     */
    logout: function (redirectUrl = 'index.html') {
      this.clearSession();
      window.location.href = redirectUrl;
    }
  };

  // ── Sync Navbar Across All Pages ───────────────────────────────────────────
  function syncNavbarAuthState() {
    const user = Auth.getUser();
    const isAuthed = Auth.isAuthenticated();
    const customAvatar = localStorage.getItem(AVATAR_KEY);

    const signinBtns = document.querySelectorAll('.nav-signin-btn');
    const profileBtns = document.querySelectorAll('.nav-profile-btn');

    if (isAuthed && user) {
      signinBtns.forEach(btn => {
        btn.textContent = 'Sign Out';
        btn.href = '#';
        btn.onclick = (e) => {
          e.preventDefault();
          Auth.logout('index.html');
        };
      });

      profileBtns.forEach(btn => {
        btn.style.display = 'inline-flex';
        btn.textContent = customAvatar || ((user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U');
        btn.title = `${user.name} (${user.email})`;
        btn.href = 'profile.html';
      });
    } else {
      signinBtns.forEach(btn => {
        btn.textContent = 'Sign In';
        btn.href = 'login.html';
        btn.onclick = null;
      });

      profileBtns.forEach(btn => {
        btn.style.display = 'none';
      });
    }

    // Mobile Drawer
    const drawerAuth = document.querySelector('.nav-drawer-auth');
    if (drawerAuth) {
      if (isAuthed && user) {
        const displayAvatar = customAvatar || ((user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U');
        drawerAuth.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FF3D6B, #FF8C42); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff;">
              ${displayAvatar}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 700; font-size: 0.9rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(user.name)}</div>
              <div style="font-size: 0.75rem; color: #9CA3AF; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(user.email)}</div>
            </div>
          </div>
          <a href="profile.html" class="signin-link" style="text-align: center; margin-bottom: 0.5rem;">My Profile</a>
          <a href="#" class="signup-link" id="drawerLogoutBtn" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #FCA5A5; text-align: center;">Sign Out</a>
        `;
        const drawerLogout = document.getElementById('drawerLogoutBtn');
        if (drawerLogout) {
          drawerLogout.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout('index.html');
          });
        }
      } else {
        drawerAuth.innerHTML = `
          <a href="login.html" class="signin-link">Sign In</a>
          <a href="signup.html" class="signup-link">Get Started</a>
        `;
      }
    }
  }

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.addEventListener('univault_auth_changed', syncNavbarAuthState);

  // ── Initialize on DOM Load ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    syncNavbarAuthState();

    // ── Login Form ───────────────────────────────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPass');
      const errorBox = document.getElementById('loginErrorBox');
      const submitBtn = document.getElementById('loginSubmitBtn');
      const togglePassBtn = document.getElementById('toggleLoginPass');

      if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          togglePassBtn.textContent = isPass ? '👁️' : '🔒';
        });
      }

      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorBox) errorBox.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!email || !password) {
          showError(errorBox, 'Please provide both your email address and password.');
          return;
        }

        setLoading(submitBtn, true, 'Signing In…');

        try {
          await Auth.login(email, password);
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl') || 'profile.html';
          window.location.href = returnUrl;
        } catch (err) {
          showError(errorBox, err.message);
          setLoading(submitBtn, false, 'Sign In');
        }
      });
    }

    // ── Signup Form ──────────────────────────────────────────────────────────
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      const nameInput = document.getElementById('signupName');
      const emailInput = document.getElementById('signupEmail');
      const passInput = document.getElementById('signupPass');
      const confirmPassInput = document.getElementById('signupConfirmPass');
      const errorBox = document.getElementById('signupErrorBox');
      const submitBtn = document.getElementById('signupSubmitBtn');
      const togglePassBtn = document.getElementById('toggleSignupPass');

      if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          if (confirmPassInput) confirmPassInput.type = passInput.type;
          togglePassBtn.textContent = isPass ? '👁️' : '🔒';
        });
      }

      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorBox) errorBox.style.display = 'none';

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passInput.value;
        const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

        if (!name || name.length < 2) {
          showError(errorBox, 'Name must be at least 2 characters long.');
          return;
        }

        if (!email) {
          showError(errorBox, 'Please enter a valid email address.');
          return;
        }

        if (!password || password.length < 6) {
          showError(errorBox, 'Password must be at least 6 characters long.');
          return;
        }

        if (confirmPassInput && password !== confirmPassword) {
          showError(errorBox, 'Passwords do not match. Please re-enter.');
          return;
        }

        setLoading(submitBtn, true, 'Creating Account…');

        try {
          await Auth.signup(name, email, password);
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl') || 'index.html';
          window.location.href = returnUrl;
        } catch (err) {
          showError(errorBox, err.message);
          setLoading(submitBtn, false, 'Create Account');
        }
      });
    }

    // ── Profile Page Handler ─────────────────────────────────────────────────
    const profileContainer = document.getElementById('profileViewContainer');
    if (profileContainer) {
      initProfilePageController();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 👤 PROFILE PAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initProfilePageController() {
    // 1. Strict Auth Gate: Redirect to login.html if not authenticated
    if (!Auth.isAuthenticated()) {
      window.location.replace('login.html?returnUrl=profile.html');
      return;
    }

    const loadingState = document.getElementById('profileLoading');
    const contentState = document.getElementById('profileContent');

    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('profileAvatar');
    const memberSinceEl = document.getElementById('profileMemberSince');
    const logoutBtn = document.getElementById('profileLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    // Section Grids & Elements
    const watchlistGrid = document.getElementById('profileWatchlistGrid');
    const watchlistEmpty = document.getElementById('profileWatchlistEmpty');
    const badgeWatchlistCount = document.getElementById('badgeWatchlistCount');

    const recentGrid = document.getElementById('profileRecentGrid');
    const recentEmpty = document.getElementById('profileRecentEmpty');
    const badgeRecentCount = document.getElementById('badgeRecentCount');
    const clearRecentBtn = document.getElementById('clearRecentBtn');

    const favGrid = document.getElementById('profileFavoritesGrid');
    const favEmpty = document.getElementById('profileFavoritesEmpty');
    const badgeFavCount = document.getElementById('badgeFavCount');

    // Settings
    const settingsForm = document.getElementById('profileSettingsForm');
    const settingsName = document.getElementById('settingsName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsAlert = document.getElementById('settingsAlert');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Avatar Picker
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarPickerPanel = document.getElementById('avatarPickerPanel');
    const avatarOptions = document.querySelectorAll('.avatar-option-btn');

    try {
      // 2. Fetch authenticated profile via JWT
      const user = await Auth.getProfile();

      if (loadingState) loadingState.style.display = 'none';
      if (contentState) contentState.style.display = 'block';

      // 3. Populate Profile Header
      if (nameEl) nameEl.textContent = user.name;
      if (emailEl) emailEl.textContent = user.email;
      if (settingsName) settingsName.value = user.name;
      if (settingsEmail) settingsEmail.value = user.email;

      const customAvatar = localStorage.getItem(AVATAR_KEY);
      if (avatarEl) {
        avatarEl.textContent = customAvatar || ((user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U');
      }

      if (memberSinceEl && user.created_at) {
        try {
          const date = new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          memberSinceEl.textContent = `Member since ${date}`;
        } catch {
          memberSinceEl.textContent = `Member since ${user.created_at}`;
        }
      }

      // 4. Tab Navigation Switcher
      const tabBtns = document.querySelectorAll('.profile-tab-btn');
      const panels = document.querySelectorAll('.profile-section-panel');

      tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = btn.getAttribute('data-target');
          tabBtns.forEach(b => b.classList.toggle('active', b === btn));
          panels.forEach(p => p.classList.toggle('active', p.id === targetId));
        });
      });

      // 5. Section 1: My Watchlist
      async function loadWatchlistSection() {
        let items = [];
        const token = Auth.getToken();
        if (token) {
          try {
            const res = await fetch(getApiUrl('/api/watchlist'), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.items)) {
              items = data.items.map(item => ({
                id: item.tmdb_id || item.id,
                tmdb_id: item.tmdb_id,
                media_type: item.media_type,
                title: item.title,
                poster_path: item.poster,
                poster: item.poster,
                added_at: item.created_at
              }));
            }
          } catch (e) {
            console.warn('Profile watchlist sync failed:', e);
          }
        }
        if (items.length === 0) {
          try {
            const raw = localStorage.getItem(WATCHLIST_KEY);
            if (raw) items = JSON.parse(raw);
          } catch {}
        }

        if (badgeWatchlistCount) badgeWatchlistCount.textContent = items.length;

        if (items.length === 0) {
          if (watchlistGrid) watchlistGrid.innerHTML = '';
          if (watchlistEmpty) watchlistEmpty.style.display = 'block';
        } else {
          if (watchlistEmpty) watchlistEmpty.style.display = 'none';
          if (watchlistGrid && typeof renderGrid === 'function') {
            renderGrid(watchlistGrid, items);
          }
        }
      }
      loadWatchlistSection();

      // 6. Section 2: Recently Viewed (Fetches latest 10 from GET /api/user/recently-viewed)
      async function loadRecentSection() {
        let recentItems = [];
        const token = Auth.getToken();
        if (token) {
          try {
            const res = await fetch(getApiUrl('/api/user/recently-viewed?limit=10'), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.items) && data.items.length > 0) {
              recentItems = data.items.map(item => ({
                id: item.tmdb_id || item.id,
                tmdb_id: item.tmdb_id,
                media_type: item.media_type,
                title: item.title,
                poster_path: item.poster,
                poster: item.poster,
                viewed_at: item.viewed_at
              }));
            }
          } catch (e) {
            console.warn('Recently viewed API fetch error:', e);
          }
        }

        if (recentItems.length === 0) {
          try {
            const raw = localStorage.getItem(RECENT_KEY);
            if (raw) recentItems = JSON.parse(raw).slice(0, 10);
          } catch {}
        } else {
          // Keep localStorage in sync
          try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(recentItems));
          } catch {}
        }

        if (badgeRecentCount) badgeRecentCount.textContent = recentItems.length;

        if (recentItems.length === 0) {
          if (recentGrid) recentGrid.innerHTML = '';
          if (recentEmpty) recentEmpty.style.display = 'block';
        } else {
          if (recentEmpty) recentEmpty.style.display = 'none';
          if (recentGrid && typeof renderGrid === 'function') {
            renderGrid(recentGrid, recentItems.slice(0, 10));
          }
        }
      }
      loadRecentSection();

      if (clearRecentBtn) {
        clearRecentBtn.addEventListener('click', async () => {
          if (confirm('Clear your recently viewed history?')) {
            localStorage.removeItem(RECENT_KEY);
            const token = Auth.getToken();
            if (token) {
              try {
                await fetch('/api/user/recently-viewed', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
              } catch (err) {
                console.warn('Clear recent API error:', err);
              }
            }
            loadRecentSection();
          }
        });
      }

      // 7. Section 3: Favorites
      function loadFavoritesSection() {
        let favItems = [];
        try {
          const raw = localStorage.getItem(FAV_KEY);
          if (raw) favItems = JSON.parse(raw);
        } catch {}

        // Fallback: If no explicit favorites, use top-rated watchlist items
        if (favItems.length === 0) {
          try {
            const rawWl = localStorage.getItem(WATCHLIST_KEY);
            if (rawWl) favItems = JSON.parse(rawWl).slice(0, 4);
          } catch {}
        }

        if (badgeFavCount) badgeFavCount.textContent = favItems.length;

        if (favItems.length === 0) {
          if (favGrid) favGrid.innerHTML = '';
          if (favEmpty) favEmpty.style.display = 'block';
        } else {
          if (favEmpty) favEmpty.style.display = 'none';
          if (favGrid && typeof renderGrid === 'function') {
            renderGrid(favGrid, favItems);
          }
        }
      }
      loadFavoritesSection();

      // 8. Section 5: Account Settings Form
      if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const newName = settingsName.value.trim();
          if (!newName || newName.length < 2) {
            showSettingsAlert('Name must be at least 2 characters long.', false);
            return;
          }

          if (saveSettingsBtn) {
            saveSettingsBtn.disabled = true;
            saveSettingsBtn.textContent = 'Saving…';
          }

          const token = Auth.getToken();
          if (token) {
            try {
              const res = await fetch(getApiUrl('/api/user/profile'), {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
              });
              const data = await res.json();
              if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile.');
              }
              if (data.user) {
                user.name = data.user.name;
              }
            } catch (err) {
              console.warn('Profile backend update error:', err);
            }
          }

          user.name = newName;
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          if (nameEl) nameEl.textContent = newName;
          if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.textContent = 'Save Changes';
          }
          showSettingsAlert('Settings updated successfully! ✓', true);
          syncNavbarAuthState();
        });
      }

      function showSettingsAlert(msg, isSuccess) {
        if (!settingsAlert) return;
        settingsAlert.textContent = msg;
        settingsAlert.style.display = 'block';
        settingsAlert.style.background = isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
        settingsAlert.style.border = isSuccess ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)';
        settingsAlert.style.color = isSuccess ? '#10B981' : '#FCA5A5';
        setTimeout(() => {
          settingsAlert.style.display = 'none';
        }, 3000);
      }

      // 9. Section 6: Logout Actions
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.logout('index.html');
        });
      }
      if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.logout('index.html');
        });
      }
      if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Switch back to Watchlist tab
          const firstTab = document.querySelector('.profile-tab-btn[data-target="panelWatchlist"]');
          if (firstTab) firstTab.click();
        });
      }

      // 10. Avatar Picker Logic
      if (changeAvatarBtn && avatarPickerPanel) {
        changeAvatarBtn.addEventListener('click', () => {
          const isHidden = avatarPickerPanel.style.display === 'none';
          avatarPickerPanel.style.display = isHidden ? 'block' : 'none';
        });
      }

      avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const selected = opt.getAttribute('data-avatar');
          localStorage.setItem(AVATAR_KEY, selected);
          if (avatarEl) avatarEl.textContent = selected;
          if (avatarPickerPanel) avatarPickerPanel.style.display = 'none';
          syncNavbarAuthState();
        });
      });

    } catch (err) {
      console.error('Profile auth error:', err);
      Auth.clearSession();
      window.location.replace('login.html?returnUrl=profile.html');
    }
  }

  function showError(box, msg) {
    if (!box) {
      alert(msg);
      return;
    }
    let displayMsg = String(msg || '');
    if (displayMsg === 'Failed to fetch' || displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError')) {
      displayMsg = '⚠️ Cannot connect to backend server. Please make sure the backend is running at http://localhost:5000 ("npm start").';
    }
    box.textContent = displayMsg;
    box.style.display = 'block';
  }

  function setLoading(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = text;
    btn.style.opacity = isLoading ? '0.7' : '1';
  }

  global.UniVaultAuth = Auth;

})(typeof window !== 'undefined' ? window : this);
