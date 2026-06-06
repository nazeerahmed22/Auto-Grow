const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all members
router.get('/', (req, res) => {
  try {
    const members = db.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = m.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = m.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = m.id AND t.status = 'in-progress') as in_progress_count
      FROM members m
      ORDER BY m.created_at ASC
    `).all();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one member
router.get('/:id', (req, res) => {
  try {
    const member = db.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = m.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = m.id AND t.status = 'done') as done_count
      FROM members m WHERE m.id = ?
    `).get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create member
router.post('/', (req, res) => {
  try {
    const { name, email, role, avatar_color } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
    const color = avatar_color || colors[Math.floor(Math.random() * colors.length)];
    const result = db.prepare(`
      INSERT INTO members (name, email, role, avatar_color) VALUES (?, ?, ?, ?)
    `).run(name, email, role || 'Developer', color);
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(member);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update member
router.put('/:id', (req, res) => {
  try {
    const { name, email, role, avatar_color } = req.body;
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Member not found' });
    db.prepare(`
      UPDATE members SET name = ?, email = ?, role = ?, avatar_color = ? WHERE id = ?
    `).run(
      name || existing.name,
      email || existing.email,
      role || existing.role,
      avatar_color || existing.avatar_color,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Member not found' });
    db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
