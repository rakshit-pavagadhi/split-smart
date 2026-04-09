const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc   Get category breakdown
// @route  GET /api/groups/:id/analytics/category
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const breakdown = await Expense.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalSpending = breakdown.reduce((sum, cat) => sum + cat.total, 0);

    const data = breakdown.map(cat => ({
      category: cat._id,
      total: Math.round(cat.total * 100) / 100,
      count: cat.count,
      percentage: totalSpending > 0 ? Math.round((cat.total / totalSpending) * 10000) / 100 : 0
    }));

    res.json({ success: true, data, totalSpending: Math.round(totalSpending * 100) / 100 });
  } catch (error) {
    next(error);
  }
};

// @desc   Get monthly trends
// @route  GET /api/groups/:id/analytics/monthly
exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const trends = await Expense.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId) } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const data = trends.map(t => ({
      month: `${months[t._id.month - 1]} ${t._id.year}`,
      total: Math.round(t.total * 100) / 100,
      count: t.count
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc   Get member contributions
// @route  GET /api/groups/:id/analytics/members
exports.getMemberContributions = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const contributions = await Expense.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId) } },
      {
        $group: {
          _id: '$paidBy',
          totalPaid: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalPaid: -1 } }
    ]);

    const totalSpending = contributions.reduce((sum, c) => sum + c.totalPaid, 0);

    const data = [];
    for (const c of contributions) {
      const user = await User.findById(c._id).select('name email avatar');
      data.push({
        user,
        totalPaid: Math.round(c.totalPaid * 100) / 100,
        count: c.count,
        percentage: totalSpending > 0 ? Math.round((c.totalPaid / totalSpending) * 10000) / 100 : 0
      });
    }

    res.json({ success: true, data, totalSpending: Math.round(totalSpending * 100) / 100 });
  } catch (error) {
    next(error);
  }
};

// @desc   Export CSV
// @route  GET /api/groups/:id/export/csv
exports.exportCSV = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .sort('date');

    // Build CSV
    let csv = 'Date,Description,Category,Amount,Paid By,Split Type,Splits\n';

    for (const expense of expenses) {
      const date = new Date(expense.date).toLocaleDateString();
      const desc = `"${expense.description.replace(/"/g, '""')}"`;
      const splits = expense.splits
        .map(s => `${s.user.name}: ₹${s.amount.toFixed(2)}`)
        .join('; ');

      csv += `${date},${desc},${expense.category},${expense.amount.toFixed(2)},${expense.paidBy.name},${expense.splitType},"${splits}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=splitsmart_ledger_${groupId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
