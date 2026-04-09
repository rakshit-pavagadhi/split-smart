const router = require('express').Router({ mergeParams: true });
const { getCategoryBreakdown, getMonthlyTrends, getMemberContributions, exportCSV } = require('../controllers/analyticsController');
const { protect, groupMember } = require('../middleware/auth');

router.use(protect);
router.use(groupMember());

router.get('/category', getCategoryBreakdown);
router.get('/monthly', getMonthlyTrends);
router.get('/members', getMemberContributions);

module.exports = router;
