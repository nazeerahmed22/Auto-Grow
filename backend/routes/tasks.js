const express = require('express');
const router = express.Router();
const db = require('../db');

// GET task stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
      FROM tasks
    `).get();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all tasks
router.get('/', (req, res) => {
  try {
    const { project_id, status } = req.query;
    let query = `
      SELECT t.*, p.name as project_name, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN members m ON t.assigned_to = m.id
      WHERE 1=1
    `;
    const params = [];
    if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    query += ' ORDER BY t.created_at DESC';
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one task
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, p.name as project_name, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN members m ON t.assigned_to = m.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', (req, res) => {
  try {
    const { project_id, title, description, status, priority, assigned_to, due_date } = req.body;
    if (!project_id || !title) return res.status(400).json({ error: 'project_id and title are required' });
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
    if (!project) return res.status(400).json({ error: 'Invalid project_id' });
    const result = db.prepare(`
      INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(project_id, title, description || null, status || 'todo', priority || 'medium', assigned_to || null, due_date || null);
    const task = db.prepare(`
      SELECT t.*, p.name as project_name, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN members m ON t.assigned_to = m.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task
router.put('/:id', (req, res) => {
  try {
    const { project_id, title, description, status, priority, assigned_to, due_date } = req.body;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    db.prepare(`
      UPDATE tasks SET project_id = ?, title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      project_id || existing.project_id,
      title || existing.title,
      description !== undefined ? description : existing.description,
      status || existing.status,
      priority || existing.priority,
      assigned_to !== undefined ? assigned_to : existing.assigned_to,
      due_date !== undefined ? due_date : existing.due_date,
      req.params.id
    );
    const updated = db.prepare(`
      SELECT t.*, p.name as project_name, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN members m ON t.assigned_to = m.id
      WHERE t.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
