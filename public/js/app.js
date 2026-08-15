/**
 * ===========================================================================
 * UniVault — Main Platform Application Controller (app.js)
 * ===========================================================================
 * Orchestrates pages, data loading from TMDB_API, and rendering via Components.
 */

(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname.toLowerCase();
    const page = path.split('/').filter(Boolean).pop() || 'index.html';

    // ── 1. Route Dispatcher ──────────────────────────────────────────────────
    if (page === 'index.html' || page === '' || page === '/') {
      initHomePage();
    } else if (page === 'movies.html') {
      initMoviesPage();
    } else if (page === 'tv-shows.html') {
      initTVShowsPage();
    } else if (page === 'anime.html') {
      initAnimePage();
    } else if (page === 'search.html') {
      initSearchPage();
    } else if (page === 'details.html') {
      initDetailsPage();
    } else if (page === 'watchlist.html') {
      initWatchlistPage();
    } else if (page === 'trailers.html' || page === 'trending.html') {
      initTrendingPage();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HOMEPAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initHomePage() {
    Components.renderNavbar('home');
    Components.renderFooter();

    // Show initial skeleton loaders
    Components.createSkeletonCarousel('carouselTrending', 6);
    Components.createSkeletonCarousel('carouselPopularMovies', 6);
    Components.createSkeletonCarousel('carouselPopularTV', 6);
    Components.createSkeletonCarousel('carouselTopRated', 6);
    Components.createSkeletonCarousel('carouselAnime', 6);

    try {
      // 1. Fetch Trending Items & Hero
      const trending = await TMDB_API.getTrending('all', 'day');
      if (trending && trending.length > 0) {
        // Pass top featured trending titles to dynamic hero carousel
        setupHeroBanner(trending.slice(0, 8), 'netflixHero');
        // Trending Top 10 Ranked Row
        Components.createCarousel('carouselTrending', 'Trending Now', trending.slice(0, 10), true);
      }

      // 2. Continue Watching Row (from recent views)
      setupContinueWatchingRow();

      // 3. Parallel Fetch for All Sections
      const [popularMovies, popularTV, topRated, anime, nowPlaying, actionMovies, comedyMovies, horrorMovies, scifiMovies] = await Promise.all([
        TMDB_API.getPopularMovies(1),
        TMDB_API.getPopularTV(1),
        TMDB_API.getTopRatedMovies(1),
        TMDB_API.getAnime('popular', 1),
        TMDB_API.getNowPlayingMovies(1),
        TMDB_API.getGenreContent('movie', 28, 1),
        TMDB_API.getGenreContent('movie', 35, 1),
        TMDB_API.getGenreContent('movie', 27, 1),
        TMDB_API.getGenreContent('movie', 878, 1)
      ]);

      Components.createCarousel('carouselPopularMovies', 'Popular Movies', popularMovies, false, 'movies.html');
      Components.createCarousel('carouselPopularTV', 'Popular TV Shows', popularTV, false, 'tv-shows.html');
      Components.createCarousel('carouselAnime', 'Anime Spotlight', anime, false, 'anime.html');
      Components.createCarousel('carouselTopRated', 'Top Rated on UniVault', topRated, false);
      Components.createCarousel('carouselNewReleases', 'New Releases', nowPlaying, false);
      Components.createCarousel('carouselAction', 'Action & Adventure', actionMovies, false);
      Components.createCarousel('carouselComedy', 'Comedy & Laughs', comedyMovies, false);
      Components.createCarousel('carouselHorror', 'Thrills & Chills', horrorMovies, false);
      Components.createCarousel('carouselSciFi', 'Sci-Fi & Cyberpunk', scifiMovies, false);

    } catch (err) {
      console.error('[HomePage Init Error]:', err);
    }
  }

  function setupHeroBanner(itemOrItems, targetElementId = null) {
    let heroEl = targetElementId ? document.getElementById(targetElementId) : null;
    if (!heroEl) {
      heroEl = document.getElementById('netflixHero') || document.getElementById('animeHero') || document.querySelector('.netflix-hero');
    }
    if (!heroEl || !itemOrItems) return;

    return Components.createHeroCarousel(heroEl, itemOrItems, {
      isAnime: heroEl.id === 'animeHero'
    });
  }

  function setupContinueWatchingRow() {
    const container = document.getElementById('carouselContinueWatching');
    if (!container) return;

    let recent = [];
    try {
      const raw = localStorage.getItem('univault_recent_history');
      recent = raw ? JSON.parse(raw) : [];
    } catch {
      recent = [];
    }

    if (!recent || recent.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.className = 'section-container';
    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Continue Watching for You</h2>
      </div>
      <div class="netflix-carousel-wrapper">
        <button type="button" class="carousel-btn left">‹</button>
        <div class="netflix-carousel-track" id="continue_track">
          ${recent.slice(0, 8).map(item => Components.createContinueCard(item)).join('')}
        </div>
        <button type="button" class="carousel-btn right">›</button>
      </div>
    `;

    const track = document.getElementById('continue_track');
    const leftBtn = container.querySelector('.carousel-btn.left');
    const rightBtn = container.querySelector('.carousel-btn.right');
    if (track && leftBtn && rightBtn) {
      leftBtn.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.75, behavior: 'smooth' }));
      rightBtn.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' }));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MOVIES PAGE CONTROLLER (With Full TMDB Pagination & URL Sync)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initMoviesPage() {
    Components.renderNavbar('movies');
    Components.renderFooter();

    const grid = document.getElementById('moviesGrid');
    const paginationEl = document.getElementById('moviesPagination');
    const filterPills = document.querySelectorAll('.filter-pill[data-genre]');
    const sortSelect = document.getElementById('movieSortSelect');

    // Read initial state from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));
    let currentGenre = urlParams.get('genre') || 'all';
    let currentSort = urlParams.get('sort') || 'popularity.desc';

    // Synchronize UI elements with URL state
    if (sortSelect) sortSelect.value = currentSort;
    filterPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-genre') === currentGenre);
    });

    let isLoading = false;
    let requestSeq = 0;

    function syncUrl(push = true) {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      if (currentGenre !== 'all') params.set('genre', currentGenre);
      if (currentSort !== 'popularity.desc') params.set('sort', currentSort);

      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? '?' + qs : ''}`;
      if (push) {
        window.history.pushState({ page: currentPage, genre: currentGenre, sort: currentSort }, '', newUrl);
      } else {
        window.history.replaceState({ page: currentPage, genre: currentGenre, sort: currentSort }, '', newUrl);
      }
    }

    async function loadMovies(shouldScroll = false) {
      if (isLoading) return;
      isLoading = true;
      const currentReq = ++requestSeq;

      Components.createSkeletonGrid('moviesGrid', 18);
      if (paginationEl) paginationEl.style.display = 'none';

      try {
        let movies = [];
        if (currentGenre === 'all') {
          if (currentSort === 'vote_average.desc') {
            movies = await TMDB_API.getTopRatedMovies(currentPage);
          } else if (currentSort === 'primary_release_date.desc') {
            movies = await TMDB_API.getNowPlayingMovies(currentPage);
          } else {
            movies = await TMDB_API.getPopularMovies(currentPage);
          }
        } else {
          movies = await TMDB_API.getGenreContent('movie', currentGenre, currentPage, currentSort);
        }

        // Prevent stale responses if a newer request was dispatched
        if (currentReq !== requestSeq) return;

        if (grid) {
          if (movies && movies.length > 0) {
            grid.innerHTML = movies.map(m => Components.createMovieCard(m)).join('');
          } else {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #9CA3AF;">No movies found for this filter.</div>`;
          }
        }

        // Render Smart Pagination
        const totalPages = movies.total_pages || (movies.length >= 18 ? 500 : 1);
        if (paginationEl) {
          Components.renderPagination('moviesPagination', {
            currentPage,
            totalPages,
            onPageChange: (newPage) => {
              if (newPage === currentPage || isLoading) return;
              currentPage = newPage;
              syncUrl(true);
              loadMovies(true);
            }
          });
        }

        if (shouldScroll && grid) {
          const topOffset = grid.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
      } catch (err) {
        console.error('Movies load error:', err);
        if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #EF4444;">Unable to load movies. Please check your connection.</div>`;
      } finally {
        if (currentReq === requestSeq) isLoading = false;
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (isLoading) return;
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentGenre = pill.getAttribute('data-genre');
        currentPage = 1;
        syncUrl(true);
        loadMovies(true);
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        if (isLoading) return;
        currentSort = sortSelect.value;
        currentPage = 1;
        syncUrl(true);
        loadMovies(true);
      });
    }

    // Handle browser Back/Forward navigation
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentPage = Math.max(1, parseInt(p.get('page') || '1', 10));
      currentGenre = p.get('genre') || 'all';
      currentSort = p.get('sort') || 'popularity.desc';

      if (sortSelect) sortSelect.value = currentSort;
      filterPills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-genre') === currentGenre);
      });
      loadMovies(false);
    });

    loadMovies(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TV SHOWS PAGE CONTROLLER (With Full TMDB Pagination & URL Sync)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initTVShowsPage() {
    Components.renderNavbar('tv');
    Components.renderFooter();

    const grid = document.getElementById('tvGrid');
    const paginationEl = document.getElementById('tvPagination');
    const filterPills = document.querySelectorAll('.filter-pill[data-genre]');
    const sortSelect = document.getElementById('tvSortSelect');

    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));
    let currentGenre = urlParams.get('genre') || 'all';
    let currentSort = urlParams.get('sort') || 'popularity.desc';

    if (sortSelect) sortSelect.value = currentSort;
    filterPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-genre') === currentGenre);
    });

    let isLoading = false;
    let requestSeq = 0;

    function syncUrl(push = true) {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      if (currentGenre !== 'all') params.set('genre', currentGenre);
      if (currentSort !== 'popularity.desc') params.set('sort', currentSort);

      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? '?' + qs : ''}`;
      if (push) {
        window.history.pushState({ page: currentPage, genre: currentGenre, sort: currentSort }, '', newUrl);
      } else {
        window.history.replaceState({ page: currentPage, genre: currentGenre, sort: currentSort }, '', newUrl);
      }
    }

    async function loadTV(shouldScroll = false) {
      if (isLoading) return;
      isLoading = true;
      const currentReq = ++requestSeq;

      Components.createSkeletonGrid('tvGrid', 18);
      if (paginationEl) paginationEl.style.display = 'none';

      try {
        let shows = [];
        if (currentGenre === 'all') {
          if (currentSort === 'vote_average.desc') {
            shows = await TMDB_API.getTopRatedTV(currentPage);
          } else {
            shows = await TMDB_API.getPopularTV(currentPage);
          }
        } else {
          shows = await TMDB_API.getGenreContent('tv', currentGenre, currentPage, currentSort);
        }

        if (currentReq !== requestSeq) return;

        if (grid) {
          if (shows && shows.length > 0) {
            grid.innerHTML = shows.map(s => Components.createMovieCard(s)).join('');
          } else {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #9CA3AF;">No shows found for this filter.</div>`;
          }
        }

        const totalPages = shows.total_pages || (shows.length >= 18 ? 500 : 1);
        if (paginationEl) {
          Components.renderPagination('tvPagination', {
            currentPage,
            totalPages,
            onPageChange: (newPage) => {
              if (newPage === currentPage || isLoading) return;
              currentPage = newPage;
              syncUrl(true);
              loadTV(true);
            }
          });
        }

        if (shouldScroll && grid) {
          const topOffset = grid.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
      } catch (err) {
        console.error('TV load error:', err);
        if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #EF4444;">Unable to load TV shows. Please check your connection.</div>`;
      } finally {
        if (currentReq === requestSeq) isLoading = false;
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (isLoading) return;
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentGenre = pill.getAttribute('data-genre');
        currentPage = 1;
        syncUrl(true);
        loadTV(true);
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        if (isLoading) return;
        currentSort = sortSelect.value;
        currentPage = 1;
        syncUrl(true);
        loadTV(true);
      });
    }

    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentPage = Math.max(1, parseInt(p.get('page') || '1', 10));
      currentGenre = p.get('genre') || 'all';
      currentSort = p.get('sort') || 'popularity.desc';

      if (sortSelect) sortSelect.value = currentSort;
      filterPills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-genre') === currentGenre);
      });
      loadTV(false);
    });

    loadTV(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ANIME PAGE CONTROLLER (With Full TMDB Pagination & URL Sync)
  // ═══════════════════════════════════════════════════════════════════════════
  async function initAnimePage() {
    Components.renderNavbar('anime');
    Components.renderFooter();

    const grid = document.getElementById('animeGrid');
    const paginationEl = document.getElementById('animePagination');
    const filterPills = document.querySelectorAll('.filter-pill[data-category]');
    const sortSelect = document.getElementById('animeSortSelect');

    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));
    let currentCategory = urlParams.get('category') || 'popular';
    let currentSort = urlParams.get('sort') || 'popularity.desc';

    if (sortSelect) sortSelect.value = currentSort;
    filterPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-category') === currentCategory);
    });

    let isLoading = false;
    let requestSeq = 0;

    function syncUrl(push = true) {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      if (currentCategory !== 'popular') params.set('category', currentCategory);
      if (currentSort !== 'popularity.desc') params.set('sort', currentSort);

      const qs = params.toString();
      const newUrl = `${window.location.pathname}${qs ? '?' + qs : ''}`;
      if (push) {
        window.history.pushState({ page: currentPage, category: currentCategory, sort: currentSort }, '', newUrl);
      } else {
        window.history.replaceState({ page: currentPage, category: currentCategory, sort: currentSort }, '', newUrl);
      }
    }

    async function loadAnimeCatalog(shouldScroll = false) {
      if (isLoading) return;
      isLoading = true;
      const currentReq = ++requestSeq;

      if (grid) Components.createSkeletonGrid('animeGrid', 18);
      if (paginationEl) paginationEl.style.display = 'none';

      try {
        const animeList = await TMDB_API.getAnime(currentCategory, currentPage, currentSort);

        if (currentReq !== requestSeq) return;

        if (grid) {
          if (animeList && animeList.length > 0) {
            grid.innerHTML = animeList.map(a => Components.createMovieCard(a)).join('');
          } else {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #9CA3AF;">No anime found for this category.</div>`;
          }
        }

        const totalPages = animeList.total_pages || (animeList.length >= 18 ? 500 : 1);
        if (paginationEl) {
          Components.renderPagination('animePagination', {
            currentPage,
            totalPages,
            onPageChange: (newPage) => {
              if (newPage === currentPage || isLoading) return;
              currentPage = newPage;
              syncUrl(true);
              loadAnimeCatalog(true);
            }
          });
        }

        if (shouldScroll && grid) {
          const topOffset = grid.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
      } catch (err) {
        console.error('Anime catalog load error:', err);
        if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #EF4444;">Unable to load anime catalog.</div>`;
      } finally {
        if (currentReq === requestSeq) isLoading = false;
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (isLoading) return;
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.getAttribute('data-category');
        currentPage = 1;
        syncUrl(true);
        loadAnimeCatalog(true);
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        if (isLoading) return;
        currentSort = sortSelect.value;
        currentPage = 1;
        syncUrl(true);
        loadAnimeCatalog(true);
      });
    }

    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search);
      currentPage = Math.max(1, parseInt(p.get('page') || '1', 10));
      currentCategory = p.get('category') || 'popular';
      currentSort = p.get('sort') || 'popularity.desc';

      if (sortSelect) sortSelect.value = currentSort;
      filterPills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-category') === currentCategory);
      });
      loadAnimeCatalog(false);
    });

    loadAnimeCatalog(false);

    Components.createSkeletonCarousel('carouselAnimeTrending', 6);
    Components.createSkeletonCarousel('carouselAnimeAction', 6);
    Components.createSkeletonCarousel('carouselAnimeFantasy', 6);
    Components.createSkeletonCarousel('carouselAnimeTopRated', 6);

    try {
      const [trending, action, fantasy, topRated] = await Promise.all([
        TMDB_API.getAnime('popular', 1),
        TMDB_API.getAnime('action', 1),
        TMDB_API.getAnime('fantasy', 1),
        TMDB_API.getAnime('top_rated', 1)
      ]);

      Components.createCarousel('carouselAnimeTrending', 'Trending Anime Series', trending, false);
      Components.createCarousel('carouselAnimeAction', 'Action & Shonen Anime', action, false);
      Components.createCarousel('carouselAnimeFantasy', 'Fantasy & Supernatural Anime', fantasy, false);
      Components.createCarousel('carouselAnimeTopRated', 'Top Rated Masterpieces', topRated, false);

      const heroEl = document.getElementById('animeHero');
      if (heroEl && trending.length > 0) {
        setupHeroBanner(trending.slice(0, 8), 'animeHero');
      }
    } catch (err) {
      console.error('Anime carousels load error:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SEARCH PAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initSearchPage() {
    Components.renderNavbar('search');
    Components.renderFooter();

    const searchInput = document.getElementById('pageSearchInput');
    const searchGrid = document.getElementById('searchResultsGrid');
    const filterTabs = document.querySelectorAll('.search-filter-tab');
    const statusEl = document.getElementById('searchStatusText');

    let currentQuery = '';
    let currentFilter = 'all'; 
    let rawResults = [];
    let debounceTimer = null;

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';

    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
      currentQuery = initialQuery;
      performSearch(initialQuery);
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentQuery = val;
          if (val) {
            const url = new URL(window.location);
            url.searchParams.set('q', val);
            window.history.replaceState({}, '', url);
            performSearch(val);
          } else {
            if (searchGrid) searchGrid.innerHTML = '';
            if (statusEl) statusEl.textContent = 'Search across 10,000+ movies, TV series, and anime.';
          }
        }, 300);
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        applySearchFilter();
      });
    });

    async function performSearch(query) {
      if (!searchGrid) return;
      searchGrid.innerHTML = Array(8).fill(0).map(() => `<div class="netflix-card skeleton-shimmer skeleton-card"></div>`).join('');
      if (statusEl) statusEl.textContent = `Searching UniVault catalog for "${escapeHTML(query)}"...`;

      try {
        const results = await TMDB_API.searchMulti(query, 1);
        rawResults = results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
        applySearchFilter();
      } catch (err) {
        console.error('Search error:', err);
        if (statusEl) statusEl.textContent = 'Failed to fetch search results. Please try again.';
      }
    }

    function applySearchFilter() {
      if (!searchGrid) return;
      let filtered = [...rawResults];

      if (currentFilter === 'movie') {
        filtered = rawResults.filter(r => r.media_type === 'movie');
      } else if (currentFilter === 'tv') {
        filtered = rawResults.filter(r => r.media_type === 'tv');
      } else if (currentFilter === 'anime') {
        filtered = rawResults.filter(r => r.genre_ids && r.genre_ids.includes(16));
      }

      if (statusEl) {
        statusEl.textContent = filtered.length > 0 
          ? `Found ${filtered.length} titles matching "${escapeHTML(currentQuery)}"`
          : `No titles found matching "${escapeHTML(currentQuery)}"`;
      }

      if (filtered.length === 0) {
        searchGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: #9CA3AF;">
            <div style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">No results found</div>
            <p>Try searching for different keywords, actor names, or genres.</p>
          </div>
        `;
        return;
      }

      searchGrid.innerHTML = filtered.map(item => Components.createMovieCard(item)).join('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DETAILS PAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initDetailsPage() {
    Components.renderNavbar();
    Components.renderFooter();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'movie';
    const id = parseInt(urlParams.get('id'), 10);

    if (!id) {
      window.location.href = 'index.html';
      return;
    }

    try {
      const details = type === 'tv' ? await TMDB_API.getTVDetails(id) : await TMDB_API.getMovieDetails(id);
      if (!details) {
        window.location.href = 'index.html';
        return;
      }

      saveToRecentlyViewed(details, type);

      renderDetailsHeader(details, type);
      renderCastSection(details);

      if (type === 'tv') {
        renderSeasonsAndEpisodes(details);
      }

      const similar = (details.similar && details.similar.results) ? details.similar.results : await TMDB_API.getSimilar(type, id);
      const recs = (details.recommendations && details.recommendations.results) ? details.recommendations.results : await TMDB_API.getRecommendations(type, id);

      Components.createCarousel('carouselSimilar', 'More Like This', similar.slice(0, 12));
      Components.createCarousel('carouselRecommendations', 'Recommended For You', recs.slice(0, 12));

    } catch (err) {
      console.error('Details load error:', err);
    }
  }

  function renderDetailsHeader(item, type) {
    const container = document.getElementById('detailsHero');
    if (!container) return;

    const id = item.id;
    const title = item.title || item.name || 'Untitled';
    const overview = item.overview || 'No synopsis available.';
    const rating = TMDB_API.formatRating(item.vote_average);
    const year = TMDB_API.formatYear(item.release_date || item.first_air_date);
    const runtime = type === 'movie' ? TMDB_API.formatRuntime(item.runtime) : `${item.number_of_seasons || 1} Seasons`;
    const backdrop = TMDB_API.getBackdropUrl(item.backdrop_path, 'original');
    const poster = TMDB_API.getImageUrl(item.poster_path, 'w500');
    const genres = (item.genres || []).map(g => g.name).join(' • ');
    const isSaved = Components.isInWatchlist(id, type);

    container.innerHTML = `
      <div class="hero-backdrop-wrapper">
        <img src="${backdrop}" alt="${escapeHTML(title)}" class="hero-backdrop-img" onerror="this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80'">
        <div class="hero-gradient-overlay"></div>
      </div>
      <div class="details-content-inner" style="position: relative; z-index: 5; max-width: 1400px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 2.5rem; align-items: flex-end;">
        <div class="details-poster-box" style="flex: 0 0 clamp(200px, 20vw, 300px); aspect-ratio: 2/3; border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.85); background: #161622;">
          <img src="${poster}" alt="${escapeHTML(title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/500x750/161622/4B5563?text=No+Poster'">
        </div>
        <div style="flex: 1; min-width: min(100%, 400px);">
          <div class="hero-pill-tag">${type === 'tv' ? 'TV Series' : 'Feature Film'}</div>
          <h1 class="hero-title" style="margin-bottom: 0.75rem;">${escapeHTML(title)}</h1>
          <div class="hero-meta-row">
            <span class="hero-rating-badge">${Components.icons.star} ${rating}</span>
            <span class="hero-quality-badge">4K ULTRA HD</span>
            <span>${year}</span>
            <span>•</span>
            <span>${runtime}</span>
            <span>•</span>
            <span>${genres}</span>
          </div>
          <p class="hero-overview" style="-webkit-line-clamp: 5; margin-bottom: 1.5rem;">${escapeHTML(overview)}</p>
          <div class="hero-actions">
            <button 
              type="button" 
              class="btn-netflix btn-netflix-primary"
              onclick="Components.openTrailerModal('${type}', ${id}, '${escapeQuotes(title)}')"
            >
              ${Components.icons.play} <span>Watch Trailer</span>
            </button>
            <button 
              type="button" 
              class="btn-netflix btn-netflix-secondary" 
              id="detailsListBtn"
            >
              ${isSaved ? Components.icons.check : Components.icons.plus} <span>${isSaved ? 'In My List' : 'My List'}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const listBtn = document.getElementById('detailsListBtn');
    if (listBtn) {
      listBtn.addEventListener('click', () => {
        Components.toggleWatchlistButton(null, item);
        const nowSaved = Components.isInWatchlist(id, type);
        listBtn.innerHTML = `${nowSaved ? Components.icons.check : Components.icons.plus} <span>${nowSaved ? 'In My List' : 'My List'}</span>`;
      });
    }
  }

  function renderCastSection(item) {
    const castContainer = document.getElementById('detailsCastTrack');
    if (!castContainer) return;

    const cast = (item.credits && item.credits.cast) ? item.credits.cast.slice(0, 12) : [];
    if (cast.length === 0) {
      const section = document.getElementById('detailsCastSection');
      if (section) section.style.display = 'none';
      return;
    }

    castContainer.innerHTML = cast.map(person => {
      const photo = person.profile_path ? TMDB_API.getImageUrl(person.profile_path, 'w185') : 'https://via.placeholder.com/185x275/1e1e2d/6B7280?text=No+Photo';
      return `
        <div style="flex: 0 0 130px; text-align: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto 0.6rem; border: 2px solid rgba(255,255,255,0.15);">
            <img src="${photo}" alt="${escapeHTML(person.name)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="font-weight: 700; font-size: 0.85rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(person.name)}</div>
          <div style="font-size: 0.75rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(person.character || '')}</div>
        </div>
      `;
    }).join('');
  }

  async function renderSeasonsAndEpisodes(tvDetails) {
    const container = document.getElementById('tvEpisodesSection');
    if (!container || !tvDetails.seasons || tvDetails.seasons.length === 0) return;

    container.style.display = 'block';
    const validSeasons = tvDetails.seasons.filter(s => s.season_number > 0);

    const selectorHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h2 class="section-title">Episodes</h2>
        <select class="sort-select" id="seasonSelector">
          ${validSeasons.map(s => `<option value="${s.season_number}">${escapeHTML(s.name || `Season ${s.season_number}`)} (${s.episode_count} Episodes)</option>`).join('')}
        </select>
      </div>
      <div class="episodes-list-grid" id="episodesListGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
        <!-- Episodes dynamically populated -->
      </div>
    `;
    container.innerHTML = selectorHtml;

    const selector = document.getElementById('seasonSelector');
    const episodesGrid = document.getElementById('episodesListGrid');

    async function loadEpisodes(seasonNum) {
      if (!episodesGrid) return;
      episodesGrid.innerHTML = '<div class="skeleton-shimmer" style="height: 140px; border-radius: 8px;"></div>';

      try {
        const seasonData = await TMDB_API.getTVSeasonEpisodes(tvDetails.id, seasonNum);
        const eps = (seasonData && seasonData.episodes) ? seasonData.episodes : [];

        if (eps.length === 0) {
          episodesGrid.innerHTML = '<div style="color: #9CA3AF; padding: 2rem;">No episodes available for this season.</div>';
          return;
        }

        episodesGrid.innerHTML = eps.map(ep => {
          const thumb = ep.still_path ? TMDB_API.getBackdropUrl(ep.still_path, 'w500') : TMDB_API.getBackdropUrl(tvDetails.backdrop_path, 'w500');
          return `
            <div style="background: var(--bg-card); border-radius: 10px; overflow: hidden; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
              <div style="position: relative; aspect-ratio: 16/9; background: #000;">
                <img src="${thumb}" alt="${escapeHTML(ep.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80'">
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                  <button type="button" class="card-action-btn play" style="width: 40px; height: 40px;" onclick="Components.openTrailerModal('tv', ${tvDetails.id}, '${escapeQuotes(ep.name)}')" aria-label="Play Episode Trailer">${Components.icons.play}</button>
                </div>
                <span style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.8); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px;">${ep.runtime ? `${ep.runtime}m` : '45m'}</span>
              </div>
              <div style="padding: 1rem; flex: 1; display: flex; flex-direction: column;">
                <div style="font-weight: 800; font-size: 0.95rem; color: #fff; margin-bottom: 0.25rem;">${ep.episode_number}. ${escapeHTML(ep.name)}</div>
                <p style="font-size: 0.82rem; color: #9CA3AF; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(ep.overview || 'Enjoy this episode in 4K on UniVault.')}</p>
              </div>
            </div>
          `;
        }).join('');
      } catch (err) {
        console.error('Failed to load episodes:', err);
      }
    }

    if (selector) {
      selector.addEventListener('change', () => loadEpisodes(selector.value));
      loadEpisodes(selector.value || 1);
    }
  }

  function saveToRecentlyViewed(item, type) {
    try {
      let recent = [];
      const raw = localStorage.getItem('univault_recent_history');
      recent = raw ? JSON.parse(raw) : [];
      const id = String(item.id);

      recent = recent.filter(r => String(r.id) !== id);
      recent.unshift({
        id: item.id,
        tmdb_id: item.id,
        media_type: type,
        title: item.title || item.name,
        backdrop_path: item.backdrop_path,
        poster_path: item.poster_path,
        viewed_at: Date.now()
      });

      if (recent.length > 20) recent.pop();
      localStorage.setItem('univault_recent_history', JSON.stringify(recent));

      // Sync with MongoDB backend if logged in
      if (global.UniVaultAuth && global.UniVaultAuth.isAuthenticated()) {
        const token = global.UniVaultAuth.getToken();
        const endpoint = global.getUniVaultApiUrl ? global.getUniVaultApiUrl('/api/user/recently-viewed') : '/api/user/recently-viewed';
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tmdb_id: item.id,
            media_type: type,
            title: item.title || item.name,
            poster: item.poster_path,
            backdrop: item.backdrop_path
          })
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Recently viewed save error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. WATCHLIST / MY LIST PAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initWatchlistPage() {
    Components.renderNavbar('watchlist');
    Components.renderFooter();

    const grid = document.getElementById('watchlistGrid');
    const emptyState = document.getElementById('watchlistEmptyState');
    const filterTabs = document.querySelectorAll('.watchlist-filter-tab');
    let currentFilter = 'all';

    function renderList() {
      const list = Components.getWatchlist();
      let filtered = list;

      if (currentFilter === 'movie') {
        filtered = list.filter(i => i.media_type === 'movie');
      } else if (currentFilter === 'tv') {
        filtered = list.filter(i => i.media_type === 'tv');
      }

      if (filtered.length === 0) {
        if (grid) grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (grid) {
        grid.innerHTML = filtered.map(item => Components.createMovieCard(item)).join('');
      }
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        renderList();
      });
    });

    window.addEventListener('watchlistUpdated', renderList);
    renderList();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. TRENDING PAGE CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════════
  async function initTrendingPage() {
    const isTrailerPage = window.location.pathname.includes('trailers.html');
    Components.renderNavbar(isTrailerPage ? 'trailers' : 'trending');
    Components.renderFooter();

    Components.createSkeletonCarousel('carouselTrendingDay', 6);
    Components.createSkeletonCarousel('carouselTrendingWeek', 6);
    Components.createSkeletonCarousel('carouselTrendingMovies', 6);
    Components.createSkeletonCarousel('carouselTrendingTV', 6);

    try {
      const [day, week, movies, tv] = await Promise.all([
        TMDB_API.getTrending('all', 'day'),
        TMDB_API.getTrending('all', 'week'),
        TMDB_API.getPopularMovies(1),
        TMDB_API.getPopularTV(1)
      ]);

      Components.createCarousel('carouselTrendingDay', 'Trending Today (Top 10)', day.slice(0, 10), true);
      Components.createCarousel('carouselTrendingWeek', 'Trending This Week', week.slice(0, 12), false);
      Components.createCarousel('carouselTrendingMovies', 'Popular Movies Right Now', movies.slice(0, 12), false);
      Components.createCarousel('carouselTrendingTV', 'Top Television Shows', tv.slice(0, 12), false);

    } catch (err) {
      console.error('Trending page error:', err);
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

  function escapeQuotes(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

})(typeof window !== 'undefined' ? window : this);
