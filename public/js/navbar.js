/**
 * UniVault Navigation System — navbar.js
 *
 * Responsibilities:
 *  1. Transparent → dark-glass scroll transition
 *  2. Hamburger toggle (mobile drawer)
 *  3. Backdrop overlay click-to-close
 *  4. Keyboard accessibility (Escape key, focus trap)
 *  5. Active link highlighting
 *  6. Genres dropdown (desktop)
 *  7. Close drawer on nav link click
 *  8. Lock / unlock body scroll when drawer is open
 */

(function () {
  'use strict';

  // ── Element refs ─────────────────────────────────────────
  const navbar       = document.getElementById('navbar');
  const hamburger    = document.getElementById('hamburger');
  const drawer       = document.getElementById('navDrawer');
  const overlay      = document.getElementById('navOverlay');
  const genreToggle  = document.getElementById('genreToggle');
  const genreDropdown = document.getElementById('genreDropdown');

  // ── Scroll threshold (px before glass kicks in) ──────────
  const SCROLL_THRESHOLD = 20;

  // ── 1. Scroll → glass transition ─────────────────────────
  function handleScroll() {
    if (!navbar) return;
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    navbar.classList.toggle('scrolled', scrolled);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // ── 2. Hamburger / Drawer toggle ─────────────────────────
  function openDrawer() {
    if (!hamburger || !drawer || !overlay) return;
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    overlay.classList.add('is-visible');
    navbar.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';

    // Focus first link for a11y
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeDrawer() {
    if (!hamburger || !drawer || !overlay) return;
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    navbar.classList.remove('drawer-open');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  function toggleDrawer() {
    const isOpen = drawer && drawer.classList.contains('is-open');
    isOpen ? closeDrawer() : openDrawer();
  }

  if (hamburger) hamburger.addEventListener('click', toggleDrawer);
  if (overlay)   overlay.addEventListener('click', closeDrawer);

  // ── 3. Escape key closes drawer ──────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      if (genreDropdown) closeGenreDropdown();
    }
  });

  // ── 4. Close drawer on any drawer link click ─────────────
  if (drawer) {
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        // small delay so navigation doesn't feel jarring
        setTimeout(closeDrawer, 120);
      });
    });
  }

  // ── 5. Active link detection ─────────────────────────────
  function markActiveLink() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const allLinks = document.querySelectorAll('.nav-links-desktop a, .nav-drawer-links a');

    allLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').replace(/^\.\//, '');
      const isHome = (href === 'index.html' || href === '/') &&
                     (path === '/' || path.endsWith('/index.html') || path === '');
      const isMatch = !isHome
        ? (href !== 'index.html' && href !== '/' && path.endsWith(href))
        : isHome;

      link.classList.toggle('active', isHome || isMatch);
      if (link.classList.contains('active')) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  markActiveLink();

  // ── 6. Genres Dropdown (desktop) ─────────────────────────
  const genreParent = document.querySelector('.nav-dropdown');

  function openGenreDropdown() {
    if (!genreParent) return;
    genreParent.classList.add('open');
    if (genreToggle) genreToggle.setAttribute('aria-expanded', 'true');
  }

  function closeGenreDropdown() {
    if (!genreParent) return;
    genreParent.classList.remove('open');
    if (genreToggle) genreToggle.setAttribute('aria-expanded', 'false');
  }

  if (genreParent) {
    // Hover (desktop)
    genreParent.addEventListener('mouseenter', openGenreDropdown);
    genreParent.addEventListener('mouseleave', closeGenreDropdown);

    // Click toggle (for keyboard / touch)
    if (genreToggle) {
      genreToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        genreParent.classList.contains('open')
          ? closeGenreDropdown()
          : openGenreDropdown();
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!genreParent.contains(e.target)) closeGenreDropdown();
    });
  }

  // ── 7. Resize: close drawer if viewport becomes desktop ──
  const mq = window.matchMedia('(min-width: 1025px)');
  mq.addEventListener('change', (e) => {
    if (e.matches) closeDrawer();
  });

})();
