const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'autogrow.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Developer',
    avatar_color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'on-hold')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    deadline TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    assigned_to INTEGER,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES members(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly', 'monthly')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed data only if tables are empty
const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
if (memberCount.count === 0) {
  const insertMember = db.prepare(`
    INSERT INTO members (name, email, role, avatar_color) VALUES (?, ?, ?, ?)
  `);
  insertMember.run('Alice Johnson', 'alice@autogrow.io', 'Product Manager', '#6366f1');
  insertMember.run('Bob Martinez', 'bob@autogrow.io', 'Lead Developer', '#10b981');
  insertMember.run('Carol Smith', 'carol@autogrow.io', 'UI/UX Designer', '#f59e0b');
  insertMember.run('David Lee', 'david@autogrow.io', 'Backend Developer', '#ef4444');

  const insertProject = db.prepare(`
    INSERT INTO projects (name, description, status, priority, deadline) VALUES (?, ?, ?, ?, ?)
  `);
  const p1 = insertProject.run('Auto-Grow Platform', 'Main SaaS platform development with full feature set including dashboard, reporting, and analytics.', 'active', 'high', '2025-03-31');
  const p2 = insertProject.run('Mobile App v2', 'Redesigned mobile application with new UI/UX patterns and offline support.', 'active', 'high', '2025-04-15');
  const p3 = insertProject.run('API Integration Hub', 'Third-party API integrations including Slack, Jira, and GitHub connectors.', 'on-hold', 'medium', '2025-05-01');
  const p4 = insertProject.run('Customer Portal', 'Self-service customer portal for account management and billing.', 'completed', 'low', '2025-01-15');

  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Project 1 tasks
  insertTask.run(p1.lastInsertRowid, 'Design system architecture', 'Define microservices, database schema, and API contracts.', 'done', 'high', 2, '2025-01-10');
  insertTask.run(p1.lastInsertRowid, 'Build REST API endpoints', 'Implement all CRUD endpoints for projects, tasks, and members.', 'in-progress', 'high', 4, '2025-02-15');
  insertTask.run(p1.lastInsertRowid, 'Implement dashboard UI', 'Build responsive dashboard with charts and KPI cards.', 'in-progress', 'high', 3, '2025-02-20');
  insertTask.run(p1.lastInsertRowid, 'Auto reporting engine', 'Build the cron-based report generation system.', 'todo', 'medium', 2, '2025-03-01');

  // Project 2 tasks
  insertTask.run(p2.lastInsertRowid, 'Wireframes and prototypes', 'Create Figma wireframes for all app screens.', 'done', 'high', 3, '2025-01-20');
  insertTask.run(p2.lastInsertRowid, 'React Native setup', 'Initialize RN project with navigation and state management.', 'done', 'medium', 4, '2025-01-25');
  insertTask.run(p2.lastInsertRowid, 'Offline sync module', 'Implement offline data sync using local storage and conflict resolution.', 'in-progress', 'high', 4, '2025-03-10');

  // Project 3 tasks
  insertTask.run(p3.lastInsertRowid, 'Slack integration', 'Build Slack bot and webhook integration for notifications.', 'todo', 'medium', 2, '2025-04-01');
  insertTask.run(p3.lastInsertRowid, 'GitHub connector', 'Sync GitHub issues and PRs with project tasks automatically.', 'todo', 'medium', 4, '2025-04-15');

  // Project 4 tasks
  insertTask.run(p4.lastInsertRowid, 'User authentication flow', 'Login, registration, and password reset pages.', 'done', 'high', 3, '2025-01-05');
  insertTask.run(p4.lastInsertRowid, 'Billing integration', 'Stripe payment and subscription management.', 'done', 'high', 2, '2025-01-10');
}

module.exports = db;
