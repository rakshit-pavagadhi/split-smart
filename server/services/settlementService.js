/**
 * Min-Cash-Flow Settlement Optimization Algorithm
 * 
 * Goal: Minimize the number of transactions required to settle all debts.
 * Complexity: O(n log n) due to sorting
 * 
 * Steps:
 * 1. Calculate net balance of each user
 * 2. Separate creditors (+) and debtors (-)
 * 3. Sort both by amount (descending)
 * 4. Greedy match: pair largest debtor with largest creditor
 * 5. Settle minimum of the two amounts
 * 6. Repeat until all balances are zero
 */

const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

/**
 * Calculate net balances for all members in a group
 */
const calculateNetBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId });
  const completedSettlements = await Settlement.find({ 
    group: groupId, 
    status: 'completed' 
  });

  const balances = {};

  // Process expenses
  for (const expense of expenses) {
    const payerId = expense.paidBy.toString();

    // Payer gets credit for the full amount
    balances[payerId] = (balances[payerId] || 0) + expense.amount;

    // Each split member gets debited their share
    for (const split of expense.splits) {
      const userId = split.user.toString();
      balances[userId] = (balances[userId] || 0) - split.amount;
    }
  }

  // Process completed settlements
  for (const settlement of completedSettlements) {
    const fromId = settlement.from.toString();
    const toId = settlement.to.toString();

    // Payer (from) reduces their debt
    balances[fromId] = (balances[fromId] || 0) + settlement.amount;
    // Payee (to) reduces their credit
    balances[toId] = (balances[toId] || 0) - settlement.amount;
  }

  return balances;
};

/**
 * Calculate pairwise debts between all members
 */
const calculatePairwiseDebts = async (groupId) => {
  const expenses = await Expense.find({ group: groupId });
  const completedSettlements = await Settlement.find({ 
    group: groupId, 
    status: 'completed' 
  });

  // pairwise[A][B] = amount A owes B
  const pairwise = {};

  for (const expense of expenses) {
    const payerId = expense.paidBy.toString();

    for (const split of expense.splits) {
      const userId = split.user.toString();
      if (userId === payerId) continue;

      if (!pairwise[userId]) pairwise[userId] = {};
      pairwise[userId][payerId] = (pairwise[userId][payerId] || 0) + split.amount;
    }
  }

  // Apply settlements
  for (const settlement of completedSettlements) {
    const fromId = settlement.from.toString();
    const toId = settlement.to.toString();

    if (pairwise[fromId] && pairwise[fromId][toId]) {
      pairwise[fromId][toId] -= settlement.amount;
      if (pairwise[fromId][toId] <= 0.01) {
        // If overpaid, reverse the debt
        if (pairwise[fromId][toId] < -0.01) {
          if (!pairwise[toId]) pairwise[toId] = {};
          pairwise[toId][fromId] = (pairwise[toId][fromId] || 0) + Math.abs(pairwise[fromId][toId]);
        }
        delete pairwise[fromId][toId];
      }
    }
  }

  // Format as array
  const debts = [];
  for (const from in pairwise) {
    for (const to in pairwise[from]) {
      if (pairwise[from][to] > 0.01) {
        debts.push({
          from,
          to,
          amount: Math.round(pairwise[from][to] * 100) / 100
        });
      }
    }
  }

  return debts;
};

/**
 * Min-Cash-Flow Algorithm - Minimize number of settlement transactions
 */
const minimizeCashFlow = async (groupId) => {
  const balances = await calculateNetBalances(groupId);

  // Separate into creditors and debtors
  const creditors = [];
  const debtors = [];

  for (const userId in balances) {
    const balance = Math.round(balances[userId] * 100) / 100;
    if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy matching
  const transactions = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  // Count original pairwise debts to show savings
  const pairwiseDebts = await calculatePairwiseDebts(groupId);
  const originalCount = pairwiseDebts.length;
  const optimizedCount = transactions.length;

  return {
    transactions,
    originalTransactionCount: originalCount,
    optimizedTransactionCount: optimizedCount,
    savings: originalCount - optimizedCount
  };
};

/**
 * Get balance graph data for visualization
 */
const getBalanceGraphData = async (groupId) => {
  const debts = await calculatePairwiseDebts(groupId);
  const balances = await calculateNetBalances(groupId);

  // Create nodes (unique users)
  const userIds = new Set();
  for (const debt of debts) {
    userIds.add(debt.from);
    userIds.add(debt.to);
  }
  for (const userId in balances) {
    if (Math.abs(balances[userId]) > 0.01) {
      userIds.add(userId);
    }
  }

  const nodes = Array.from(userIds).map(id => ({
    id,
    balance: Math.round((balances[id] || 0) * 100) / 100
  }));

  // Create edges
  const edges = debts.map(debt => ({
    source: debt.from,
    target: debt.to,
    amount: debt.amount
  }));

  return { nodes, edges };
};

module.exports = {
  calculateNetBalances,
  calculatePairwiseDebts,
  minimizeCashFlow,
  getBalanceGraphData
};
