const Group = require('../models/Group');
const User = require('../models/User');

// @desc   Create group
// @route  POST /api/groups
exports.createGroup = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;

    const group = await Group.create({
      name,
      type,
      description,
      members: [{ user: req.user._id, role: 'admin' }],
      createdBy: req.user._id
    });

    await group.populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc   Get user's groups
// @route  GET /api/groups
exports.getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isActive: true
    })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

    res.json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};

// @desc   Get group by ID
// @route  GET /api/groups/:id
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc   Join group by invite code
// @route  POST /api/groups/join
exports.joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });

    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if already a member
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    await group.populate('members.user', 'name email avatar');

    res.json({ success: true, message: 'Joined group successfully', group });
  } catch (error) {
    next(error);
  }
};

// @desc   Get group members
// @route  GET /api/groups/:id/members
exports.getMembers = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ success: true, members: group.members });
  } catch (error) {
    next(error);
  }
};

// @desc   Update group
// @route  PUT /api/groups/:id
exports.updateGroup = async (req, res, next) => {
  try {
    const { name, description, type } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can update
    const memberEntry = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!memberEntry || memberEntry.role !== 'admin') {
      return res.status(403).json({ message: 'Only group admin can update' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (type) group.type = type;

    await group.save();
    await group.populate('members.user', 'name email avatar');

    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete group (soft delete)
// @route  DELETE /api/groups/:id
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberEntry = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!memberEntry || memberEntry.role !== 'admin') {
      return res.status(403).json({ message: 'Only group admin can delete' });
    }

    group.isActive = false;
    await group.save();

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};
