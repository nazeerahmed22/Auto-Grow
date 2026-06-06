import { useState, useEffect } from 'react'
import { api } from '../api'

const TYPE_STYLES = {
  task_assigned: { bg: 'bg-indigo-50', icon: '📋', label: 'Task Assigned', color: 'text-indigo-700' },
  task_updated: { bg: 'bg-amber-50', icon: '✏️', label: 'Task Updated', color: 'text-amber-700' },
  comment_added: { bg: 'bg-emerald-50', icon: '💬', label: 'New Comment', color: 'text-emerald-700' },
  member_added: { bg: 'bg-blue-50', icon: '👤', label: 'Member Added', color: 'text-blue-700' },
  member_removed: { bg: 'bg-red-50', icon: '👤', label: 'Member Removed', color: 'text-red-700' },
}

function typeStyle(type) {
  return TYPE_STYLES[type] || { bg: 'bg-slate-50', icon: '🔔', label: 'Notification', color: 'text-slate-700' }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api('/api/notifications').then(r => r.json()).then(d => { setNotifications(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api(`/api/notifications/${id}/read`, { method: 'PUT' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await api('/api/notifications/read-all', { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotif = async (id) => {
    await api(`/api/notifications/${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-slate-500 font-medium">No notifications yet</div>
          <div className="text-slate-400 text-sm mt-1">You'll see notifications here when tasks are assigned to you or updated.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const ts = typeStyle(n.type)
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  n.read ? 'bg-white border-slate-100' : `${ts.bg} border-transparent shadow-sm`
                }`}
              >
                <div className="text-xl flex-shrink-0 mt-0.5">{ts.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50 ${ts.color}`}>{ts.label}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Mark as read"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
