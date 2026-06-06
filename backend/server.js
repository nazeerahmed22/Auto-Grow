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

    const memberStats = { total: members.length };

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
        const m = members.find(m => m.id === t.assigned_to);
        return { ...t, project_name: p?.name || null, assignee_name: m?.name || null, assignee_color: m?.avatar_color || null };
      });

    res.json({ projects: projectStats, tasks: taskStats, members: memberStats, recent_projects: recentProjects, recent_tasks: recentTasks });
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
