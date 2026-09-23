const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let lookupEmail = email.toLowerCase().trim();
    if (lookupEmail === 'elena@cnykra.com') lookupEmail = 'pooja@cnykra.com';
    if (lookupEmail === 'marcus@cnykra.com') lookupEmail = 'rohan@cnykra.com';
    if (lookupEmail === 'sofia@cnykra.com') lookupEmail = 'sunita@cnykra.com';

    const user = await User.findOne({ email: lookupEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Use demo accounts shown on the login page.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Use demo accounts shown on the login page.' });
    }

    const payload = {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      initials: user.initials,
      color: user.color
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'cnykra_hotel_secret_key_2024', {
      expiresIn: '24h'
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      initials: user.initials,
      color: user.color,
      shift: user.shift,
      phone: user.phone
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
