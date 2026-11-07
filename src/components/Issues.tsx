import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, CircleCheck, FileCode2 } from 'lucide-react'
import type { Issue } from '../data/types'
import { conflicts, timeAgo } from '../data/mock'
import { DevAvatar, SeverityBadge } from './ui'
import { severityStyles } from '../data/severity'

const categoryLabel: Record<string, string> = {
  api_contract: 'API contract',
  signature_change: 'Signature change',
  missing_dependency: 'Missing dependency',
}

/** Conflict notification card. */
export function IssueCard({
  issue,
  compact = false,
  active = false,
}: {
  issue: Issue
  compact?: boolean
  active?: boolean
}) {
  const s = severityStyles[issue.severity]
  const conflict = conflicts[issue.id]
  const resolved = issue.status === 'resolved'
  const confidence = issue.details?.confidence as number | undefined

  return (
    <Link
      to={`/conflicts/${issue.id}`}
      className={`group block rounded-xl border p-4 transition hover:-translate-y-0.5 ${
        resolved
          ? 'bg-space-850/40 border-slate-700/60 opacity-70'
          : `${s.border} ${s.bg}`
      } ${active ? 'ring-nebula-400/70 ring-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {resolved ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <CircleCheck className="size-3.5" /> Resolved
              </span>
            ) : (
              <SeverityBadge
                severity={issue.severity}
                confidence={confidence}
              />
            )}
            <span className="text-xs text-slate-400">
              {categoryLabel[issue.category] ?? issue.category}
            </span>
            <span className="ml-auto text-xs text-slate-500">
              {timeAgo(issue.updatedAt)}
            </span>
          </div>
          <h3
            className={`font-semibold ${resolved ? 'text-slate-300' : 'text-white'}`}
          >
            {issue.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {issue.description}
            </p>
          )}
          {conflict ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <DevAvatar id={conflict.source.developerId} size={20} />
              <code className="truncate font-mono">
                {conflict.source.path.split('/').pop()}
              </code>
              <ArrowRight className="size-3.5 shrink-0 text-slate-500" />
              <DevAvatar id={conflict.impacted.developerId} size={20} />
              <code className="truncate font-mono">
                {conflict.impacted.path.split('/').pop()}
              </code>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {issue.affectedFiles.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-400"
                >
                  <FileCode2 className="size-3" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
      </div>
    </Link>
  )
}

export function IssueList({
  issues,
  compact,
  activeId,
}: {
  issues: Issue[]
  compact?: boolean
  activeId?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {issues.map((i) => (
        <IssueCard
          key={i.id}
          issue={i}
          compact={compact}
          active={i.id === activeId}
        />
      ))}
    </div>
  )
}
