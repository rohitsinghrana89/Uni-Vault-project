/**
 * UniVault — Improved PhonePe UPI QR Code Payment & Subscription Test Suite
 */

const fs = require('fs');
const path = require('path');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' 🧪 RUNNING PHONEPE UPI PAYMENT VERIFICATION SUITE');
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

// ── 1. Check PhonePe QR Code Image Assets ──
const qrCleanPath = path.join(__dirname, 'public/assets/payment/phonepe-qr-clean.png');
assert(fs.existsSync(qrCleanPath), 'Clean 1:1 QR asset exists at public/assets/payment/phonepe-qr-clean.png');

// ── 2. Check Backend Payment Model & Routes ──
const paymentModel = fs.readFileSync(path.join(__dirname, 'backend/models/Payment.js'), 'utf8');
assert(paymentModel.includes('userId') && paymentModel.includes('paymentId'), 'Payment model has userId and paymentId fields');
assert(paymentModel.includes('expiresAt:'), 'Payment model has expiresAt timestamp field');
assert(paymentModel.includes('status:') && paymentModel.includes('pending'), 'Payment model has status tracking');

const userModel = fs.readFileSync(path.join(__dirname, 'backend/models/User.js'), 'utf8');
assert(userModel.includes('subscription:'), 'User model includes subscription schema subdocument');
assert(userModel.includes("enum: ['Free', 'Basic', 'Standard', 'Premium']"), 'User model supports all subscription tiers');

const paymentRoutes = fs.readFileSync(path.join(__dirname, 'backend/routes/payment.js'), 'utf8');
assert(paymentRoutes.includes("router.post('/create'"), 'payment.js defines POST /create');
assert(paymentRoutes.includes("router.post('/verify'"), 'payment.js defines POST /verify');
assert(paymentRoutes.includes("router.get('/status/:paymentId'"), 'payment.js defines GET /status/:paymentId');
assert(paymentRoutes.includes("router.get('/subscription'"), 'payment.js defines GET /subscription');
assert(paymentRoutes.includes('QRCode.toDataURL'), 'payment.js dynamically generates QR code with embedded payment URI');
assert(paymentRoutes.includes('new Date() > new Date(payment.expiresAt)'), 'payment.js enforces server-side expiration validation');

// Price validation checks
assert(paymentRoutes.includes('Basic: { monthly: 99, yearly: 999 }'), 'Server enforces Basic price (₹99 / ₹999)');
assert(paymentRoutes.includes('Standard: { monthly: 199, yearly: 1999 }'), 'Server enforces Standard price (₹199 / ₹1999)');
assert(paymentRoutes.includes('Premium: { monthly: 299, yearly: 2999 }'), 'Server enforces Premium price (₹299 / ₹2999)');

const serverJs = fs.readFileSync(path.join(__dirname, 'backend/server.js'), 'utf8');
assert(serverJs.includes("app.use('/api/payment', paymentRoutes)"), 'backend/server.js mounts /api/payment');

// ── 3. Check Subscription Page UI Improvements ──
const subHtml = fs.readFileSync(path.join(__dirname, 'public/subscription.html'), 'utf8');

// Ensure removed elements are NOT present in the payment modal UI
assert(!subHtml.includes('Copy UPI ID'), 'UPI ID copy button removed from UI');
assert(!subHtml.includes('9389023802.wallet@phonepe</div>'), 'UPI ID text is NOT displayed underneath the QR code in HTML');

// Check improved components
assert(subHtml.includes('qr-compact-container'), 'subscription.html has compact centered QR container');
assert(subHtml.includes('qr-timer-box') && subHtml.includes('Payment expires in'), 'subscription.html includes 10-minute expiration countdown timer');
assert(subHtml.includes('qr-expired-overlay') && subHtml.includes('QR CODE EXPIRED'), 'subscription.html includes QR expired overlay');
assert(subHtml.includes('Generate New QR'), 'subscription.html includes "Generate New QR" button');
assert(subHtml.includes('Scan & Pay using any UPI app'), 'subscription.html includes "Scan & Pay using any UPI app"');
assert(subHtml.includes("I've Completed Payment"), 'subscription.html includes "I\'ve Completed Payment" action');
assert(subHtml.includes('● Waiting for payment...'), 'subscription.html includes clean waiting status');
assert(subHtml.includes('⟳ Verifying payment'), 'subscription.html includes clean verifying status');
assert(subHtml.includes('✓ Payment successful'), 'subscription.html includes clean success status');
assert(subHtml.includes('/api/payment/create') && subHtml.includes('/api/payment/verify'), 'subscription.html calls backend payment endpoints');

console.log('\n══════════════════════════════════════════════════════════');
console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Total`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
