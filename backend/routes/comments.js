const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// DELETE /api/comments/:id
router.delete('/:id', auth, (req, res) => {
  const comment = db.getById('comments', req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  db.delete('comments', req.params.id);
  res.json({ message: 'Comment deleted' });
});

module.exports = router;
