'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Timer,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Zap,
  CircleDot,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
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

// ─── Extended color constants ────────────────────────────────────────────────
const C_EMERALD = '#10b981'
const C_EMERALD_LIGHT = 'rgba(16,185,129,0.15)'
const C_CYAN_LIGHT = 'rgba(6,182,212,0.15)'
const C_SLATE = '#71717a'
const C_AMBER = '#f59e0b'
const C_AMBER_LIGHT = 'rgba(245,158,11,0.15)'

// ─── Performance status helper ───────────────────────────────────────────────
function perfStatus(speedPct: number): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
  bgClass: string
  indicatorClass: string
} {
  if (speedPct >= 95)
    return {
      label: 'Good',
      variant: 'default',
      color: C_EMERALD,
      bgClass: 'bg-emerald-500/10',
      indicatorClass: '[&>div]:bg-emerald-500',
    }
  if (speedPct >= 85)
    return {
      label: 'Warning',
      variant: 'secondary',
      color: C_AMBER,
      bgClass: 'bg-amber-500/10',
      indicatorClass: '[&>div]:bg-amber-500',
    }
  return {
    label: 'Critical',
    variant: 'destructive',
    color: C_RED,
    bgClass: 'bg-red-500/10',
    indicatorClass: '[&>div]:bg-red-500',
  }
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────
function ChartCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-emerald-400',
  children,
  className,
}: {
  title: string
  description?: string
  icon: React.ElementType
  iconColor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={`border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 ${className || ''}`}
    >
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
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  )
}

// ─── Mini Sparkline (SVG polyline) ───────────────────────────────────────────
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
      <polygon fill={`url(#${gradId})`} points={`0,${h} ${points} ${lastX},${h}`} />
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

// ─── KPI Card ────────────────────────────────────────────────────────────────
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
  trendPositive?: boolean // whether down trend is positive (e.g., lower cycle time is better)
}

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  sparkData,
  sparkColor = C_EMERALD,
  accentColor,
  trendPositive = true,
}: KPICardProps) {
  const isTrendGood =
    trend === 'up'
      ? trendPositive
      : trend === 'down'
        ? !trendPositive
        : true

  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm kpi-card-hover group">
      {/* Top accent gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor || C_EMERALD}, transparent)`,
        }}
      />
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105"
            style={{
              backgroundColor: accentColor ? `${accentColor}18` : `${C_EMERALD}18`,
              ['--tw-ring-color' as string]: accentColor ? `${accentColor}25` : `${C_EMERALD}25`,
            }}
          >
            <Icon className="size-5" style={{ color: accentColor || C_EMERALD }} />
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
                <span className={`flex items-center gap-0.5 ${isTrendGood ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendingUp className="size-3" />
                </span>
              )}
              {trend === 'down' && (
                <span className={`flex items-center gap-0.5 ${isTrendGood ? 'text-emerald-400' : 'text-red-400'}`}>
                  <TrendingDown className="size-3" />
                </span>
              )}
              <span
                className={
                  isTrendGood
                    ? 'kpi-subtext text-emerald-400/80'
                    : 'kpi-subtext text-red-400/80'
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

// ─── Mock Data ───────────────────────────────────────────────────────────────

// Speed vs Ideal over 24 hours
const SPEED_IDEAL_24H = [
  { hour: '00:00', actual: 820, ideal: 850 },
  { hour: '01:00', actual: 815, ideal: 850 },
  { hour: '02:00', actual: 790, ideal: 850 },
  { hour: '03:00', actual: 805, ideal: 850 },
  { hour: '04:00', actual: 830, ideal: 850 },
  { hour: '05:00', actual: 845, ideal: 850 },
  { hour: '06:00', actual: 838, ideal: 850 },
  { hour: '07:00', actual: 810, ideal: 850 },
  { hour: '08:00', actual: 795, ideal: 850 },
  { hour: '09:00', actual: 825, ideal: 850 },
  { hour: '10:00', actual: 840, ideal: 850 },
  { hour: '11:00', actual: 832, ideal: 850 },
  { hour: '12:00', actual: 800, ideal: 850 },
  { hour: '13:00', actual: 815, ideal: 850 },
  { hour: '14:00', actual: 842, ideal: 850 },
  { hour: '15:00', actual: 848, ideal: 850 },
  { hour: '16:00', actual: 835, ideal: 850 },
  { hour: '17:00', actual: 820, ideal: 850 },
  { hour: '18:00', actual: 808, ideal: 850 },
  { hour: '19:00', actual: 830, ideal: 850 },
  { hour: '20:00', actual: 845, ideal: 850 },
  { hour: '21:00', actual: 838, ideal: 850 },
  { hour: '22:00', actual: 822, ideal: 850 },
  { hour: '23:00', actual: 810, ideal: 850 },
]

// Cycle time distribution (histogram)
const CYCLE_TIME_DISTRIBUTION = [
  { range: '3.0-3.5s', count: 8, withinTarget: true },
  { range: '3.5-4.0s', count: 22, withinTarget: true },
  { range: '4.0-4.5s', count: 45, withinTarget: true },
  { range: '4.5-5.0s', count: 35, withinTarget: false },
  { range: '5.0-5.5s', count: 18, withinTarget: false },
  { range: '5.5-6.0s', count: 9, withinTarget: false },
  { range: '6.0-6.5s', count: 4, withinTarget: false },
  { range: '6.5-7.0s', count: 2, withinTarget: false },
]

// Machine performance data
const MACHINE_PERFORMANCE = [
  { machine: 'CNC Mill #1', actualSpeed: 842, idealSpeed: 850, cycleTime: 4.28, targetCT: 4.50, outputHr: 752, status: 'Good' as const },
  { machine: 'CNC Mill #2', actualSpeed: 798, idealSpeed: 850, cycleTime: 4.82, targetCT: 4.50, outputHr: 712, status: 'Warning' as const },
  { machine: 'Lathe #1',    actualSpeed: 838, idealSpeed: 850, cycleTime: 4.31, targetCT: 4.50, outputHr: 748, status: 'Good' as const },
  { machine: 'Conveyor A',  actualSpeed: 720, idealSpeed: 850, cycleTime: 5.12, targetCT: 4.50, outputHr: 642, status: 'Critical' as const },
  { machine: 'Press #1',    actualSpeed: 830, idealSpeed: 850, cycleTime: 4.40, targetCT: 4.50, outputHr: 740, status: 'Good' as const },
  { machine: 'Robot Arm #1',actualSpeed: 770, idealSpeed: 850, cycleTime: 4.95, targetCT: 4.50, outputHr: 688, status: 'Warning' as const },
  { machine: 'Welder #1',   actualSpeed: 845, idealSpeed: 850, cycleTime: 4.25, targetCT: 4.50, outputHr: 756, status: 'Good' as const },
  { machine: 'Grinder #1',  actualSpeed: 690, idealSpeed: 850, cycleTime: 5.38, targetCT: 4.50, outputHr: 616, status: 'Critical' as const },
]

// Output rate over 24 hours
const OUTPUT_TREND_24H = [
  { hour: '00:00', output: 740, target: 750 },
  { hour: '01:00', output: 735, target: 750 },
  { hour: '02:00', output: 710, target: 750 },
  { hour: '03:00', output: 725, target: 750 },
  { hour: '04:00', output: 748, target: 750 },
  { hour: '05:00', output: 762, target: 750 },
  { hour: '06:00', output: 758, target: 750 },
  { hour: '07:00', output: 730, target: 750 },
  { hour: '08:00', output: 718, target: 750 },
  { hour: '09:00', output: 745, target: 750 },
  { hour: '10:00', output: 760, target: 750 },
  { hour: '11:00', output: 755, target: 750 },
  { hour: '12:00', output: 720, target: 750 },
  { hour: '13:00', output: 738, target: 750 },
  { hour: '14:00', output: 758, target: 750 },
  { hour: '15:00', output: 765, target: 750 },
  { hour: '16:00', output: 752, target: 750 },
  { hour: '17:00', output: 742, target: 750 },
  { hour: '18:00', output: 728, target: 750 },
  { hour: '19:00', output: 748, target: 750 },
  { hour: '20:00', output: 762, target: 750 },
  { hour: '21:00', output: 755, target: 750 },
  { hour: '22:00', output: 740, target: 750 },
  { hour: '23:00', output: 730, target: 750 },
]

// Sparkline data for KPI cards
const SPEED_SPARK = [91.5, 92.3, 93.1, 92.8, 93.5, 94.0, 93.7, 94.2, 93.9, 94.5, 94.1, 94.2]
const CYCLE_SPARK = [5.2, 5.0, 4.9, 4.8, 5.1, 4.7, 4.6, 4.9, 4.8, 4.7, 4.8, 4.8]
const OUTPUT_SPARK = [720, 735, 742, 748, 738, 755, 760, 745, 750, 762, 758, 748]

// ─── Component ───────────────────────────────────────────────────────────────
export function PerformancePage() {
  // ── Derived data with useMemo ─────────────────────────────────────────────
  const speedVsIdealData = useMemo(() => SPEED_IDEAL_24H, [])

  const cycleTimeData = useMemo(
    () =>
      CYCLE_TIME_DISTRIBUTION.map((d) => ({
        ...d,
        fill: d.withinTarget ? C_EMERALD : d.range < '5.0-5.5s' ? C_AMBER : C_RED,
      })),
    []
  )

  const machineTableData = useMemo(
    () =>
      MACHINE_PERFORMANCE.map((m) => ({
        ...m,
        speedPct: Math.round((m.actualSpeed / m.idealSpeed) * 1000) / 10,
      })),
    []
  )

  const outputTrendData = useMemo(() => OUTPUT_TREND_24H, [])

  // ── Aggregate KPI values ───────────────────────────────────────────────────
  const avgSpeedPct = useMemo(
    () =>
      Math.round(
        (machineTableData.reduce((s, m) => s + m.speedPct, 0) / machineTableData.length) * 10
      ) / 10,
    [machineTableData]
  )

  const avgCycleTime = useMemo(
    () =>
      Math.round(
        (machineTableData.reduce((s, m) => s + m.cycleTime, 0) / machineTableData.length) * 100
      ) / 100,
    [machineTableData]
  )

  const avgOutput = useMemo(
    () =>
      Math.round(
        machineTableData.reduce((s, m) => s + m.outputHr, 0) / machineTableData.length
      ),
    [machineTableData]
  )

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        icon={TrendingUp}
        title="Performance"
        description="OEE Performance: Actual Speed / Ideal Speed × 100%"
      />

      {/* ── Top KPI Cards Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
        <KPICard
          icon={Gauge}
          label="Speed Performance"
          value="94.2%"
          subtitle="↑ 2.1% vs last shift"
          trend="up"
          trendValue="2.1%"
          sparkData={SPEED_SPARK}
          sparkColor={C_EMERALD}
          accentColor={C_EMERALD}
        />
        <KPICard
          icon={Timer}
          label="Avg Cycle Time"
          value="4.8s"
          subtitle="↓ 0.3s improving (target 4.5s)"
          trend="down"
          trendValue="0.3s"
          sparkData={CYCLE_SPARK}
          sparkColor={C_CYAN}
          accentColor={C_CYAN}
          trendPositive={false}
        />
        <KPICard
          icon={Package}
          label="Output Rate"
          value="748 pcs/hr"
          subtitle="↑ 12 pcs/hr vs target"
          trend="up"
          trendValue="12"
          sparkData={OUTPUT_SPARK}
          sparkColor={C_EMERALD}
          accentColor={C_EMERALD}
        />
      </div>

      {/* ── Speed vs Ideal Speed Chart ──────────────────────────────────────── */}
      <ChartCard
        title="Speed vs Ideal Speed"
        description="Actual speed compared to ideal speed over 24 hours"
        icon={Gauge}
        iconColor="text-emerald-400"
        className="animate-slide-up stagger-1"
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedVsIdealData}>
              <defs>
                <linearGradient id="speedGapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_EMERALD} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C_EMERALD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="hour"
                tick={AXIS_TICK_SM}
                tickLine={false}
                axisLine={AXIS_LINE}
                interval={3}
              />
              <YAxis
                tick={AXIS_TICK_SM}
                tickLine={false}
                axisLine={AXIS_LINE}
                domain={[750, 870]}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={LEGEND_STYLE}
                iconType="line"
                formatter={(value: string) => (
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Speed"
                stroke={C_EMERALD}
                fill="url(#speedGapGrad)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: C_EMERALD, strokeWidth: 2, fill: '#0a0a0a' }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                name="Ideal Speed"
                stroke={C_SLATE}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Speed gap indicator */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded bg-emerald-500" />
            Actual Speed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded bg-slate-500" style={{ borderTop: '1px dashed #71717a' }} />
            Ideal Speed (850 pcs/hr)
          </span>
          <span className="ml-auto flex items-center gap-1">
            <ArrowDownRight className="size-3 text-amber-400" />
            Avg gap: {Math.round(850 - speedVsIdealData.reduce((s, d) => s + d.actual, 0) / speedVsIdealData.length)} pcs/hr
          </span>
        </div>
      </ChartCard>

      {/* ── Cycle Time Distribution + Machine Performance Table ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up stagger-2">
        {/* Cycle Time Distribution */}
        <ChartCard
          title="Cycle Time Distribution"
          description="Frequency distribution of cycle times (target: ≤4.5s)"
          icon={Timer}
          iconColor="text-cyan-400"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CYCLE_TIME_DISTRIBUTION} barCategoryGap="12%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={AXIS_TICK_SM}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={AXIS_TICK_SM}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const withinTarget = CYCLE_TIME_DISTRIBUTION.find((d) => d.range === label)?.withinTarget
                    return (
                      <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl">
                        <p className="mb-1 font-semibold text-foreground/90">{label}</p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <span
                            className="inline-block size-2.5 rounded-sm"
                            style={{ backgroundColor: withinTarget ? C_EMERALD : C_RED }}
                          />
                          <span className="flex-1">Count</span>
                          <span className="font-bold text-foreground">{payload[0].value}</span>
                        </p>
                        <p className={`mt-1 text-[10px] ${withinTarget ? 'text-emerald-400' : 'text-red-400'}`}>
                          {withinTarget ? '✓ Within target' : '✗ Above target'}
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Frequency">
                  {cycleTimeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.withinTarget ? C_EMERALD : index <= 5 ? C_AMBER : C_RED}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Within Target (≤4.5s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" />
              Slightly Over
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
              Significantly Over
            </span>
          </div>
        </ChartCard>

        {/* Machine Performance Table */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-400" />
              Machine Performance
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Speed and cycle time breakdown per machine
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8">Machine</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8 text-right">Speed</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8 text-right">Speed %</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8 text-right">CT</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8 text-right">Out/hr</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 h-8 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineTableData.map((m) => {
                    const status = perfStatus(m.speedPct)
                    return (
                      <TableRow
                        key={m.machine}
                        className="border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-xs font-medium py-2.5">{m.machine}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5 text-right">
                          {m.actualSpeed}
                          <span className="text-muted-foreground/50">/{m.idealSpeed}</span>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Progress
                              value={m.speedPct}
                              className={`h-1.5 w-12 ${status.indicatorClass}`}
                            />
                            <span
                              className="text-xs font-bold metric-value"
                              style={{ color: status.color }}
                            >
                              {m.speedPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2.5 text-right">
                          <span
                            style={{ color: m.cycleTime <= m.targetCT ? C_EMERALD : m.cycleTime <= m.targetCT * 1.1 ? C_AMBER : C_RED }}
                          >
                            {m.cycleTime.toFixed(2)}s
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium py-2.5 text-right">
                          {m.outputHr}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={status.variant}
                            className={`text-[10px] px-1.5 py-0 ${status.bgClass} border-0`}
                            style={{ color: status.color }}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Output Trend ─────────────────────────────────────────────────────── */}
      <ChartCard
        title="Output Trend"
        description="Hourly output rate vs target over 24 hours"
        icon={Package}
        iconColor="text-emerald-400"
        className="animate-slide-up stagger-3"
      >
        <Tabs defaultValue="area" className="w-full">
          <TabsList className="mb-3 h-7 bg-muted/30">
            <TabsTrigger value="area" className="text-[10px] px-2.5 h-5">
              Area View
            </TabsTrigger>
            <TabsTrigger value="bar" className="text-[10px] px-2.5 h-5">
              Bar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="area" className="mt-0">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={outputTrendData}>
                  <defs>
                    <linearGradient id="outputAboveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_EMERALD} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={C_EMERALD} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="outputBelowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_RED} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C_RED} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="hour"
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    domain={[680, 790]}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip valueSuffix=" pcs/hr" />} />
                  <Legend
                    wrapperStyle={LEGEND_STYLE}
                    iconType="line"
                    formatter={(value: string) => (
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{value}</span>
                    )}
                  />
                  <ReferenceLine
                    y={750}
                    stroke={C_SLATE}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: 'Target: 750',
                      position: 'insideTopRight',
                      fill: 'rgba(255,255,255,0.4)',
                      fontSize: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    name="Output Rate"
                    stroke={C_EMERALD}
                    fill="url(#outputAboveGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: C_EMERALD, strokeWidth: 2, fill: '#0a0a0a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bar" className="mt-0">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outputTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={3}
                  />
                  <YAxis
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    domain={[680, 790]}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip valueSuffix=" pcs/hr" />} />
                  <Legend
                    wrapperStyle={LEGEND_STYLE}
                    formatter={(value: string) => (
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{value}</span>
                    )}
                  />
                  <ReferenceLine
                    y={750}
                    stroke={C_SLATE}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: 'Target',
                      position: 'insideTopRight',
                      fill: 'rgba(255,255,255,0.4)',
                      fontSize: 10,
                    }}
                  />
                  <Bar dataKey="output" name="Output Rate" radius={[3, 3, 0, 0]}>
                    {outputTrendData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.output >= entry.target ? C_EMERALD : C_RED}
                        fillOpacity={entry.output >= entry.target ? 0.8 : 0.65}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Output summary stats */}
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/20">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Peak
            </span>
            <span className="text-sm font-bold text-emerald-400 metric-value">
              {Math.max(...outputTrendData.map((d) => d.output))} pcs/hr
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/20">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Average
            </span>
            <span className="text-sm font-bold text-foreground metric-value">
              {Math.round(outputTrendData.reduce((s, d) => s + d.output, 0) / outputTrendData.length)} pcs/hr
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/20">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Below Target
            </span>
            <span className="text-sm font-bold text-red-400 metric-value">
              {outputTrendData.filter((d) => d.output < d.target).length} hrs
            </span>
          </div>
        </div>
      </ChartCard>

      {/* ── Performance Summary Strip ────────────────────────────────────────── */}
      <div className="animate-fade-in stagger-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Speed Summary */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
              style={{ backgroundColor: `${C_EMERALD}18`, ['--tw-ring-color' as string]: `${C_EMERALD}25` }}
            >
              <Gauge className="size-5" style={{ color: C_EMERALD }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Speed Performance
              </p>
              <p className="text-lg font-extrabold metric-value" style={{ color: C_EMERALD }}>
                {avgSpeedPct}%
              </p>
            </div>
            <Progress value={avgSpeedPct} className="h-2 w-20 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Cycle Time Summary */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
              style={{ backgroundColor: `${C_CYAN}18`, ['--tw-ring-color' as string]: `${C_CYAN}25` }}
            >
              <Timer className="size-5" style={{ color: C_CYAN }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Avg Cycle Time
              </p>
              <p className="text-lg font-extrabold metric-value" style={{ color: C_CYAN }}>
                {avgCycleTime.toFixed(1)}s
              </p>
            </div>
            <span className="text-xs text-muted-foreground/60">Target: 4.5s</span>
          </CardContent>
        </Card>

        {/* Output Summary */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
              style={{ backgroundColor: `${C_EMERALD}18`, ['--tw-ring-color' as string]: `${C_EMERALD}25` }}
            >
              <Package className="size-5" style={{ color: C_EMERALD }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Output Rate
              </p>
              <p className="text-lg font-extrabold metric-value" style={{ color: C_EMERALD }}>
                {avgOutput} pcs/hr
              </p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">
              <ArrowUpRight className="size-3 mr-0.5" />
              On Track
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
