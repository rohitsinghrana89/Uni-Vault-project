const fs = require('fs');
const path = require('path');

// Read public/js/cards.js content to verify function signature and elements
const cardsJsContent = fs.readFileSync(path.join(__dirname, 'public', 'js', 'cards.js'), 'utf8');

const checks = [
  { name: 'Contains createMediaCard function', pass: cardsJsContent.includes('function createMediaCard') },
  { name: 'Contains renderCardGrid function', pass: cardsJsContent.includes('function renderCardGrid') },
  { name: 'Contains detectMediaType function', pass: cardsJsContent.includes('function detectMediaType') },
  { name: 'Handles Movie / TV / Anime media types', pass: cardsJsContent.includes("'anime'") && cardsJsContent.includes("'tv'") && cardsJsContent.includes("'movie'") },
  { name: 'Uses lazy loading attribute', pass: cardsJsContent.includes('loading="lazy"') },
  { name: 'Contains poster fallback mechanism', pass: cardsJsContent.includes('poster-fallback-wrapper') },
  { name: 'Contains Rating chip', pass: cardsJsContent.includes('card-rating-chip') },
  { name: 'Contains Release Year', pass: cardsJsContent.includes('meta-year') },
  { name: 'Contains Play Button action', pass: cardsJsContent.includes('card-play-btn') },
  { name: 'Contains Watchlist Button action', pass: cardsJsContent.includes('btn-watchlist') },
  { name: 'Contains More Info Button action', pass: cardsJsContent.includes('btn-info') },
  { name: 'Global UniVaultCards export', pass: cardsJsContent.includes('global.UniVaultCards') },
];

let passed = 0;
console.log('🧪 Verifying cards.js Implementation:\n');
checks.forEach(c => {
  if (c.pass) {
    console.log(`✅ [PASS] ${c.name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${c.name}`);
  }
});

console.log(`\nResults: ${passed} / ${checks.length} checks passed.`);
if (passed === checks.length) {
  process.exit(0);
} else {
  process.exit(1);
}
