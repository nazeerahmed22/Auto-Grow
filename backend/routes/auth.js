const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, avatar_color: user.avatar_color },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });

    const existing = db.findOne('users', u => u.email === email);
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, 10);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const user = db.insert('users', {
      name, email, password_hash, role: 'member',
      avatar_color, title: '', bio: '', phone: '', timezone: 'UTC',
    });

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = db.findOne('users', u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.getById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// PUT /api/auth/profile
router.put('/profile', auth, (req, res) => {
  const { name, email, title, bio, phone, timezone, avatar_color } = req.body;
  const user = db.getById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check email uniqueness if changed
  if (email && email !== user.email) {
    const dup = db.findOne('users', u => u.email === email && u.id !== user.id);
    if (dup) return res.status(409).json({ error: 'Email already in use' });
  }

  const updated = db.update('users', user.id, {
    name: name || user.name,
    email: email || user.email,
    title: title !== undefined ? title : user.title,
    bio: bio !== undefined ? bio : user.bio,
    phone: phone !== undefined ? phone : user.phone,
    timezone: timezone !== undefined ? timezone : user.timezone,
    avatar_color: avatar_color || user.avatar_color,
  });

  res.json(safeUser(updated));
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password required' });

    const user = db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 10);
    db.update('users', user.id, { password_hash });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
