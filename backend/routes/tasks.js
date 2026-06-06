const express = require('express');
const router = express.Router();
const db = require('../db');

function withJoins(task) {
  const project = db.getById('projects', task.project_id);
  const member = task.assigned_to ? db.getById('members', task.assigned_to) : null;
  return {
    ...task,
    project_name: project?.name || null,
    assignee_name: member?.name || null,
    assignee_color: member?.avatar_color || null,
  };
}

const today = () => new Date().toISOString().split('T')[0];

router.get('/stats', (req, res) => {
  const tasks = db.getAll('tasks');
  const t = today();
  res.json({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && t.due_date < t && t.status !== 'done').length,
  });
});

router.get('/', (req, res) => {
  const { project_id, status } = req.query;
  let tasks = db.getAll('tasks');
  if (project_id) tasks = tasks.filter(t => t.project_id === Number(project_id));
  if (status) tasks = tasks.filter(t => t.status === status);
  tasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(tasks.map(withJoins));
});

router.get('/:id', (req, res) => {
  const task = db.getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(withJoins(task));
});

router.post('/', (req, res) => {
  const { project_id, title, description, status, priority, assigned_to, due_date } = req.body;
  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title are required' });
  if (!db.getById('projects', project_id)) return res.status(400).json({ error: 'Invalid project_id' });
  const task = db.insert('tasks', {
    project_id: Number(project_id),
    title,
    description: description || null,
    status: status || 'todo',
    priority: priority || 'medium',
    assigned_to: assigned_to ? Number(assigned_to) : null,
    due_date: due_date || null,
  });
  res.status(201).json(withJoins(task));
});

router.put('/:id', (req, res) => {
  const existing = db.getById('tasks', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const { project_id, title, description, status, priority, assigned_to, due_date } = req.body;
  const updated = db.update('tasks', req.params.id, {
    project_id: project_id ? Number(project_id) : existing.project_id,
    title: title || existing.title,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    assigned_to: assigned_to !== undefined ? (assigned_to ? Number(assigned_to) : null) : existing.assigned_to,
    due_date: due_date !== undefined ? due_date : existing.due_date,
  });
  res.json(withJoins(updated));
});

router.delete('/:id', (req, res) => {
  if (!db.getById('tasks', req.params.id)) return res.status(404).json({ error: 'Task not found' });
  db.delete('tasks', req.params.id);
  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;
