const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');
const { sendTaskNotification } = require('../utils/email');

function withJoins(task) {
  const project = db.getById('projects', task.project_id);
  const users = db.getAll('users');
  const assignee = task.assigned_to ? users.find(u => u.id === task.assigned_to) : null;
  const creator = task.creator_id ? users.find(u => u.id === task.creator_id) : null;
  return {
    ...task,
    project_name: project?.name || null,
    assignee_name: assignee?.name || null,
    assignee_color: assignee?.avatar_color || null,
    creator_name: creator?.name || null,
  };
}

const today = () => new Date().toISOString().split('T')[0];

router.get('/stats', auth, (req, res) => {
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

router.get('/', auth, (req, res) => {
  const { project_id, status } = req.query;
  let tasks = db.getAll('tasks');
  if (project_id) tasks = tasks.filter(t => t.project_id === Number(project_id));
  if (status) tasks = tasks.filter(t => t.status === status);
  tasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(tasks.map(withJoins));
});

router.get('/:id', auth, (req, res) => {
  const task = db.getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(withJoins(task));
});

// GET /api/tasks/:taskId/comments
router.get('/:taskId/comments', auth, (req, res) => {
  const task = db.getById('tasks', req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const users = db.getAll('users');
  const comments = db.getAll('comments')
    .filter(c => c.task_id === Number(req.params.taskId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(c => {
      const u = users.find(u => u.id === c.user_id);
      return { ...c, user_name: u?.name || 'Unknown', user_color: u?.avatar_color || '#6366f1' };
    });
  res.json(comments);
});

// POST /api/tasks/:taskId/comments
router.post('/:taskId/comments', auth, (req, res) => {
  const task = db.getById('tasks', req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const comment = db.insert('comments', {
    task_id: Number(req.params.taskId),
    user_id: req.user.id,
    text,
  });
  // Notify watchers
  const watchers = task.watchers || [];
  watchers.forEach(uid => {
    if (uid !== req.user.id) {
      db.createNotification(uid, 'comment_added', `${req.user.name} commented on task "${task.title}"`, `/tasks`);
    }
  });
  const project = db.getById('projects', task.project_id);
  db.logActivity(task.project_id, req.user.id, 'comment_added', `${req.user.name} commented on "${task.title}"`);
  const u = db.getById('users', req.user.id);
  res.status(201).json({ ...comment, user_name: u?.name || 'Unknown', user_color: u?.avatar_color || '#6366f1' });
});

router.post('/', auth, (req, res) => {
  const { project_id, title, description, status, priority, assigned_to, due_date, repeat, notify_assignee, notify_creator, watchers, checklist } = req.body;
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
    repeat: repeat || 'none',
    notify_assignee: notify_assignee || false,
    notify_creator: notify_creator || false,
    creator_id: req.user.id,
    watchers: watchers || [],
    attachments: [],
    checklist: checklist || [],
  });

  const project = db.getById('projects', project_id);

  // Notify assignee
  if (task.assigned_to && task.assigned_to !== req.user.id) {
    db.createNotification(task.assigned_to, 'task_assigned', `You were assigned to task "${task.title}" in ${project?.name || 'a project'}`, `/tasks`);
    if (notify_assignee) {
      const assignee = db.getById('users', task.assigned_to);
      if (assignee) {
        sendTaskNotification({
          to: assignee.email,
          subject: `New task assigned: ${task.title}`,
          taskTitle: task.title,
          projectName: project?.name || '',
          assigneeName: assignee.name,
          dueDate: task.due_date,
          message: `You have been assigned a new task.`,
        }).catch(() => {});
      }
    }
  }

  db.logActivity(task.project_id, req.user.id, 'task_created', `${req.user.name} created task "${task.title}"`);
  res.status(201).json(withJoins(task));
});

router.put('/:id', auth, (req, res) => {
  const existing = db.getById('tasks', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const { project_id, title, description, status, priority, assigned_to, due_date, repeat, notify_assignee, notify_creator, watchers, checklist } = req.body;

  const prevAssignee = existing.assigned_to;
  const updated = db.update('tasks', req.params.id, {
    project_id: project_id ? Number(project_id) : existing.project_id,
    title: title || existing.title,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    assigned_to: assigned_to !== undefined ? (assigned_to ? Number(assigned_to) : null) : existing.assigned_to,
    due_date: due_date !== undefined ? due_date : existing.due_date,
    repeat: repeat !== undefined ? repeat : existing.repeat,
    notify_assignee: notify_assignee !== undefined ? notify_assignee : existing.notify_assignee,
    notify_creator: notify_creator !== undefined ? notify_creator : existing.notify_creator,
    watchers: watchers !== undefined ? watchers : existing.watchers,
    checklist: checklist !== undefined ? checklist : existing.checklist,
  });

  const project = db.getById('projects', updated.project_id);

  // Notify new assignee if changed
  if (updated.assigned_to && updated.assigned_to !== prevAssignee && updated.assigned_to !== req.user.id) {
    db.createNotification(updated.assigned_to, 'task_assigned', `You were assigned to task "${updated.title}" in ${project?.name || 'a project'}`, `/tasks`);
  }

  // Notify watchers of update
  const watcherList = updated.watchers || [];
  watcherList.forEach(uid => {
    if (uid !== req.user.id) {
      db.createNotification(uid, 'task_updated', `Task "${updated.title}" was updated by ${req.user.name}`, `/tasks`);
    }
  });

  // Notify creator
  if (updated.notify_creator && updated.creator_id && updated.creator_id !== req.user.id) {
    db.createNotification(updated.creator_id, 'task_updated', `Task "${updated.title}" was updated`, `/tasks`);
  }

  db.logActivity(updated.project_id, req.user.id, 'task_updated', `${req.user.name} updated task "${updated.title}"`);
  res.json(withJoins(updated));
});

router.delete('/:id', auth, (req, res) => {
  const task = db.getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.deleteWhere('comments', c => c.task_id === task.id);
  db.delete('tasks', req.params.id);
  db.logActivity(task.project_id, req.user.id, 'task_deleted', `${req.user.name} deleted task "${task.title}"`);
  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;
