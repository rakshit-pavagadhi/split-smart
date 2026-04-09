const router = require('express').Router({ mergeParams: true });
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, groupMember } = require('../middleware/auth');
const { validate, addExpenseSchema } = require('../middleware/validate');

router.use(protect);
router.use(groupMember());

router.post('/', validate(addExpenseSchema), addExpense);
router.get('/', getExpenses);
router.put('/:eid', updateExpense);
router.delete('/:eid', deleteExpense);

module.exports = router;
