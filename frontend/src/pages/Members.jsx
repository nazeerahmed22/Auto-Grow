import { useState, useEffect } from 'react'

function Modal({ onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial || { name: '', email: '', role: 'Developer', avatar_color: '#6366f1' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 modal-content">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{initial ? 'Edit Member' : 'Add Member'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.role} onChange={e => set('role', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avatar Color</label>
              <input type="color" className="w-full h-10 border border-slate-200 rounded-lg px-1 py-1 cursor-pointer" value={form.avatar_color} onChange={e => set('avatar_color', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => fetch('/api/members').then(r => r.json()).then(d => { setMembers(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const save = async (form) => {
    const isEdit = modal.member?.id
    await fetch(isEdit ? `/api/members/${modal.member.id}` : '/api/members', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setModal(null)
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this member?')) return
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{members.length} team members</p>
        <button onClick={() => setModal({ member: null })} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Add Member
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: m.avatar_color }}>
                {m.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800">{m.name}</h3>
                <p className="text-xs text-slate-500">{m.role}</p>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ member: m })} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                <span className="text-slate-200">|</span>
                <button onClick={() => del(m.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Del</button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center border-t border-slate-50 pt-3">
              <div>
                <p className="text-base font-bold text-slate-700">{m.task_count}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <div>
                <p className="text-base font-bold text-indigo-600">{m.in_progress_count}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
              <div>
                <p className="text-base font-bold text-emerald-600">{m.done_count}</p>
                <p className="text-xs text-slate-400">Done</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal
          onClose={() => setModal(null)}
          onSubmit={save}
          initial={modal.member ? { name: modal.member.name, email: modal.member.email, role: modal.member.role, avatar_color: modal.member.avatar_color } : undefined}
        />
      )}
    </div>
  )
}
