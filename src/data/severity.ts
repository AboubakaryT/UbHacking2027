import type { Severity } from './types'

export const severityStyles: Record<
  Severity,
  { text: string; border: string; bg: string; dot: string; label: string }
> = {
  critical: {
    text: 'text-rose-300',
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-400',
    label: 'Critical',
  },
  high: {
    text: 'text-orange-300',
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
    label: 'High',
  },
  medium: {
    text: 'text-amber-200',
    border: 'border-amber-400/50',
    bg: 'bg-amber-400/10',
    dot: 'bg-amber-300',
    label: 'Medium',
  },
  low: {
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    dot: 'bg-sky-400',
    label: 'Low',
  },
}
