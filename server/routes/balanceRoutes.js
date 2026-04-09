const router = require('express').Router({ mergeParams: true });
const { getBalanceSummary, getPairwiseBalances, getBalanceGraph, getSettlementSuggestions } = require('../controllers/balanceController');
const { protect, groupMember } = require('../middleware/auth');

router.use(protect);
router.use(groupMember());

router.get('/summary', getBalanceSummary);
router.get('/pairwise', getPairwiseBalances);
router.get('/graph', getBalanceGraph);

module.exports = router;
