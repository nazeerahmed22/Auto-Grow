const express = require('express');
const router = express.Router();
const db = require('../db');

function generateReportData(type) {
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

  const overdueTasks = tasks
    .filter(t => t.due_date && t.due_date < today && t.status !== 'done')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 10)
    .map(t => {
      const p = projects.find(p => p.id === t.project_id);
      const m = members.find(m => m.id === t.assigned_to);
      return { id: t.id, title: t.title, due_date: t.due_date, priority: t.priority, project_name: p?.name || null, assignee_name: m?.name || null };
    });

  const topMembers = members.map(m => {
    const mt = tasks.filter(t => t.assigned_to === m.id);
    return { id: m.id, name: m.name, role: m.role, avatar_color: m.avatar_color, tasks_done: mt.filter(t => t.status === 'done').length, total_tasks: mt.length };
  }).sort((a, b) => b.tasks_done - a.tasks_done).slice(0, 5);

  const busyProjects = projects.map(p => {
    const pt = tasks.filter(t => t.project_id === p.id);
    return { id: p.id, name: p.name, status: p.status, priority: p.priority, pending_tasks: pt.filter(t => t.status !== 'done').length, total_tasks: pt.length };
  }).sort((a, b) => b.pending_tasks - a.pending_tasks).slice(0, 5);

  const highPriorityPending = tasks
    .filter(t => t.priority === 'high' && t.status !== 'done')
    .sort((a, b) => (a.due_date || 'z').localeCompare(b.due_date || 'z'))
    .slice(0, 5)
    .map(t => {
      const p = projects.find(p => p.id === t.project_id);
      return { id: t.id, title: t.title, status: t.status, due_date: t.due_date, project_name: p?.name || null };
    });

  const labels = {
    daily: `Daily Report - ${today}`,
    weekly: `Weekly Report - Week of ${today}`,
    monthly: `Monthly Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
  };

  return {
    title: labels[type],
    content: {
      generated_at: new Date().toISOString(),
      period: type,
      summary: { projects: projectStats, tasks: taskStats },
      overdue_tasks: overdueTasks,
      top_members: topMembers,
      busy_projects: busyProjects,
      high_priority_pending: highPriorityPending,
    },
  };
}

router.get('/', (req, res) => {
  const reports = db.getAll('reports')
    .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at))
    .map(r => {
      const c = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
      return {
        id: r.id, type: r.type, title: r.title, generated_at: r.generated_at,
        total_projects: c?.summary?.projects?.total || 0,
        total_tasks: c?.summary?.tasks?.total || 0,
        tasks_done: c?.summary?.tasks?.done || 0,
        tasks_overdue: c?.summary?.tasks?.overdue || 0,
      };
    });
  res.json(reports);
});

router.get('/:id', (req, res) => {
  const report = db.getById('reports', req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  const content = typeof report.content === 'string' ? JSON.parse(report.content) : report.content;
  res.json({ ...report, content });
});

router.post('/generate', (req, res) => {
  const type = req.body.type || 'daily';
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be daily, weekly, or monthly' });
  }
  const { title, content } = generateReportData(type);
  const report = db.insert('reports', { type, title, content, generated_at: new Date().toISOString() });
  res.status(201).json({ ...report, content });
});

router.delete('/:id', (req, res) => {
  if (!db.getById('reports', req.params.id)) return res.status(404).json({ error: 'Report not found' });
  db.delete('reports', req.params.id);
  res.json({ message: 'Report deleted successfully' });
});

module.exports = { router, generateReportData };
