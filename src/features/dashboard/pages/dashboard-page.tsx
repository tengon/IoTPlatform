'use client'

import { useMemo } from 'react'
import {
  MonitorSmartphone,
  Factory,
  Bell,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Info,
  AlertCircle,
  Thermometer,
  Gauge,
  Activity,
  Clock,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { useNavigation } from '@/store/navigation'
import { PageHeader } from '@/shared/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Chart color helpers ─────────────────────────────────────────────────────
const CHART_1 = 'hsl(var(--chart-1))'
const CHART_2 = 'hsl(var(--chart-2))'
const CHART_3 = 'hsl(var(--chart-3))'
const CHART_4 = 'hsl(var(--chart-4))'
const CHART_5 = 'hsl(var(--chart-5))'

// Solid fallback colors for recharts (oklch not parseable by recharts)
const C_GREEN = '#10b981'
const C_YELLOW = '#eab308'
const C_CYAN = '#06b6d4'
const C_ORANGE = '#f97316'
const C_RED = '#ef4444'
const C_GREEN_LIGHT = 'rgba(16,185,129,0.15)'
const C_YELLOW_LIGHT = 'rgba(234,179,8,0.15)'
const C_CYAN_LIGHT = 'rgba(6,182,212,0.15)'
const C_ORANGE_LIGHT = 'rgba(249,115,22,0.15)'
const C_RED_LIGHT = 'rgba(239,68,68,0.15)'

const SEVERITY_COLORS: Record<string, { fill: string; bg: string; icon: typeof AlertCircle }> = {
  critical: { fill: C_RED, bg: C_RED_LIGHT, icon: AlertCircle },
  warning: { fill: C_YELLOW, bg: C_YELLOW_LIGHT, icon: AlertTriangle },
  info: { fill: C_CYAN, bg: C_CYAN_LIGHT, icon: Info },
}

const STATUS_COLORS: Record<string, string> = {
  running: C_GREEN,
  idle: C_YELLOW,
  maintenance: '#3b82f6',
  error: C_RED,
}

// ─── Custom dark tooltip ─────────────────────────────────────────────────────
function DarkTooltip({
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block mr-1.5 size-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{p.value}{valueSuffix}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Mini sparkline for KPI cards ─────────────────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const sparkData = data.slice(-12).map((v, i) => ({ i, v }))
  if (sparkData.length < 2) return null
  const min = Math.min(...sparkData.map((d) => d.v))
  const max = Math.max(...sparkData.map((d) => d.v))
  const range = max - min || 1
  const h = 28
  const w = 72
  const step = w / (sparkData.length - 1)
  const points = sparkData
    .map((d, idx) => {
      const x = idx * step
      const y = h - ((d.v - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-[28px] opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
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
  onClick?: () => void
}

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  sparkData,
  sparkColor = C_GREEN,
  accentColor,
  onClick,
}: KPICardProps) {
  return (
    <Card
      className="relative overflow-hidden py-4 transition-colors hover:border-primary/30"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Subtle accent line top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: accentColor || 'var(--chart-1)' }}
      />
      <CardContent className="flex items-start justify-between pb-0 pt-0">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentColor ? `${accentColor}20` : 'var(--primary) 15%' }}
          >
            <Icon
              className="size-5"
              style={{ color: accentColor || 'var(--primary)' }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {trend === 'up' && <TrendingUp className="size-3 text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="size-3 text-red-400" />}
              <span
                className={
                  trend === 'up'
                    ? 'text-emerald-400'
                    : trend === 'down'
                      ? 'text-red-400'
                      : 'text-muted-foreground'
                }
              >
                {subtitle}
              </span>
            </div>
          </div>
        </div>
        {sparkData && sparkData.length > 1 && (
          <MiniSparkline data={sparkData} color={sparkColor} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export function DashboardPage() {
  const { devices, machines, alarms, energyHistory, production } = useIIoTStore()
  const { setCurrentPage } = useNavigation()

  // ── Computed values ──
  const onlineDevices = useMemo(
    () => devices.filter((d) => d.status === 'online' || d.status === 'warning').length,
    [devices]
  )
  const offlineDevices = devices.length - onlineDevices
  const activeMachines = useMemo(
    () => machines.filter((m) => m.status === 'running').length,
    [machines]
  )
  const activeAlarms = useMemo(
    () => alarms.filter((a) => a.status === 'active'),
    [alarms]
  )
  const criticalAlarms = useMemo(
    () => activeAlarms.filter((a) => a.severity === 'critical').length,
    [activeAlarms]
  )
  const todayEnergy = useMemo(() => {
    if (!energyHistory.length) return 0
    return energyHistory.reduce((sum, e) => sum + e.kwh, 0)
  }, [energyHistory])

  // ── Production trend data (simulated 24h) ──
  const productionTrendData = useMemo(() => {
    const hours: { hour: string; output: number; target: number }[] = []
    const totalTarget = production.reduce((s, p) => s + p.target, 0) || 1
    const totalActual = production.reduce((s, p) => s + p.actual, 0) || 0
    for (let h = 0; h < 24; h++) {
      const hourStr = `${String(h).padStart(2, '0')}:00`
      // Simulate production curve: ramp up, peak, slight dip at night
      const shiftMultiplier = h >= 6 && h <= 18 ? 1 : 0.4
      const peakMultiplier = h >= 9 && h <= 16 ? 1.2 : 1
      const noise = 0.85 + Math.sin(h * 0.7) * 0.15
      const output = Math.round(
        (totalActual / 24) * shiftMultiplier * peakMultiplier * noise
      )
      const target = Math.round((totalTarget / 24) * shiftMultiplier * peakMultiplier)
      hours.push({ hour: hourStr, output, target })
    }
    return hours
  }, [production])

  // ── OEE Bar Chart data ──
  const oeeData = useMemo(
    () =>
      machines.map((m) => ({
        name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
        OEE: Number((m.oee * 100).toFixed(1)),
        Availability: Number((m.availability * 100).toFixed(1)),
        Performance: Number((m.performance * 100).toFixed(1)),
        Quality: Number((m.quality * 100).toFixed(1)),
      })),
    [machines]
  )

  // ── Alarm distribution ──
  const alarmDistribution = useMemo(() => {
    const counts = { critical: 0, warning: 0, info: 0 }
    activeAlarms.forEach((a) => { counts[a.severity]++ })
    return [
      { name: 'Critical', value: counts.critical, fill: C_RED },
      { name: 'Warning', value: counts.warning, fill: C_YELLOW },
      { name: 'Info', value: counts.info, fill: C_CYAN },
    ].filter((d) => d.value > 0)
  }, [activeAlarms])

  // ── Latest 5 active alarms ──
  const latestAlarms = useMemo(
    () =>
      [...activeAlarms]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [activeAlarms]
  )

  // ── Energy chart data ──
  const energyChartData = useMemo(() => {
    if (!energyHistory.length) return []
    return energyHistory.map((e) => {
      const d = new Date(e.timestamp)
      return {
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        kWh: Number(e.kwh.toFixed(2)),
        voltage: Number(e.voltage.toFixed(1)),
      }
    })
  }, [energyHistory])

  // ── Sparkline data for KPIs ──
  const deviceSparkData = useMemo(() => {
    // Simulate a small spark from recent device count changes
    return [devices.length - 1, devices.length, devices.length + 1, devices.length, onlineDevices, onlineDevices, onlineDevices + 1]
  }, [devices.length, onlineDevices])

  const energySparkData = useMemo(
    () => energyHistory.slice(-12).map((e) => e.kwh),
    [energyHistory]
  )

  const machineSparkData = useMemo(
    () => machines.map((m) => (m.status === 'running' ? 1 : 0)),
    [machines]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Real-time industrial operations overview"
        icon={Activity}
      />

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={MonitorSmartphone}
          label="Total Devices"
          value={devices.length}
          subtitle={`${onlineDevices} online · ${offlineDevices} offline`}
          trend="up"
          trendValue="+2 today"
          sparkData={deviceSparkData}
          sparkColor={C_GREEN}
          accentColor={C_GREEN}
        />
        <KPICard
          icon={Factory}
          label="Active Machines"
          value={activeMachines}
          subtitle={`${activeMachines} of ${machines.length} running`}
          trend={activeMachines > 0 ? 'up' : 'neutral'}
          sparkData={machineSparkData}
          sparkColor={C_GREEN}
          accentColor={C_CYAN}
        />
        <KPICard
          icon={Bell}
          label="Active Alarms"
          value={activeAlarms.length}
          subtitle={criticalAlarms > 0 ? `${criticalAlarms} critical` : 'No critical alarms'}
          trend={criticalAlarms > 0 ? 'down' : 'neutral'}
          sparkData={activeAlarms.map(() => Math.random())}
          sparkColor={criticalAlarms > 0 ? C_RED : C_YELLOW}
          accentColor={criticalAlarms > 0 ? C_RED : C_YELLOW}
          onClick={() => setCurrentPage('active-alarms')}
        />
        <KPICard
          icon={Zap}
          label="Energy Consumption"
          value={`${todayEnergy.toFixed(0)} kWh`}
          subtitle="Today's total consumption"
          trend="up"
          sparkData={energySparkData}
          sparkColor={C_ORANGE}
          accentColor={C_ORANGE}
        />
      </div>

      {/* ── Production Trend + OEE Row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Production Overview (3/5 width) */}
        <Card className="lg:col-span-3 py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" />
              Production Overview
            </CardTitle>
            <CardDescription>24-hour production output vs target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_CYAN} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={C_CYAN} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke={C_CYAN}
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    fill="url(#gradTarget)"
                    name="Target"
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    stroke={C_GREEN}
                    strokeWidth={2}
                    fill="url(#gradOutput)"
                    name="Output"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* OEE Bar Chart (2/5 width) */}
        <Card className="lg:col-span-2 py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gauge className="size-4 text-emerald-400" />
              Machine OEE Overview
            </CardTitle>
            <CardDescription>OEE, Availability, Performance, Quality (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oeeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Tooltip content={<DarkTooltip valueSuffix="%" />} />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
                  />
                  <Bar dataKey="OEE" fill={C_GREEN} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Availability" fill={C_CYAN} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Performance" fill={C_ORANGE} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Quality" fill={C_YELLOW} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alarm Summary + Machine Status Grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Alarm Summary (1/3) */}
        <Card className="lg:col-span-1 py-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400" />
              Alarm Summary
            </CardTitle>
            <CardDescription>Active alarm distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {/* Donut Chart */}
            <div className="flex items-center justify-center h-[160px]">
              {alarmDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alarmDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {alarmDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.006 155)',
                        border: '1px solid oklch(0.25 0.008 155)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'oklch(0.92 0.01 155)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Bell className="size-8 opacity-30" />
                  <span className="text-xs">No active alarms</span>
                </div>
              )}
            </div>

            {/* Legend row */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500" />
                Critical
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-yellow-500" />
                Warning
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan-500" />
                Info
              </div>
            </div>

            {/* Latest Alarms List */}
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Latest Active Alarms
              </p>
              <ScrollArea className="h-[160px] max-h-[160px]">
                <div className="flex flex-col gap-2 pr-2">
                  {latestAlarms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No active alarms
                    </p>
                  ) : (
                    latestAlarms.map((alarm) => {
                      const sev = SEVERITY_COLORS[alarm.severity]
                      const SevIcon = sev.icon
                      return (
                        <div
                          key={alarm.id}
                          className="flex items-start gap-2.5 rounded-lg border border-border/50 px-2.5 py-2 transition-colors hover:bg-muted/30"
                        >
                          <div
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: sev.bg }}
                          >
                            <SevIcon className="size-3.5" style={{ color: sev.fill }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">
                              {alarm.source}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {alarm.message}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                              <Clock className="size-2.5" />
                              {formatDistanceToNow(new Date(alarm.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* View all button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-auto w-full"
              onClick={() => setCurrentPage('active-alarms')}
            >
              View All Alarms
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Machine Status Grid (2/3) */}
        <Card className="lg:col-span-2 py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Factory className="size-4 text-emerald-400" />
              Machine Status
            </CardTitle>
            <CardDescription>Real-time status of all connected machines</CardDescription>
          </CardHeader>
          <CardContent>
            {machines.length === 0 ? (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                No machines connected
              </div>
            ) : (
              <ScrollArea className="h-[320px] max-h-[320px]">
                <div className="grid grid-cols-1 gap-3 pr-2 sm:grid-cols-2">
                  {machines.map((machine) => {
                    const statusColor = STATUS_COLORS[machine.status]
                    return (
                      <div
                        key={machine.id}
                        className="relative rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/20"
                      >
                        {/* Status indicator dot */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block size-2.5 rounded-full ${machine.status === 'running' ? 'animate-pulse-dot glow-green' : machine.status === 'error' ? 'glow-red' : ''}`}
                              style={{ backgroundColor: statusColor }}
                            />
                            <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
                              {machine.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 capitalize"
                            style={{
                              borderColor: `${statusColor}50`,
                              color: statusColor,
                            }}
                          >
                            {machine.status}
                          </Badge>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Factory className="size-3" />
                          {machine.type}
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {/* Temperature */}
                          <div className="rounded-md bg-muted/30 px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                              <Thermometer className="size-3 text-orange-400" />
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                              {machine.temperature}°C
                            </p>
                          </div>
                          {/* RPM */}
                          <div className="rounded-md bg-muted/30 px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                              <Activity className="size-3 text-cyan-400" />
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                              {machine.rpm}
                            </p>
                          </div>
                          {/* OEE */}
                          <div className="rounded-md bg-muted/30 px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                              <Gauge className="size-3 text-emerald-400" />
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                              {(machine.oee * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* OEE Progress bar */}
                        <div className="mt-2">
                          <Progress
                            value={machine.oee * 100}
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Energy Consumption Chart ── */}
      <Card className="py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-orange-400" />
            Energy Consumption
          </CardTitle>
          <CardDescription>Real-time power consumption (kWh) and voltage levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            {energyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_ORANGE} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C_ORANGE} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    interval={Math.max(0, Math.floor(energyChartData.length / 10) - 1)}
                  />
                  <YAxis
                    yAxisId="kwh"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    label={{
                      value: 'kWh',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'rgba(255,255,255,0.3)', fontSize: 10 },
                      offset: -5,
                    }}
                  />
                  <YAxis
                    yAxisId="voltage"
                    orientation="right"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    label={{
                      value: 'V',
                      angle: 90,
                      position: 'insideRight',
                      style: { fill: 'rgba(255,255,255,0.3)', fontSize: 10 },
                      offset: -5,
                    }}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
                  />
                  <Line
                    yAxisId="kwh"
                    type="monotone"
                    dataKey="kWh"
                    stroke={C_ORANGE}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: C_ORANGE, strokeWidth: 0 }}
                    name="kWh"
                  />
                  <Line
                    yAxisId="voltage"
                    type="monotone"
                    dataKey="voltage"
                    stroke={C_CYAN}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 3, fill: C_CYAN, strokeWidth: 0 }}
                    name="Voltage"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Zap className="size-8 opacity-20" />
                  <span>Awaiting energy data...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
