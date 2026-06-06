const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all projects
router.get('/', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') as pending_count
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one project
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') as pending_count
      FROM projects p WHERE p.id = ?
    `).get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET project tasks
router.get('/:id/tasks', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN members m ON t.assigned_to = m.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `).all(req.params.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', (req, res) => {
  try {
    const { name, description, status, priority, deadline } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = db.prepare(`
      INSERT INTO projects (name, description, status, priority, deadline, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(name, description || null, status || 'active', priority || 'medium', deadline || null);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project
router.put('/:id', (req, res) => {
  try {
    const { name, description, status, priority, deadline } = req.body;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    db.prepare(`
      UPDATE projects SET name = ?, description = ?, status = ?, priority = ?, deadline = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      status || existing.status,
      priority || existing.priority,
      deadline !== undefined ? deadline : existing.deadline,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
