import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  FileCode2,
  GitBranch,
  Network,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { activity, developers, graph, issues, timeAgo } from '../data/mock'
import { IssueList } from '../components/Issues'
import { DependencyGraph } from '../components/graph'
import { DevAvatar, PanelHeader } from '../components/ui'

const activityDot: Record<string, string> = {
  file_changed: 'bg-sky-400',
  issue_detected: 'bg-rose-400',
  issue_resolved: 'bg-emerald-400',
  developer_connected: 'bg-nebula-400',
  developer_disconnected: 'bg-slate-500',
}

export default function Dashboard() {
  const online = developers.filter((d) => d.connected)
  const modifiedFiles = developers.reduce(
    (n, d) => n + Object.keys(d.files).length,
    0,
  )
  const active = issues.filter((i) => i.status === 'active')
  const critical = active.filter(
    (i) => i.severity === 'critical' || i.severity === 'high',
  )

  const stats = [
    {
      label: 'Developers online',
      value: online.length,
      icon: Users,
      tone: 'text-sky-300 border-sky-500/30',
    },
    {
      label: 'Files modified (uncommitted)',
      value: modifiedFiles,
      icon: FileCode2,
      tone: 'text-nebula-300 border-nebula-500/30',
    },
    {
      label: 'Active conflicts',
      value: active.length,
      icon: TriangleAlert,
      tone: 'text-amber-200 border-amber-400/40',
    },
    {
      label: 'High / critical',
      value: critical.length,
      icon: TriangleAlert,
      tone: 'text-rose-300 border-rose-500/40',
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Mission Control
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Live view of every crew member's uncommitted changes and what they
          might break.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`panel flex items-center gap-4 p-4 ${tone}`}
          >
            <Icon className="size-8 shrink-0" />
            <div>
              <div className="text-3xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="panel">
          <PanelHeader
            icon={<TriangleAlert className="size-4" />}
            title="Conflict alerts"
            right={
              <Link
                to="/conflicts"
                className="text-nebula-300 flex items-center gap-1 text-xs hover:text-white"
              >
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="p-4">
            <IssueList issues={active} />
          </div>
        </div>

        <div className="panel">
          <PanelHeader
            icon={<Users className="size-4" />}
            title="Connected developers"
          />
          <div className="divide-nebula-500/10 divide-y">
            {developers.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <DevAvatar id={d.id} online={d.connected} />
                  <div className="min-w-0">
                    <div
                      className={`font-medium ${d.connected ? 'text-white' : 'text-slate-500'}`}
                    >
                      {d.id}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-slate-400">
                      <GitBranch className="size-3" /> {d.branch} ·{' '}
                      {d.baseCommit}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-slate-500">
                    {d.connected
                      ? `active ${timeAgo(d.lastSeen)}`
                      : `offline · ${timeAgo(d.lastSeen)}`}
                  </span>
                </div>
                {Object.values(d.files).length > 0 && (
                  <ul className="mt-2 ml-10 space-y-1">
                    {Object.values(d.files).map((f) => (
                      <li
                        key={f.path}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="size-1.5 rounded-full bg-amber-300"
                          title="modified"
                        />
                        <code className="truncate font-mono text-slate-300">
                          {f.path}
                        </code>
                        <span className="ml-auto shrink-0 text-slate-500">
                          {timeAgo(f.modifiedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="panel flex h-[380px] flex-col overflow-hidden">
          <PanelHeader
            icon={<Network className="size-4" />}
            title="Dependency orbit"
            right={
              <Link
                to="/graph"
                className="text-nebula-300 flex items-center gap-1 text-xs hover:text-white"
              >
                Full map <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="min-h-0 flex-1">
            <DependencyGraph graph={graph} minimap={false} />
          </div>
        </div>

        <div className="panel">
          <PanelHeader
            icon={<Activity className="size-4" />}
            title="Live activity"
          />
          <ul className="space-y-3 p-4">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${activityDot[a.type] ?? 'bg-slate-400'}`}
                />
                <span className="text-slate-300">{a.message}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-500">
                  {timeAgo(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
