import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import TaskDetailModal from '../components/TaskDetailModal'

function Avatar({ name, color, size = 'sm' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-6 h-6 text-xs'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ backgroundColor: color || '#6366f1' }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'active': 'bg-emerald-100 text-emerald-700',
    'completed': 'bg-blue-100 text-blue-700',
    'on-hold': 'bg-amber-100 text-amber-700',
    'todo': 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    'done': 'bg-emerald-100 text-emerald-700',
  }
  const labels = { 'active': 'Active', 'completed': 'Completed', 'on-hold': 'On Hold', 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const styles = { 'high': 'bg-red-100 text-red-700', 'medium': 'bg-amber-100 text-amber-700', 'low': 'bg-green-100 text-green-700' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[priority] || 'bg-slate-100 text-slate-600'}`}>{priority}</span>
}

const emptyTaskForm = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', due_date: '', repeat: 'none' }

function TaskForm({ onSubmit, onCancel, saving, initial, users }) {
  const [form, setForm] = useState(initial || emptyTaskForm)
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-3 bg-slate-50 p-4 rounded-xl">
      <div>
        <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Task title..." />
      </div>
      <div>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Description (optional)" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Unassigned</option>
          {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </form>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('all')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [savingTask, setSavingTask] = useState(false)
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(null)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [addMemberSearch, setAddMemberSearch] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const loadAll = () => {
    Promise.all([
      api(`/api/projects/${id}`).then(r => r.json()),
      api(`/api/projects/${id}/tasks`).then(r => r.json()),
      api(`/api/activity/project/${id}`).then(r => r.json()),
      api('/api/admin/users').catch(() => ({ json: () => [] })).then(r => r.json ? r.json() : []),
    ]).then(([p, t, a, u]) => {
      setProject(p)
      setTasks(t)
      setActivities(a)
      setAllUsers(Array.isArray(u) ? u : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [id])

  const handleCreateTask = async (form) => {
    setSavingTask(true)
    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...form, project_id: Number(id), assigned_to: form.assigned_to ? Number(form.assigned_to) : null }),
    })
    if (res.ok) { setShowTaskForm(false); loadAll() }
    setSavingTask(false)
  }

  const handleUpdateTask = async (form) => {
    setSavingTask(true)
    const res = await api(`/api/tasks/${editingTask.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...form, assigned_to: form.assigned_to ? Number(form.assigned_to) : null }),
    })
    if (res.ok) { setEditingTask(null); loadAll() }
    setSavingTask(false)
  }

  const handleDeleteTask = async (taskId) => {
    await api(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setDeleteTaskConfirm(null)
    loadAll()
  }

  const handleAddMember = async (userId) => {
    setAddingMember(true)
    const res = await api(`/api/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) { setAddMemberSearch(''); loadAll() }
    setAddingMember(false)
  }

  const handleRemoveMember = async (userId) => {
    await api(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' })
    loadAll()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  if (!project) return (
    <div className="text-center py-16 text-slate-500">
      <div className="text-4xl mb-3">404</div>
      <div>Project not found</div>
      <button onClick={() => navigate('/projects')} className="mt-4 text-indigo-600 hover:underline text-sm">Back to Projects</button>
    </div>
  )

  const progress = project.total_tasks > 0 ? Math.round((project.done_count / project.total_tasks) * 100) : 0
  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter)

  const memberIds = (project.members || []).map(m => m.id)
  const availableToAdd = allUsers.filter(u => !memberIds.includes(u.id) &&
    (!addMemberSearch || u.name.toLowerCase().includes(addMemberSearch.toLowerCase()) || u.email.toLowerCase().includes(addMemberSearch.toLowerCase()))
  )

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {project.description && <p className="text-slate-500 text-sm mt-1.5 max-w-2xl">{project.description}</p>}
          </div>
          {project.deadline && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-slate-400">Deadline</div>
              <div className="text-sm font-semibold text-slate-700">{new Date(project.deadline).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {['overview', 'tasks', 'members', 'activity'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
            {t === 'tasks' && tasks.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks', value: project.total_tasks, color: 'text-slate-700', bg: 'bg-slate-50' },
              { label: 'Done', value: project.done_count, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Members', value: (project.members || []).length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{project.done_count} done</span>
              <span>{project.pending_count} remaining</span>
            </div>
          </div>

          {activities.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <Avatar name={a.user_name} color={a.user_color} size="xs" />
                    <div>
                      <p className="text-sm text-slate-700">{a.description}</p>
                      <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {['all', 'todo', 'in-progress', 'done'].map(s => (
                <button key={s} onClick={() => setTaskFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    taskFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}>
                  {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s === 'todo' ? 'To Do' : 'Done'}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>

          {showTaskForm && !editingTask && (
            <TaskForm
              users={project.members || []}
              saving={savingTask}
              onSubmit={handleCreateTask}
              onCancel={() => setShowTaskForm(false)}
            />
          )}

          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-slate-500">No tasks found</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
              {filteredTasks.map(task => (
                <div key={task.id}>
                  {editingTask?.id === task.id ? (
                    <div className="p-4">
                      <TaskForm
                        initial={{ title: task.title, description: task.description || '', status: task.status, priority: task.priority, assigned_to: task.assigned_to ? String(task.assigned_to) : '', due_date: task.due_date || '', repeat: task.repeat || 'none' }}
                        users={project.members || []}
                        saving={savingTask}
                        onSubmit={handleUpdateTask}
                        onCancel={() => setEditingTask(null)}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setDetailTaskId(task.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {task.repeat && task.repeat !== 'none' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded capitalize">🔄 {task.repeat}</span>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {task.assignee_name && (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={task.assignee_name} color={task.assignee_color} size="xs" />
                            <span className="text-xs text-slate-500 hidden sm:block">{task.assignee_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <span className="text-xs text-slate-400">{new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditingTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTaskConfirm(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Delete confirm */}
          {deleteTaskConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTaskConfirm(null)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="font-medium text-slate-700">Delete "{deleteTaskConfirm.title}"?</p>
                <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setDeleteTaskConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
                  <button onClick={() => handleDeleteTask(deleteTaskConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          {user?.role === 'admin' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Member</h3>
              <input
                type="text"
                value={addMemberSearch}
                onChange={e => setAddMemberSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                placeholder="Search users by name or email..."
              />
              {addMemberSearch && availableToAdd.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableToAdd.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(u.id)}
                      disabled={addingMember}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar name={u.name} color={u.avatar_color} />
                      <div>
                        <div className="text-sm font-medium text-slate-700">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {addMemberSearch && availableToAdd.length === 0 && (
                <p className="text-sm text-slate-400">No matching users found to add</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Project Members ({(project.members || []).length})</h3>
            </div>
            {(project.members || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No members yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(project.members || []).map(m => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.title || m.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {m.role}
                    </span>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4">Activity Timeline</h3>
          {activities.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No activity recorded yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Avatar name={a.user_name} color={a.user_color} size="xs" />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2 min-h-4" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm text-slate-700">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTaskId && (
        <TaskDetailModal
          taskId={detailTaskId}
          onClose={() => setDetailTaskId(null)}
          onUpdated={loadAll}
          projects={[project]}
          users={project.members || []}
        />
      )}
    </div>
  )
}
