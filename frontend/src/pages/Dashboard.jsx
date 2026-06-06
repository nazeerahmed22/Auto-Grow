import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          color.includes('indigo') ? 'bg-indigo-50' :
          color.includes('emerald') ? 'bg-emerald-50' :
          color.includes('amber') ? 'bg-amber-50' :
          color.includes('blue') ? 'bg-blue-50' :
          'bg-slate-50'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'active': 'bg-emerald-100 text-emerald-700',
    'completed': 'bg-blue-100 text-blue-700',
    'on-hold': 'bg-amber-100 text-amber-700',
    'todo': 'bg-slate-100 text-slate-600',
    'in-progress': 'bg-amber-100 text-amber-700',
    'done': 'bg-emerald-100 text-emerald-700',
  }
  const labels = {
    'active': 'Active',
    'completed': 'Completed',
    'on-hold': 'On Hold',
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const styles = {
    'high': 'bg-red-100 text-red-700',
    'medium': 'bg-amber-100 text-amber-700',
    'low': 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[priority] || 'bg-slate-100 text-slate-600'}`}>
      {priority}
    </span>
  )
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-8 text-right">{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        Failed to load dashboard data. Make sure the backend is running.
      </div>
    )
  }

  const { projects, tasks, members, recent_projects, recent_tasks } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Projects"
          value={projects.total}
          subtitle={`${projects.active} active, ${projects.on_hold} on hold`}
          color="text-indigo-600"
          icon="📁"
        />
        <StatCard
          title="Active Tasks"
          value={tasks.in_progress}
          subtitle={`${tasks.todo} to do, ${tasks.overdue} overdue`}
          color="text-amber-600"
          icon="⚡"
        />
        <StatCard
          title="Completed Tasks"
          value={tasks.done}
          subtitle={`Out of ${tasks.total} total`}
          color="text-emerald-600"
          icon="✅"
        />
        <StatCard
          title="Team Members"
          value={members.total}
          subtitle="Across all projects"
          color="text-blue-600"
          icon="👥"
        />
      </div>

      {/* Charts + Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Task Status Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4">Task Status Overview</h2>
          <div className="space-y-4">
            <ProgressBar label="To Do" value={tasks.todo} total={tasks.total} color="bg-blue-400" />
            <ProgressBar label="In Progress" value={tasks.in_progress} total={tasks.total} color="bg-amber-400" />
            <ProgressBar label="Done" value={tasks.done} total={tasks.total} color="bg-emerald-400" />
            {tasks.overdue > 0 && (
              <ProgressBar label="Overdue" value={tasks.overdue} total={tasks.total} color="bg-red-400" />
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{tasks.total}</div>
              <div className="text-xs text-slate-500">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-500">Completion</div>
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4">Project Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', count: projects.active, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
              { label: 'On Hold', count: projects.on_hold, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700' },
              { label: 'Completed', count: projects.completed, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.light}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            {projects.total > 0 && (
              <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                {projects.active > 0 && (
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(projects.active / projects.total) * 100}%` }}
                    title={`Active: ${projects.active}`}
                  />
                )}
                {projects.on_hold > 0 && (
                  <div
                    className="bg-amber-500"
                    style={{ width: `${(projects.on_hold / projects.total) * 100}%` }}
                    title={`On Hold: ${projects.on_hold}`}
                  />
                )}
                {projects.completed > 0 && (
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(projects.completed / projects.total) * 100}%` }}
                    title={`Completed: ${projects.completed}`}
                  />
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">{projects.total} total projects</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm text-slate-700">Active Projects</span>
              </div>
              <span className="font-bold text-indigo-600">{projects.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm text-slate-700">Overdue Tasks</span>
              </div>
              <span className="font-bold text-red-600">{tasks.overdue}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <span className="text-sm text-slate-700">In Progress</span>
              </div>
              <span className="font-bold text-amber-600">{tasks.in_progress}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="text-sm text-slate-700">Completed</span>
              </div>
              <span className="font-bold text-emerald-600">{tasks.done}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Project</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Tasks</th>
                <th className="px-6 py-3 text-left">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_projects.map(project => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{project.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{project.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                  <td className="px-6 py-4"><PriorityBadge priority={project.priority} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {project.total_tasks > 0 && (
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.round(((project.total_tasks - project.pending_count) / project.total_tasks) * 100)}%` }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{project.total_tasks - project.pending_count}/{project.total_tasks}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Project</th>
                <th className="px-6 py-3 text-left">Assignee</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{task.project_name}</td>
                  <td className="px-6 py-4">
                    {task.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: task.assignee_color || '#6366f1' }}
                        >
                          {task.assignee_name[0]}
                        </div>
                        <span className="text-sm text-slate-600">{task.assignee_name}</span>
                      </div>
                    ) : <span className="text-sm text-slate-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
