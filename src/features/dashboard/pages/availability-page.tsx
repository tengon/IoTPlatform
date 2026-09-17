'use client'

import { useMemo } from 'react'
import {
  CircleDot,
  Play,
  Square,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  Timer,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ─── Color constants ────────────────────────────────────────────────────────
const C_EMERALD = '#10b981'
const C_AMBER = '#f59e0b'
const C_RED_C = '#ef4444'
const C_SLATE = '#64748b'

const C_EMERALD_LIGHT = 'rgba(16,185,129,0.15)'
const C_AMBER_LIGHT = 'rgba(245,158,11,0.15)'
const C_RED_LIGHT = 'rgba(239,68,68,0.15)'
const C_SLATE_LIGHT = 'rgba(100,116,139,0.15)'

// ─── Planned production time ────────────────────────────────────────────────
const PLANNED_HRS = 24.0

// ─── Top-level KPI data ─────────────────────────────────────────────────────
interface KPIMetric {
  label: string
  hours: number
  pct: number
  color: string
  colorLight: string
  icon: React.ElementType
  trend: number // positive = up, negative = down
  sparkline: number[]
}

const KPI_METRICS: KPIMetric[] = [
  {
    label: 'Run Time',
    hours: 18.4,
    pct: 76.7,
    color: C_EMERALD,
    colorLight: C_EMERALD_LIGHT,
    icon: Play,
    trend: 2.3,
    sparkline: [15.2, 16.1, 17.0, 16.8, 17.5, 18.0, 17.8, 18.2, 18.4],
  },
  {
    label: 'Stop Time',
    hours: 3.2,
    pct: 13.3,
    color: C_AMBER,
    colorLight: C_AMBER_LIGHT,
    icon: Square,
    trend: -1.1,
    sparkline: [4.1, 3.8, 3.5, 3.6, 3.4, 3.3, 3.5, 3.3, 3.2],
  },
  {
    label: 'Fault Time',
    hours: 1.1,
    pct: 4.6,
    color: C_RED_C,
    colorLight: C_RED_LIGHT,
    icon: AlertTriangle,
    trend: -0.5,
    sparkline: [1.8, 1.5, 1.3, 1.4, 1.2, 1.1, 1.3, 1.2, 1.1],
  },
  {
    label: 'Downtime',
    hours: 1.3,
    pct: 5.4,
    color: C_SLATE,
    colorLight: C_SLATE_LIGHT,
    icon: Clock,
    trend: -0.7,
    sparkline: [2.0, 1.8, 1.6, 1.5, 1.4, 1.5, 1.4, 1.3, 1.3],
  },
]

// ─── 24-hour stacked area trend data ────────────────────────────────────────
function generateHourlyTrend() {
  const data = []
  for (let h = 0; h < 24; h++) {
    const base = h >= 6 && h <= 18 ? 0.8 : 0.5 // higher run rate during shifts
    const run = +(base * 0.9 + Math.random() * 0.1).toFixed(2)
    const stop = +((1 - base) * 0.45 + Math.random() * 0.05).toFixed(2)
    const fault = +((1 - base) * 0.2 + Math.random() * 0.03).toFixed(2)
    const downtime = +(Math.max(0, 1 - run - stop - fault)).toFixed(2)
    data.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      Run: +(run * PLANNED_HRS).toFixed(1),
      Stop: +(stop * PLANNED_HRS).toFixed(1),
      Fault: +(fault * PLANNED_HRS).toFixed(1),
      Downtime: +(downtime * PLANNED_HRS).toFixed(1),
    })
  }
  return data
}

// ─── Machine availability table data ────────────────────────────────────────
interface MachineAvail {
  name: string
  run: number
  stop: number
  fault: number
  downtime: number
  availability: number
}

const MACHINE_DATA: MachineAvail[] = [
  { name: 'CNC Mill #1', run: 19.2, stop: 2.5, fault: 0.9, downtime: 1.4, availability: 80.0 },
  { name: 'CNC Mill #2', run: 20.1, stop: 1.8, fault: 0.6, downtime: 1.5, availability: 83.8 },
  { name: 'Lathe #1', run: 21.5, stop: 1.2, fault: 0.5, downtime: 0.8, availability: 89.6 },
  { name: 'Conveyor A', run: 16.8, stop: 3.8, fault: 1.6, downtime: 1.8, availability: 70.0 },
  { name: 'Press #1', run: 20.6, stop: 1.5, fault: 0.8, downtime: 1.1, availability: 85.8 },
  { name: 'Robot Arm #1', run: 18.9, stop: 2.8, fault: 1.2, downtime: 1.1, availability: 78.8 },
  { name: 'Welder #1', run: 21.8, stop: 1.0, fault: 0.4, downtime: 0.8, availability: 90.8 },
  { name: 'Grinder #1', run: 15.5, stop: 4.2, fault: 2.1, downtime: 2.2, availability: 64.6 },
]

// ─── Distribution pie data ──────────────────────────────────────────────────
const DISTRIBUTION_DATA = [
  { name: 'Run', value: 18.4, color: C_EMERALD },
  { name: 'Stop', value: 3.2, color: C_AMBER },
  { name: 'Fault', value: 1.1, color: C_RED_C },
  { name: 'Downtime', value: 1.3, color: C_SLATE },
]

// ─── Shift comparison data ──────────────────────────────────────────────────
const SHIFT_DATA = [
  { shift: 'Morning\n(06-14)', Run: 82.3, Stop: 10.5, Fault: 3.2, Downtime: 4.0 },
  { shift: 'Afternoon\n(14-22)', Run: 78.1, Stop: 12.8, Fault: 4.1, Downtime: 5.0 },
  { shift: 'Night\n(22-06)', Run: 69.5, Stop: 16.7, Fault: 6.4, Downtime: 7.4 },
]

// ─── Status badge helper ────────────────────────────────────────────────────
function statusBadge(avail: number) {
  if (avail >= 90)
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
        Good
      </Badge>
    )
  if (avail >= 80)
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
        Warning
      </Badge>
    )
  return (
    <Badge className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20">
      Critical
    </Badge>
  )
}

// ─── Custom Pie center label ────────────────────────────────────────────────
function PieCenterLabel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="800" fill={C_EMERALD}>
      76.7%
    </text>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function AvailabilityPage() {
  // ── Hourly trend data (stable per render cycle) ────────────────────────
  const hourlyTrend = useMemo(() => generateHourlyTrend(), [])

  // ── Sparkline data transformation for KPI cards ────────────────────────
  const sparklineData = useMemo(
    () =>
      KPI_METRICS.map((m) => ({
        ...m,
        data: m.sparkline.map((v, i) => ({ idx: i, val: v })),
      })),
    []
  )

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        icon={CircleDot}
        title="Availability Mesin"
        description="OEE Availability: Run Time / Planned Production Time"
      />

      {/* ── Top KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        {sparklineData.map((kpi) => {
          const Icon = kpi.icon
          const trendUp = kpi.trend >= 0
          return (
            <Card
              key={kpi.label}
              className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border/60 group"
            >
              {/* Top color accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }}
              />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg ring-1"
                      style={{
                        backgroundColor: kpi.colorLight,
                        ['--tw-ring-color' as string]: `${kpi.color}25`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        {kpi.label}
                      </p>
                      <p className="text-xl font-extrabold metric-value" style={{ color: kpi.color }}>
                        {kpi.hours} hrs
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${
                      trendUp
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/15 text-red-400 border-red-500/20'
                    }`}
                  >
                    {trendUp ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </Badge>
                </div>

                {/* Percentage bar */}
                <div className="mt-3 flex items-center gap-2">
                  <Progress
                    value={kpi.pct}
                    className="h-1.5 flex-1 [&>div]:bg-primary"
                    style={{ ['--progress-color' as string]: kpi.color } as React.CSSProperties}
                  />
                  <span className="text-xs font-medium text-muted-foreground/80">{kpi.pct}%</span>
                </div>

                {/* Sparkline */}
                <div className="mt-3 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`spark-grad-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.color} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke={kpi.color}
                        strokeWidth={1.5}
                        fill={`url(#spark-grad-${kpi.label})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Availability Trend Chart ────────────────────────────────────── */}
      <Card
        className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 animate-slide-up"
        style={{ animationDelay: '0.05s' }}
      >
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" />
                Availability Trend — 24h
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Stacked area: Run / Stop / Fault / Downtime hours
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground/70">
              Last 24 hours
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend} margin={{ top: 4, right: 12, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_EMERALD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C_EMERALD} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradStop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_AMBER} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C_AMBER} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradFault" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_RED_C} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C_RED_C} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_SLATE} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C_SLATE} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} interval={2} />
                <YAxis tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} unit="h" />
                <Tooltip content={<ChartTooltip valueSuffix="h" />} />
                <Legend {...LEGEND_STYLE} />
                <Area type="monotone" dataKey="Run" stackId="1" stroke={C_EMERALD} strokeWidth={1.5} fill="url(#gradRun)" />
                <Area type="monotone" dataKey="Stop" stackId="1" stroke={C_AMBER} strokeWidth={1.5} fill="url(#gradStop)" />
                <Area type="monotone" dataKey="Fault" stackId="1" stroke={C_RED_C} strokeWidth={1.5} fill="url(#gradFault)" />
                <Area type="monotone" dataKey="Downtime" stackId="1" stroke={C_SLATE} strokeWidth={1.5} fill="url(#gradDown)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Machine Table + Distribution Pie (side-by-side on lg) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Machine Availability Table ──────────────────────────────── */}
        <Card
          className="lg:col-span-3 border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Timer className="size-4 text-emerald-400" />
                  Machine Availability
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Run / Stop / Fault / Downtime breakdown per machine
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground/70">
                {MACHINE_DATA.length} machines
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 h-9">Machine</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-right h-9">Run (h)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-right h-9">Stop (h)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-right h-9">Fault (h)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-right h-9">Down (h)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-right h-9">Avail %</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground/70 text-center h-9">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MACHINE_DATA.map((m) => (
                    <TableRow key={m.name} className="border-border/20 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-sm py-2.5">{m.name}</TableCell>
                      <TableCell className="text-right text-sm py-2.5" style={{ color: C_EMERALD }}>
                        {m.run.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm py-2.5" style={{ color: C_AMBER }}>
                        {m.stop.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm py-2.5" style={{ color: C_RED_C }}>
                        {m.fault.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm py-2.5" style={{ color: C_SLATE }}>
                        {m.downtime.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold py-2.5">
                        {m.availability.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center py-2.5">{statusBadge(m.availability)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Distribution Pie Chart ─────────────────────────────────── */}
        <Card
          className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 animate-slide-up"
          style={{ animationDelay: '0.15s' }}
        >
          <CardHeader className="pb-2 pt-5 px-5">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieIcon className="size-4 text-emerald-400" />
                Time Distribution
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Proportion of Run / Stop / Fault / Downtime
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DISTRIBUTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    label={false}
                  >
                    {DISTRIBUTION_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      const total = DISTRIBUTION_DATA.reduce((s, e) => s + e.value, 0)
                      const pct = ((d.value as number) / total * 100).toFixed(1)
                      return (
                        <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl chart-tooltip">
                          <p className="font-semibold text-foreground/90">{d.name}</p>
                          <p className="text-muted-foreground/80">
                            {d.value}h <span className="text-foreground/70 font-medium">({pct}%)</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Legend
                    {...LEGEND_STYLE}
                    formatter={(value: string) => {
                      const entry = DISTRIBUTION_DATA.find((d) => d.name === value)
                      const total = DISTRIBUTION_DATA.reduce((s, e) => s + e.value, 0)
                      const pct = entry ? ((entry.value / total) * 100).toFixed(1) : ''
                      return (
                        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                          {value}{' '}
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                            ({pct}%)
                          </span>
                        </span>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center" style={{ marginTop: -12 }}>
                  <p className="text-2xl font-extrabold" style={{ color: C_EMERALD }}>
                    76.7%
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Availability</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Run Rate by Shift ──────────────────────────────────────────── */}
      <Card
        className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-400" />
                Run Rate by Shift
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Stacked breakdown of Run / Stop / Fault / Downtime % per shift
              </CardDescription>
            </div>
            <Tabs defaultValue="all" className="ml-auto">
              <TabsList className="h-7 text-[10px]">
                <TabsTrigger value="all" className="text-[10px] px-2 h-5">
                  All
                </TabsTrigger>
                <TabsTrigger value="run" className="text-[10px] px-2 h-5">
                  Run Only
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Tabs defaultValue="all">
            <TabsContent value="all" className="mt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SHIFT_DATA} margin={{ top: 4, right: 12, left: -4, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="shift"
                      tick={AXIS_TICK_SM}
                      axisLine={AXIS_LINE}
                      tickLine={false}
                      interval={0}
                      height={40}
                    />
                    <YAxis tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Legend {...LEGEND_STYLE} />
                    <Bar dataKey="Run" stackId="a" fill={C_EMERALD} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Stop" stackId="a" fill={C_AMBER} />
                    <Bar dataKey="Fault" stackId="a" fill={C_RED_C} />
                    <Bar dataKey="Downtime" stackId="a" fill={C_SLATE} radius={[0, 0, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="run" className="mt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SHIFT_DATA} margin={{ top: 4, right: 12, left: -4, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="shift"
                      tick={AXIS_TICK_SM}
                      axisLine={AXIS_LINE}
                      tickLine={false}
                      interval={0}
                      height={40}
                    />
                    <YAxis tick={AXIS_TICK_SM} axisLine={AXIS_LINE} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Legend {...LEGEND_STYLE} />
                    <Bar dataKey="Run" fill={C_EMERALD} radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Shift summary cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {SHIFT_DATA.map((s) => {
              const shiftName = s.shift.split('\n')[0]
              const availColor = s.Run >= 80 ? C_EMERALD : s.Run >= 70 ? C_AMBER : C_RED_C
              return (
                <div
                  key={shiftName}
                  className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2"
                >
                  <div
                    className="h-8 w-1.5 rounded-full"
                    style={{ backgroundColor: availColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground/70 truncate">
                      {s.shift.replace('\n', ' ')}
                    </p>
                    <p className="text-sm font-bold" style={{ color: availColor }}>
                      {s.Run.toFixed(1)}% Run
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
