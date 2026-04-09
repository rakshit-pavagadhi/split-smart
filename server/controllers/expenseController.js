const Expense = require('../models/Expense');
const Group = require('../models/Group');

// @desc   Add expense to group
// @route  POST /api/groups/:id/expenses
exports.addExpense = async (req, res, next) => {
  try {
    const { description, amount, category, paidBy, splitType, splits, date } = req.body;
    const groupId = req.params.id;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    let expenseSplits = splits;

    // Auto-calculate equal splits if not provided
    if (splitType === 'equal' && (!splits || splits.length === 0)) {
      const memberCount = group.members.length;
      const equalAmount = Math.floor((amount / memberCount) * 100) / 100;
      const remainder = Math.round((amount - equalAmount * memberCount) * 100) / 100;

      expenseSplits = group.members.map((member, index) => ({
        user: member.user,
        amount: index === 0 ? equalAmount + remainder : equalAmount
      }));
    }

    // For percentage splits, calculate amounts
    if (splitType === 'percentage' && splits) {
      expenseSplits = splits.map(split => ({
        user: split.user,
        amount: Math.round((amount * split.percentage / 100) * 100) / 100,
        percentage: split.percentage
      }));
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      category: category || 'Other',
      paidBy,
      splitType,
      splits: expenseSplits,
      date: date || new Date(),
      createdBy: req.user._id
    });

    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.user', 'name email avatar');

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc   Get group expenses
// @route  GET /api/groups/:id/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, startDate, endDate } = req.query;
    const groupId = req.params.id;

    const query = { group: groupId };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-date -createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update expense
// @route  PUT /api/groups/:id/expenses/:eid
exports.updateExpense = async (req, res, next) => {
  try {
    const { description, amount, category, paidBy, splitType, splits, date } = req.body;
    const expense = await Expense.findById(req.params.eid);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.group.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Expense does not belong to this group' });
    }

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (paidBy) expense.paidBy = paidBy;
    if (splitType) expense.splitType = splitType;
    if (splits) expense.splits = splits;
    if (date) expense.date = date;

    await expense.save();
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.user', 'name email avatar');

    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete expense
// @route  DELETE /api/groups/:id/expenses/:eid
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.eid);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.group.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Expense does not belong to this group' });
    }

    await Expense.findByIdAndDelete(req.params.eid);

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};
