import { useState, useEffect } from 'react'

const typeColors = {
  daily: 'bg-blue-100 text-blue-700',
  weekly: 'bg-purple-100 text-purple-700',
  monthly: 'bg-indigo-100 text-indigo-700',
}

function ReportDetail({ report, onClose }) {
  const c = report.content

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-slate-800">{report.title}</h3>
            <p className="text-xs text-slate-400">{new Date(report.generated_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects', value: c.summary.projects.total, color: 'text-indigo-600' },
              { label: 'Active Projects', value: c.summary.projects.active, color: 'text-emerald-600' },
              { label: 'Total Tasks', value: c.summary.tasks.total, color: 'text-slate-700' },
              { label: 'Tasks Done', value: c.summary.tasks.done, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Task breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Task Breakdown</h4>
            <div className="space-y-2">
              {[
                { label: 'To Do', v: c.summary.tasks.todo, total: c.summary.tasks.total, color: 'bg-slate-400' },
                { label: 'In Progress', v: c.summary.tasks.in_progress, total: c.summary.tasks.total, color: 'bg-indigo-500' },
                { label: 'Done', v: c.summary.tasks.done, total: c.summary.tasks.total, color: 'bg-emerald-500' },
                { label: 'Overdue', v: c.summary.tasks.overdue, total: c.summary.tasks.total, color: 'bg-red-500' },
              ].map(({ label, v, total, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20">{label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: total > 0 ? `${(v / total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-5 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top members */}
          {c.top_members?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Top Performers</h4>
              <div className="space-y-2">
                {c.top_members.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: m.avatar_color }}>
                      {m.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{m.tasks_done} done</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue tasks */}
          {c.overdue_tasks?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-2">⚠️ Overdue Tasks ({c.overdue_tasks.length})</h4>
              <div className="space-y-1">
                {c.overdue_tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.project_name}</p>
                    </div>
                    <span className="text-xs text-red-600 font-medium">{t.due_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [genType, setGenType] = useState('daily')

  const load = () => fetch('/api/reports').then(r => r.json()).then(d => { setReports(d); setLoading(false) })

  useEffect(() => { load() }, [])

  const generate = async () => {
    setGenerating(true)
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: genType })
    })
    const report = await res.json()
    setGenerating(false)
    setSelected(report)
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this report?')) return
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    load()
  }

  const viewReport = async (id) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setSelected(data)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>

  return (
    <div className="space-y-4">
      {/* Generate panel */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-3">Generate Report</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={genType} onChange={e => setGenType(e.target.value)}>
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
          </select>
          <button onClick={generate} disabled={generating} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {generating ? 'Generating...' : '⚡ Generate Now'}
          </button>
          <p className="text-xs text-slate-400">Reports also auto-generate daily at midnight, weekly on Sundays, and monthly on the 1st.</p>
        </div>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400">
            <p className="text-4xl mb-3">📈</p>
            <p>No reports yet. Generate your first report above.</p>
          </div>
        )}
        {reports.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeColors[r.type]}`}>{r.type}</span>
                <h4 className="text-sm font-semibold text-slate-800 truncate">{r.title}</h4>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>🗓 {new Date(r.generated_at).toLocaleString()}</span>
                {r.total_projects != null && <span>📁 {r.total_projects} projects</span>}
                {r.total_tasks != null && <span>✅ {r.tasks_done}/{r.total_tasks} tasks</span>}
                {r.tasks_overdue > 0 && <span className="text-red-500 font-medium">⚠️ {r.tasks_overdue} overdue</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => viewReport(r.id)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">View</button>
              <button onClick={() => del(r.id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Del</button>
            </div>
          </div>
        ))}
      </div>

      {selected && <ReportDetail report={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
