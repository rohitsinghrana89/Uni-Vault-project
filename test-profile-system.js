/**
 * UniVault — Netflix-Inspired Profile Dashboard Test Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING UNIVAULT PROFILE DASHBOARD VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

// ── 1. Check Profile HTML Structure ──
const profilePath = path.join(__dirname, 'public/profile.html');
assert(fs.existsSync(profilePath), 'public/profile.html exists');

const profileHtml = fs.readFileSync(profilePath, 'utf8');

// Auth Gate check
assert(profileHtml.includes('window.location.replace(\'login.html\')') || profileHtml.includes('window.location.replace("login.html")'), 'profile.html has immediate auth gate redirect');

// Hero Header
assert(profileHtml.includes('profile-hero-section'), 'profile.html has cinematic hero section');
assert(profileHtml.includes('headerAvatar') && profileHtml.includes('headerName') && profileHtml.includes('headerEmail'), 'profile.html displays avatar, name, and email');
assert(profileHtml.includes('headerSubBadge'), 'profile.html displays subscription badge in header');
assert(profileHtml.includes('openEditProfileBtn'), 'profile.html has Edit Profile button');

// Navigation Tabs
assert(profileHtml.includes('data-tab="overview"'), 'profile.html includes Overview tab');
assert(profileHtml.includes('data-tab="mylist"'), 'profile.html includes My List tab');
assert(profileHtml.includes('data-tab="continue"'), 'profile.html includes Continue Watching tab');
assert(profileHtml.includes('data-tab="recent"'), 'profile.html includes Recently Viewed tab');
assert(profileHtml.includes('data-tab="history"'), 'profile.html includes Watch History tab');
assert(profileHtml.includes('data-tab="subscription"'), 'profile.html includes Subscription tab');
assert(profileHtml.includes('data-tab="settings"'), 'profile.html includes Settings tab');

// Overview Stats Cards
assert(profileHtml.includes('statMyListCount'), 'profile.html has My List stats card');
assert(profileHtml.includes('statContinueCount'), 'profile.html has Continue Watching stats card');
assert(profileHtml.includes('statRecentCount'), 'profile.html has Recently Viewed stats card');
assert(profileHtml.includes('statSubPlan'), 'profile.html has Subscription tier stats card');

// Modals
assert(profileHtml.includes('editModalBackdrop') && profileHtml.includes('avatarPickerGrid'), 'profile.html includes Edit Profile modal with Avatar Picker');
assert(profileHtml.includes('logoutModalBackdrop') && profileHtml.includes('confirmLogoutBtn'), 'profile.html includes Logout Confirmation modal');

// ── 2. Check Backend User & RecentlyViewed Endpoints ──
const userModel = fs.readFileSync(path.join(__dirname, 'backend/models/User.js'), 'utf8');
assert(userModel.includes('avatar:'), 'User model supports custom avatar string');
assert(userModel.includes('subscription:'), 'User model supports subscription subdocument');

const userRoutes = fs.readFileSync(path.join(__dirname, 'backend/routes/user.js'), 'utf8');
assert(userRoutes.includes("router.get('/me'"), 'user.js defines GET /api/user/me');
assert(userRoutes.includes("router.put('/profile'"), 'user.js defines PUT /api/user/profile');
assert(userRoutes.includes("router.get('/recently-viewed'"), 'user.js defines GET /api/user/recently-viewed');
assert(userRoutes.includes("router.post('/recently-viewed'"), 'user.js defines POST /api/user/recently-viewed');
assert(userRoutes.includes("router.delete('/recently-viewed'"), 'user.js defines DELETE /api/user/recently-viewed');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
