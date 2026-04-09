const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Group = require('../models/Group');
const { sendSettlementNotification } = require('../services/emailService');

// @desc   Create settlement
// @route  POST /api/groups/:id/settlements
exports.createSettlement = async (req, res, next) => {
  try {
    const { from, to, amount, paymentMethod, note } = req.body;
    const groupId = req.params.id;

    const settlement = await Settlement.create({
      group: groupId,
      from,
      to,
      amount,
      paymentMethod: paymentMethod || 'other',
      note,
      status: 'pending'
    });

    await settlement.populate('from', 'name email avatar');
    await settlement.populate('to', 'name email avatar');

    res.status(201).json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};

// @desc   Get group settlements
// @route  GET /api/groups/:id/settlements
exports.getSettlements = async (req, res, next) => {
  try {
    const settlements = await Settlement.find({ group: req.params.id })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort('-createdAt');

    res.json({ success: true, settlements });
  } catch (error) {
    next(error);
  }
};

// @desc   Update settlement status
// @route  PUT /api/groups/:id/settlements/:sid
exports.updateSettlementStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const settlement = await Settlement.findById(req.params.sid);

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    settlement.status = status;
    if (status === 'completed') {
      settlement.completedAt = new Date();

      // Send notification
      const fromUser = await User.findById(settlement.from);
      const toUser = await User.findById(settlement.to);
      const group = await Group.findById(settlement.group);
      
      sendSettlementNotification(fromUser, toUser, settlement.amount, group.name).catch(console.error);
    }

    await settlement.save();
    await settlement.populate('from', 'name email avatar');
    await settlement.populate('to', 'name email avatar');

    res.json({ success: true, settlement });
  } catch (error) {
    next(error);
  }
};
