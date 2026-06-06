import { useState, useEffect } from 'react'

function StatusBadge({ status }) {
  const styles = {
    'todo': 'bg-blue-100 text-blue-700 border border-blue-200',
    'in-progress': 'bg-amber-100 text-amber-700 border border-amber-200',
    'done': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  }
  const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[priority] || 'bg-slate-100 text-slate-600'}`}>
      {priority}
    </span>
  )
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg modal-content max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const emptyForm = { project_id: '', title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', due_date: '' }

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ]).then(([t, p, m]) => {
      setTasks(t); setProjects(p); setMembers(m); setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => {
    setEditTask(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (task) => {
    setEditTask(task)
    setForm({
      project_id: String(task.project_id),
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
      due_date: task.due_date || ''
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTask(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editTask ? `/api/tasks/${editTask.id}` : '/api/tasks'
      const method = editTask ? 'PUT' : 'POST'
      const payload = {
        ...form,
        project_id: Number(form.project_id),
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) { closeModal(); loadData() }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadData()
  }

  const filtered = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchProject = projectFilter === 'all' || String(t.project_id) === projectFilter
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.project_name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchSearch
  })

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'To Do', value: stats.todo, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Done', value: stats.done, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'todo', 'in-progress', 'done'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s === 'todo' ? 'To Do' : 'Done'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-1 flex-wrap">
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0 px-4 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-slate-500 font-medium">No tasks found</div>
            <div className="text-slate-400 text-sm mt-1">Try adjusting filters or create a new task</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Task</th>
                  <th className="px-6 py-3 text-left">Project</th>
                  <th className="px-6 py-3 text-left">Assignee</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Priority</th>
                  <th className="px-6 py-3 text-left">Due Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(task => {
                  const overdue = isOverdue(task)
                  return (
                    <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 max-w-xs">
                        <div>
                          <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                            {task.title}
                            {overdue && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Overdue</span>
                            )}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{task.project_name}</td>
                      <td className="px-6 py-4">
                        {task.assignee_name ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: task.assignee_color || '#6366f1' }}
                            >
                              {task.assignee_name[0]}
                            </div>
                            <span className="text-sm text-slate-700 whitespace-nowrap">{task.assignee_name}</span>
                          </div>
                        ) : <span className="text-sm text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {task.due_date ? (
                          <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project *</label>
            <select
              required
              value={form.project_id}
              onChange={e => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Task description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
              <select
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Task">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Delete "{deleteConfirm?.title}"?</p>
          <p className="text-slate-400 text-sm mt-1">This action cannot be undone.</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
