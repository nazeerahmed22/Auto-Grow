const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

function withTaskCounts(project) {
  const tasks = db.getAll('tasks').filter(t => t.project_id === project.id);
  const users = db.getAll('users');
  const member_ids = project.member_ids || [];
  const members = member_ids.map(id => {
    const u = users.find(u => u.id === id);
    if (!u) return null;
    const { password_hash, ...safe } = u;
    return safe;
  }).filter(Boolean);
  return {
    ...project,
    task_count: tasks.length,
    total_tasks: tasks.length,
    done_count: tasks.filter(t => t.status === 'done').length,
    pending_count: tasks.filter(t => t.status !== 'done').length,
    members,
  };
}

router.get('/', auth, (req, res) => {
  const projects = db.getAll('projects')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(withTaskCounts);
  res.json(projects);
});

router.get('/:id', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(withTaskCounts(project));
});

router.get('/:id/tasks', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const users = db.getAll('users');
  const tasks = db.getAll('tasks')
    .filter(t => t.project_id === Number(req.params.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(t => {
      const u = t.assigned_to ? users.find(u => u.id === t.assigned_to) : null;
      return { ...t, assignee_name: u?.name || null, assignee_color: u?.avatar_color || null };
    });
  res.json(tasks);
});

router.get('/:id/members', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const users = db.getAll('users');
  const member_ids = project.member_ids || [];
  const members = member_ids.map(id => {
    const u = users.find(u => u.id === id);
    if (!u) return null;
    const { password_hash, ...safe } = u;
    return safe;
  }).filter(Boolean);
  res.json(members);
});

router.post('/:id/members', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const user = db.getById('users', user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const member_ids = project.member_ids || [];
  if (!member_ids.includes(Number(user_id))) {
    member_ids.push(Number(user_id));
    db.update('projects', project.id, { member_ids });
    db.logActivity(project.id, req.user.id, 'member_added', `${req.user.name} added ${user.name} to the project`);
  }
  res.json(withTaskCounts(db.getById('projects', project.id)));
});

router.delete('/:id/members/:userId', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const userId = Number(req.params.userId);
  const member_ids = (project.member_ids || []).filter(id => id !== userId);
  db.update('projects', project.id, { member_ids });
  const user = db.getById('users', userId);
  db.logActivity(project.id, req.user.id, 'member_removed', `${req.user.name} removed ${user?.name || 'a member'} from the project`);
  res.json(withTaskCounts(db.getById('projects', project.id)));
});

router.post('/', auth, (req, res) => {
  const { name, description, status, priority, deadline, member_ids } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const project = db.insert('projects', {
    name, description: description || null,
    status: status || 'active',
    priority: priority || 'medium',
    deadline: deadline || null,
    member_ids: member_ids || [],
  });
  db.logActivity(project.id, req.user.id, 'project_created', `${req.user.name} created project "${project.name}"`);
  res.status(201).json(withTaskCounts(project));
});

router.put('/:id', auth, (req, res) => {
  const existing = db.getById('projects', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  const { name, description, status, priority, deadline, member_ids } = req.body;
  const updated = db.update('projects', req.params.id, {
    name: name || existing.name,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    deadline: deadline !== undefined ? deadline : existing.deadline,
    member_ids: member_ids !== undefined ? member_ids : existing.member_ids,
  });
  db.logActivity(updated.id, req.user.id, 'project_updated', `${req.user.name} updated project "${updated.name}"`);
  res.json(withTaskCounts(updated));
});

router.delete('/:id', auth, (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const tasks = db.getAll('tasks').filter(t => t.project_id === Number(req.params.id));
  tasks.forEach(t => db.delete('tasks', t.id));
  db.delete('projects', req.params.id);
  res.json({ message: 'Project deleted successfully' });
});

module.exports = router;
