'use client'

import { useMemo, useState, useEffect } from 'react'
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
  Download,
  Calendar,
  RefreshCw,
  Cpu,
  Package,
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
import { MachineDetailDialog } from '@/shared/components/machine-detail-dialog'
import type { MachineStatus } from '@/store/iiot'

// ─── Chart color helpers ─────────────────────────────────────────────────────
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

const GRID_STROKE = 'rgba(255,255,255,0.05)'
const AXIS_TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 11 }
const AXIS_LINE = { stroke: 'rgba(255,255,255,0.06)' }

// ─── Fallback machine data (when WebSocket not connected) ────────────────────
const FALLBACK_MACHINES: Array<{ id: string; name: string; status: 'running' | 'idle' | 'error' | 'maintenance'; oee: number }> = [
  { id: 'fb-1', name: 'MCH-001', status: 'running', oee: 87.3 },
  { id: 'fb-2', name: 'MCH-002', status: 'idle', oee: 82.1 },
  { id: 'fb-3', name: 'MCH-003', status: 'running', oee: 79.5 },
  { id: 'fb-4', name: 'MCH-004', status: 'running', oee: 91.2 },
  { id: 'fb-5', name: 'MCH-005', status: 'idle', oee: 85.7 },
  { id: 'fb-6', name: 'MCH-006', status: 'running', oee: 88.9 },
]

// ─── Custom dark tooltip with glass effect ───────────────────────────────────
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
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-1.5 font-semibold text-foreground/90">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="flex-1">{p.name}</span>
          <span className="font-bold text-foreground metric-value">{p.value}{valueSuffix}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Enhanced Mini sparkline for KPI cards ───────────────────────────────────
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

// ─── KPI Card (enhanced) ────────────────────────────────────────────────────
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
  onClick,
  className,
}: KPICardProps) {
  return (
    <Card
      className={`relative overflow-hidden h-full kpi-card-hover group cursor-default ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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

// ─── Chart Card Wrapper ─────────────────────────────────────────────────────
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
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export function DashboardPage() {
  const { devices, machines, alarms, energyHistory, production, lastUpdate, isConnected } = useIIoTStore()
  const { setCurrentPage } = useNavigation()
  const [selectedMachine, setSelectedMachine] = useState<MachineStatus | null>(null)
  const [machineDialogOpen, setMachineDialogOpen] = useState(false)
  const [lastUpdatedText, setLastUpdatedText] = useState('—')

  // Update last-updated text
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
        name: m.name.length > 14 ? m.name.slice(0, 14) + '…' : m.name,
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

  const staggerClass = (i: number) => `stagger-${Math.min(i + 1, 6)}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Real-time industrial operations overview"
        icon={Activity}
        lastUpdated={lastUpdatedText}
        badge={isConnected ? 'LIVE' : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Calendar className="size-3.5" />
              Last 24h
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="size-3.5" />
              Export
            </Button>
          </div>
        }
      />

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`animate-slide-up ${staggerClass(0)}`}>
          <KPICard
            icon={MonitorSmartphone}
            label="Total Devices"
            value={devices.length}
            subtitle={`${onlineDevices} online · ${offlineDevices} offline`}
            trend="up"
            sparkData={deviceSparkData}
            sparkColor={C_GREEN}
            accentColor={C_GREEN}
            className="kpi-gradient-green"
          />
        </div>
        <div className={`animate-slide-up ${staggerClass(1)}`}>
          <KPICard
            icon={Factory}
            label="Active Machines"
            value={activeMachines}
            subtitle={`${activeMachines} of ${machines.length} running`}
            trend={activeMachines > 0 ? 'up' : 'neutral'}
            sparkData={machineSparkData}
            sparkColor={C_GREEN}
            accentColor={C_CYAN}
            className="kpi-gradient-cyan"
          />
        </div>
        <div className={`animate-slide-up ${staggerClass(2)}`}>
          <KPICard
            icon={Bell}
            label="Active Alarms"
            value={activeAlarms.length}
            subtitle={criticalAlarms > 0 ? `${criticalAlarms} critical` : 'No critical alarms'}
            trend={criticalAlarms > 0 ? 'down' : 'neutral'}
            sparkData={activeAlarms.map(() => Math.random())}
            sparkColor={criticalAlarms > 0 ? C_RED : C_YELLOW}
            accentColor={criticalAlarms > 0 ? C_RED : C_YELLOW}
            className="kpi-gradient-red"
            onClick={() => setCurrentPage('active-alarms')}
          />
        </div>
        <div className={`animate-slide-up ${staggerClass(3)}`}>
          <KPICard
            icon={Zap}
            label="Energy Consumption"
            value={`${todayEnergy.toFixed(0)} kWh`}
            subtitle="Today's total consumption"
            trend="up"
            sparkData={energySparkData}
            sparkColor={C_ORANGE}
            accentColor={C_ORANGE}
            className="kpi-gradient-amber"
          />
        </div>
      </div>

      {/* ── Machine Status Summary Widget ── */}
      <div className={`animate-slide-up ${staggerClass(4)}`}>
        <div className="glass-card kpi-card-hover rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="size-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Machine Status Summary</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {machines.length > 0 ? machines.length : 6} machines
            </Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(machines.length > 0 ? machines.slice(0, 6) : FALLBACK_MACHINES).map((m, idx) => {
              const statusColor = m.status === 'running' ? C_GREEN : m.status === 'idle' ? C_YELLOW : m.status === 'error' ? C_RED : '#3b82f6'
              const oeePct = typeof m.oee === 'number' ? (m.oee < 1 ? m.oee * 100 : m.oee) : 0
              return (
                <div
                  key={m.id || `fallback-${idx}`}
                  className={`animate-slide-up ${staggerClass(idx)} shrink-0 w-[150px] rounded-lg border border-border/40 p-3 transition-all duration-200 hover:bg-muted/20 hover:border-border/60 cursor-pointer`}
                  onClick={() => {
                    if (machines.length > 0) {
                      setSelectedMachine(machines[idx] || machines[0])
                      setMachineDialogOpen(true)
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block size-2.5 rounded-full shrink-0 ${m.status === 'running' ? 'animate-pulse-dot glow-green' : m.status === 'error' ? 'glow-red' : ''}`}
                      style={{ backgroundColor: statusColor }}
                    />
                    <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                  </div>
                  <p className={`text-lg font-extrabold metric-value ${oeePct >= 85 ? 'text-emerald-400' : oeePct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {oeePct.toFixed(1)}%
                  </p>
                  <p className="text-[10px] kpi-subtext uppercase tracking-wider">OEE</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Production Trend + OEE Row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 animate-slide-up stagger-5">
        {/* Production Overview */}
        <ChartCard
          title="Production Overview"
          description="24-hour production output vs target"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          className="lg:col-span-3 chart-container-glass"
          actions={
            <div className="flex items-center gap-1 text-[10px] kpi-subtext">
              <RefreshCw className={`size-3 ${isConnected ? 'animate-spin' : ''}`} style={isConnected ? { animationDuration: '3s' } : {}} />
              <span>Auto-refreshing</span>
            </div>
          }
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionTrendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_CYAN} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={C_CYAN} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="hour"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  interval={3}
                />
                <YAxis
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  label={{
                    value: 'Units',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'rgba(255,255,255,0.25)', fontSize: 10 },
                    offset: 0,
                  }}
                />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="target" stroke={C_CYAN} strokeWidth={1.5} strokeDasharray="5 3" fill="url(#gradTarget)" name="Target" />
                <Area type="monotone" dataKey="output" stroke={C_GREEN} strokeWidth={2} fill="url(#gradOutput)" name="Output" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Production Items List */}
          {production.length > 0 && (
            <div className="mt-4 border-t border-border/40 pt-3">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest kpi-subtext">
                Active Production Orders
              </p>
              <div className="flex flex-col gap-2.5">
                {production.slice(0, 5).map((order) => {
                  const ratio = order.target > 0 ? (order.actual / order.target) * 100 : 0
                  const progressColor = ratio >= 90
                    ? '[&>div]:bg-emerald-500'
                    : ratio >= 60
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-red-500'
                  const textColor = ratio >= 90
                    ? 'text-emerald-400'
                    : ratio >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  return (
                    <div key={order.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="size-3 shrink-0 text-emerald-400/60" />
                          <p className="text-xs font-medium text-foreground truncate">{order.productName}</p>
                        </div>
                        <p className="text-[10px] kpi-subtext mt-0.5 ml-5">{order.machineName} · {order.actual}/{order.target} units</p>
                      </div>
                      <span className={`text-xs font-bold metric-value ${textColor} shrink-0 w-12 text-right`}>{ratio.toFixed(0)}%</span>
                      <div className="w-20 shrink-0">
                        <Progress value={Math.min(ratio, 100)} className={`h-1.5 ${progressColor}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ChartCard>

        {/* OEE Bar Chart */}
        <ChartCard
          title="Machine OEE Overview"
          description="OEE, Availability, Performance, Quality (%)"
          icon={Gauge}
          iconColor="text-emerald-400"
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={oeeData} margin={{ top: 8, right: 5, left: -15, bottom: 0 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <Tooltip content={<DarkTooltip valueSuffix="%" />} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }} />
                <Bar dataKey="OEE" fill={C_GREEN} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Availability" fill={C_CYAN} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Performance" fill={C_ORANGE} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Quality" fill={C_YELLOW} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Alarm Summary + Machine Status Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up stagger-6">
        {/* Alarm Summary */}
        <ChartCard
          title="Alarm Summary"
          description="Active alarm distribution"
          icon={AlertTriangle}
          iconColor="text-amber-400"
          className="lg:col-span-1 flex flex-col"
        >
          <div className="flex flex-col gap-4 flex-1">
            {/* Gauge + Breakdown */}
            <div className="flex items-center gap-4 h-[130px]">
              {/* Donut Gauge - left */}
              <div className="w-[130px] shrink-0 h-full">
                {alarmDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alarmDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {alarmDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(0.17 0.006 155)',
                          border: '1px solid oklch(0.25 0.008 155)',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: 'oklch(0.92 0.01 155)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Bell className="size-6 opacity-30" />
                  </div>
                )}
              </div>

              {/* Breakdown list - right */}
              <div className="flex flex-col justify-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20 shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">Critical</span>
                  <span className="text-sm font-bold text-red-400 metric-value">{alarmDistribution.find(d => d.name === 'Critical')?.value || 0}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">Warning</span>
                  <span className="text-sm font-bold text-amber-400 metric-value">{alarmDistribution.find(d => d.name === 'Warning')?.value || 0}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-cyan-500 ring-2 ring-cyan-500/20 shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">Info</span>
                  <span className="text-sm font-bold text-cyan-400 metric-value">{alarmDistribution.find(d => d.name === 'Info')?.value || 0}</span>
                </div>
              </div>
            </div>

            {/* Latest Alarms List */}
            <div className="flex-1">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest kpi-subtext">
                Latest Active Alarms
              </p>
              <ScrollArea className="h-[140px] max-h-[140px]">
                <div className="flex flex-col gap-1.5 pr-2">
                  {latestAlarms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No active alarms</p>
                  ) : (
                    latestAlarms.map((alarm) => {
                      const sev = SEVERITY_COLORS[alarm.severity]
                      const SevIcon = sev.icon
                      return (
                        <div
                          key={alarm.id}
                          className="flex items-start gap-2.5 rounded-lg border border-border/30 px-3 py-2.5 transition-all duration-200 hover:bg-muted/30 hover:border-border/50"
                        >
                          <div
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: sev.bg }}
                          >
                            <SevIcon className="size-3" style={{ color: sev.fill }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{alarm.source}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{alarm.message}</p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                              <Clock className="size-2.5" />
                              {formatDistanceToNow(new Date(alarm.createdAt), { addSuffix: true })}
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
              className="mt-auto w-full text-xs gap-1.5 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
              onClick={() => setCurrentPage('active-alarms')}
            >
              View All Alarms
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </ChartCard>

        {/* Machine Status Grid */}
        <ChartCard
          title="Machine Status"
          description="Real-time status of all connected machines"
          icon={Factory}
          iconColor="text-emerald-400"
          className="lg:col-span-1"
          actions={
            <Badge variant="secondary" className="text-[10px]">
              {machines.length} machines
            </Badge>
          }
        >
          {machines.length === 0 ? (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
              <div className="flex flex-col items-center gap-2">
                <Factory className="size-8 opacity-20" />
                <span>No machines connected</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[320px] max-h-[320px]">
              <div className="grid grid-cols-1 gap-3 pr-2 sm:grid-cols-2">
                {machines.map((machine) => {
                  const statusColor = STATUS_COLORS[machine.status]
                  return (
                    <div
                      key={machine.id}
                      className="relative rounded-xl border border-border/40 py-2.5 px-3 transition-all duration-200 hover:bg-muted/20 hover:border-border/60 cursor-pointer group/machine"
                      onClick={() => {
                        setSelectedMachine(machine)
                        setMachineDialogOpen(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`inline-block size-2.5 rounded-full ${machine.status === 'running' ? 'animate-pulse-dot glow-green' : machine.status === 'error' ? 'glow-red' : ''}`}
                            style={{ backgroundColor: statusColor }}
                          />
                          <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                            {machine.name}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 capitalize transition-colors ${
                            machine.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : machine.status === 'error'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : machine.status === 'idle'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {machine.status}
                        </Badge>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Factory className="size-3" />
                        {machine.type}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center transition-colors group-hover/machine:bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <Thermometer className={`size-3 ${machine.temperature > 80 ? 'text-red-400' : machine.temperature > 60 ? 'text-amber-400' : 'text-emerald-400'}`} />
                          </div>
                          <p className={`text-xs font-bold metric-value ${machine.temperature > 80 ? 'text-red-400' : 'text-foreground'}`}>
                            {machine.temperature}°C
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center transition-colors group-hover/machine:bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <Activity className="size-3 text-cyan-400" />
                          </div>
                          <p className="text-xs font-bold metric-value text-foreground">
                            {machine.rpm}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/20 px-2.5 py-2 text-center transition-colors group-hover/machine:bg-muted/30">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                            <Gauge className={`size-3 ${machine.oee > 85 ? 'text-emerald-400' : machine.oee > 70 ? 'text-amber-400' : 'text-red-400'}`} />
                          </div>
                          <p className={`text-xs font-bold metric-value ${machine.oee > 85 ? 'text-emerald-400' : machine.oee > 70 ? 'text-amber-400' : 'text-red-400'}`}>
                            {(machine.oee * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* OEE Progress bar */}
                      <div className="mt-2.5">
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
        </ChartCard>
      </div>

      {/* ── Energy Consumption Chart ── */}
      <div className="animate-slide-up stagger-6">
        <ChartCard
          title="Energy Consumption"
          className="chart-container-glass"
          description="Real-time power consumption (kWh) and voltage levels"
          icon={Zap}
          iconColor="text-orange-400"
          actions={
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">kWh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan-500" />
                <span className="text-muted-foreground">Voltage</span>
              </div>
            </div>
          }
        >
          <div className="h-[240px] w-full">
            {energyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyChartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_ORANGE} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={C_ORANGE} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="time"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={Math.max(0, Math.floor(energyChartData.length / 10) - 1)}
                  />
                  <YAxis
                    yAxisId="kwh"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    label={{
                      value: 'kWh',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'rgba(255,255,255,0.25)', fontSize: 10 },
                      offset: -5,
                    }}
                  />
                  <YAxis
                    yAxisId="voltage"
                    orientation="right"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    label={{
                      value: 'V',
                      angle: 90,
                      position: 'insideRight',
                      style: { fill: 'rgba(255,255,255,0.25)', fontSize: 10 },
                      offset: -5,
                    }}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}
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
        </ChartCard>
      </div>

      {/* ── Active Alarms Banner ── */}
      <div className="animate-slide-up stagger-7 flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.03] px-5 py-3.5 border-l-[3px] border-l-red-500/70">
        <AlertTriangle className="size-5 text-red-400 shrink-0" />
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="text-xs uppercase tracking-wider text-red-400/80 font-medium">Active Alarms</span>
          <span className="text-2xl font-bold text-red-400 leading-none">{activeAlarms.length}</span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 shrink-0"
          onClick={() => setCurrentPage('active-alarms')}
        >
          View All
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* Machine Detail Dialog */}
      <MachineDetailDialog
        machine={selectedMachine}
        open={machineDialogOpen}
        onOpenChange={setMachineDialogOpen}
      />
    </div>
  )
}