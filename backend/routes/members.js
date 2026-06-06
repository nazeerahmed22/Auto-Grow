const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const members = db.getAll('members');
  const tasks = db.getAll('tasks');
  const result = members
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(m => ({
      ...m,
      task_count: tasks.filter(t => t.assigned_to === m.id).length,
      done_count: tasks.filter(t => t.assigned_to === m.id && t.status === 'done').length,
      in_progress_count: tasks.filter(t => t.assigned_to === m.id && t.status === 'in-progress').length,
    }));
  res.json(result);
});

router.get('/:id', (req, res) => {
  const member = db.getById('members', req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  const tasks = db.getAll('tasks').filter(t => t.assigned_to === member.id);
  res.json({
    ...member,
    task_count: tasks.length,
    done_count: tasks.filter(t => t.status === 'done').length,
  });
});

router.post('/', (req, res) => {
  const { name, email, role, avatar_color } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const exists = db.getAll('members').find(m => m.email === email);
  if (exists) return res.status(400).json({ error: 'Email already exists' });
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  const member = db.insert('members', {
    name, email,
    role: role || 'Developer',
    avatar_color: avatar_color || colors[Math.floor(Math.random() * colors.length)],
  });
  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const existing = db.getById('members', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  const { name, email, role, avatar_color } = req.body;
  const updated = db.update('members', req.params.id, {
    name: name || existing.name,
    email: email || existing.email,
    role: role || existing.role,
    avatar_color: avatar_color || existing.avatar_color,
  });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (!db.getById('members', req.params.id)) return res.status(404).json({ error: 'Member not found' });
  db.delete('members', req.params.id);
  res.json({ message: 'Member deleted successfully' });
});

module.exports = router;
