'use client'

/**
 * Shared chart constants, tooltip, and grid config
 * for consistent styling across all analytics pages.
 */
export const C_GREEN = '#10b981'
export const C_YELLOW = '#eab308'
export const C_CYAN = '#06b6d4'
export const C_ORANGE = '#f97316'
export const C_RED = '#ef4444'
export const C_SLATE = '#71717a'

export const C_GREEN_LIGHT = 'rgba(16,185,129,0.15)'
export const C_YELLOW_LIGHT = 'rgba(234,179,8,0.15)'
export const C_CYAN_LIGHT = 'rgba(6,182,212,0.15)'
export const C_ORANGE_LIGHT = 'rgba(249,115,22,0.15)'
export const C_RED_LIGHT = 'rgba(239,68,68,0.15)'

/** Consistent axis tick and line styles for dark theme */
export const AXIS_TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 11 }
export const AXIS_TICK_SM = { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }
export const AXIS_LINE = { stroke: 'rgba(255,255,255,0.06)' }
export const GRID_STROKE = 'rgba(255,255,255,0.05)'

/** Consistent legend style */
export const LEGEND_STYLE = { fontSize: 11, color: 'rgba(255,255,255,0.65)' }

/** Shared dark tooltip for recharts */
export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = '',
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  valueSuffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl chart-tooltip">
      <p className="mb-1.5 font-semibold text-foreground/90">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground/80 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="flex-1 kpi-subtext">{p.name}</span>
          <span className="font-bold text-foreground metric-value">{p.value}{valueSuffix}</span>
        </p>
      ))}
    </div>
  )
}

/** Shared OEE color helper */
export function oeeColor(oee: number): string {
  if (oee >= 85) return C_GREEN
  if (oee >= 70) return C_YELLOW
  return C_RED
}

/** Shared OEE bar color */
export function oeeBarColor(oee: number): string {
  if (oee >= 85) return 'bg-emerald-500'
  if (oee >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

/** Shared severity colors */
export const SEVERITY_COLORS: Record<string, { fill: string; bg: string }> = {
  critical: { fill: C_RED, bg: C_RED_LIGHT },
  warning: { fill: C_YELLOW, bg: C_YELLOW_LIGHT },
  info: { fill: C_CYAN, bg: C_CYAN_LIGHT },
}

/** Shared status colors */
export const STATUS_COLORS: Record<string, string> = {
  running: C_GREEN,
  idle: C_YELLOW,
  maintenance: '#3b82f6',
  error: C_RED,
  online: C_GREEN,
  offline: C_SLATE,
  warning: C_YELLOW,
}
