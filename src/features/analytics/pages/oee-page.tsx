'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart3,
  TrendingUp,
  Layers,
  Crosshair,
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
  LabelList,
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
  oeeColor,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

// ─── OEE Target ────────────────────────────────────────────────────────────
const OEE_TARGET = 85

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

// ─── SVG Semi-circle Gauge (enhanced with gradient + glow) ──────────────────
function OEEGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 85 ? C_GREEN : clamped >= 70 ? C_YELLOW : C_RED
  const radius = 80
  const cx = 100
  const cy = 95
  // Semi-circle: from 180° to 0° (left to right)
  const circumference = Math.PI * radius // half circle
  const filled = (clamped / 100) * circumference

  const gradId = `oee-gauge-grad-${color.replace('#', '')}`
  const glowId = `oee-gauge-glow-${color.replace('#', '')}`

  // Build SVG arc path
  const describeArc = (
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = {
      x: x + r * Math.cos((startAngle * Math.PI) / 180),
      y: y + r * Math.sin((startAngle * Math.PI) / 180),
    }
    const end = {
      x: x + r * Math.cos((endAngle * Math.PI) / 180),
      y: y + r * Math.sin((endAngle * Math.PI) / 180),
    }
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
  }

  const bgPath = describeArc(cx, cy, radius, 180, 0)
  const valueAngle = 180 - (clamped / 100) * 180
  const valuePath = describeArc(cx, cy, radius, 180, valueAngle)

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Value arc with gradient + glow */}
        <path
          d={valuePath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = 180 - (tick / 100) * 180
          const rad = (angle * Math.PI) / 180
          const innerR = radius - 22
          const outerR = radius - 16
          return (
            <line
              key={tick}
              x1={cx + innerR * Math.cos(rad)}
              y1={cy + innerR * Math.sin(rad)}
              x2={cx + outerR * Math.cos(rad)}
              y2={cy + outerR * Math.sin(rad)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
          )
        })}
        {/* Tick labels */}
        {[0, 50, 100].map((tick) => {
          const angle = 180 - (tick / 100) * 180
          const rad = (angle * Math.PI) / 180
          const labelR = radius - 32
          return (
            <text
              key={tick}
              x={cx + labelR * Math.cos(rad)}
              y={cy + labelR * Math.sin(rad) + 3}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="9"
            >
              {tick}%
            </text>
          )
        })}
        {/* Center value */}
        <text x={cx} y={cy - 15} textAnchor="middle" fill={color} fontSize="32" fontWeight="bold">
          {clamped.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">
          Overall OEE
        </text>
      </svg>
    </div>
  )
}

// ─── OEE Component Card (enhanced) ──────────────────────────────────────────
function OEEComponentCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  const barWidth = Math.max(0, Math.min(100, value))
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:border-border/60 group w-44 shrink-0 kpi-card-hover">
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg ring-1"
            style={{ backgroundColor: `${color}18`, ['--tw-ring-color' as string]: `${color}25` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</span>
        </div>
        <p className="text-2xl font-extrabold metric-value" style={{ color }}>
          {value.toFixed(1)}%
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function OEEPage() {
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

  // ── Overall OEE ───────────────────────────────────────────────────────────
  const displayOEE = useMemo(
    () => machineData.reduce((sum, m) => sum + m.oee, 0) / machineData.length,
    [machineData]
  )

  const overallA = useMemo(
    () => machineData.reduce((sum, m) => sum + m.availability, 0) / machineData.length,
    [machineData]
  )

  const overallP = useMemo(
    () => machineData.reduce((sum, m) => sum + m.performance, 0) / machineData.length,
    [machineData]
  )

  const overallQ = useMemo(
    () => machineData.reduce((sum, m) => sum + m.quality, 0) / machineData.length,
    [machineData]
  )

  // ── 24h OEE trend data ──────────────────────────────────────────────────
  const oeeTrend24h = useMemo(() => {
    const data: Array<{ hour: string; OEE: number }> = []
    const val = displayOEE
    for (let i = 0; i < 24; i++) {
      val = Math.max(65, Math.min(95, val + (Math.random() - 0.45) * 6))
      data.push({
        hour: `${String(i).padStart(2, '0')}:00`,
        OEE: Math.round(val * 10) / 10,
      })
    }
    return data
  }, [displayOEE])

  // ── 30-day OEE trend data ─────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const data: Array<{
      day: string
      Availability: number
      Performance: number
      Quality: number
    }> = []
    for (let i = 29; i >= 0; i--) {
      data.push({
        day: `D-${i}`,
        Availability: Math.min(100, overallA + (Math.random() - 0.5) * 6),
        Performance: Math.min(100, overallP + (Math.random() - 0.5) * 4),
        Quality: Math.min(100, overallQ + (Math.random() - 0.5) * 1.5),
      })
    }
    return data
  }, [overallA, overallP, overallQ])

  // ── Loss analysis data ────────────────────────────────────────────────────
  const lossData = useMemo(
    () =>
      machineData.map((m) => ({
        name: m.name.replace(/ #\d+/, ''),
        'Avail. Loss': Math.round((100 - m.availability) * 10) / 10,
        'Perf. Loss': Math.round((100 - m.performance) * 10) / 10,
        'Quality Loss': Math.round((100 - m.quality) * 10) / 10,
      })),
    [machineData]
  )

  // ── Target vs Actual ──────────────────────────────────────────────────────
  const targetVsActual = useMemo(
    () =>
      machineData.map((m) => ({
        name: m.name.replace(/ #\d+/, ''),
        Target: OEE_TARGET,
        Actual: m.oee,
      })),
    [machineData]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gauge}
        title="OEE Analysis"
        description="Overall Equipment Effectiveness breakdown"
        lastUpdated={lastUpdatedText}
      />

      {/* OEE Gauge */}
      <Card className="chart-container-glass hover:border-border/60 transition-colors duration-300 animate-slide-up">
        <CardContent className="pt-6 flex flex-col items-center px-5 pb-5">
          <OEEGauge value={displayOEE} />
          <div className="flex items-center gap-2 mt-2">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Target: {OEE_TARGET}%{' '}
              {displayOEE >= OEE_TARGET ? (
                <span className="text-emerald-400 font-medium">
                  <ArrowUpRight className="inline h-3 w-3" /> On Track
                </span>
              ) : (
                <span className="text-red-400 font-medium">
                  <ArrowDownRight className="inline h-3 w-3" /> Below Target
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* OEE Trend (24h) */}
      <ChartCard
        title="OEE Trend (24h)"
        description="Hourly OEE percentage over the last 24 hours"
        icon={TrendingUp}
        className="chart-container-glass animate-slide-up stagger-1"
      >
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={oeeTrend24h}>
              <defs>
                <linearGradient id="oeeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="hour" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} interval={3} />
              <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[60, 100]} width={35} />
              <Tooltip content={<ChartTooltip valueSuffix="%" />} />
              <Area
                type="monotone"
                dataKey="OEE"
                stroke={C_GREEN}
                fill="url(#oeeTrendGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* A × P × Q = OEE Breakdown */}
      <div className="animate-slide-up stagger-2">
        <p className="text-xs text-muted-foreground mb-3 text-center">
          OEE = Availability × Performance × Quality
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <OEEComponentCard
            label="Availability"
            value={overallA}
            icon={() => <span className="text-lg font-mono" style={{ color: C_GREEN }}>A</span>}
            color={C_GREEN}
          />
          <span className="text-2xl font-bold text-muted-foreground shrink-0">×</span>
          <OEEComponentCard
            label="Performance"
            value={overallP}
            icon={() => <span className="text-lg font-mono" style={{ color: C_CYAN }}>P</span>}
            color={C_CYAN}
          />
          <span className="text-2xl font-bold text-muted-foreground shrink-0">×</span>
          <OEEComponentCard
            label="Quality"
            value={overallQ}
            icon={() => <span className="text-lg font-mono" style={{ color: C_ORANGE }}>Q</span>}
            color={C_ORANGE}
          />
          <span className="text-2xl font-bold text-muted-foreground shrink-0">=</span>
          <OEEComponentCard
            label="OEE Result"
            value={overallA * (overallP / 100) * (overallQ / 100)}
            icon={() => <span className="text-lg font-mono" style={{ color: C_YELLOW }}>OEE</span>}
            color={C_YELLOW}
          />
        </div>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="per-machine">
        <TabsList className="h-9">
          <TabsTrigger value="per-machine" className="text-xs px-3">
            Per-Machine OEE
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs px-3">
            OEE Trends
          </TabsTrigger>
          <TabsTrigger value="loss" className="text-xs px-3">
            Loss Analysis
          </TabsTrigger>
          <TabsTrigger value="target" className="text-xs px-3">
            Target vs Actual
          </TabsTrigger>
        </TabsList>

        {/* Per-Machine OEE Table with inline bars */}
        <TabsContent value="per-machine" className="mt-4 animate-slide-up">
          <ChartCard
            title="Per-Machine OEE Breakdown"
            description="Each factor shown with inline bar visualization"
            icon={BarChart3}
            className="chart-container-glass"
          >
            <div className="max-h-[400px] overflow-y-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">Machine</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">Availability</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">Performance</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">Quality</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60">OEE</TableHead>
                    <TableHead className="uppercase tracking-wider text-[11px] text-muted-foreground/60 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineData.map((m) => {
                    const mOeeColor = oeeColor(m.oee)
                    return (
                      <TableRow key={m.name} className="transition-colors hover:bg-muted/20">
                        <TableCell className="text-xs font-medium">
                          {m.name}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono w-10 text-right">
                              {m.availability}%
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${m.availability}%`, backgroundColor: C_GREEN }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono w-10 text-right">
                              {m.performance}%
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${m.performance}%`, backgroundColor: C_CYAN }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono w-10 text-right">
                              {m.quality}%
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${m.quality}%`, backgroundColor: C_ORANGE }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold font-mono" style={{ color: mOeeColor }}>
                          {m.oee}%
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <Badge
                            className={`text-[10px] border-0 ${
                              m.oee >= 85
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : m.oee >= 70
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {m.oee >= 85
                              ? 'Excellent'
                              : m.oee >= 70
                                ? 'Acceptable'
                                : 'Needs Attention'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </TabsContent>

        {/* OEE Trend — AreaChart with A, P, Q */}
        <TabsContent value="trends" className="mt-4 animate-slide-up">
          <ChartCard
            title="OEE Component Trends — 30 Days"
            description="Availability, Performance, and Quality over time"
            icon={TrendingUp}
            className="chart-container-glass"
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_CYAN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C_CYAN} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_ORANGE} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C_ORANGE} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="day" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} interval={4} />
                  <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[70, 100]} width={35} />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Area type="monotone" dataKey="Availability" stroke={C_GREEN} fill="url(#availGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Performance" stroke={C_CYAN} fill="url(#perfGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Quality" stroke={C_ORANGE} fill="url(#qualGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Loss Analysis — Stacked BarChart */}
        <TabsContent value="loss" className="mt-4 animate-slide-up">
          <ChartCard
            title="Loss Analysis by Machine"
            description="Breakdown of Availability, Performance, and Quality losses"
            icon={Layers}
            className="chart-container-glass"
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} width={40} />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="Avail. Loss" stackId="loss" fill={C_RED} radius={[0, 0, 0, 0]} barSize={30}>
                    <LabelList dataKey="Avail. Loss" position="center" style={{ fontSize: 10, fontWeight: 500, fill: '#fff' }} />
                  </Bar>
                  <Bar dataKey="Perf. Loss" stackId="loss" fill={C_ORANGE} barSize={30}>
                    <LabelList dataKey="Perf. Loss" position="center" style={{ fontSize: 10, fontWeight: 500, fill: '#fff' }} />
                  </Bar>
                  <Bar dataKey="Quality Loss" stackId="loss" fill={C_YELLOW} radius={[3, 3, 0, 0]} barSize={30}>
                    <LabelList dataKey="Quality Loss" position="center" style={{ fontSize: 10, fontWeight: 500, fill: '#fff' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Target vs Actual */}
        <TabsContent value="target" className="mt-4 animate-slide-up">
          <ChartCard
            title="Target vs Actual OEE"
            description={`Comparing each machine against the ${OEE_TARGET}% OEE target`}
            icon={Crosshair}
            className="chart-container-glass"
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={targetVsActual} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} />
                  <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[0, 100]} width={35} />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="Target" fill="rgba(255,255,255,0.12)" radius={[2, 2, 0, 0]} barSize={16} />
                  <Bar dataKey="Actual" radius={[2, 2, 0, 0]} barSize={16}>
                    {targetVsActual.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.Actual >= OEE_TARGET
                            ? C_GREEN
                            : entry.Actual >= 70
                              ? C_YELLOW
                              : C_RED
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
