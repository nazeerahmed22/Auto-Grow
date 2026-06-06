const express = require('express');
const router = express.Router();
const db = require('../db');

function generateReportData(type) {
  const today = new Date().toISOString().split('T')[0];

  // Project stats
  const projectStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'on-hold' THEN 1 ELSE 0 END) as on_hold
    FROM projects
  `).get();

  // Task stats
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN due_date < ? AND status != 'done' THEN 1 ELSE 0 END) as overdue
    FROM tasks
  `).get(today);

  // Overdue tasks detail
  const overdueTasks = db.prepare(`
    SELECT t.id, t.title, t.due_date, t.priority, p.name as project_name, m.name as assignee_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN members m ON t.assigned_to = m.id
    WHERE t.due_date < ? AND t.status != 'done'
    ORDER BY t.due_date ASC
    LIMIT 10
  `).all(today);

  // Top performing members
  const topMembers = db.prepare(`
    SELECT m.id, m.name, m.role, m.avatar_color,
      COUNT(CASE WHEN t.status = 'done' THEN 1 END) as tasks_done,
      COUNT(t.id) as total_tasks
    FROM members m
    LEFT JOIN tasks t ON t.assigned_to = m.id
    GROUP BY m.id
    ORDER BY tasks_done DESC
    LIMIT 5
  `).all();

  // Projects with most pending tasks
  const busyProjects = db.prepare(`
    SELECT p.id, p.name, p.status, p.priority,
      COUNT(CASE WHEN t.status != 'done' THEN 1 END) as pending_tasks,
      COUNT(t.id) as total_tasks
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY pending_tasks DESC
    LIMIT 5
  `).all();

  // High priority pending tasks
  const highPriorityPending = db.prepare(`
    SELECT t.id, t.title, t.status, t.due_date, p.name as project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.priority = 'high' AND t.status != 'done'
    ORDER BY t.due_date ASC NULLS LAST
    LIMIT 5
  `).all();

  const labels = {
    daily: `Daily Report - ${today}`,
    weekly: `Weekly Report - Week of ${today}`,
    monthly: `Monthly Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
  };

  return {
    title: labels[type],
    content: {
      generated_at: new Date().toISOString(),
      period: type,
      summary: {
        projects: projectStats,
        tasks: taskStats
      },
      overdue_tasks: overdueTasks,
      top_members: topMembers,
      busy_projects: busyProjects,
      high_priority_pending: highPriorityPending
    }
  };
}

// GET all reports
router.get('/', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT id, type, title, generated_at,
        json_extract(content, '$.summary.tasks.total') as total_tasks,
        json_extract(content, '$.summary.projects.total') as total_projects,
        json_extract(content, '$.summary.tasks.done') as tasks_done,
        json_extract(content, '$.summary.tasks.overdue') as tasks_overdue
      FROM reports
      ORDER BY generated_at DESC
    `).all();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one report
router.get('/:id', (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.content = JSON.parse(report.content);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate report
router.post('/generate', (req, res) => {
  try {
    const type = req.body.type || 'daily';
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be daily, weekly, or monthly' });
    }

    const { title, content } = generateReportData(type);
    const result = db.prepare(`
      INSERT INTO reports (type, title, content) VALUES (?, ?, ?)
    `).run(type, title, JSON.stringify(content));

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    report.content = JSON.parse(report.content);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE report
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Report not found' });
    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, generateReportData };
