const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const membersRouter = require('./routes/members');
const { router: reportsRouter, generateReportData } = require('./routes/reports');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');
const commentsRouter = require('./routes/comments');
const activityRouter = require('./routes/activity');

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/members', membersRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const projects = db.getAll('projects');
    const tasks = db.getAll('tasks');
    const users = db.getAll('users');
    const members = db.getAll('members');

    const projectStats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      on_hold: projects.filter(p => p.status === 'on-hold').length,
    };

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length,
    };

    const memberStats = { total: users.filter(u => u.role === 'member').length };

    const recentProjects = projects
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(p => {
        const pt = tasks.filter(t => t.project_id === p.id);
        return { ...p, total_tasks: pt.length, done_count: pt.filter(t => t.status === 'done').length, pending_count: pt.filter(t => t.status !== 'done').length };
      });

    const recentTasks = tasks
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(t => {
        const p = projects.find(p => p.id === t.project_id);
        const u = users.find(u => u.id === t.assigned_to);
        return { ...t, project_name: p?.name || null, assignee_name: u?.name || null, assignee_color: u?.avatar_color || null };
      });

    const recentActivities = db.getAll('activities')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(a => {
        const u = users.find(u => u.id === a.user_id);
        const p = projects.find(p => p.id === a.project_id);
        return { ...a, user_name: u?.name || 'Unknown', user_color: u?.avatar_color || '#6366f1', project_name: p?.name || null };
      });

    res.json({ projects: projectStats, tasks: taskStats, members: memberStats, recent_projects: recentProjects, recent_tasks: recentTasks, recent_activities: recentActivities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function saveReport(type) {
  try {
    const { title, content } = generateReportData(type);
    db.insert('reports', { type, title, content, generated_at: new Date().toISOString() });
    console.log(`[CRON] ${type} report generated`);
  } catch (err) {
    console.error(`[CRON] Failed to generate ${type} report:`, err.message);
  }
}

// Recurring task cron: create new instances of repeat tasks daily
cron.schedule('0 6 * * *', () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = db.getAll('tasks').filter(t => t.repeat && t.repeat !== 'none' && t.status === 'done');
    tasks.forEach(task => {
      if (!task.due_date) return;
      const due = new Date(task.due_date);
      const now = new Date();
      let nextDue = null;
      if (task.repeat === 'daily') {
        nextDue = new Date(now);
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (task.repeat === 'weekly') {
        nextDue = new Date(due);
        while (nextDue <= now) nextDue.setDate(nextDue.getDate() + 7);
      } else if (task.repeat === 'monthly') {
        nextDue = new Date(due);
        while (nextDue <= now) nextDue.setMonth(nextDue.getMonth() + 1);
      }
      if (nextDue) {
        const nextDateStr = nextDue.toISOString().split('T')[0];
        const alreadyExists = db.getAll('tasks').some(t =>
          t.title === task.title && t.project_id === task.project_id && t.due_date === nextDateStr
        );
        if (!alreadyExists) {
          db.insert('tasks', {
            project_id: task.project_id,
            title: task.title,
            description: task.description,
            status: 'todo',
            priority: task.priority,
            assigned_to: task.assigned_to,
            due_date: nextDateStr,
            repeat: task.repeat,
            notify_assignee: task.notify_assignee,
            notify_creator: task.notify_creator,
            creator_id: task.creator_id,
            watchers: task.watchers || [],
            attachments: [],
            checklist: [],
          });
          console.log(`[CRON] Created recurring task: ${task.title}`);
        }
      }
    });
  } catch (err) {
    console.error('[CRON] Recurring task error:', err.message);
  }
});

cron.schedule('0 0 * * *', () => saveReport('daily'));
cron.schedule('0 0 * * 0', () => saveReport('weekly'));
cron.schedule('0 0 1 * *', () => saveReport('monthly'));

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Auto-Grow backend running on http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

module.exports = app;
