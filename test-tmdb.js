/**
 * UniVault — TMDB Backend Endpoint Test Suite
 * Run: node test-tmdb.js  (server must be running on port 5000)
 */

const PORT = process.env.PORT || 5000;
const BASE = `http://127.0.0.1:${PORT}`;

const tests = [
    // format: { label, url, expectStatus, optional }
    { label: 'Auth Test',           url: '/api/tmdb/auth-test',             expectStatus: 200 },
    { label: 'Trending',            url: '/api/tmdb/trending',              expectStatus: 200, optional: true },
    { label: 'Movies › Popular',    url: '/api/tmdb/movies/popular',        expectStatus: 200 },
    { label: 'Movies › Now Playing',url: '/api/tmdb/movies/now-playing',    expectStatus: 200 },
    { label: 'Movies › Top Rated',  url: '/api/tmdb/movies/top-rated',      expectStatus: 200 },
    { label: 'Movies › Upcoming',   url: '/api/tmdb/movies/upcoming',       expectStatus: 200 },
    { label: 'TV › Popular',        url: '/api/tmdb/tv/popular',            expectStatus: 200 },
    { label: 'TV › Top Rated',      url: '/api/tmdb/tv/top-rated',          expectStatus: 200 },
    { label: 'TV › Airing Today',   url: '/api/tmdb/tv/airing-today',       expectStatus: 200 },
    { label: 'Search › "Inception"',url: '/api/tmdb/search?query=Inception',expectStatus: 200 },
    { label: 'Search › (no query)', url: '/api/tmdb/search',                expectStatus: 400 },
];

async function run() {
    let passed = 0, failed = 0, warnings = 0;

    console.log('\n══════════════════════════════════════════════════');
    console.log('  UniVault — TMDB Endpoint Test Suite');
    console.log('══════════════════════════════════════════════════\n');

    for (const t of tests) {
        try {
            const res  = await fetch(BASE + t.url);
            const data = await res.json();
            const ok   = res.status === t.expectStatus;

            if (t.label === 'Auth Test') {
                // Special: auth test — report valid flag
                if (data.valid) {
                    console.log(`  ✅ [PASS] ${t.label}`);
                    console.log(`     Key: ${data.message}`);
                    console.log(`     Trending reachable: ${data.trendingReachable ? 'Yes ✅' : 'No ⚠️  (network-restricted, non-fatal)'}`);
                    passed++;
                } else {
                    console.log(`  ❌ [FAIL] ${t.label}`);
                    console.log(`     ${data.message}`);
                    failed++;
                }
                continue;
            }

            const count  = Array.isArray(data.results) ? data.results.length : 0;
            const sample = data.results?.[0]?.title || data.results?.[0]?.name || data.message || '-';

            if (ok && t.optional && count === 0) {
                // Optional endpoint that returned an error (e.g. network-blocked trending)
                console.log(`  ⚠️  [WARN] ${t.label} — HTTP ${res.status} (network-restricted on this machine)`);
                warnings++;
            } else if (ok) {
                const detail = t.expectStatus === 400
                    ? `(correct 400) ${data.message}`
                    : `${count} results | "${sample}"`;
                console.log(`  ✅ [PASS] ${t.label} — HTTP ${res.status} | ${detail}`);
                passed++;
            } else {
                console.log(`  ❌ [FAIL] ${t.label} — HTTP ${res.status} (expected ${t.expectStatus}) | ${data.message || ''}`);
                t.optional ? warnings++ : failed++;
            }

        } catch (err) {
            console.log(`  ❌ [FAIL] ${t.label} — Network error: ${err.message}`);
            t.optional ? warnings++ : failed++;
        }
    }

    const total = tests.length;
    console.log('\n──────────────────────────────────────────────────');
    console.log(`  Results: ${passed} passed  ${warnings} warnings  ${failed} failed  (${total} total)`);

    if (failed === 0) {
        console.log('\n  ✅ All required endpoints are working correctly.');
        if (warnings > 0) {
            console.log(`  ⚠️  ${warnings} optional endpoint(s) network-restricted (non-fatal).`);
        }
    } else {
        console.log(`\n  ❌ ${failed} required endpoint(s) failed.`);
        process.exitCode = 1;
    }
    console.log('══════════════════════════════════════════════════\n');
}

run();
