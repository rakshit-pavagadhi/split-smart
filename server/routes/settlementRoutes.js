const router = require('express').Router({ mergeParams: true });
const { createSettlement, getSettlements, updateSettlementStatus } = require('../controllers/settlementController');
const { getSettlementSuggestions } = require('../controllers/balanceController');
const { protect, groupMember } = require('../middleware/auth');
const { validate, createSettlementSchema } = require('../middleware/validate');

router.use(protect);
router.use(groupMember());

router.get('/suggestions', getSettlementSuggestions);
router.post('/', validate(createSettlementSchema), createSettlement);
router.get('/', getSettlements);
router.put('/:sid', updateSettlementStatus);

module.exports = router;
