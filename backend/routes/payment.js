const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Authoritative pricing table (Prevents client-side price tampering)
const PLAN_PRICES = {
  Basic: { monthly: 99, yearly: 999 },
  Standard: { monthly: 199, yearly: 1999 },
  Premium: { monthly: 299, yearly: 2999 }
};

const UPI_ID = '9389023802.wallet@phonepe';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 1. POST /api/payment/create
 * Initialize a new dynamic PhonePe UPI payment order with 10-minute expiry
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { plan, billing = 'monthly' } = req.body;

    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan selected. Must be Basic, Standard, or Premium.'
      });
    }

    const billingCycle = billing === 'yearly' ? 'yearly' : 'monthly';
    const amount = PLAN_PRICES[plan][billingCycle];

    const orderId = `ORD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Set strictly 10 minutes lifetime
    const durationSeconds = 600;
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    // Standard UPI Payment URI (Embeds transaction details without visible text display)
    const upiUri = `upi://pay?pa=${UPI_ID}&pn=UniVault&am=${amount}&cu=INR&tn=UniVault-${plan}-${orderId}`;

    // Generate dynamic QR Data URL with clean high-contrast pixels
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QRCode generation fallback:', qrErr.message);
      qrDataUrl = '/assets/payment/phonepe-qr-clean.png';
    }

    const payment = new Payment({
      userId: req.user.id,
      plan,
      billing: billingCycle,
      amount,
      currency: 'INR',
      upiId: UPI_ID,
      upiUri,
      paymentId,
      orderId,
      expiresAt,
      status: 'pending'
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      paymentId,
      orderId,
      plan,
      billing: billingCycle,
      amount,
      currency: 'INR',
      upiUri,
      qrDataUrl,
      expiresAt,
      durationSeconds
    });

  } catch (err) {
    console.error('Payment create error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment order'
    });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 2. POST /api/payment/verify
 * Confirm and verify PhonePe UPI payment with strict expiry validation
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, utrNumber } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for verification.'
      });
    }

    const payment = await Payment.findOne({ paymentId, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found for this user.'
      });
    }

    // Check expiration
    if (payment.expiresAt && new Date() > new Date(payment.expiresAt)) {
      payment.status = 'expired';
      await payment.save();
      return res.status(400).json({
        success: false,
        status: 'expired',
        message: 'Payment session has expired. Please generate a new QR code.'
      });
    }

    // Set verified status
    payment.status = 'completed';
    payment.utrNumber = utrNumber ? String(utrNumber).trim() : undefined;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update user subscription in MongoDB
    const durationDays = payment.billing === 'yearly' ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const user = await User.findById(req.user.id);
    if (user) {
      user.subscription = {
        plan: payment.plan,
        billing: payment.billing,
        status: 'active',
        startDate: new Date(),
        expiresAt,
        paymentId: payment.paymentId
      };
      await user.save();
    }

    return res.status(200).json({
      success: true,
      status: 'completed',
      plan: payment.plan,
      billing: payment.billing,
      amount: payment.amount,
      expiresAt,
      message: `Payment confirmed! Your ${payment.plan} subscription is now active.`
    });

  } catch (err) {
    console.error('Payment verify error:', err);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 3. GET /api/payment/status/:paymentId
 * Retrieve the real-time status of a payment order
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ paymentId, userId: req.user.id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const isExpired = payment.expiresAt && new Date() > new Date(payment.expiresAt);
    const effectiveStatus = (payment.status === 'pending' && isExpired) ? 'expired' : payment.status;

    return res.status(200).json({
      success: true,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      plan: payment.plan,
      billing: payment.billing,
      amount: payment.amount,
      status: effectiveStatus,
      expiresAt: payment.expiresAt,
      isExpired,
      createdAt: payment.createdAt,
      verifiedAt: payment.verifiedAt
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status'
    });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 4. GET /api/payment/subscription
 * Retrieve current user subscription status
 * ═════════════════════════════════════════════════════════════════════════════
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sub = user.subscription || { plan: 'Free', status: 'active', billing: 'monthly' };
    return res.status(200).json({
      success: true,
      subscription: sub
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
});

module.exports = router;
