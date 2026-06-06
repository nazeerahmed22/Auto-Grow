const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const FILE = path.join(__dirname, 'data.json');

function buildSeed() {
  const now = '2025-01-01T00:00:00.000Z';
  const adminHash = bcrypt.hashSync('admin123', 10);
  const memberHash = bcrypt.hashSync('password123', 10);

  return {
    users: [
      { id: 1, name: 'Admin User', email: 'admin@autogrow.io', password_hash: adminHash, role: 'admin', avatar_color: '#6366f1', title: 'System Administrator', bio: 'Auto-Grow platform admin', phone: '', timezone: 'UTC', created_at: now, updated_at: now },
      { id: 2, name: 'Alice Johnson', email: 'alice@autogrow.io', password_hash: memberHash, role: 'member', avatar_color: '#6366f1', title: 'Product Manager', bio: '', phone: '', timezone: 'UTC', created_at: now, updated_at: now },
      { id: 3, name: 'Bob Martinez', email: 'bob@autogrow.io', password_hash: memberHash, role: 'member', avatar_color: '#10b981', title: 'Lead Developer', bio: '', phone: '', timezone: 'UTC', created_at: now, updated_at: now },
      { id: 4, name: 'Carol Smith', email: 'carol@autogrow.io', password_hash: memberHash, role: 'member', avatar_color: '#f59e0b', title: 'UI/UX Designer', bio: '', phone: '', timezone: 'UTC', created_at: now, updated_at: now },
      { id: 5, name: 'David Lee', email: 'david@autogrow.io', password_hash: memberHash, role: 'member', avatar_color: '#ef4444', title: 'Backend Developer', bio: '', phone: '', timezone: 'UTC', created_at: now, updated_at: now },
    ],
    members: [
      { id: 1, name: 'Alice Johnson', email: 'alice@autogrow.io', role: 'Product Manager', avatar_color: '#6366f1', created_at: now },
      { id: 2, name: 'Bob Martinez', email: 'bob@autogrow.io', role: 'Lead Developer', avatar_color: '#10b981', created_at: now },
      { id: 3, name: 'Carol Smith', email: 'carol@autogrow.io', role: 'UI/UX Designer', avatar_color: '#f59e0b', created_at: now },
      { id: 4, name: 'David Lee', email: 'david@autogrow.io', role: 'Backend Developer', avatar_color: '#ef4444', created_at: now },
    ],
    projects: [
      { id: 1, name: 'Auto-Grow Platform', description: 'Main SaaS platform development with full feature set including dashboard, reporting, and analytics.', status: 'active', priority: 'high', deadline: '2025-03-31', member_ids: [2, 3, 4, 5], created_at: now, updated_at: now },
      { id: 2, name: 'Mobile App v2', description: 'Redesigned mobile application with new UI/UX patterns and offline support.', status: 'active', priority: 'high', deadline: '2025-04-15', member_ids: [3, 4, 5], created_at: now, updated_at: now },
      { id: 3, name: 'API Integration Hub', description: 'Third-party API integrations including Slack, Jira, and GitHub connectors.', status: 'on-hold', priority: 'medium', deadline: '2025-05-01', member_ids: [3, 5], created_at: now, updated_at: now },
      { id: 4, name: 'Customer Portal', description: 'Self-service customer portal for account management and billing.', status: 'completed', priority: 'low', deadline: '2025-01-15', member_ids: [2, 4], created_at: now, updated_at: now },
    ],
    tasks: [
      { id: 1, project_id: 1, title: 'Design system architecture', description: 'Define microservices, database schema, and API contracts.', status: 'done', priority: 'high', assigned_to: 2, due_date: '2025-01-10', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 2, project_id: 1, title: 'Build REST API endpoints', description: 'Implement all CRUD endpoints for projects, tasks, and members.', status: 'in-progress', priority: 'high', assigned_to: 4, due_date: '2025-02-15', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 3, project_id: 1, title: 'Implement dashboard UI', description: 'Build responsive dashboard with charts and KPI cards.', status: 'in-progress', priority: 'high', assigned_to: 3, due_date: '2025-02-20', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 4, project_id: 1, title: 'Auto reporting engine', description: 'Build the cron-based report generation system.', status: 'todo', priority: 'medium', assigned_to: 2, due_date: '2025-03-01', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 5, project_id: 2, title: 'Wireframes and prototypes', description: 'Create Figma wireframes for all app screens.', status: 'done', priority: 'high', assigned_to: 3, due_date: '2025-01-20', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 6, project_id: 2, title: 'React Native setup', description: 'Initialize RN project with navigation and state management.', status: 'done', priority: 'medium', assigned_to: 4, due_date: '2025-01-25', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 7, project_id: 2, title: 'Offline sync module', description: 'Implement offline data sync using local storage and conflict resolution.', status: 'in-progress', priority: 'high', assigned_to: 4, due_date: '2025-03-10', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 8, project_id: 3, title: 'Slack integration', description: 'Build Slack bot and webhook integration for notifications.', status: 'todo', priority: 'medium', assigned_to: 2, due_date: '2025-04-01', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 9, project_id: 3, title: 'GitHub connector', description: 'Sync GitHub issues and PRs with project tasks automatically.', status: 'todo', priority: 'medium', assigned_to: 4, due_date: '2025-04-15', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 10, project_id: 4, title: 'User authentication flow', description: 'Login, registration, and password reset pages.', status: 'done', priority: 'high', assigned_to: 3, due_date: '2025-01-05', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
      { id: 11, project_id: 4, title: 'Billing integration', description: 'Stripe payment and subscription management.', status: 'done', priority: 'high', assigned_to: 2, due_date: '2025-01-10', repeat: 'none', notify_assignee: false, notify_creator: false, creator_id: 1, watchers: [], attachments: [], checklist: [], created_at: now, updated_at: now },
    ],
    comments: [],
    notifications: [],
    activities: [],
    reports: [],
    _seq: { users: 5, members: 4, projects: 4, tasks: 11, comments: 0, notifications: 0, activities: 0, reports: 0 },
  };
}

let _store = null;

function load() {
  if (_store) return _store;
  if (fs.existsSync(FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      // Migrate: ensure new collections exist
      if (!parsed.users) {
        _store = buildSeed();
        save();
      } else {
        _store = parsed;
        // Ensure new tables exist
        if (!_store.comments) _store.comments = [];
        if (!_store.notifications) _store.notifications = [];
        if (!_store.activities) _store.activities = [];
        if (!_store._seq.comments) _store._seq.comments = 0;
        if (!_store._seq.notifications) _store._seq.notifications = 0;
        if (!_store._seq.activities) _store._seq.activities = 0;
        if (!_store._seq.users) _store._seq.users = (_store.users || []).length;
      }
      return _store;
    } catch (_) {}
  }
  _store = buildSeed();
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

  findOne(table, predicate) {
    return (load()[table] || []).find(predicate) || null;
  },

  insert(table, data) {
    const s = load();
    if (!s[table]) s[table] = [];
    const id = nextId(table);
    const now = new Date().toISOString();
    const row = { id, created_at: now, updated_at: now, ...data };
    s[table].push(row);
    save();
    return row;
  },

  update(table, id, data) {
    const s = load();
    const idx = (s[table] || []).findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    s[table][idx] = { ...s[table][idx], ...data, updated_at: new Date().toISOString() };
    save();
    return s[table][idx];
  },

  delete(table, id) {
    const s = load();
    const idx = (s[table] || []).findIndex(r => r.id === Number(id));
    if (idx === -1) return false;
    s[table].splice(idx, 1);
    save();
    return true;
  },

  deleteWhere(table, predicate) {
    const s = load();
    if (!s[table]) return 0;
    const before = s[table].length;
    s[table] = s[table].filter(r => !predicate(r));
    save();
    return before - s[table].length;
  },
};

// Helper: create a notification
function createNotification(userId, type, message, link) {
  return db.insert('notifications', {
    user_id: Number(userId),
    type,
    message,
    read: false,
    link: link || null,
  });
}

// Helper: log activity
function logActivity(projectId, userId, action, description) {
  return db.insert('activities', {
    project_id: projectId ? Number(projectId) : null,
    user_id: userId ? Number(userId) : null,
    action,
    description,
  });
}

load(); // initialise on require
module.exports = { ...db, createNotification, logActivity };
