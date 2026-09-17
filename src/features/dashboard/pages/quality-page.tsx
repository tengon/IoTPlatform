'use client'

import { useMemo } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  PieChart as PieChartIcon,
  ListFilter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts'
import { PageHeader } from '@/shared/components/page-header'
import {
  ChartTooltip,
  AXIS_TICK_SM,
  AXIS_LINE,
  GRID_STROKE,
  LEGEND_STYLE,
  C_GREEN,
  C_CYAN,
  C_ORANGE,
  C_RED,
} from '@/shared/components/chart-utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Local color constants ─────────────────────────────────────────────────
const C_GREEN_LIGHT = 'rgba(16,185,129,0.15)'
const C_RED_LIGHT = 'rgba(239,68,68,0.15)'
const C_CYAN_LIGHT = 'rgba(6,182,212,0.15)'
const C_ORANGE_LIGHT = 'rgba(249,115,22,0.15)'
const C_YELLOW = '#eab308'
const C_YELLOW_LIGHT = 'rgba(234,179,8,0.15)'
const C_AMBER = '#f59e0b'
const C_PURPLE = '#a855f7'
const C_PURPLE_LIGHT = 'rgba(168,85,247,0.15)'

// ─── Enhanced Mini sparkline for KPI cards ────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const sparkData = data.slice(-12).map((v, i) => ({ i, v }))
  if (sparkData.length < 2) return null
  const min = Math.min(...sparkData.map((d) => d.v))
  const max = Math.max(...sparkData.map((d) => d.v))
  const range = max - min || 1
  const h = 32
  const w = 80
  const step = w / (sparkData.length - 1)
  const points = sparkData
    .map((d, idx) => {
      const x = idx * step
      const y = h - ((d.v - min) / range) * (h - 6) - 3
      return `${x},${y}`
    })
    .join(' ')
  const lastX = (sparkData.length - 1) * step
  const lastY = h - ((sparkData[sparkData.length - 1].v - min) / range) * (h - 6) - 3
  const gradId = `spark-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8 opacity-70">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradId})`}
        points={`0,${h} ${points} ${lastX},${h}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  sparkData?: number[]
  sparkColor?: string
  accentColor?: string
  className?: string
}

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend = 'neutral',
  sparkData,
  sparkColor = C_GREEN,
  accentColor,
  className,
}: KPICardProps) {
  return (
    <Card className={`relative overflow-hidden h-full kpi-card-hover group cursor-default ${className || ''}`}>
      {/* Top accent gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor || 'var(--primary)'}, transparent)`,
        }}
      />
      <CardContent className="flex items-start justify-between p-5 pt-5 pb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105"
            style={{
              backgroundColor: accentColor ? `${accentColor}18` : 'var(--primary) 12%',
              ringColor: accentColor ? `${accentColor}25` : 'var(--primary) 20%',
            }}
          >
            <Icon className="size-5" style={{ color: accentColor || 'var(--primary)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground metric-value animate-count-up">
              {value}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {trend === 'up' && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <TrendingUp className="size-3" />
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center gap-0.5 text-red-400">
                  <TrendingDown className="size-3" />
                </span>
              )}
              <span
                className={
                  trend === 'up'
                    ? 'kpi-subtext text-emerald-400/80'
                    : trend === 'down'
                      ? 'kpi-subtext text-red-400/80'
                      : 'kpi-subtext text-muted-foreground/70'
                }
              >
                {subtitle}
              </span>
            </div>
          </div>
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="shrink-0 mt-1">
            <MiniSparkline data={sparkData} color={sparkColor} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Chart Card Wrapper ────────────────────────────────────────────────────
function ChartCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-emerald-400',
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  icon: React.ElementType
  iconColor?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 ${className || ''}`}>
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon className={`size-4 ${iconColor}`} />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  )
}

// ─── Quality Status Badge ──────────────────────────────────────────────────
function QualityStatusBadge({ quality }: { quality: number }) {
  if (quality >= 99) {
    return <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-[10px]">Good</Badge>
  }
  if (quality >= 97) {
    return <Badge variant="default" className="bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 text-[10px]">Warning</Badge>
  }
  return <Badge variant="default" className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20 text-[10px]">Critical</Badge>
}

// ─── Mock Data ─────────────────────────────────────────────────────────────

// Good vs Reject Trend (24h)
const GOOD_REJECT_TREND = [
  { hour: '00:00', good: 580, reject: 9 },
  { hour: '01:00', good: 545, reject: 11 },
  { hour: '02:00', good: 510, reject: 8 },
  { hour: '03:00', good: 490, reject: 12 },
  { hour: '04:00', good: 520, reject: 7 },
  { hour: '05:00', good: 560, reject: 10 },
  { hour: '06:00', good: 610, reject: 8 },
  { hour: '07:00', good: 650, reject: 14 },
  { hour: '08:00', good: 680, reject: 11 },
  { hour: '09:00', good: 695, reject: 9 },
  { hour: '10:00', good: 710, reject: 13 },
  { hour: '11:00', good: 725, reject: 10 },
  { hour: '12:00', good: 690, reject: 8 },
  { hour: '13:00', good: 705, reject: 12 },
  { hour: '14:00', good: 720, reject: 9 },
  { hour: '15:00', good: 735, reject: 11 },
  { hour: '16:00', good: 740, reject: 7 },
  { hour: '17:00', good: 715, reject: 10 },
  { hour: '18:00', good: 680, reject: 8 },
  { hour: '19:00', good: 650, reject: 6 },
  { hour: '20:00', good: 620, reject: 9 },
  { hour: '21:00', good: 590, reject: 7 },
  { hour: '22:00', good: 570, reject: 8 },
  { hour: '23:00', good: 552, reject: 6 },
]

// Reject Reason Distribution
const REJECT_REASONS = [
  { reason: 'Dimensional Error', pct: 38, count: 83, color: C_RED },
  { reason: 'Surface Defect', pct: 25, count: 55, color: C_ORANGE },
  { reason: 'Material Defect', pct: 18, count: 39, color: C_YELLOW },
  { reason: 'Assembly Error', pct: 12, count: 26, color: C_CYAN },
  { reason: 'Other', pct: 7, count: 15, color: C_GREEN },
]

// Machine Quality Table
const MACHINE_QUALITY = [
  { machine: 'CNC Mill #1', total: 2100, good: 2087, reject: 13, quality: 99.38, topDefect: 'Dimensional Error', status: 'good' as const },
  { machine: 'CNC Mill #2', total: 1890, good: 1872, reject: 18, quality: 99.05, topDefect: 'Surface Defect', status: 'good' as const },
  { machine: 'Lathe #1', total: 2350, good: 2341, reject: 9, quality: 99.62, topDefect: 'Dimensional Error', status: 'good' as const },
  { machine: 'Press #1', total: 1720, good: 1687, reject: 33, quality: 98.08, topDefect: 'Material Defect', status: 'warning' as const },
  { machine: 'Robot Arm #1', total: 1560, good: 1545, reject: 15, quality: 99.04, topDefect: 'Assembly Error', status: 'good' as const },
  { machine: 'Welder #1', total: 1980, good: 1920, reject: 60, quality: 96.97, topDefect: 'Surface Defect', status: 'critical' as const },
  { machine: 'Grinder #1', total: 1450, good: 1421, reject: 29, quality: 98.00, topDefect: 'Dimensional Error', status: 'warning' as const },
  { machine: 'Conveyor A', total: 2450, good: 2439, reject: 11, quality: 99.55, topDefect: 'Other', status: 'good' as const },
]

// Quality by Product (Pie Chart)
const PRODUCT_QUALITY = [
  { product: 'Precision Shaft', count: 4200, quality: 99.2, color: C_GREEN },
  { product: 'Gear Housing', count: 3100, quality: 98.5, color: C_CYAN },
  { product: 'Bearing Ring', count: 2800, quality: 97.8, color: C_ORANGE },
  { product: 'Connector Pin', count: 1950, quality: 99.6, color: '#8b5cf6' },
  { product: 'Mounting Plate', count: 1500, quality: 96.4, color: C_YELLOW },
  { product: 'Others', count: 1048, quality: 98.1, color: '#71717a' },
]

// Pareto Data (already sorted descending by count)
const PARETO_DATA = [
  { reason: 'Dimensional Error', count: 83, cumulative: 38.1 },
  { reason: 'Surface Defect', count: 55, cumulative: 63.3 },
  { reason: 'Material Defect', count: 39, cumulative: 81.2 },
  { reason: 'Assembly Error', count: 26, cumulative: 93.2 },
  { reason: 'Calibration Drift', count: 8, cumulative: 96.9 },
  { reason: 'Tool Wear', count: 4, cumulative: 98.7 },
  { reason: 'Other', count: 3, cumulative: 100.0 },
]

// Sparkline data
const SPARK_QUALITY = [97.8, 97.9, 98.1, 98.0, 98.2, 98.3, 98.1, 98.4, 98.5, 98.4, 98.5, 98.6]
const SPARK_GOOD = [13800, 13920, 14010, 14050, 14120, 14180, 14250, 14320, 14400, 14520, 14650, 14782]
const SPARK_REJECT = [260, 255, 248, 242, 238, 232, 228, 225, 222, 220, 219, 218]
const SPARK_FPY = [96.2, 96.3, 96.5, 96.4, 96.6, 96.7, 96.8, 96.9, 96.9, 97.0, 97.0, 97.1]

// ─── Custom Pareto Tooltip ─────────────────────────────────────────────────
function ParetoTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-1.5 font-semibold text-foreground/90">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground/80 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="flex-1 kpi-subtext">{p.name}</span>
          <span className="font-bold text-foreground metric-value">
            {p.name === 'Cumulative %' ? `${p.value.toFixed(1)}%` : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Custom Pie Label ──────────────────────────────────────────────────────
const RADIAN = Math.PI / 180
function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.85)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function QualityPage() {
  // ── Memoized data ──
  const goodRejectTrend = useMemo(() => GOOD_REJECT_TREND, [])
  const rejectReasons = useMemo(() => REJECT_REASONS, [])
  const machineQuality = useMemo(() => MACHINE_QUALITY, [])
  const productQuality = useMemo(() => PRODUCT_QUALITY, [])
  const paretoData = useMemo(() => PARETO_DATA, [])

  const overallQuality = useMemo(() => {
    const totalGood = machineQuality.reduce((s, m) => s + m.good, 0)
    const totalAll = machineQuality.reduce((s, m) => s + m.total, 0)
    return totalAll > 0 ? ((totalGood / totalAll) * 100) : 0
  }, [machineQuality])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <PageHeader
        title="Quality"
        description="OEE Quality: Good Count / Total Count × 100%"
        icon={ShieldCheck}
      />

      {/* ── Top KPI Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <KPICard
          icon={ShieldCheck}
          label="Quality Rate"
          value="98.6%"
          subtitle="↑ 0.3% vs last shift"
          trend="up"
          trendValue="+0.3%"
          sparkData={SPARK_QUALITY}
          sparkColor={C_GREEN}
          accentColor={C_GREEN}
        />
        <KPICard
          icon={CheckCircle2}
          label="Good Count"
          value={14782 .toLocaleString() + ' pcs'}
          subtitle="Today cumulative"
          trend="up"
          sparkData={SPARK_GOOD}
          sparkColor={C_GREEN}
          accentColor={C_GREEN}
        />
        <KPICard
          icon={XCircle}
          label="Reject Count"
          value={218 .toLocaleString() + ' pcs'}
          subtitle="↓ 15 vs yesterday (improving)"
          trend="down"
          sparkData={SPARK_REJECT}
          sparkColor={C_RED}
          accentColor={C_RED}
        />
        <KPICard
          icon={Target}
          label="First Pass Yield"
          value="97.1%"
          subtitle="↑ 0.5% vs last shift"
          trend="up"
          trendValue="+0.5%"
          sparkData={SPARK_FPY}
          sparkColor={C_CYAN}
          accentColor={C_CYAN}
        />
      </div>

      {/* ── Good vs Reject Trend + Reject Reason Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Good vs Reject Stacked Area */}
        <ChartCard
          title="Good vs Reject Trend"
          description="24-hour production quality breakdown"
          icon={BarChart3}
          iconColor="text-emerald-400"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goodRejectTrend} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gradReject" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_RED} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C_RED} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} interval={3} />
                <YAxis yAxisId="left" tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} orientation="left" />
                <YAxis yAxisId="right" tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} orientation="right" domain={[0, 20]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="good"
                  name="Good Count"
                  stroke={C_GREEN}
                  strokeWidth={2}
                  fill="url(#gradGood)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: C_GREEN }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="reject"
                  name="Reject Count"
                  stroke={C_RED}
                  strokeWidth={2}
                  fill="url(#gradReject)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: C_RED }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Reject Reason Distribution */}
        <ChartCard
          title="Reject Reason Distribution"
          description="Top defect categories"
          icon={AlertTriangle}
          iconColor="text-red-400"
        >
          <div className="space-y-3">
            {rejectReasons.map((item) => (
              <div key={item.reason} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-foreground/90">{item.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground/70">{item.count} pcs</span>
                    <span className="text-xs font-bold metric-value" style={{ color: item.color }}>
                      {item.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/70">Total Rejects</span>
              <span className="font-bold text-foreground metric-value">
                {rejectReasons.reduce((s, r) => s + r.count, 0).toLocaleString()} pcs
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Machine Quality Table ── */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <ChartCard
          title="Machine Quality Table"
          description="Per-machine quality metrics and defect analysis"
          icon={ListFilter}
          iconColor="text-emerald-400"
          actions={
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
              {machineQuality.filter((m) => m.status === 'good').length}/{machineQuality.length} Good
            </Badge>
          }
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Machine</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-right">Total Count</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-right">Good Count</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-right">Reject Count</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-right">Quality %</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Top Defect</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machineQuality.map((m) => (
                  <TableRow key={m.machine} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-sm text-foreground/90">{m.machine}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{m.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-emerald-400/90">{m.good.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-red-400/90">{m.reject.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-bold tabular-nums metric-value" style={{ color: m.quality >= 99 ? C_GREEN : m.quality >= 97 ? C_AMBER : C_RED }}>
                          {m.quality.toFixed(2)}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${m.quality}%`,
                              backgroundColor: m.quality >= 99 ? C_GREEN : m.quality >= 97 ? C_AMBER : C_RED,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/80">{m.topDefect}</TableCell>
                    <TableCell className="text-center">
                      <QualityStatusBadge quality={m.quality} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      </div>

      {/* ── Quality by Product + Reject Pareto Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Quality by Product Pie Chart */}
        <ChartCard
          title="Quality by Product"
          description="Production distribution across product types"
          icon={PieChartIcon}
          iconColor="text-cyan-400"
        >
          <div className="relative h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productQuality}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  innerRadius={45}
                  dataKey="count"
                  nameKey="product"
                  strokeWidth={2}
                  stroke="rgba(0,0,0,0.2)"
                >
                  {productQuality.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as (typeof productQuality)[0]
                    return (
                      <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl">
                        <p className="mb-1.5 font-semibold text-foreground/90">{data.product}</p>
                        <p className="text-muted-foreground/80 flex items-center gap-2">
                          <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
                          <span className="flex-1 kpi-subtext">Production Count</span>
                          <span className="font-bold text-foreground metric-value">{data.count.toLocaleString()}</span>
                        </p>
                        <p className="text-muted-foreground/80 flex items-center gap-2">
                          <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
                          <span className="flex-1 kpi-subtext">Quality Rate</span>
                          <span className="font-bold text-foreground metric-value">{data.quality}%</span>
                        </p>
                      </div>
                    )
                  }}
                />
                <Legend
                  wrapperStyle={LEGEND_STYLE}
                  formatter={(value: string, entry: any) => {
                    const item = productQuality.find((p) => p.product === value)
                    return (
                      <span className="text-[11px]" style={{ color: entry.color }}>
                        {value} <span className="text-muted-foreground/50">({item?.quality}%)</span>
                      </span>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center" style={{ marginTop: '-4px' }}>
                <p className="text-2xl font-extrabold text-emerald-400 metric-value">{overallQuality.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Overall</p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Reject Pareto Chart */}
        <ChartCard
          title="Reject Pareto Analysis"
          description="Cumulative defect distribution — 80/20 rule"
          icon={BarChart3}
          iconColor="text-orange-400"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradParetoBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_ORANGE} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={C_ORANGE} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis
                  dataKey="reason"
                  tick={AXIS_TICK_SM}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  yAxisId="left"
                  tick={AXIS_TICK_SM}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  orientation="left"
                  label={{
                    value: 'Reject Count',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  domain={[0, 100]}
                  tick={AXIS_TICK_SM}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  orientation="right"
                  tickFormatter={(v: number) => `${v}%`}
                  label={{
                    value: 'Cumulative %',
                    angle: 90,
                    position: 'insideRight',
                    offset: 10,
                    style: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 },
                  }}
                />
                <Tooltip content={<ParetoTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="Reject Count"
                  fill="url(#gradParetoBar)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative %"
                  stroke={C_CYAN}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: C_CYAN, stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, stroke: C_CYAN, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}


