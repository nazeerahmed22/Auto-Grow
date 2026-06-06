const express = require('express');
const router = express.Router();
const db = require('../db');

function withTaskCounts(project) {
  const tasks = db.getAll('tasks').filter(t => t.project_id === project.id);
  return {
    ...project,
    task_count: tasks.length,
    total_tasks: tasks.length,
    done_count: tasks.filter(t => t.status === 'done').length,
    pending_count: tasks.filter(t => t.status !== 'done').length,
  };
}

router.get('/', (req, res) => {
  const projects = db.getAll('projects')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(withTaskCounts);
  res.json(projects);
});

router.get('/:id', (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(withTaskCounts(project));
});

router.get('/:id/tasks', (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const members = db.getAll('members');
  const tasks = db.getAll('tasks')
    .filter(t => t.project_id === Number(req.params.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(t => {
      const m = members.find(m => m.id === t.assigned_to) || null;
      return { ...t, assignee_name: m?.name || null, assignee_color: m?.avatar_color || null };
    });
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { name, description, status, priority, deadline } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const project = db.insert('projects', {
    name, description: description || null,
    status: status || 'active',
    priority: priority || 'medium',
    deadline: deadline || null,
  });
  res.status(201).json(withTaskCounts(project));
});

router.put('/:id', (req, res) => {
  const existing = db.getById('projects', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  const { name, description, status, priority, deadline } = req.body;
  const updated = db.update('projects', req.params.id, {
    name: name || existing.name,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    deadline: deadline !== undefined ? deadline : existing.deadline,
  });
  res.json(withTaskCounts(updated));
});

router.delete('/:id', (req, res) => {
  if (!db.getById('projects', req.params.id)) return res.status(404).json({ error: 'Project not found' });
  // cascade delete tasks
  const tasks = db.getAll('tasks').filter(t => t.project_id === Number(req.params.id));
  tasks.forEach(t => db.delete('tasks', t.id));
  db.delete('projects', req.params.id);
  res.json({ message: 'Project deleted successfully' });
});

module.exports = router;
