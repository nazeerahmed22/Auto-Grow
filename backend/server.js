const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const membersRouter = require('./routes/members');
const { router: reportsRouter, generateReportData } = require('./routes/reports');

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/members', membersRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard summary endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const projectStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'on-hold' THEN 1 ELSE 0 END) as on_hold
      FROM projects
    `).get();

    const taskStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN due_date < ? AND status != 'done' THEN 1 ELSE 0 END) as overdue
      FROM tasks
    `).get(today);

    const memberCount = db.prepare('SELECT COUNT(*) as total FROM members').get();

    const recentProjects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') as pending_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks
      FROM projects p
      ORDER BY p.updated_at DESC
      LIMIT 5
    `).all();

    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, m.name as assignee_name, m.avatar_color as assignee_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN members m ON t.assigned_to = m.id
      ORDER BY t.updated_at DESC
      LIMIT 5
    `).all();

    res.json({
      projects: projectStats,
      tasks: taskStats,
      members: memberCount,
      recent_projects: recentProjects,
      recent_tasks: recentTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron job: Daily report at midnight
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Generating daily report...');
  try {
    const { title, content } = generateReportData('daily');
    db.prepare('INSERT INTO reports (type, title, content) VALUES (?, ?, ?)').run('daily', title, JSON.stringify(content));
    console.log('[CRON] Daily report generated successfully');
  } catch (err) {
    console.error('[CRON] Failed to generate daily report:', err.message);
  }
});

// Cron job: Weekly report every Sunday at midnight
cron.schedule('0 0 * * 0', () => {
  console.log('[CRON] Generating weekly report...');
  try {
    const { title, content } = generateReportData('weekly');
    db.prepare('INSERT INTO reports (type, title, content) VALUES (?, ?, ?)').run('weekly', title, JSON.stringify(content));
    console.log('[CRON] Weekly report generated successfully');
  } catch (err) {
    console.error('[CRON] Failed to generate weekly report:', err.message);
  }
});

// Cron job: Monthly report on the 1st of each month at midnight
cron.schedule('0 0 1 * *', () => {
  console.log('[CRON] Generating monthly report...');
  try {
    const { title, content } = generateReportData('monthly');
    db.prepare('INSERT INTO reports (type, title, content) VALUES (?, ?, ?)').run('monthly', title, JSON.stringify(content));
    console.log('[CRON] Monthly report generated successfully');
  } catch (err) {
    console.error('[CRON] Failed to generate monthly report:', err.message);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Auto-Grow backend running on http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

module.exports = app;
