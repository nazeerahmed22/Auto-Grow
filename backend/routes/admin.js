const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { auth, isAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(auth, isAdmin);

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.getAll('users').map(safeUser);
  res.json(users);
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });

    const existing = db.findOne('users', u => u.email === email);
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, 10);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const user = db.insert('users', {
      name, email, password_hash,
      role: role === 'admin' ? 'admin' : 'member',
      avatar_color, title: '', bio: '', phone: '', timezone: 'UTC',
    });

    res.status(201).json(safeUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const user = db.getById('users', id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.delete('users', id);
  res.json({ message: 'User deleted' });
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'role must be admin or member' });
  const user = db.getById('users', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = db.update('users', req.params.id, { role });
  res.json(safeUser(updated));
});

module.exports = router;
