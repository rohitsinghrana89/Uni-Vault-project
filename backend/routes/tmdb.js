const express = require('express');
const router  = express.Router();
const tmdbService = require('../../services/tmdbService');

/**
 * Helper to handle route errors consistently
 */
function handleRouteError(res, err) {
    const status = err.status || 500;
    res.status(status).json({
        error: true,
        status,
        message: err.message || 'Internal server error'
    });
}

/**
 * GET /api/tmdb/auth-test
 */
router.get('/auth-test', async (req, res) => {
    try {
        const result = await tmdbService.validateApiKey();
        const status = result.valid ? 200 : 401;
        res.status(status).json({
            valid:   result.valid,
            message: result.message,
            ...(result.valid && result.data ? { tmdb: result.data } : {})
        });
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/trending
 */
router.get('/trending', async (req, res) => {
    try {
        const { type = 'all', time = 'day', page = 1 } = req.query;
        const data = await tmdbService.getTrending(type, time, Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/movies/popular
 */
router.get('/movies/popular', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getPopularMovies(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/movies/now-playing & /api/tmdb/movies/now_playing
 */
const handleNowPlaying = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getNowPlayingMovies(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
};
router.get('/movies/now-playing', handleNowPlaying);
router.get('/movies/now_playing', handleNowPlaying);

/**
 * GET /api/tmdb/movies/top-rated & /api/tmdb/movies/top_rated
 */
const handleMoviesTopRated = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getTopRatedMovies(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
};
router.get('/movies/top-rated', handleMoviesTopRated);
router.get('/movies/top_rated', handleMoviesTopRated);

/**
 * GET /api/tmdb/movies/upcoming
 */
router.get('/movies/upcoming', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getUpcomingMovies(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/tv/popular
 */
router.get('/tv/popular', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getPopularTV(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/tv/top-rated & /api/tmdb/tv/top_rated
 */
const handleTVTopRated = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getTopRatedTV(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
};
router.get('/tv/top-rated', handleTVTopRated);
router.get('/tv/top_rated', handleTVTopRated);

/**
 * GET /api/tmdb/tv/airing-today & /api/tmdb/tv/airing_today
 */
const handleAiringToday = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await tmdbService.getAiringTodayTV(Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
};
router.get('/tv/airing-today', handleAiringToday);
router.get('/tv/airing_today', handleAiringToday);

/**
 * GET /api/tmdb/search
 */
router.get('/search', async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        if (!query || query.trim() === '') {
            return res.status(400).json({ error: true, status: 400, message: 'Query parameter "query" is required' });
        }
        const data = await tmdbService.searchMulti(query, Number(page));
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/genres/:type
 */
router.get('/genres/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = await tmdbService.getGenres(type);
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * GET /api/tmdb/:type/:id/videos
 */
router.get('/:type/:id/videos', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdbService.getVideos(type, id);
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

/**
 * Universal Catch-All GET /api/tmdb/*
 */
router.get('/*', async (req, res) => {
    try {
        const endpoint = req.params[0] || req.path;
        const data = await tmdbService.proxyFetch(`/${endpoint}`, req.query);
        res.json(data);
    } catch (err) {
        handleRouteError(res, err);
    }
});

module.exports = router;
