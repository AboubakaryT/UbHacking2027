import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Network } from 'lucide-react'
import { graph, issues } from '../data/mock'
import type { GraphNode } from '../data/types'
import { DependencyGraph } from '../components/graph'
import { IssueCard } from '../components/Issues'
import { PanelHeader } from '../components/ui'

const legend = [
  { label: 'Critical', color: '#fb7185' },
  { label: 'High', color: '#fb923c' },
  { label: 'Medium', color: '#fcd34d' },
  { label: 'No issues', color: '#3b3185' },
]

export default function GraphPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null)

  const upstream = selected
    ? graph.edges.filter((e) => e.targetNode === selected.id)
    : []
  const downstream = selected
    ? graph.edges.filter((e) => e.sourceNode === selected.id)
    : []
  const label = (id: string) =>
    graph.nodes.find((n) => n.id === id)?.label ?? id
  const related = selected?.path
    ? issues.filter((i) => i.affectedFiles.includes(selected.path!))
    : []

  return (
    <div className="grid h-full min-h-[640px] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="panel flex min-h-[520px] flex-col overflow-hidden">
        <PanelHeader
          icon={<Network className="size-4" />}
          title="Dependency map"
          right={legend.map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        />
        <div className="min-h-0 flex-1">
          <DependencyGraph graph={graph} onSelect={setSelected} />
        </div>
      </div>

      <div className="panel overflow-auto">
        <PanelHeader title={selected ? selected.label : 'Node details'} />
        {selected ? (
          <div className="flex flex-col gap-4 p-4 text-sm">
            <dl className="grid grid-cols-[80px_1fr] gap-y-1.5">
              <dt className="text-slate-500">Type</dt>
              <dd className="text-slate-200">{selected.nodeType}</dd>
              {selected.path && (
                <>
                  <dt className="text-slate-500">Path</dt>
                  <dd className="font-mono text-xs break-all text-slate-200">
                    {selected.path}
                  </dd>
                </>
              )}
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-200">
                {selected.issueStatus ?? 'healthy'}
              </dd>
            </dl>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Depends on ({downstream.length})
              </h3>
              <ul className="space-y-1">
                {downstream.map((e) => (
                  <li key={e.id} className="font-mono text-xs text-slate-300">
                    <span className="text-slate-500">{e.relationship} →</span>{' '}
                    {label(e.targetNode)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Used by ({upstream.length})
              </h3>
              <ul className="space-y-1">
                {upstream.map((e) => (
                  <li key={e.id} className="font-mono text-xs text-slate-300">
                    {label(e.sourceNode)}{' '}
                    <span className="text-slate-500">→ {e.relationship}</span>
                  </li>
                ))}
              </ul>
            </div>

            {related.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Related conflicts
                </h3>
                {related.map((i) => (
                  <IssueCard key={i.id} issue={i} compact />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="p-4 text-sm text-slate-400">
            Click a node to see what it depends on and which developers' changes
            affect it. Red animated edges show where a break spreads.{' '}
            <Link to="/conflicts" className="text-nebula-300 underline">
              View conflicts
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
