const express = require('express');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users — list all housekeepers (staff)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'housekeeper' }).select('-password');
    const staff = users.map(u => ({
      id: u.userId,
      name: u.name,
      initials: u.initials,
      role: u.title,
      shift: u.shift,
      color: u.color,
      phone: u.phone
    }));
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/activity — get recent activity logs
router.get('/activity', auth, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
