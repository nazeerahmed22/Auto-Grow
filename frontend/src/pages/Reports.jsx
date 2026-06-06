import { useState, useEffect } from 'react'
import { api } from '../api'

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl modal-content max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
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

function ReportTypeBadge({ type }) {
  const styles = {
    daily: 'bg-blue-100 text-blue-700 border border-blue-200',
    weekly: 'bg-purple-100 text-purple-700 border border-purple-200',
    monthly: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-bold ${highlight || 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

function ReportDetail({ report }) {
  if (!report?.content) return null
  const { summary, overdue_tasks, top_members, busy_projects, high_priority_pending } = report.content

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <ReportTypeBadge type={report.type} />
        <span className="text-sm text-slate-500">
          Generated {new Date(report.generated_at).toLocaleString()}
        </span>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-600">{summary.projects.total}</div>
          <div className="text-sm text-slate-600 mt-0.5">Total Projects</div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600">Active</span>
              <span className="font-medium">{summary.projects.active}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600">On Hold</span>
              <span className="font-medium">{summary.projects.on_hold}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Completed</span>
              <span className="font-medium">{summary.projects.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600">{summary.tasks.total}</div>
          <div className="text-sm text-slate-600 mt-0.5">Total Tasks</div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">To Do</span>
              <span className="font-medium">{summary.tasks.todo}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600">In Progress</span>
              <span className="font-medium">{summary.tasks.in_progress}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600">Done</span>
              <span className="font-medium">{summary.tasks.done}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion rate */}
      <div className="bg-white border border-slate-100 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">Overall Task Completion</span>
          <span className="text-sm font-bold text-indigo-600">
            {summary.tasks.total > 0 ? Math.round((summary.tasks.done / summary.tasks.total) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${summary.tasks.total > 0 ? Math.round((summary.tasks.done / summary.tasks.total) * 100) : 0}%` }}
          />
        </div>
        {summary.tasks.overdue > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <span>⚠️</span>
            <span>{summary.tasks.overdue} overdue task{summary.tasks.overdue !== 1 ? 's' : ''} need attention</span>
          </div>
        )}
      </div>

      {/* Top Members */}
      {top_members && top_members.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3">Top Performing Members</h3>
          <div className="space-y-2">
            {top_members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: m.avatar_color || '#6366f1' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.role}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-emerald-600">{m.tasks_done} done</div>
                  <div className="text-xs text-slate-400">{m.total_tasks} total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {overdue_tasks && overdue_tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-red-500">⚠️</span> Overdue Tasks
          </h3>
          <div className="space-y-2">
            {overdue_tasks.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.project_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-red-600 font-medium">{new Date(t.due_date).toLocaleDateString()}</div>
                  {t.assignee_name && <div className="text-xs text-slate-400">{t.assignee_name}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busy Projects */}
      {busy_projects && busy_projects.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3">Projects by Pending Tasks</h3>
          <div className="space-y-2">
            {busy_projects.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    {p.total_tasks > 0 && (
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(p.pending_tasks / p.total_tasks) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-600">{p.pending_tasks}</div>
                  <div className="text-xs text-slate-400">pending</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Pending */}
      {high_priority_pending && high_priority_pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-red-500">🔴</span> High Priority Pending Tasks
          </h3>
          <div className="space-y-2">
            {high_priority_pending.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.project_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{t.status}</span>
                  {t.due_date && (
                    <div className="text-xs text-slate-400 mt-1">{new Date(t.due_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportDetail, setReportDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [generateType, setGenerateType] = useState('daily')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadReports = () => {
    setLoading(true)
    api('/api/reports')
      .then(r => r.json())
      .then(d => { setReports(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadReports() }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: generateType })
      })
      if (res.ok) {
        const report = await res.json()
        loadReports()
        viewReport(report)
      }
    } finally {
      setGenerating(false)
    }
  }

  const viewReport = async (report) => {
    setSelectedReport(report)
    if (report.content && typeof report.content === 'object') {
      setReportDetail(report)
      return
    }
    setLoadingDetail(true)
    try {
      const res = await api(`/api/reports/${report.id}`)
      const data = await res.json()
      setReportDetail(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDelete = async (id) => {
    await api(`/api/reports/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    setSelectedReport(null)
    loadReports()
  }

  const typeIcon = { daily: '📅', weekly: '📆', monthly: '🗓️' }
  const typeColor = {
    daily: 'from-blue-500 to-blue-600',
    weekly: 'from-purple-500 to-purple-600',
    monthly: 'from-indigo-500 to-indigo-600',
  }

  return (
    <div className="space-y-5">
      {/* Generate Panel */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-bold">Auto Report Generator</h2>
            <p className="text-indigo-200 text-sm mt-1">
              Generate comprehensive reports with live project data. Daily reports run automatically at midnight.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <select
              value={generateType}
              onChange={e => setGenerateType(e.target.value)}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="daily" className="text-slate-800">Daily Report</option>
              <option value="weekly" className="text-slate-800">Weekly Report</option>
              <option value="monthly" className="text-slate-800">Monthly Report</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cron Schedule Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { type: 'daily', label: 'Daily Reports', schedule: 'Every day at midnight', icon: '📅' },
          { type: 'weekly', label: 'Weekly Reports', schedule: 'Every Sunday at midnight', icon: '📆' },
          { type: 'monthly', label: 'Monthly Reports', schedule: '1st of each month', icon: '🗓️' },
        ].map(s => (
          <div key={s.type} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3">
            <div className="text-2xl">{s.icon}</div>
            <div>
              <div className="text-sm font-semibold text-slate-700">{s.label}</div>
              <div className="text-xs text-slate-400">{s.schedule}</div>
            </div>
            <div className="ml-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Report History</h2>
          <span className="text-sm text-slate-500">{reports.length} reports</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-slate-500 font-medium">No reports yet</div>
            <div className="text-slate-400 text-sm mt-1">Click "Generate Now" to create your first report</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map(report => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onClick={() => viewReport(report)}
              >
                <div className={`h-2 bg-gradient-to-r ${typeColor[report.type] || 'from-slate-400 to-slate-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcon[report.type] || '📄'}</span>
                      <ReportTypeBadge type={report.type} />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(report) }}
                      className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="font-semibold text-slate-800 text-sm mb-1 leading-snug">{report.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {new Date(report.generated_at).toLocaleString()}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-slate-700">{report.total_projects || 0}</div>
                      <div className="text-xs text-slate-400">Projects</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-slate-700">{report.total_tasks || 0}</div>
                      <div className="text-xs text-slate-400">Tasks</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-emerald-600">{report.tasks_done || 0}</div>
                      <div className="text-xs text-slate-400">Done</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-red-600">{report.tasks_overdue || 0}</div>
                      <div className="text-xs text-slate-400">Overdue</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Click to view details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      <Modal
        open={!!selectedReport}
        onClose={() => { setSelectedReport(null); setReportDetail(null) }}
        title={selectedReport?.title || 'Report Details'}
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : reportDetail ? (
          <ReportDetail report={reportDetail} />
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Report">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Delete this report?</p>
          <p className="text-slate-400 text-sm mt-1">"{deleteConfirm?.title}"</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
