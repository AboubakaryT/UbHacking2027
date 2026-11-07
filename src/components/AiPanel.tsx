import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Code2,
  GitCompareArrows,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { Conflict, Issue } from '../data/types'
import { Button, PanelHeader, SeverityBadge } from './ui'
import { CodeView } from './DiffViewer'

/**
 * AI explanation + suggested fix for one conflict.
 * TODO: replace the fake delay with a call to the AI analysis service.
 */
interface Props {
  issue: Issue
  conflict: Conflict
  showOpenLink?: boolean
}

export function AiPanel(props: Props) {
  const [nonce, setNonce] = useState(0)
  // Remount on a new issue or "regenerate" so the loading state restarts.
  return (
    <AiPanelInner
      key={`${props.issue.id}-${nonce}`}
      {...props}
      onRegenerate={() => setNonce((n) => n + 1)}
    />
  )
}

function AiPanelInner({
  issue,
  conflict,
  showOpenLink = false,
  onRegenerate,
}: Props & { onRegenerate: () => void }) {
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const { ai } = conflict
  const fixLines = ai.suggestedFix.split('\n').length

  return (
    <div className="panel flex flex-col overflow-hidden">
      <PanelHeader
        icon={<Sparkles className="size-4" />}
        title="AI Conflict Assistant"
        right={
          <button
            onClick={onRegenerate}
            className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            title="Regenerate"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3 p-4">
          {[80, 95, 60, 90, 70].map((w, i) => (
            <div
              key={i}
              className="bg-nebula-500/15 h-3 animate-pulse rounded"
              style={{ width: `${w}%` }}
            />
          ))}
          <p className="text-nebula-300/70 text-xs">Analyzing both changes…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-rose-300" />
              <span className="font-semibold text-rose-200">
                Breaking change likely
              </span>
              <span className="ml-auto">
                <SeverityBadge
                  severity={issue.severity}
                  confidence={ai.confidence}
                />
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-300">{issue.description}</p>
          </div>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Why?
            </h3>
            <ul className="marker:text-nebula-400 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {ai.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Suggested fix
            </h3>
            <div className="overflow-hidden rounded-lg border border-emerald-500/30">
              <CodeView
                value={ai.suggestedFix}
                language={ai.suggestedFixLanguage}
                height={Math.min(fixLines * 19 + 24, 280)}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Next steps
            </h3>
            <ol className="space-y-1.5 text-sm text-slate-300">
              {ai.steps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="bg-nebula-600/40 text-nebula-200 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setApplied(true)} className="flex-1">
              {applied ? (
                <Check className="size-4" />
              ) : (
                <Code2 className="size-4" />
              )}
              {applied
                ? `Fix sent to ${conflict.impacted.developerId}`
                : 'Apply suggestion'}
            </Button>
            {showOpenLink && (
              <Link to={`/conflicts/${issue.id}`} className="flex-1">
                <Button variant="ghost" className="w-full">
                  <GitCompareArrows className="size-4" /> Open diff
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
