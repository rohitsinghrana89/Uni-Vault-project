/**
 * UniVault Client-Side Authentication Service
 * Powered by MongoDB Atlas + JWT + bcrypt REST API
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
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    },

    /**
     * Retrieve stored user object
     */
    getUser: function () {
      try {
        const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
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
     * Logout and redirect to landing authentication page
     */
    logout: function (redirectUrl = 'landing.html') {
      this.clearSession();
      window.location.href = redirectUrl;
    },

    /**
     * Route Protection Guard
     * - Unauthenticated visitors accessing content pages -> redirect to landing.html
     * - Authenticated users visiting auth pages (landing/login/signup) -> redirect to index.html
     */
    checkRouteProtection: function () {
      if (typeof window === 'undefined' || !window.location) return;

      const path = window.location.pathname.toLowerCase();
      const segments = path.split('/').filter(Boolean);
      const currentPage = (segments.length > 0 ? segments[segments.length - 1] : '') || 'index.html';

      const authPages = ['landing.html', 'login.html', 'signup.html'];
      const isAuthPage = authPages.some(page => currentPage === page || currentPage.endsWith('/' + page));

      const isAuthed = this.isAuthenticated();

      // If user is already logged in and visits landing / login / signup -> open index.html
      if (isAuthed && isAuthPage) {
        window.location.replace('index.html');
        return;
      }

      // If user is NOT logged in and visits any protected page -> open landing.html
      if (!isAuthed && !isAuthPage) {
        window.location.replace('landing.html');
        return;
      }
    }
  };

  // Run Route Protection immediately upon script evaluation
  Auth.checkRouteProtection();

  // ── Sync Navbar Across All Content Pages ──────────────────────────────────
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
          Auth.logout('landing.html');
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
        btn.href = 'landing.html';
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
            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #E50914, #B81D24); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff;">
              ${displayAvatar}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 700; font-size: 0.9rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(user.name)}</div>
              <div style="font-size: 0.75rem; color: #9CA3AF; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(user.email)}</div>
            </div>
          </div>
          <a href="profile.html" class="signin-link" style="text-align: center; margin-bottom: 0.5rem;">My Profile</a>
          <a href="#" class="signup-link" id="drawerLogoutBtn" style="background: rgba(229, 9, 20, 0.2); border: 1px solid rgba(229, 9, 20, 0.4); color: #FFA5A5; text-align: center;">Sign Out</a>
        `;
        const drawerLogout = document.getElementById('drawerLogoutBtn');
        if (drawerLogout) {
          drawerLogout.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout('landing.html');
          });
        }
      } else {
        drawerAuth.innerHTML = `
          <a href="landing.html" class="signin-link">Sign In</a>
          <a href="landing.html" class="signup-link">Get Started</a>
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

  // ── Initialize Interactive Elements on DOM Load ───────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    Auth.checkRouteProtection();
    syncNavbarAuthState();

    // ── 1. Landing Page "Get Started" & Modals Handler ───────────────────────
    const getStartedForm = document.getElementById('getStartedForm');
    const heroEmailInput = document.getElementById('heroEmailInput');
    const authModalBackdrop = document.getElementById('authModalBackdrop');
    const signInCard = document.getElementById('signInCard');
    const signUpCard = document.getElementById('signUpCard');

    const openSignInBtn = document.getElementById('openSignInBtn');
    const openSignUpBtn = document.getElementById('openSignUpBtn');
    const closeSignInBtn = document.getElementById('closeSignInBtn');
    const closeSignUpBtn = document.getElementById('closeSignUpBtn');
    const switchToSignUpBtn = document.getElementById('switchToSignUpBtn');
    const switchToSignInBtn = document.getElementById('switchToSignInBtn');

    function showModal(view = 'signin') {
      if (!authModalBackdrop) return;
      authModalBackdrop.classList.add('active');
      authModalBackdrop.setAttribute('aria-hidden', 'false');

      if (view === 'signup') {
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) {
          signUpCard.style.display = 'block';
          const nameInput = document.getElementById('signUpName');
          if (nameInput) setTimeout(() => nameInput.focus(), 100);
        }
      } else {
        if (signUpCard) signUpCard.style.display = 'none';
        if (signInCard) {
          signInCard.style.display = 'block';
          const emailInput = document.getElementById('signInEmail');
          if (emailInput) setTimeout(() => emailInput.focus(), 100);
        }
      }
    }

    function hideModal() {
      if (!authModalBackdrop) return;
      authModalBackdrop.classList.remove('active');
      authModalBackdrop.setAttribute('aria-hidden', 'true');
      if (signInCard) signInCard.style.display = 'none';
      if (signUpCard) signUpCard.style.display = 'none';
    }

    if (getStartedForm && heroEmailInput) {
      getStartedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = heroEmailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !emailRegex.test(email)) {
          heroEmailInput.focus();
          heroEmailInput.style.borderColor = '#E50914';
          return;
        }

        // Open signup card and prefill email
        showModal('signup');
        const signUpEmail = document.getElementById('signUpEmail');
        if (signUpEmail) {
          signUpEmail.value = email;
        }
      });
    }

    if (openSignInBtn) openSignInBtn.addEventListener('click', () => showModal('signin'));
    if (openSignUpBtn) openSignUpBtn.addEventListener('click', () => showModal('signup'));
    if (closeSignInBtn) closeSignInBtn.addEventListener('click', hideModal);
    if (closeSignUpBtn) closeSignUpBtn.addEventListener('click', hideModal);
    if (switchToSignUpBtn) switchToSignUpBtn.addEventListener('click', () => showModal('signup'));
    if (switchToSignInBtn) switchToSignInBtn.addEventListener('click', () => showModal('signin'));

    if (authModalBackdrop) {
      authModalBackdrop.addEventListener('click', (e) => {
        if (e.target === authModalBackdrop) {
          hideModal();
        }
      });
    }

    // ── 2. Sign In Form Handler (Modal & Standalone) ────────────────────────
    const signInForm = document.getElementById('signInForm') || document.getElementById('loginForm');
    if (signInForm) {
      const emailInput = document.getElementById('signInEmail') || document.getElementById('loginEmail');
      const passInput = document.getElementById('signInPassword') || document.getElementById('loginPass');
      const errorBox = document.getElementById('signInErrorBox') || document.getElementById('loginErrorBox');
      const submitBtn = document.getElementById('signInSubmitBtn') || document.getElementById('loginSubmitBtn');
      const togglePassBtn = document.getElementById('toggleSignInPass') || document.getElementById('toggleLoginPass');

      if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          togglePassBtn.textContent = isPass ? '👁️' : '🔒';
        });
      }

      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorBox) errorBox.style.display = 'none';

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!email || !password) {
          showError(errorBox, 'Please provide both your email address and password.');
          return;
        }

        setLoading(submitBtn, true, 'Signing In…');

        try {
          await Auth.login(email, password);
          // Strict Requirement: Always redirect directly to index.html (never profile.html)
          window.location.href = 'index.html';
        } catch (err) {
          showError(errorBox, err.message);
          setLoading(submitBtn, false, 'Sign In');
        }
      });
    }

    // ── 3. Sign Up Form Handler (Modal & Standalone) ────────────────────────
    const signUpForm = document.getElementById('signUpForm') || document.getElementById('signupForm');
    if (signUpForm) {
      const nameInput = document.getElementById('signUpName') || document.getElementById('signupName');
      const emailInput = document.getElementById('signUpEmail') || document.getElementById('signupEmail');
      const passInput = document.getElementById('signUpPassword') || document.getElementById('signupPass');
      const confirmPassInput = document.getElementById('signUpConfirmPassword') || document.getElementById('signupConfirmPass');
      const errorBox = document.getElementById('signUpErrorBox') || document.getElementById('signupErrorBox');
      const submitBtn = document.getElementById('signUpSubmitBtn') || document.getElementById('signupSubmitBtn');
      const togglePassBtn = document.getElementById('toggleSignUpPass') || document.getElementById('toggleSignupPass');

      if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          if (confirmPassInput) confirmPassInput.type = passInput.type;
          togglePassBtn.textContent = isPass ? '👁️' : '🔒';
        });
      }

      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorBox) errorBox.style.display = 'none';

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';
        const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

        if (!name || name.length < 2) {
          showError(errorBox, 'Full name must be at least 2 characters.');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
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
          // Strict Requirement: Always redirect directly to index.html (never profile.html)
          window.location.href = 'index.html';
        } catch (err) {
          showError(errorBox, err.message);
          setLoading(submitBtn, false, 'Create Account');
        }
      });
    }

    // ── 4. Google Auth Mock Handler ─────────────────────────────────────────
    const googleBtn = document.getElementById('googleSignInBtn') || document.getElementById('googleLoginBtn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        alert('Google Sign-In is configured for UniVault SSO. Please sign in with your email and password to access your account.');
      });
    }

    // ── 5. Profile Page Handler ─────────────────────────────────────────────
    const profileContainer = document.getElementById('profileViewContainer');
    if (profileContainer) {
      initProfilePageController();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 👤 PROFILE PAGE CONTROLLER (Preserved for Profile.html)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initProfilePageController() {
    if (!Auth.isAuthenticated()) {
      window.location.replace('landing.html');
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
      const user = await Auth.getProfile();

      if (loadingState) loadingState.style.display = 'none';
      if (contentState) contentState.style.display = 'block';

      if (nameEl) nameEl.textContent = user.name || 'User';
      if (emailEl) emailEl.textContent = user.email || '';
      
      const customAvatar = localStorage.getItem(AVATAR_KEY);
      if (avatarEl) avatarEl.textContent = customAvatar || ((user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U');

      if (memberSinceEl && user.created_at) {
        try {
          const date = new Date(user.created_at);
          memberSinceEl.textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
        } catch {
          memberSinceEl.textContent = '2026';
        }
      }

      if (settingsName) settingsName.value = user.name || '';
      if (settingsEmail) settingsEmail.value = user.email || '';

      // ── Populate Watchlist Section ──
      if (watchlistGrid) {
        try {
          let items = [];
          const res = await fetch(getApiUrl('/api/watchlist'), {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
          });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.items)) {
            items = data.items;
          } else {
            const raw = localStorage.getItem(WATCHLIST_KEY);
            items = raw ? JSON.parse(raw) : [];
          }

          if (badgeWatchlistCount) badgeWatchlistCount.textContent = items.length;

          if (items.length === 0) {
            if (watchlistEmpty) watchlistEmpty.style.display = 'block';
            watchlistGrid.innerHTML = '';
          } else {
            if (watchlistEmpty) watchlistEmpty.style.display = 'none';
            watchlistGrid.innerHTML = items.map(item => createMediaCardHTML(item)).join('');
          }
        } catch (e) {
          console.warn('Profile Watchlist Load Error:', e);
        }
      }

      // ── Populate Recently Viewed Section ──
      if (recentGrid) {
        try {
          let recent = [];
          const res = await fetch(getApiUrl('/api/user/recently-viewed?limit=10'), {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
          });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.items)) {
            recent = data.items;
          } else {
            const raw = localStorage.getItem(RECENT_KEY);
            recent = raw ? JSON.parse(raw) : [];
          }

          if (badgeRecentCount) badgeRecentCount.textContent = recent.length;

          if (recent.length === 0) {
            if (recentEmpty) recentEmpty.style.display = 'block';
            recentGrid.innerHTML = '';
          } else {
            if (recentEmpty) recentEmpty.style.display = 'none';
            recentGrid.innerHTML = recent.map(item => createMediaCardHTML(item)).join('');
          }
        } catch (e) {
          console.warn('Profile Recent Load Error:', e);
        }
      }

      // ── Populate Favorites Section ──
      if (favGrid) {
        try {
          const raw = localStorage.getItem(FAV_KEY);
          const favs = raw ? JSON.parse(raw) : [];
          if (badgeFavCount) badgeFavCount.textContent = favs.length;
          if (favs.length === 0) {
            if (favEmpty) favEmpty.style.display = 'block';
            favGrid.innerHTML = '';
          } else {
            if (favEmpty) favEmpty.style.display = 'none';
            favGrid.innerHTML = favs.map(item => createMediaCardHTML(item)).join('');
          }
        } catch (e) {
          console.warn('Profile Favs Load Error:', e);
        }
      }

      // ── Tab Switching ──
      const navTabs = document.querySelectorAll('.profile-nav-tab');
      const sections = document.querySelectorAll('.profile-section-panel');

      navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const targetSectionId = tab.getAttribute('data-target');
          
          navTabs.forEach(t => t.classList.remove('active'));
          sections.forEach(s => s.style.display = 'none');

          tab.classList.add('active');
          const targetSection = document.getElementById(targetSectionId);
          if (targetSection) targetSection.style.display = 'block';
        });
      });

      // ── Logout Modal & Trigger ──
      const logoutModal = document.getElementById('profileLogoutModal');
      if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutModal.style.display = 'flex';
        });
      }
      if (cancelLogoutBtn && logoutModal) {
        cancelLogoutBtn.addEventListener('click', () => {
          logoutModal.style.display = 'none';
        });
      }
      if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
          Auth.logout('landing.html');
        });
      }

      // ── Clear Recent History Button ──
      if (clearRecentBtn) {
        clearRecentBtn.addEventListener('click', async () => {
          if (confirm('Clear all your recently viewed titles?')) {
            try {
              localStorage.removeItem(RECENT_KEY);
              await fetch(getApiUrl('/api/user/recently-viewed'), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
              });
              if (recentGrid) recentGrid.innerHTML = '';
              if (recentEmpty) recentEmpty.style.display = 'block';
              if (badgeRecentCount) badgeRecentCount.textContent = '0';
            } catch (e) {
              console.warn('Clear recent error:', e);
            }
          }
        });
      }

      // ── Save Profile Settings ──
      if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (settingsAlert) settingsAlert.style.display = 'none';

          const newName = settingsName.value.trim();
          const newPassword = document.getElementById('settingsNewPass')?.value || '';
          const currentPassword = document.getElementById('settingsCurrentPass')?.value || '';

          if (!newName) {
            showError(settingsAlert, 'Name cannot be empty.');
            return;
          }

          setLoading(saveSettingsBtn, true, 'Saving…');

          try {
            const body = { name: newName };
            if (newPassword) {
              if (!currentPassword) {
                throw new Error('Current password is required to set a new password.');
              }
              if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long.');
              }
              body.new_password = newPassword;
              body.current_password = currentPassword;
            }

            const res = await fetch(getApiUrl('/api/user/profile'), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
              },
              body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.message || 'Failed to update profile.');
            }

            // Update user in session
            const cur = Auth.getUser() || {};
            cur.name = newName;
            localStorage.setItem(USER_KEY, JSON.stringify(cur));

            if (nameEl) nameEl.textContent = newName;
            if (avatarEl && !localStorage.getItem(AVATAR_KEY)) {
              avatarEl.textContent = newName[0].toUpperCase();
            }

            syncNavbarAuthState();

            if (settingsAlert) {
              settingsAlert.style.display = 'block';
              settingsAlert.style.background = 'rgba(16, 185, 129, 0.15)';
              settingsAlert.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              settingsAlert.style.color = '#6EE7B7';
              settingsAlert.textContent = '✅ Profile updated successfully!';
            }

            const curPassField = document.getElementById('settingsCurrentPass');
            const newPassField = document.getElementById('settingsNewPass');
            if (curPassField) curPassField.value = '';
            if (newPassField) newPassField.value = '';

          } catch (err) {
            showError(settingsAlert, err.message);
          } finally {
            setLoading(saveSettingsBtn, false, 'Save Changes');
          }
        });
      }

      // ── Avatar Picker ──
      if (changeAvatarBtn && avatarPickerPanel) {
        changeAvatarBtn.addEventListener('click', () => {
          const isOpen = avatarPickerPanel.style.display === 'flex';
          avatarPickerPanel.style.display = isOpen ? 'none' : 'flex';
        });
      }

      avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const emoji = opt.getAttribute('data-avatar');
          if (emoji) {
            localStorage.setItem(AVATAR_KEY, emoji);
            if (avatarEl) avatarEl.textContent = emoji;
            if (avatarPickerPanel) avatarPickerPanel.style.display = 'none';
            syncNavbarAuthState();
          }
        });
      });

      const resetAvatarBtn = document.getElementById('resetAvatarBtn');
      if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener('click', () => {
          localStorage.removeItem(AVATAR_KEY);
          if (avatarEl) avatarEl.textContent = (user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U';
          if (avatarPickerPanel) avatarPickerPanel.style.display = 'none';
          syncNavbarAuthState();
        });
      }

    } catch (err) {
      console.error('Profile auth error:', err);
      Auth.clearSession();
      window.location.replace('landing.html');
    }
  }

  function createMediaCardHTML(item) {
    const id = item.tmdb_id || item.id;
    const title = item.title || item.name || 'Untitled';
    const type = item.media_type || 'movie';
    const poster = item.poster || item.poster_path 
      ? (item.poster || item.poster_path).startsWith('http') 
        ? (item.poster || item.poster_path) 
        : `https://image.tmdb.org/t/p/w500${item.poster || item.poster_path}`
      : 'https://via.placeholder.com/300x450/111/333?text=No+Poster';

    return `
      <div class="card" style="aspect-ratio: 2/3; position: relative; border-radius: 12px; overflow: hidden; background: #16161c;">
        <img src="${poster}" alt="${escapeHTML(title)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 0.75rem;">
          <h4 style="font-size: 0.88rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(title)}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; color: #FF3D6B; text-transform: uppercase; font-weight: 800;">${type}</span>
            <a href="details.html?type=${type}&id=${id}" style="color: #fff; font-size: 0.75rem; text-decoration: none; font-weight: 600;">Details →</a>
          </div>
        </div>
      </div>
    `;
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
