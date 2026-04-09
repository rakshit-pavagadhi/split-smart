const router = require('express').Router({ mergeParams: true });
const { exportCSV } = require('../controllers/analyticsController');
const { protect, groupMember } = require('../middleware/auth');

router.use(protect);
router.use(groupMember());

router.get('/csv', exportCSV);

module.exports = router;
