const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/notifications
router.get('/', (req, res) => {
  const notifications = db.getAll('notifications')
    .filter(n => n.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(notifications);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const n = db.getById('notifications', req.params.id);
  if (!n || n.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  const updated = db.update('notifications', req.params.id, { read: true });
  res.json(updated);
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  const all = db.getAll('notifications').filter(n => n.user_id === req.user.id && !n.read);
  all.forEach(n => db.update('notifications', n.id, { read: true }));
  res.json({ message: 'All notifications marked as read', count: all.length });
});

// DELETE /api/notifications/:id
router.delete('/:id', (req, res) => {
  const n = db.getById('notifications', req.params.id);
  if (!n || n.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  db.delete('notifications', req.params.id);
  res.json({ message: 'Notification deleted' });
});

module.exports = router;
