/**
 * TMDB API Service Layer
 * ======================
 * All TMDB interactions stay server-side.
 * Credentials are read exclusively from environment variables — never
 * hard-coded and never sent to the browser.
 */

const BASE_URL  = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY   = process.env.TMDB_API_KEY;
const TOKEN     = process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN;

// ── Startup guard ──────────────────────────────────────────────────────────
const isRealToken = TOKEN && TOKEN !== 'YOUR_ACCESS_TOKEN' && TOKEN !== 'YOUR_TMDB_READ_ACCESS_TOKEN';
if (!API_KEY && !isRealToken) {
    console.warn('⚠️  [TMDB] TMDB_API_KEY or TMDB_ACCESS_TOKEN is missing from .env — TMDB calls will fail.');
}

// ── Shared fetch helper ────────────────────────────────────────────────────
/**
 * Makes an authenticated GET request to the TMDB API.
 *
 * @param {string} endpoint  - TMDB path, e.g. "/movie/popular"
 * @param {object} params    - additional query-string parameters
 * @returns {Promise<object>} parsed JSON response
 * @throws  {Error}          on non-OK HTTP status or network failure
 */
async function fetchFromTMDB(endpoint, params = {}) {
    // ── Build URL ──────────────────────────────────────────────────────────
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${BASE_URL}${cleanEndpoint}`);

    // Attach API key for query param authentication fallback
    if (API_KEY) {
        url.searchParams.set('api_key', API_KEY);
    }

    // Append caller-supplied parameters (page, query, language …)
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    }

    // ── Build headers ──────────────────────────────────────────────────────
    const headers = { 'Content-Type': 'application/json' };

    // Attach Bearer token header
    if (isRealToken) {
        headers['Authorization'] = `Bearer ${TOKEN.trim()}`;
    }

    // ── Execute request with retry ─────────────────────────────────────────
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            response = await fetch(url.toString(), { headers });
            break;
        } catch (networkErr) {
            attempts++;
            if (attempts >= maxAttempts) {
                const msg = `Network error reaching TMDB (${endpoint}): ${networkErr.message}`;
                console.error(`❌ [TMDB] ${msg}`);
                throw new Error(msg);
            }
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
        }
    }

    // ── Handle TMDB error responses ────────────────────────────────────────
    if (!response.ok) {
        let tmdbMessage = `TMDB responded with HTTP ${response.status}`;
        try {
            const body = await response.json();
            if (body.status_message) tmdbMessage = body.status_message;
        } catch { /* ignore parse error */ }

        console.error(`❌ [TMDB] ${endpoint} → ${tmdbMessage}`);

        const err = new Error(tmdbMessage);
        err.status = response.status;

        if (response.status === 401) {
            err.message = `TMDB Authentication Failed (401). Check TMDB_API_KEY in .env. Details: ${tmdbMessage}`;
        } else if (response.status === 404) {
            err.message = `TMDB resource not found (404): ${endpoint}`;
        }

        throw err;
    }

    return response.json();
}

// ── Public service API ─────────────────────────────────────────────────────
const tmdbService = {

    /**
     * Validates the API key by calling /movie/popular — the most reliable
     * TMDB endpoint that requires only an API key (no user token).
     * Returns 200 on a valid key, surfaces a clear error on 401.
     * Also probes /trending/all/day and reports its reachability separately.
     */
    async validateApiKey() {
        if (!API_KEY) {
            return {
                valid:   false,
                message: 'TMDB_API_KEY is not set in your .env file.'
            };
        }

        // Primary probe — must succeed for the key to be considered valid
        let primaryOk = false;
        let primaryMsg = '';
        try {
            const data = await fetchFromTMDB('/movie/popular', { page: 1 });
            const count = (data.results || []).length;
            primaryOk  = count > 0;
            primaryMsg = primaryOk
                ? `TMDB API key is valid — /movie/popular returned ${count} results.`
                : 'TMDB returned an unexpected empty response from /movie/popular.';
        } catch (err) {
            primaryMsg = err.message;
        }

        if (!primaryOk) {
            return { valid: false, message: primaryMsg };
        }

        // Secondary probe — check /trending reachability (informational, non-blocking)
        let trendingReachable = false;
        try {
            await fetchFromTMDB('/trending/movie/day', { page: 1 });
            trendingReachable = true;
        } catch { /* non-fatal */ }

        return {
            valid:             true,
            message:           primaryMsg,
            trendingReachable
        };
    },

    // ── Trending ────────────────────────────────────────────────────────────
    async getTrending(type = 'all', timeWindow = 'day', page = 1) {
        const safeType   = ['all', 'movie', 'tv', 'person'].includes(type) ? type : 'all';
        const safeWindow = ['day', 'week'].includes(timeWindow) ? timeWindow : 'day';
        return fetchFromTMDB(`/trending/${safeType}/${safeWindow}`, { page });
    },

    // ── Movies ──────────────────────────────────────────────────────────────
    async getPopularMovies(page = 1)    { return fetchFromTMDB('/movie/popular',     { page }); },
    async getNowPlayingMovies(page = 1) { return fetchFromTMDB('/movie/now_playing', { page }); },
    async getTopRatedMovies(page = 1)   { return fetchFromTMDB('/movie/top_rated',   { page }); },
    async getUpcomingMovies(page = 1)   { return fetchFromTMDB('/movie/upcoming',    { page }); },

    // ── TV Shows ────────────────────────────────────────────────────────────
    async getPopularTV(page = 1)      { return fetchFromTMDB('/tv/popular',      { page }); },
    async getTopRatedTV(page = 1)     { return fetchFromTMDB('/tv/top_rated',    { page }); },
    async getAiringTodayTV(page = 1)  { return fetchFromTMDB('/tv/airing_today', { page }); },

    // ── Search ──────────────────────────────────────────────────────────────
    async searchMulti(query, page = 1) {
        if (!query || query.trim() === '') {
            throw new Error('A non-empty "query" parameter is required for search.');
        }
        return fetchFromTMDB('/search/multi', { query: query.trim(), page });
    },

    // ── Media Details & Videos ────────────────────────────────────────────────
    async getVideos(type = 'movie', id) {
        const safeType = type === 'tv' ? 'tv' : 'movie';
        if (!id) throw new Error('Media ID is required to fetch videos.');
        return fetchFromTMDB(`/${safeType}/${id}/videos`);
    },

    async getGenres(type = 'movie') {
        const safeType = type === 'tv' ? 'tv' : 'movie';
        return fetchFromTMDB(`/genre/${safeType}/list`);
    },

    // ── Universal Proxy ─────────────────────────────────────────────────────
    async proxyFetch(endpoint, queryParams = {}) {
        return fetchFromTMDB(endpoint, queryParams);
    }
};

module.exports = tmdbService;
