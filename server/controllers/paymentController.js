const Razorpay = require('razorpay');
const crypto = require('crypto');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Group = require('../models/Group');
const { sendSettlementNotification } = require('../services/emailService');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
  });
};

// @desc   Create Razorpay order
// @route  POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, settlementId, groupId, from, to } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Create a settlement record first if not already exists
    let settlement;
    if (settlementId) {
      settlement = await Settlement.findById(settlementId);
      if (!settlement) {
        return res.status(404).json({ message: 'Settlement not found' });
      }
    } else if (groupId && from && to) {
      settlement = await Settlement.create({
        group: groupId,
        from,
        to,
        amount,
        paymentMethod: 'razorpay',
        status: 'pending'
      });
    }

    const razorpay = getRazorpayInstance();

    if (razorpay) {
      // Real Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `settlement_${settlement?._id || Date.now()}`,
        notes: {
          settlementId: settlement?._id?.toString() || '',
          groupId: groupId || '',
          from: from || '',
          to: to || ''
        }
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          settlementId: settlement?._id
        },
        key: process.env.RAZORPAY_KEY_ID
      });
    } else {
      // Fallback mock order for development without Razorpay keys
      const mockOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        settlementId: settlement?._id
      };

      res.json({
        success: true,
        order: mockOrder,
        key: 'rzp_test_mock_key',
        mock: true
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc   Verify Razorpay payment signature & complete settlement
// @route  POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, settlementId, mock } = req.body;

    let isValid = false;

    if (mock) {
      // Mock mode — auto-succeed for dev testing
      isValid = true;
    } else {
      // Real Razorpay signature verification using HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = expectedSignature === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    // Mark settlement as completed
    if (settlementId) {
      const settlement = await Settlement.findById(settlementId);
      if (settlement) {
        settlement.status = 'completed';
        settlement.paymentId = razorpay_payment_id || `mock_pay_${Date.now()}`;
        settlement.paymentMethod = 'razorpay';
        settlement.completedAt = new Date();
        await settlement.save();

        // Send notification email
        const fromUser = await User.findById(settlement.from);
        const toUser = await User.findById(settlement.to);
        const group = await Group.findById(settlement.group);
        if (fromUser && toUser && group) {
          sendSettlementNotification(fromUser, toUser, settlement.amount, group.name).catch(console.error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and settlement completed!',
      paymentId: razorpay_payment_id || `mock_pay_${Date.now()}`
    });
  } catch (error) {
    next(error);
  }
};
