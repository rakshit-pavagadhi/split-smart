const router = require('express').Router();
const { createGroup, getGroups, getGroupById, joinGroup, getMembers, updateGroup, deleteGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { validate, createGroupSchema, joinGroupSchema } = require('../middleware/validate');

router.use(protect);

router.post('/', validate(createGroupSchema), createGroup);
router.get('/', getGroups);
router.post('/join', validate(joinGroupSchema), joinGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.get('/:id/members', getMembers);

module.exports = router;
