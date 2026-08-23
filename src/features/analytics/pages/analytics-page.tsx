'use client'

import { useMemo } from 'react'
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
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
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

// ─── Solid colors for recharts ──────────────────────────────────────────────
const C_GREEN = '#10b981'
const C_YELLOW = '#eab308'
const C_CYAN = '#06b6d4'
const C_ORANGE = '#f97316'
const C_RED = '#ef4444'
const C_GREEN_LIGHT = 'rgba(16,185,129,0.2)'
const C_CYAN_LIGHT = 'rgba(6,182,212,0.2)'
const C_ORANGE_LIGHT = 'rgba(249,115,22,0.2)'
const C_RED_LIGHT = 'rgba(239,68,68,0.2)'

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

// ─── Dark tooltip ───────────────────────────────────────────────────────────
function DarkTooltip({
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          <span
            className="inline-block mr-1.5 size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}: <span className="font-semibold text-foreground">{p.value}%</span>
        </p>
      ))}
    </div>
  )
}

function ValueDarkTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          <span
            className="inline-block mr-1.5 size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}: <span className="font-semibold text-foreground">{p.value}{suffix}</span>
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  trendValue,
  color = C_GREEN,
}: {
  icon: React.ElementType
  label: string
  value: string
  suffix: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
          {trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{trendValue}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-xl font-bold mt-0.5">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>
      </p>
    </Card>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { machines } = useIIoTStore()

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
        />
        <KPICard
          icon={Factory}
          label="Total Production"
          value={kpis.totalProd.toLocaleString()}
          suffix="units"
          trend="up"
          trendValue="+5.1%"
          color={C_CYAN}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Efficiency"
          value={kpis.avgEff.toFixed(1)}
          suffix="%"
          trend="up"
          trendValue="+1.2%"
          color={C_ORANGE}
        />
        <KPICard
          icon={Zap}
          label="Uptime %"
          value={kpis.uptime.toFixed(1)}
          suffix="%"
          trend="neutral"
          trendValue="-0.1%"
          color={C_YELLOW}
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
        <TabsContent value="comparison" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">OEE Comparison by Machine</CardTitle>
              <CardDescription className="text-xs">
                Availability, Performance, Quality and OEE breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      domain={[0, 100]}
                      width={35}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
                    />
                    <Bar dataKey="Availability" fill={C_GREEN} radius={[2, 2, 0, 0]} barSize={10} />
                    <Bar dataKey="Performance" fill={C_CYAN} radius={[2, 2, 0, 0]} barSize={10} />
                    <Bar dataKey="Quality" fill={C_YELLOW} radius={[2, 2, 0, 0]} barSize={10} />
                    <Bar dataKey="OEE" fill={C_ORANGE} radius={[2, 2, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Trends - LineChart */}
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Production Trend — Last 30 Days</CardTitle>
              <CardDescription className="text-xs">
                Actual production vs daily target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      domain={[0, 600]}
                      width={40}
                    />
                    <Tooltip content={<ValueDarkTooltip suffix=" units" />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={C_GREEN}
                      strokeWidth={2}
                      dot={false}
                      fill="url(#trendGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={C_RED}
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top / Bottom Performers Table */}
        <TabsContent value="performers" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Machine Performance Ranking</CardTitle>
              <CardDescription className="text-xs">
                Ranked by Overall Equipment Effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-10">#</TableHead>
                      <TableHead className="text-xs">Machine</TableHead>
                      <TableHead className="text-xs text-right">OEE</TableHead>
                      <TableHead className="text-xs text-right">Avail.</TableHead>
                      <TableHead className="text-xs text-right">Perf.</TableHead>
                      <TableHead className="text-xs text-right">Quality</TableHead>
                      <TableHead className="text-xs text-center">Rating</TableHead>
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
                          className={
                            isTop
                              ? 'bg-emerald-500/5'
                              : isBottom
                                ? 'bg-red-500/5'
                                : ''
                          }
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
                              <span className="text-muted-foreground text-[10px]">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pareto / Defect Distribution - PieChart */}
        <TabsContent value="pareto" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Defect Type Distribution (Pareto)</CardTitle>
              <CardDescription className="text-xs">
                Cumulative defect analysis by category
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <Tooltip
                        content={
                          <ValueDarkTooltip suffix="%" />
                        }
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
                      />
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
                            style={{
                              width: `${d.value}%`,
                              backgroundColor: d.color,
                            }}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
