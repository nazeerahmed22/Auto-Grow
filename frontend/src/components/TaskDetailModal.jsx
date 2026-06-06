import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'

function Avatar({ name, color, size = 'sm' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ backgroundColor: color || '#6366f1' }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'todo': 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    'done': 'bg-emerald-100 text-emerald-700',
  }
  const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const styles = { 'high': 'bg-red-100 text-red-700', 'medium': 'bg-amber-100 text-amber-700', 'low': 'bg-green-100 text-green-700' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[priority] || 'bg-slate-100 text-slate-600'}`}>{priority}</span>
}

export default function TaskDetailModal({ taskId, onClose, onUpdated, projects, users }) {
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')

  const loadTask = () => {
    Promise.all([
      api(`/api/tasks/${taskId}`).then(r => r.json()),
      api(`/api/tasks/${taskId}/comments`).then(r => r.json()),
    ]).then(([t, c]) => {
      setTask(t)
      setComments(c)
      setEditForm({
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to ? String(t.assigned_to) : '',
        due_date: t.due_date || '',
        repeat: t.repeat || 'none',
        notify_assignee: t.notify_assignee || false,
        notify_creator: t.notify_creator || false,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadTask() }, [taskId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
          watchers: task.watchers || [],
          checklist: task.checklist || [],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTask(data)
        setEditing(false)
        onUpdated && onUpdated()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const res = await api(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text: newComment }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [...prev, c])
      setNewComment('')
    }
    setSubmittingComment(false)
  }

  const handleDeleteComment = async (cid) => {
    await api(`/api/comments/${cid}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== cid))
  }

  const toggleCheckItem = async (index) => {
    const checklist = [...(task.checklist || [])]
    checklist[index] = { ...checklist[index], done: !checklist[index].done }
    const res = await api(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ checklist }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTask(updated)
    }
  }

  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return
    const checklist = [...(task.checklist || []), { id: Date.now(), text: newCheckItem, done: false }]
    const res = await api(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ checklist }) })
    if (res.ok) {
      const updated = await res.json()
      setTask(updated)
      setNewCheckItem('')
    }
  }

  const deleteCheckItem = async (index) => {
    const checklist = (task.checklist || []).filter((_, i) => i !== index)
    const res = await api(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ checklist }) })
    if (res.ok) { const updated = await res.json(); setTask(updated) }
  }

  const toggleWatcher = async () => {
    const watchers = task.watchers || []
    const isWatching = watchers.includes(user.id)
    const updated = isWatching ? watchers.filter(id => id !== user.id) : [...watchers, user.id]
    const res = await api(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ watchers: updated }) })
    if (res.ok) { const t = await res.json(); setTask(t) }
  }

  const isWatching = task?.watchers?.includes(user?.id)

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!task) return null

  const checklist = task.checklist || []
  const checklistDone = checklist.filter(c => c.done).length
  const watcherUsers = (task.watchers || []).map(id => users?.find(u => u.id === id)).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.repeat && task.repeat !== 'none' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                    🔄 {task.repeat}
                  </span>
                )}
              </>
            ) : <span className="text-sm font-medium text-slate-500">Editing task</span>}
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Edit
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Description */}
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full text-xl font-bold text-slate-800 border-b-2 border-indigo-400 focus:outline-none pb-1 bg-transparent"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Task description..."
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-800">{task.title}</h2>
              {task.description && <p className="text-slate-500 text-sm mt-2">{task.description}</p>}
            </div>
          )}

          {/* Fields */}
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                <select value={editForm.assigned_to} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Unassigned</option>
                  {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Repeat</label>
                <select value={editForm.repeat} onChange={e => setEditForm({ ...editForm, repeat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={editForm.notify_assignee} onChange={e => setEditForm({ ...editForm, notify_assignee: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600" />
                  Notify assignee
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={editForm.notify_creator} onChange={e => setEditForm({ ...editForm, notify_creator: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600" />
                  Notify me on updates
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Assignee</div>
                {task.assignee_name ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={task.assignee_name} color={task.assignee_color} />
                    <span className="text-sm text-slate-700">{task.assignee_name}</span>
                  </div>
                ) : <span className="text-sm text-slate-400">Unassigned</span>}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Due Date</div>
                <span className="text-sm text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Project</div>
                <span className="text-sm text-slate-700">{task.project_name || '—'}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Creator</div>
                <span className="text-sm text-slate-700">{task.creator_name || '—'}</span>
              </div>
            </div>
          )}

          {/* Watchers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700">Watchers</h4>
              <button
                onClick={toggleWatcher}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  isWatching ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isWatching ? 'Unwatch' : 'Watch'}
              </button>
            </div>
            {watcherUsers.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {watcherUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                    <Avatar name={u.name} color={u.avatar_color} />
                    <span className="text-xs text-slate-600">{u.name}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No watchers yet</p>}
          </div>

          {/* Checklist */}
          {(checklist.length > 0 || true) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  Checklist {checklist.length > 0 && <span className="text-slate-400 font-normal ml-1">({checklistDone}/{checklist.length})</span>}
                </h4>
              </div>
              {checklist.length > 0 && (
                <>
                  <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {checklist.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleCheckItem(idx)}
                          className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                        <span className={`text-sm flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                        <button onClick={() => deleteCheckItem(idx)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add checklist item..."
                />
                <button onClick={addCheckItem} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Comments ({comments.length})</h4>
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <Avatar name={c.user_name} color={c.user_color} />
                  <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{c.user_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        {(c.user_id === user?.id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-3 mt-4">
              <Avatar name={user?.name} color={user?.avatar_color} />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Add a comment..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
