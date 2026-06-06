const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// GET /api/activity — global activity feed
router.get('/', auth, (req, res) => {
  const users = db.getAll('users');
  const projects = db.getAll('projects');
  const activities = db.getAll('activities')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(a => {
      const u = users.find(u => u.id === a.user_id);
      const p = projects.find(p => p.id === a.project_id);
      return {
        ...a,
        user_name: u?.name || 'Unknown',
        user_color: u?.avatar_color || '#6366f1',
        project_name: p?.name || null,
      };
    });
  res.json(activities);
});

// GET /api/projects/:id/activity
router.get('/project/:id', auth, (req, res) => {
  const users = db.getAll('users');
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const activities = db.getAll('activities')
    .filter(a => a.project_id === Number(req.params.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(a => {
      const u = users.find(u => u.id === a.user_id);
      return {
        ...a,
        user_name: u?.name || 'Unknown',
        user_color: u?.avatar_color || '#6366f1',
        project_name: project.name,
      };
    });
  res.json(activities);
});

module.exports = router;
