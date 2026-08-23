'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Factory,
  Gauge,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart as BarChartIcon,
  Target,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
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
  C_YELLOW,
} from '@/shared/components/chart-utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Default mock machines ─────────────────────────────────────────────────
const DEFAULT_MACHINES = [
  { name: 'CNC Mill #1', oee: 87.2, availability: 92.1, performance: 95.3, quality: 99.3 },
  { name: 'CNC Mill #2', oee: 82.5, availability: 88.7, performance: 93.8, quality: 99.1 },
  { name: 'Lathe #1', oee: 91.0, availability: 95.4, performance: 96.2, quality: 99.6 },
  { name: 'Conveyor A', oee: 78.3, availability: 85.2, performance: 92.1, quality: 99.4 },
  { name: 'Press #1', oee: 85.8, availability: 90.5, performance: 95.0, quality: 99.9 },
  { name: 'Robot Arm #1', oee: 73.1, availability: 82.3, performance: 89.5, quality: 99.2 },
  { name: 'Welder #1', oee: 88.4, availability: 93.0, performance: 95.7, quality: 99.7 },
  { name: 'Grinder #1', oee: 69.5, availability: 78.6, performance: 89.2, quality: 98.9 },
]

// ─── Chart Card Wrapper ─────────────────────────────────────────────────────
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
    <Card className={`hover:border-border/60 transition-colors duration-300 ${className || ''}`}>
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

// ─── Enhanced KPI Card ───────────────────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  trendValue,
  color = C_GREEN,
  index = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  suffix: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color?: string
  index?: number
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 group animate-slide-up stagger-${Math.min(index + 1, 6)}`}
    >
      {/* Top accent gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <CardContent className="flex items-start justify-between p-5 pt-5 pb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105"
            style={{
              backgroundColor: `${color}18`,
              ['--tw-ring-color' as string]: `${color}25`,
            }}
          >
            <Icon className="size-5" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground metric-value animate-count-up">
              {value}
              <span className="text-xs font-normal text-muted-foreground/60 ml-1.5">{suffix}</span>
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
              {trend === 'neutral' && (
                <span className="flex items-center gap-0.5 text-muted-foreground/60">
                  <Minus className="size-3" />
                </span>
              )}
              <span
                className={
                  trend === 'up'
                    ? 'text-emerald-400/80'
                    : trend === 'down'
                      ? 'text-red-400/80'
                      : 'text-muted-foreground/60'
                }
              >
                {trendValue}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { machines, lastUpdate } = useIIoTStore()
  const [lastUpdatedText, setLastUpdatedText] = useState('—')

  useEffect(() => {
    function update() {
      if (lastUpdate) {
        setLastUpdatedText(formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }))
      }
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  const machineData = useMemo(
    () => (machines.length > 0 ? machines : DEFAULT_MACHINES),
    [machines]
  )

  // ── KPI calculations ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const oeeValues = machineData.map((m) => m.oee)
    const avgOEE = oeeValues.reduce((a, b) => a + b, 0) / oeeValues.length
    const totalProd = 14520 + Math.floor(Math.random() * 500) // mocked
    const avgEff = 91.8 + (Math.random() - 0.5) * 2
    const uptime = 97.2 + (Math.random() - 0.5) * 1.5
    return { avgOEE, totalProd, avgEff, uptime }
  }, [machineData])

  // ── Machine comparison data for grouped bar ───────────────────────────────
  const comparisonData = useMemo(
    () =>
      machineData.map((m) => ({
        name: m.name.replace(/ #\d+/, ''),
        OEE: m.oee,
        Availability: m.availability,
        Performance: m.performance,
        Quality: m.quality,
      })),
    [machineData]
  )

  // ── 30-day production trend ───────────────────────────────────────────────
  const trendData = useMemo(() => {
    const days: Array<{ day: string; actual: number; target: number }> = []
    for (let i = 29; i >= 0; i--) {
      const base = 450 + Math.sin(i * 0.3) * 60
      const actual = Math.round(base + (Math.random() - 0.4) * 80)
      days.push({
        day: `D-${i}`,
        actual: Math.max(300, actual),
        target: 500,
      })
    }
    return days
  }, [])

  // ── Top/Bottom performers ─────────────────────────────────────────────────
  const rankedMachines = useMemo(
    () => [...machineData].sort((a, b) => b.oee - a.oee),
    [machineData]
  )

  // ── Pareto defect data ────────────────────────────────────────────────────
  const defectData = useMemo(
    () => [
      { name: 'Surface Finish', value: 34, color: C_RED },
      { name: 'Dimensional', value: 26, color: C_ORANGE },
      { name: 'Cracks', value: 18, color: C_YELLOW },
      { name: 'Material Defect', value: 12, color: C_CYAN },
      { name: 'Misalignment', value: 7, color: C_GREEN },
      { name: 'Other', value: 3, color: '#71717a' },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Advanced analytics and insights"
        lastUpdated={lastUpdatedText}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Gauge}
          label="Avg OEE"
          value={kpis.avgOEE.toFixed(1)}
          suffix="%"
          trend="up"
          trendValue="+2.3%"
          color={C_GREEN}
          index={0}
        />
        <KPICard
          icon={Factory}
          label="Total Production"
          value={kpis.totalProd.toLocaleString()}
          suffix="units"
          trend="up"
          trendValue="+5.1%"
          color={C_CYAN}
          index={1}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Efficiency"
          value={kpis.avgEff.toFixed(1)}
          suffix="%"
          trend="up"
          trendValue="+1.2%"
          color={C_ORANGE}
          index={2}
        />
        <KPICard
          icon={Zap}
          label="Uptime %"
          value={kpis.uptime.toFixed(1)}
          suffix="%"
          trend="neutral"
          trendValue="-0.1%"
          color={C_YELLOW}
          index={3}
        />
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="comparison">
        <TabsList className="h-9">
          <TabsTrigger value="comparison" className="text-xs px-3">
            Machine Comparison
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs px-3">
            Production Trends
          </TabsTrigger>
          <TabsTrigger value="performers" className="text-xs px-3">
            Top/Bottom
          </TabsTrigger>
          <TabsTrigger value="pareto" className="text-xs px-3">
            Defects
          </TabsTrigger>
        </TabsList>

        {/* Machine Comparison - Grouped BarChart */}
        <TabsContent value="comparison" className="mt-4 animate-slide-up">
          <ChartCard
            title="OEE Comparison by Machine"
            description="Availability, Performance, Quality and OEE breakdown"
            icon={BarChartIcon}
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[0, 100]} width={35} />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="Availability" fill={C_GREEN} radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="Performance" fill={C_CYAN} radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="Quality" fill={C_YELLOW} radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="OEE" fill={C_ORANGE} radius={[2, 2, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Production Trends - LineChart */}
        <TabsContent value="trends" className="mt-4 animate-slide-up">
          <ChartCard
            title="Production Trend — Last 30 Days"
            description="Actual production vs daily target"
            icon={TrendingUp}
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="day" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} interval={4} />
                  <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[0, 600]} width={40} />
                  <Tooltip content={<ChartTooltip valueSuffix=" units" />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Line type="monotone" dataKey="actual" stroke={C_GREEN} strokeWidth={2} dot={false} fill="url(#trendGrad)" />
                  <Line type="monotone" dataKey="target" stroke={C_RED} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Top / Bottom Performers Table */}
        <TabsContent value="performers" className="mt-4 animate-slide-up">
          <ChartCard
            title="Machine Performance Ranking"
            description="Ranked by Overall Equipment Effectiveness"
            icon={Target}
          >
            <div className="max-h-[400px] overflow-y-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 w-10">#</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">Machine</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-right">OEE</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-right">Avail.</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-right">Perf.</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-right">Quality</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedMachines.map((m, idx) => {
                    const isTop = idx < 3
                    const isBottom = idx >= rankedMachines.length - 3
                    const oeeColor =
                      m.oee >= 85 ? C_GREEN : m.oee >= 70 ? C_YELLOW : C_RED
                    return (
                      <TableRow
                        key={m.name}
                        className={`transition-colors hover:bg-muted/20 ${
                          isTop
                            ? 'bg-emerald-500/5'
                            : isBottom
                              ? 'bg-red-500/5'
                              : ''
                        }`}
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {m.name}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-bold" style={{ color: oeeColor }}>
                          {m.oee}%
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {m.availability}%
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {m.performance}%
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {m.quality}%
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {isTop && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                              ★ Top
                            </Badge>
                          )}
                          {isBottom && (
                            <Badge className="bg-red-500/15 text-red-400 border-0 text-[10px]">
                              ▼ Low
                            </Badge>
                          )}
                          {!isTop && !isBottom && (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Pareto / Defect Distribution - PieChart */}
        <TabsContent value="pareto" className="mt-4 animate-slide-up">
          <ChartCard
            title="Defect Type Distribution (Pareto)"
            description="Cumulative defect analysis by category"
            icon={PieChartIcon}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={defectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {defectData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {defectData.map((d, idx) => {
                  const cumPct = defectData
                    .slice(0, idx + 1)
                    .reduce((sum, x) => sum + x.value, 0)
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-muted-foreground">
                          {d.value}%{' '}
                          <span className="text-[10px]">
                            (cum. {cumPct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.value}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Pareto Principle:</span>{' '}
                    Surface Finish and Dimensional defects account for{' '}
                    <span className="font-semibold text-foreground">60%</span> of
                    all defects.
                  </p>
                </div>
              </div>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
