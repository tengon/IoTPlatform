'use client'

import { Badge } from '@/components/ui/badge'

const variants = {
  // Statuses
  running: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20', dot: 'bg-emerald-500' },
  idle: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20', dot: 'bg-amber-500' },
  maintenance: { className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/20', dot: 'bg-cyan-500' },
  error: { className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20', dot: 'bg-red-500' },
  online: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20', dot: 'bg-emerald-500' },
  offline: { className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20', dot: 'bg-red-500' },
  warning: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20', dot: 'bg-amber-500' },
  // Alarm statuses
  active: { className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20', dot: 'bg-red-500' },
  acknowledged: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20', dot: 'bg-amber-500' },
  resolved: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20', dot: 'bg-emerald-500' },
  // Production statuses
  completed: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20', dot: 'bg-emerald-500' },
  paused: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20', dot: 'bg-amber-500' },
  // Severity
  critical: { className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20', dot: 'bg-red-500' },
  info: { className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/20', dot: 'bg-cyan-500' },
  // User status
  active_user: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-500' },
  inactive_user: { className: 'bg-red-500/15 text-red-400 border-red-500/25', dot: 'bg-red-500' },
} as const

type StatusType = keyof typeof variants

export function StatusBadge({ status, showDot = true, label }: { status: StatusType; showDot?: boolean; label?: string }) {
  const v = variants[status] || variants.info
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  return (
    <Badge variant="outline" className={`${v.className} gap-1.5 text-[11px] font-medium`}>
      {showDot && <span className={`size-1.5 rounded-full ${v.dot}`} />}
      {displayLabel}
    </Badge>
  )
}
