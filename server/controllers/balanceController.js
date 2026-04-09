const User = require('../models/User');
const { 
  calculateNetBalances, 
  calculatePairwiseDebts, 
  minimizeCashFlow, 
  getBalanceGraphData 
} = require('../services/settlementService');

// @desc   Get balance summary
// @route  GET /api/groups/:id/balances/summary
exports.getBalanceSummary = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const balances = await calculateNetBalances(groupId);

    // Populate user names
    const summary = [];
    for (const userId in balances) {
      const balance = Math.round(balances[userId] * 100) / 100;
      if (Math.abs(balance) > 0.01) {
        const user = await User.findById(userId).select('name email avatar');
        summary.push({
          user,
          balance,
          status: balance > 0 ? 'owed' : 'owes'
        });
      }
    }

    // Sort: biggest creditors first
    summary.sort((a, b) => b.balance - a.balance);

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

// @desc   Get pairwise balances
// @route  GET /api/groups/:id/balances/pairwise
exports.getPairwiseBalances = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const debts = await calculatePairwiseDebts(groupId);

    // Populate user names
    const populatedDebts = [];
    for (const debt of debts) {
      const fromUser = await User.findById(debt.from).select('name email avatar');
      const toUser = await User.findById(debt.to).select('name email avatar');
      populatedDebts.push({
        from: fromUser,
        to: toUser,
        amount: debt.amount
      });
    }

    res.json({ success: true, debts: populatedDebts });
  } catch (error) {
    next(error);
  }
};

// @desc   Get balance graph data
// @route  GET /api/groups/:id/balances/graph
exports.getBalanceGraph = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const graphData = await getBalanceGraphData(groupId);

    // Populate nodes with user names
    for (let i = 0; i < graphData.nodes.length; i++) {
      const user = await User.findById(graphData.nodes[i].id).select('name email avatar');
      graphData.nodes[i].user = user;
    }

    // Populate edges
    for (let i = 0; i < graphData.edges.length; i++) {
      const source = await User.findById(graphData.edges[i].source).select('name email avatar');
      const target = await User.findById(graphData.edges[i].target).select('name email avatar');
      graphData.edges[i].sourceUser = source;
      graphData.edges[i].targetUser = target;
    }

    res.json({ success: true, graph: graphData });
  } catch (error) {
    next(error);
  }
};

// @desc   Get settlement suggestions (min-cash-flow)
// @route  GET /api/groups/:id/settlements/suggestions
exports.getSettlementSuggestions = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const result = await minimizeCashFlow(groupId);

    // Populate user names in transactions
    const populatedTransactions = [];
    for (const tx of result.transactions) {
      const fromUser = await User.findById(tx.from).select('name email avatar');
      const toUser = await User.findById(tx.to).select('name email avatar');
      populatedTransactions.push({
        from: fromUser,
        to: toUser,
        amount: tx.amount
      });
    }

    res.json({
      success: true,
      suggestions: populatedTransactions,
      originalTransactionCount: result.originalTransactionCount,
      optimizedTransactionCount: result.optimizedTransactionCount,
      savings: result.savings
    });
  } catch (error) {
    next(error);
  }
};
