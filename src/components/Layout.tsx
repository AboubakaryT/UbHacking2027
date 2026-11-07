import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  Code2,
  LayoutDashboard,
  Network,
  Orbit,
  Settings,
  Sparkles,
  TriangleAlert,
  ChevronDown,
  FolderGit2,
} from 'lucide-react'
import { developers, issues, PROJECT_ID } from '../data/mock'
import { DevAvatar } from './ui'

const nav = [
  { to: '/', label: 'Mission Control', icon: LayoutDashboard, end: true },
  { to: '/workspace', label: 'Workspace', icon: Code2 },
  { to: '/conflicts', label: 'Conflicts', icon: TriangleAlert, badge: true },
  { to: '/graph', label: 'Dependency Map', icon: Network },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const activeIssues = issues.filter((i) => i.status === 'active').length
  const online = developers.filter((d) => d.connected)

  return (
    <div className="space-bg flex h-full min-h-0 text-slate-200">
      {/* Sidebar */}
      <aside className="border-nebula-500/15 bg-space-900/60 hidden w-60 shrink-0 flex-col border-r px-3 py-5 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="from-nebula-500 glow flex size-9 items-center justify-center rounded-xl bg-gradient-to-br to-indigo-600">
            <Orbit className="size-5 text-white" />
          </span>
          <div>
            <div className="text-lg leading-tight font-bold text-white">
              CodeBase
            </div>
            <div className="text-nebula-300/70 text-[11px] leading-tight">
              Conflicts spotted before launch
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-nebula-600/30 font-medium text-white shadow-[inset_2px_0_0_var(--color-nebula-400)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className="size-4.5" />
              {label}
              {badge && activeIssues > 0 && (
                <span className="ml-auto rounded-full bg-rose-500/20 px-2 text-xs text-rose-300">
                  {activeIssues}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-nebula-500/20 bg-space-850/70 mt-auto rounded-xl border p-3">
          <div className="mb-2 text-[11px] font-medium tracking-wider text-slate-500 uppercase">
            Crew online · {online.length}
          </div>
          <div className="flex flex-col gap-2">
            {developers.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <DevAvatar id={d.id} size={22} online={d.connected} />
                <span
                  className={d.connected ? 'text-slate-200' : 'text-slate-500'}
                >
                  {d.id}
                </span>
                <span className="ml-auto truncate font-mono text-[10px] text-slate-500">
                  {Object.keys(d.files).length} files
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-nebula-500/15 flex h-16 shrink-0 items-center gap-3 border-b px-5">
          <button className="border-nebula-500/25 bg-space-850/70 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
            <FolderGit2 className="size-4" />
            <span className="text-slate-400">team /</span>
            <span className="font-medium text-white">
              {PROJECT_ID.split('/')[1]}
            </span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live · WebSocket connected
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-slate-300 hover:bg-white/5">
              <Bell className="size-5" />
              {activeIssues > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-400" />
              )}
            </button>
            <DevAvatar id="bob" size={32} online />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
