import type { ReactNode } from 'react'
import type { Severity } from '../data/types'
import { devColors } from '../data/mock'
import { severityStyles } from '../data/severity'

export function SeverityBadge({
  severity,
  confidence,
}: {
  severity: Severity
  confidence?: number
}) {
  const s = severityStyles[severity]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.text} ${s.border} ${s.bg}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
      {confidence !== undefined && ` · ${Math.round(confidence * 100)}%`}
    </span>
  )
}

export function DevAvatar({
  id,
  size = 28,
  online,
}: {
  id: string
  size?: number
  online?: boolean
}) {
  const color = devColors[id] ?? '#a78bfa'
  return (
    <span className="relative inline-flex shrink-0" title={id}>
      <span
        className="text-space-950 inline-flex items-center justify-center rounded-full font-semibold uppercase"
        style={{
          width: size,
          height: size,
          background: color,
          fontSize: size * 0.42,
        }}
      >
        {id[0]}
      </span>
      {online !== undefined && (
        <span
          className={`border-space-900 absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 ${online ? 'bg-emerald-400' : 'bg-slate-500'}`}
        />
      )}
    </span>
  )
}

export function PanelHeader({
  icon,
  title,
  right,
}: {
  icon?: ReactNode
  title: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="border-nebula-500/15 flex items-center gap-2.5 border-b px-4 py-3">
      {icon && <span className="text-nebula-400">{icon}</span>}
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  onClick?: () => void
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition'
  const styles =
    variant === 'primary'
      ? 'bg-nebula-600 text-white hover:bg-nebula-500 glow'
      : 'border border-nebula-500/40 text-nebula-300 hover:bg-nebula-500/10'
  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
