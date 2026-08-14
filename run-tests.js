const express = require('express');
const path    = require('path');
const fs      = require('fs');

// Load env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const tmdbRoutes = require('./routes/tmdb');

const app = express();
app.use(express.json());
app.use('/api/tmdb', tmdbRoutes);

const PORT = 3099;
const server = app.listen(PORT, async () => {
    console.log(`🧪 Test Server running on http://127.0.0.1:${PORT}\n`);
    
    const endpoints = [
        { name: 'Auth Test', path: '/api/tmdb/auth-test', expectArray: false },
        { name: 'Trending', path: '/api/tmdb/trending', expectArray: true },
        { name: 'Movies Popular', path: '/api/tmdb/movies/popular', expectArray: true },
        { name: 'Movies Now Playing', path: '/api/tmdb/movies/now-playing', expectArray: true },
        { name: 'Movies Top Rated', path: '/api/tmdb/movies/top-rated', expectArray: true },
        { name: 'Movies Upcoming', path: '/api/tmdb/movies/upcoming', expectArray: true },
        { name: 'TV Popular', path: '/api/tmdb/tv/popular', expectArray: true },
        { name: 'TV Top Rated', path: '/api/tmdb/tv/top-rated', expectArray: true },
        { name: 'TV Airing Today', path: '/api/tmdb/tv/airing-today', expectArray: true },
        { name: 'Search (With Query)', path: '/api/tmdb/search?query=Inception', expectArray: true },
        { name: 'Search (Missing Query - Error Test)', path: '/api/tmdb/search', expectStatus: 400 },
        { name: 'Movie Videos (Fight Club)', path: '/api/tmdb/movie/550/videos', expectArray: true },
        { name: 'Movie Genres', path: '/api/tmdb/genres/movie', expectArray: false },
    ];

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}${ep.path}`);
            const data = await res.json();

            if (ep.expectStatus) {
                if (res.status === ep.expectStatus) {
                    console.log(`✅ [PASS] ${ep.name} (HTTP ${res.status} - ${data.message})`);
                    passed++;
                } else {
                    console.error(`❌ [FAIL] ${ep.name} (Expected HTTP ${ep.expectStatus}, got ${res.status})`);
                    failed++;
                }
            } else if (res.ok) {
                if (ep.expectArray) {
                    const count = Array.isArray(data.results) ? data.results.length : 0;
                    const sample = count > 0 ? (data.results[0].title || data.results[0].name) : 'No title';
                    console.log(`✅ [PASS] ${ep.name} | HTTP ${res.status} | Received ${count} TMDB results | Top item: "${sample}"`);
                } else {
                    console.log(`✅ [PASS] ${ep.name} | HTTP ${res.status} | Message: "${data.message}"`);
                }
                passed++;
            } else {
                console.error(`❌ [FAIL] ${ep.name} | HTTP ${res.status} | Error: ${data.message}`);
                failed++;
            }
        } catch (err) {
            console.error(`❌ [FAIL] ${ep.name} | Request Failed: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n========================================`);
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${endpoints.length} Total`);
    console.log(`========================================\n`);

    server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
    });
});
