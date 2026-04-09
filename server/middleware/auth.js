const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Verify user is a member of the group
const groupMember = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const Group = require('../models/Group');
      const groupId = req.params[paramName];
      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const isMember = group.members.some(
        member => member.user.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }

      req.group = group;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { protect, groupMember };
