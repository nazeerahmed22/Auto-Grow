import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your projects and tasks' },
  '/projects': { title: 'Projects', subtitle: 'Manage and track all your projects' },
  '/tasks': { title: 'Tasks', subtitle: 'View and manage tasks across all projects' },
  '/reports': { title: 'Reports', subtitle: 'Auto-generated project reports and analytics' },
}

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation()
  const page = pageTitles[location.pathname] || pageTitles['/']
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{page.title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">{page.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:block text-sm text-slate-500">{today}</span>
        <div className="w-px h-6 bg-slate-200 hidden md:block" />
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  )
}
