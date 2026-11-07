import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileCode2,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { developers, issues } from '../data/mock'
import { DevAvatar } from './ui'

interface TreeNode {
  name: string
  path: string
  children: Map<string, TreeNode>
  isFile: boolean
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    children: new Map(),
    isFile: false,
  }
  for (const p of paths) {
    let cur = root
    p.split('/').forEach((part, i, arr) => {
      if (!cur.children.has(part)) {
        cur.children.set(part, {
          name: part,
          path: arr.slice(0, i + 1).join('/'),
          children: new Map(),
          isFile: i === arr.length - 1,
        })
      }
      cur = cur.children.get(part)!
    })
  }
  return root
}

/** Explorer showing every file touched by any connected developer. */
export function FileExplorer({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (path: string) => void
}) {
  const { tree, editors, flagged } = useMemo(() => {
    const editors = new Map<string, string[]>()
    for (const d of developers) {
      for (const p of Object.keys(d.files)) {
        editors.set(p, [...(editors.get(p) ?? []), d.id])
      }
    }
    const flagged = new Set(
      issues
        .filter((i) => i.status === 'active')
        .flatMap((i) => i.affectedFiles),
    )
    const all = new Set([...editors.keys(), ...flagged])
    return { tree: buildTree([...all].sort()), editors, flagged }
  }, [])

  return (
    <div className="py-2 text-sm">
      {[...tree.children.values()].map((n) => (
        <TreeRow
          key={n.path}
          node={n}
          depth={0}
          selected={selected}
          onSelect={onSelect}
          editors={editors}
          flagged={flagged}
        />
      ))}
    </div>
  )
}

function TreeRow({
  node,
  depth,
  selected,
  onSelect,
  editors,
  flagged,
}: {
  node: TreeNode
  depth: number
  selected?: string
  onSelect: (p: string) => void
  editors: Map<string, string[]>
  flagged: Set<string>
}) {
  const [open, setOpen] = useState(true)
  const pad = { paddingLeft: 10 + depth * 14 }

  if (node.isFile) {
    const isSel = selected === node.path
    return (
      <button
        onClick={() => onSelect(node.path)}
        style={pad}
        className={`flex w-full items-center gap-2 py-1 pr-3 text-left ${
          isSel
            ? 'bg-nebula-600/30 text-white'
            : 'text-slate-300 hover:bg-white/5'
        }`}
      >
        <FileCode2 className="size-4 shrink-0 text-sky-300" />
        <span className="truncate">{node.name}</span>
        <span className="ml-auto flex items-center gap-1">
          {(editors.get(node.path) ?? []).map((id) => (
            <DevAvatar key={id} id={id} size={14} />
          ))}
          {flagged.has(node.path) && (
            <CircleAlert className="size-4 text-rose-400" />
          )}
        </span>
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={pad}
        className="flex w-full items-center gap-1.5 py-1 pr-3 text-left text-slate-300 hover:bg-white/5"
      >
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        {open ? (
          <FolderOpen className="text-nebula-400 size-4" />
        ) : (
          <Folder className="text-nebula-400 size-4" />
        )}
        {node.name}/
      </button>
      {open &&
        [...node.children.values()].map((c) => (
          <TreeRow
            key={c.path}
            node={c}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            editors={editors}
            flagged={flagged}
          />
        ))}
    </div>
  )
}
