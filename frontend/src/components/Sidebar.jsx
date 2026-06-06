import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
]

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col
          bg-[#1e1e2e] text-white
          transition-all duration-300 ease-in-out
          ${open ? 'w-64' : 'w-0 lg:w-16'}
          overflow-hidden flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">AG</span>
            </div>
            {open && (
              <div className="min-w-0">
                <div className="font-bold text-white text-base truncate">Auto-Grow</div>
                <div className="text-xs text-slate-400 truncate">Project Manager</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {open && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
              Main Menu
            </p>
          )}
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }
                  ${!open ? 'justify-center' : ''}
                `}
                title={!open ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {open && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          {open ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">Admin User</div>
                <div className="text-xs text-slate-400 truncate">admin@autogrow.io</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
