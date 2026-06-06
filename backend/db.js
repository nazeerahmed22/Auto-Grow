const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data.json');

const SEED = {
  members: [
    { id: 1, name: 'Alice Johnson', email: 'alice@autogrow.io', role: 'Product Manager', avatar_color: '#6366f1', created_at: '2025-01-01T00:00:00.000Z' },
    { id: 2, name: 'Bob Martinez', email: 'bob@autogrow.io', role: 'Lead Developer', avatar_color: '#10b981', created_at: '2025-01-01T00:00:00.000Z' },
    { id: 3, name: 'Carol Smith', email: 'carol@autogrow.io', role: 'UI/UX Designer', avatar_color: '#f59e0b', created_at: '2025-01-01T00:00:00.000Z' },
    { id: 4, name: 'David Lee', email: 'david@autogrow.io', role: 'Backend Developer', avatar_color: '#ef4444', created_at: '2025-01-01T00:00:00.000Z' },
  ],
  projects: [
    { id: 1, name: 'Auto-Grow Platform', description: 'Main SaaS platform development with full feature set including dashboard, reporting, and analytics.', status: 'active', priority: 'high', deadline: '2025-03-31', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 2, name: 'Mobile App v2', description: 'Redesigned mobile application with new UI/UX patterns and offline support.', status: 'active', priority: 'high', deadline: '2025-04-15', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 3, name: 'API Integration Hub', description: 'Third-party API integrations including Slack, Jira, and GitHub connectors.', status: 'on-hold', priority: 'medium', deadline: '2025-05-01', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 4, name: 'Customer Portal', description: 'Self-service customer portal for account management and billing.', status: 'completed', priority: 'low', deadline: '2025-01-15', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
  ],
  tasks: [
    { id: 1, project_id: 1, title: 'Design system architecture', description: 'Define microservices, database schema, and API contracts.', status: 'done', priority: 'high', assigned_to: 2, due_date: '2025-01-10', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 2, project_id: 1, title: 'Build REST API endpoints', description: 'Implement all CRUD endpoints for projects, tasks, and members.', status: 'in-progress', priority: 'high', assigned_to: 4, due_date: '2025-02-15', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 3, project_id: 1, title: 'Implement dashboard UI', description: 'Build responsive dashboard with charts and KPI cards.', status: 'in-progress', priority: 'high', assigned_to: 3, due_date: '2025-02-20', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 4, project_id: 1, title: 'Auto reporting engine', description: 'Build the cron-based report generation system.', status: 'todo', priority: 'medium', assigned_to: 2, due_date: '2025-03-01', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 5, project_id: 2, title: 'Wireframes and prototypes', description: 'Create Figma wireframes for all app screens.', status: 'done', priority: 'high', assigned_to: 3, due_date: '2025-01-20', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 6, project_id: 2, title: 'React Native setup', description: 'Initialize RN project with navigation and state management.', status: 'done', priority: 'medium', assigned_to: 4, due_date: '2025-01-25', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 7, project_id: 2, title: 'Offline sync module', description: 'Implement offline data sync using local storage and conflict resolution.', status: 'in-progress', priority: 'high', assigned_to: 4, due_date: '2025-03-10', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 8, project_id: 3, title: 'Slack integration', description: 'Build Slack bot and webhook integration for notifications.', status: 'todo', priority: 'medium', assigned_to: 2, due_date: '2025-04-01', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 9, project_id: 3, title: 'GitHub connector', description: 'Sync GitHub issues and PRs with project tasks automatically.', status: 'todo', priority: 'medium', assigned_to: 4, due_date: '2025-04-15', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 10, project_id: 4, title: 'User authentication flow', description: 'Login, registration, and password reset pages.', status: 'done', priority: 'high', assigned_to: 3, due_date: '2025-01-05', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
    { id: 11, project_id: 4, title: 'Billing integration', description: 'Stripe payment and subscription management.', status: 'done', priority: 'high', assigned_to: 2, due_date: '2025-01-10', created_at: '2025-01-01T00:00:00.000Z', updated_at: '2025-01-01T00:00:00.000Z' },
  ],
  reports: [],
  _seq: { members: 4, projects: 4, tasks: 11, reports: 0 },
};

let _store = null;

function load() {
  if (_store) return _store;
  if (fs.existsSync(FILE)) {
    try {
      _store = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      return _store;
    } catch (_) {}
  }
  _store = JSON.parse(JSON.stringify(SEED));
  save();
  return _store;
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(_store, null, 2));
}

function nextId(table) {
  const s = load();
  s._seq[table] = (s._seq[table] || 0) + 1;
  return s._seq[table];
}

const db = {
  getAll(table) { return load()[table] || []; },

  getById(table, id) {
    return (load()[table] || []).find(r => r.id === Number(id)) || null;
  },

  insert(table, data) {
    const s = load();
    const id = nextId(table);
    const now = new Date().toISOString();
    const row = { id, created_at: now, updated_at: now, ...data };
    s[table].push(row);
    save();
    return row;
  },

  update(table, id, data) {
    const s = load();
    const idx = s[table].findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    s[table][idx] = { ...s[table][idx], ...data, updated_at: new Date().toISOString() };
    save();
    return s[table][idx];
  },

  delete(table, id) {
    const s = load();
    const idx = s[table].findIndex(r => r.id === Number(id));
    if (idx === -1) return false;
    s[table].splice(idx, 1);
    save();
    return true;
  },
};

load(); // initialise on require
module.exports = db;
