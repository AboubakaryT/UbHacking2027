import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ArrowDown, Bell, GitCompareArrows } from 'lucide-react'
import { conflicts, developers, issues } from '../data/mock'
import type { ConflictSide, IssueStatus } from '../data/types'
import { IssueList } from '../components/Issues'
import { DiffViewer } from '../components/DiffViewer'
import { AiPanel } from '../components/AiPanel'
import { Button, DevAvatar } from '../components/ui'

const filters: { label: string; value: IssueStatus | 'all' }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

function SideDiff({ side, label }: { side: ConflictSide; label: string }) {
  const dev = developers.find((d) => d.id === side.developerId)
  const lines = Math.max(
    side.original.split('\n').length,
    side.modified.split('\n').length,
  )
  return (
    <div className="panel overflow-hidden">
      <div className="border-nebula-500/15 flex flex-wrap items-center gap-2 border-b px-4 py-2.5 text-sm">
        <DevAvatar id={side.developerId} size={22} />
        <span className="font-medium text-white">{side.developerId}</span>
        <span className="text-slate-500">·</span>
        <code className="font-mono text-xs text-slate-300">{side.path}</code>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
          {label} · {dev?.branch} · uncommitted
        </span>
      </div>
      <DiffViewer
        original={side.original}
        modified={side.modified}
        language={side.language}
        height={lines * 19 + 30}
      />
    </div>
  )
}

export default function Conflicts() {
  const { id } = useParams()
  const [filter, setFilter] = useState<IssueStatus | 'all'>('active')
  const list = issues.filter((i) => filter === 'all' || i.status === filter)

  if (!id) {
    const first = issues.find((i) => i.status === 'active') ?? issues[0]
    return <Navigate to={`/conflicts/${first.id}`} replace />
  }

  const issue = issues.find((i) => i.id === id)
  const conflict = id ? conflicts[id] : undefined

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-white">Conflicts</h1>
        <div className="bg-space-850/80 flex gap-1 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
                filter === f.value
                  ? 'bg-nebula-600/50 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <IssueList issues={list} compact activeId={id} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {issue ? (
          <>
            <div className="panel flex flex-wrap items-center gap-3 p-4">
              <GitCompareArrows className="text-nebula-400 size-5" />
              <div className="min-w-0">
                <h2 className="font-semibold text-white">{issue.title}</h2>
                <p className="text-sm text-slate-400">{issue.description}</p>
              </div>
              <Button variant="ghost" className="ml-auto">
                <Bell className="size-4" /> Notify both devs
              </Button>
            </div>
            {conflict ? (
              <>
                <SideDiff side={conflict.source} label="Breaking change" />
                <div className="flex items-center justify-center gap-2 text-xs text-rose-300">
                  <ArrowDown className="size-4" /> breaks code that depends on
                  it
                </div>
                <SideDiff side={conflict.impacted} label="Impacted code" />
              </>
            ) : (
              <div className="panel p-6 text-sm text-slate-400">
                No diff captured for this issue.
              </div>
            )}
          </>
        ) : (
          <div className="panel p-6 text-sm text-slate-400">
            Conflict not found.
          </div>
        )}
      </div>

      {issue && conflict && (
        <div className="lg:col-span-2 2xl:col-span-1">
          <AiPanel issue={issue} conflict={conflict} />
        </div>
      )}
    </div>
  )
}
