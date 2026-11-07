import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileCode2,
  FolderTree,
  GitCompareArrows,
  X,
} from 'lucide-react'
import { conflicts, issues } from '../data/mock'
import type { Conflict, ConflictSide } from '../data/types'
import { FileExplorer } from '../components/Codebase'
import { CodeView, DiffViewer } from '../components/DiffViewer'
import { AiPanel } from '../components/AiPanel'
import { DevAvatar, PanelHeader, SeverityBadge } from '../components/ui'

const activeConflicts = issues
  .filter((i) => i.status === 'active' && conflicts[i.id])
  .map((i) => ({ issue: i, conflict: conflicts[i.id] }))

function findSide(
  path: string,
): { side: ConflictSide; conflict: Conflict } | undefined {
  for (const c of Object.values(conflicts)) {
    if (c.source.path === path) return { side: c.source, conflict: c }
    if (c.impacted.path === path) return { side: c.impacted, conflict: c }
  }
}

const placeholder = (path: string) =>
  `// ${path}\n// No live content streamed for this file yet.\n// The file watcher agent will send it here as soon as it changes.\n`

export default function Workspace() {
  const [openTabs, setOpenTabs] = useState<string[]>([
    'web/src/components/ProfileCard.tsx',
    'server/routes/users.ts',
  ])
  const [current, setCurrent] = useState(openTabs[0])
  const [idx, setIdx] = useState(0)

  const open = (p: string) => {
    setOpenTabs((t) => (t.includes(p) ? t : [...t, p]))
    setCurrent(p)
  }
  const close = (p: string) => {
    const next = openTabs.filter((t) => t !== p)
    setOpenTabs(next)
    if (current === p) setCurrent(next[0] ?? '')
  }

  const hit = current ? findSide(current) : undefined
  const fileConflict = hit
    ? activeConflicts.find((c) => c.conflict === hit.conflict)
    : undefined
  const preview = activeConflicts[idx]
  const flagged = useMemo(
    () =>
      new Set(
        issues
          .filter((i) => i.status === 'active')
          .flatMap((i) => i.affectedFiles),
      ),
    [],
  )

  return (
    <div className="grid h-full min-h-[720px] grid-cols-[240px_minmax(0,1fr)_360px] grid-rows-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
      {/* Explorer */}
      <div className="panel row-span-2 overflow-auto">
        <PanelHeader
          icon={<FolderTree className="size-4" />}
          title="Explorer"
        />
        <FileExplorer selected={current} onSelect={open} />
      </div>

      {/* Editor */}
      <div className="panel flex min-h-0 flex-col overflow-hidden">
        <div className="border-nebula-500/15 flex items-end gap-1 border-b px-2 pt-2">
          {openTabs.map((t) => (
            <div
              key={t}
              onClick={() => setCurrent(t)}
              className={`flex cursor-pointer items-center gap-2 rounded-t-lg border border-b-0 px-3 py-1.5 text-sm ${
                t === current
                  ? 'border-nebula-500/40 bg-space-800 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="size-3.5 text-sky-300" />
              {t.split('/').pop()}
              {flagged.has(t) && (
                <CircleAlert className="size-3.5 text-rose-400" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  close(t)
                }}
                className="rounded p-0.5 hover:bg-white/10"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
        {current ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-slate-400">
              {current.split('/').join('  ›  ')}
              {hit && (
                <span className="ml-auto flex items-center gap-1.5 font-sans">
                  <DevAvatar id={hit.side.developerId} size={16} />
                  editing now
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <CodeView
                value={hit?.side.modified ?? placeholder(current)}
                language={hit?.side.language ?? 'typescript'}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Pick a file in the explorer
          </div>
        )}
      </div>

      {/* AI side panel */}
      <div className="row-span-2 min-h-0 overflow-auto">
        {fileConflict ? (
          <AiPanel
            issue={fileConflict.issue}
            conflict={fileConflict.conflict}
            showOpenLink
          />
        ) : (
          <div className="panel p-6 text-center text-sm text-slate-400">
            No conflicts touch this file. 🚀
          </div>
        )}
      </div>

      {/* Bottom merge/conflict preview */}
      <div className="panel flex min-h-0 flex-col overflow-hidden">
        <PanelHeader
          icon={<GitCompareArrows className="size-4" />}
          title={
            preview ? (
              <span className="flex items-center gap-2">
                Conflict preview:
                <DevAvatar id={preview.conflict.source.developerId} size={18} />
                <code className="font-mono text-xs text-slate-300">
                  {preview.conflict.source.path}
                </code>
              </span>
            ) : (
              'Conflict preview'
            )
          }
          right={
            preview && (
              <>
                <SeverityBadge
                  severity={preview.issue.severity}
                  confidence={preview.conflict.ai.confidence}
                />
                <button
                  onClick={() =>
                    setIdx(
                      (idx - 1 + activeConflicts.length) %
                        activeConflicts.length,
                    )
                  }
                  className="border-nebula-500/30 rounded border p-1 hover:bg-white/5"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs text-slate-400">
                  {idx + 1} of {activeConflicts.length}
                </span>
                <button
                  onClick={() => setIdx((idx + 1) % activeConflicts.length)}
                  className="border-nebula-500/30 rounded border p-1 hover:bg-white/5"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )
          }
        />
        {preview && (
          <div className="min-h-0 flex-1">
            <DiffViewer
              original={preview.conflict.source.original}
              modified={preview.conflict.source.modified}
              language={preview.conflict.source.language}
            />
          </div>
        )}
      </div>
    </div>
  )
}
