'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  HeartPulse,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Server,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Radio,
  Database,
  ShieldCheck,
  BellRing,
  GitBranch,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Network,
  CircleDot,
  RotateCcw,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Settings2,
  X,
  Trash2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { StateArchitectureDiagram } from '@/shared/components/state-architecture-diagram'
import { PageHeader } from '@/shared/components/page-header'
import {
  ChartTooltip,
  AXIS_TICK_SM,
  AXIS_LINE,
  GRID_STROKE,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ──────────────────────────────────────────────────────────────
interface ServiceStatus {
  name: string
  icon: React.ElementType
  status: 'healthy' | 'running' | 'connected' | 'active' | 'degraded' | 'down'
  uptime: string
  lastChecked: Date
  responseTime?: number
  details?: string
}

interface SystemEvent {
  id: string
  timestamp: Date
  type: 'deployment' | 'restart' | 'error' | 'warning' | 'info'
  service: string
  message: string
  severity?: 'info' | 'warning' | 'error'
  isNew?: boolean
}

interface ThresholdConfig {
  apiResponseTime: number
  memoryUsage: number
  wsLatency: number
}

interface ThresholdViolation {
  id: string
  metric: string
  currentValue: number
  threshold: number
  unit: string
  exceeded: number
}

interface ResourceMetric {
  label: string
  value: number
  unit: string
  max: number
  trend: 'up' | 'down' | 'stable'
 color: string
}

// ─── Mock Service Data ──────────────────────────────────────────────────
function generateServices(): ServiceStatus[] {
  return [
    {
      name: 'IIoT Gateway',
      icon: Radio,
      status: 'connected',
      uptime: '14d 6h 32m',
      lastChecked: new Date(Date.now() - 8000),
      responseTime: 12,
      details: 'MQTT broker connected, 24 active sessions',
    },
    {
      name: 'WebSocket Server',
      icon: Wifi,
      status: 'running',
      uptime: '14d 6h 32m',
      lastChecked: new Date(Date.now() - 5000),
      responseTime: 8,
      details: 'Socket.io v4, 18 subscriptions active',
    },
    {
      name: 'Database',
      icon: Database,
      status: 'healthy',
      uptime: '30d 2h 15m',
      lastChecked: new Date(Date.now() - 3000),
      responseTime: 3,
      details: 'SQLite, 12.4 MB, 0 locked tables',
    },
    {
      name: 'Auth Service',
      icon: ShieldCheck,
      status: 'active',
      uptime: '14d 6h 32m',
      lastChecked: new Date(Date.now() - 10000),
      responseTime: 18,
      details: 'NextAuth v4, JWT sessions',
    },
    {
      name: 'Notification Service',
      icon: BellRing,
      status: 'active',
      uptime: '7d 18h 45m',
      lastChecked: new Date(Date.now() - 12000),
      responseTime: 22,
      details: '3 pending alerts, 142 sent today',
    },
    {
      name: 'Data Pipeline',
      icon: GitBranch,
      status: 'running',
      uptime: '14d 6h 32m',
      lastChecked: new Date(Date.now() - 6000),
      responseTime: 15,
      details: 'Processing 847 pts/min, 0 lag',
    },
  ]
}

function generateEvents(): SystemEvent[] {
  const now = Date.now()
  return [
    { id: 'e1', timestamp: new Date(now - 120000), type: 'info', service: 'Data Pipeline', message: 'Pipeline throughput normalized after brief spike' },
    { id: 'e2', timestamp: new Date(now - 300000), type: 'deployment', service: 'WebSocket Server', message: 'Config updated: max connections raised to 100' },
    { id: 'e3', timestamp: new Date(now - 600000), type: 'warning', service: 'Database', message: 'Slow query detected: alarm_history scan took 847ms' },
    { id: 'e4', timestamp: new Date(now - 900000), type: 'info', service: 'Auth Service', message: 'Session cleanup completed: removed 23 expired tokens' },
    { id: 'e5', timestamp: new Date(now - 1500000), type: 'restart', service: 'Notification Service', message: 'Graceful restart completed in 2.3s' },
    { id: 'e6', timestamp: new Date(now - 2100000), type: 'deployment', service: 'IIoT Gateway', message: 'MQTT broker firmware updated to v3.8.2' },
    { id: 'e7', timestamp: new Date(now - 2700000), type: 'error', service: 'Data Pipeline', message: 'Transient write failure to telemetry buffer (auto-recovered)' },
    { id: 'e8', timestamp: new Date(now - 3600000), type: 'info', service: 'WebSocket Server', message: 'Client connection pool optimized: 8 idle connections closed' },
    { id: 'e9', timestamp: new Date(now - 4500000), type: 'warning', service: 'IIoT Gateway', message: 'MQTT message queue depth briefly exceeded 5000' },
    { id: 'e10', timestamp: new Date(now - 5400000), type: 'deployment', service: 'Platform', message: 'System update v2.2.0 deployed successfully' },
    { id: 'e11', timestamp: new Date(now - 7200000), type: 'restart', service: 'Database', message: 'Scheduled maintenance restart completed' },
    { id: 'e12', timestamp: new Date(now - 9000000), type: 'info', service: 'Auth Service', message: 'New API key provisioned for external integration' },
    { id: 'e13', timestamp: new Date(now - 10800000), type: 'warning', service: 'Notification Service', message: 'Email delivery rate approaching limit (85%)' },
    { id: 'e14', timestamp: new Date(now - 12600000), type: 'error', service: 'WebSocket Server', message: 'Connection storm detected — rate limiter activated' },
    { id: 'e15', timestamp: new Date(now - 14400000), type: 'deployment', service: 'Data Pipeline', message: 'New aggregation rule deployed for OEE calculation' },
  ]
}

function generateApiData(): { time: string; responseTime: number }[] {
  const data: { time: string; responseTime: number }[] = []
  const now = Date.now()
  for (let i = 59; i >= 0; i--) {
    const t = (60 - i) / 60
    const base = 38 + 8 * Math.sin(t * Math.PI * 3)
    const spike = i === 12 ? 180 : i === 35 ? 95 : 0
    data.push({
      time: new Date(now - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      responseTime: Math.max(10, base + (Math.random() - 0.5) * 20 + spike),
    })
  }
  return data
}

function generateMemoryData(): { time: string; usage: number }[] {
  const data: { time: string; usage: number }[] = []
  const now = Date.now()
  let mem = 68
  for (let i = 59; i >= 0; i--) {
    mem += (Math.random() - 0.48) * 3
    mem = Math.max(55, Math.min(82, mem))
    data.push({
      time: new Date(now - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      usage: Math.round(mem * 10) / 10,
    })
  }
  return data
}

// ─── Status Helpers ─────────────────────────────────────────────────────
function isHealthy(status: ServiceStatus['status']): boolean {
  return ['healthy', 'running', 'connected', 'active'].includes(status)
}

function statusColor(status: ServiceStatus['status']): string {
  if (isHealthy(status)) return 'bg-emerald-500'
  if (status === 'degraded') return 'bg-amber-500'
  return 'bg-red-500'
}

function statusLabel(status: ServiceStatus['status']): string {
  const map: Record<string, string> = {
    healthy: 'Healthy',
    running: 'Running',
    connected: 'Connected',
    active: 'Active',
    degraded: 'Degraded',
    down: 'Down',
  }
  return map[status] ?? status
}

function eventTypeConfig(type: SystemEvent['type']) {
  switch (type) {
    case 'deployment': return { icon: Upload, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Deploy' }
    case 'restart': return { icon: RotateCcw, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Restart' }
    case 'error': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' }
    case 'warning': return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Warning' }
    case 'info': return { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Info' }
  }
}

function severityConfig(severity?: 'info' | 'warning' | 'error') {
  switch (severity) {
    case 'error': return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' }
    case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Warning' }
    default: return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Info' }
  }
}

function responseTimeColor(rt?: number): string {
  if (!rt) return 'text-emerald-400'
  if (rt > 200) return 'text-red-400'
  if (rt > 100) return 'text-amber-400'
  return 'text-emerald-400'
}

const AUTO_EVENT_MESSAGES = [
  { type: 'info' as const, service: 'Health Monitor', message: 'Health check passed — all services nominal' },
  { type: 'info' as const, service: 'Cache Service', message: 'Cache cleared — freed 128 MB' },
  { type: 'info' as const, service: 'Connection Pool', message: 'Connection pool optimized — 6 idle connections recycled' },
  { type: 'info' as const, service: 'Data Pipeline', message: 'Pipeline batch committed — 2,340 records' },
  { type: 'warning' as const, service: 'Gateway', message: 'MQTT QoS downgrade detected on 2 topics' },
  { type: 'info' as const, service: 'Auth Service', message: 'Token rotation completed for 12 sessions' },
  { type: 'warning' as const, service: 'Database', message: 'Query latency spike: avg 45ms → 120ms' },
  { type: 'info' as const, service: 'Notification Service', message: 'Alert queue drained — 0 pending' },
  { type: 'error' as const, service: 'WebSocket Server', message: 'Client handshake timeout — 1 connection dropped' },
  { type: 'info' as const, service: 'Scheduler', message: 'Cron job completed: telemetry aggregation in 340ms' },
  { type: 'info' as const, service: 'Gateway', message: 'TLS certificate check — valid for 287 days' },
]

// ─── Component ──────────────────────────────────────────────────────────
export function DiagnosticsPage() {
  const { isConnected } = useIIoTStore()
  const [apiData, setApiData] = useState(generateApiData)
  const [memoryData, setMemoryData] = useState(generateMemoryData)
  const [services, setServices] = useState(generateServices)
  const [events, setEvents] = useState<SystemEvent[]>(() =>
    generateEvents().map(e => ({
      ...e,
      severity: e.type === 'error' ? 'error' : e.type === 'warning' ? 'warning' : 'info',
    }))
  )
  const [resources, setResources] = useState<ResourceMetric[]>([
    { label: 'CPU', value: 34, unit: '%', max: 100, trend: 'stable', color: C_GREEN },
    { label: 'Memory', value: 68, unit: '%', max: 100, trend: 'up', color: C_CYAN },
    { label: 'Disk', value: 52, unit: '%', max: 100, trend: 'stable', color: C_ORANGE },
    { label: 'Network', value: 23, unit: 'Mbps', max: 100, trend: 'up', color: C_GREEN },
  ])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [lastRefreshText, setLastRefreshText] = useState('—')

  // ── Threshold State ──────────────────────────────────────────────
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    apiResponseTime: 200,
    memoryUsage: 85,
    wsLatency: 50,
  })
  const [pendingThresholds, setPendingThresholds] = useState<ThresholdConfig>({ ...thresholds })
  const [violations, setViolations] = useState<ThresholdViolation[]>([])
  const [serviceLastChecked, setServiceLastChecked] = useState(new Date())
  const eventIdRef = useRef(100)

  // Auto-refresh simulated data every 3-5 seconds
  const refreshData = useCallback(() => {
    setApiData((prev) => {
      const now = Date.now()
      const newPoint = {
        time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        responseTime: Math.max(10, 38 + (Math.random() - 0.5) * 30),
      }
      return [...prev.slice(1), newPoint]
    })
    setMemoryData((prev) => {
      const now = Date.now()
      const lastVal = prev[prev.length - 1].usage
      const newVal = Math.max(55, Math.min(82, lastVal + (Math.random() - 0.48) * 3))
      return [
        ...prev.slice(1),
        {
          time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          usage: Math.round(newVal * 10) / 10,
        },
      ]
    })
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        lastChecked: new Date(),
        responseTime: Math.round(5 + Math.random() * 40),
      }))
    )
    setServiceLastChecked(new Date())
    setResources((prev) =>
      prev.map((r) => {
        const delta = (Math.random() - 0.45) * 4
        const newVal = Math.max(5, Math.min(r.max * 0.95, r.value + delta))
        return {
          ...r,
          value: Math.round(newVal * 10) / 10,
          trend: delta > 1.5 ? 'up' : delta < -1.5 ? 'down' : 'stable',
        }
      })
    )
    setLastRefresh(new Date())
  }, [thresholds])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    refreshData()
    intervalRef.current = setInterval(refreshData, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refreshData])

  // Update "last refreshed" text
  useEffect(() => {
    function update() {
      setLastRefreshText(formatDistanceToNow(lastRefresh, { addSuffix: true }))
    }
    update()
    const interval = setInterval(update, 5000)
    return () => clearInterval(interval)
  }, [lastRefresh])

  // ── Computed KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const latest = apiData[apiData.length - 1]
    const avgResponse = apiData.reduce((s, d) => s + d.responseTime, 0) / apiData.length
    const latestMem = memoryData[memoryData.length - 1]
    return {
      uptime: '99.97%',
      apiResponseTime: Math.round(avgResponse),
      wsLatency: 12 + Math.round((Math.random() - 0.5) * 4),
      activeConnections: 24 + Math.round((Math.random() - 0.5) * 6),
      peakResponse: Math.round(Math.max(...apiData.map((d) => d.responseTime))),
      currentMemory: latestMem?.usage.toFixed(1) ?? '68.0',
    }
  }, [apiData, memoryData])

  // ── Threshold violation checking ────────────────────────────────────
  useEffect(() => {
    const newViolations: ThresholdViolation[] = []
    if (kpis.apiResponseTime > thresholds.apiResponseTime) {
      newViolations.push({
        id: 'v-api',
        metric: 'API Response Time',
        currentValue: kpis.apiResponseTime,
        threshold: thresholds.apiResponseTime,
        unit: 'ms',
        exceeded: kpis.apiResponseTime - thresholds.apiResponseTime,
      })
    }
    if (Number(kpis.currentMemory) > thresholds.memoryUsage) {
      newViolations.push({
        id: 'v-mem',
        metric: 'Memory Usage',
        currentValue: Number(kpis.currentMemory),
        threshold: thresholds.memoryUsage,
        unit: '%',
        exceeded: Math.round((Number(kpis.currentMemory) - thresholds.memoryUsage) * 10) / 10,
      })
    }
    if (kpis.wsLatency > thresholds.wsLatency) {
      newViolations.push({
        id: 'v-ws',
        metric: 'WebSocket Latency',
        currentValue: kpis.wsLatency,
        threshold: thresholds.wsLatency,
        unit: 'ms',
        exceeded: kpis.wsLatency - thresholds.wsLatency,
      })
    }
    setViolations(newViolations)
  }, [kpis, thresholds])

  // ── Apply thresholds ──────────────────────────────────────────────
  const applyThresholds = useCallback(() => {
    setThresholds({ ...pendingThresholds })
  }, [pendingThresholds])

  const clearViolation = useCallback((id: string) => {
    setViolations((prev) => prev.filter(v => v.id !== id))
  }, [])

  const clearAllViolations = useCallback(() => {
    setViolations([])
  }, [])

  // ── Auto-generate system events every 8-15 seconds ────────────────
  useEffect(() => {
    let msgIdx = 0
    function addEvent() {
      const template = AUTO_EVENT_MESSAGES[msgIdx % AUTO_EVENT_MESSAGES.length]
      msgIdx++
      const sev: 'info' | 'warning' | 'error' = template.type
      setEvents((prev) => {
        const newEvent: SystemEvent = {
          id: `auto-${eventIdRef.current++}`,
          timestamp: new Date(),
          type: template.type === 'error' ? 'error' : template.type === 'warning' ? 'warning' : 'info',
          service: template.service,
          message: template.message,
          severity: sev,
          isNew: true,
        }
        const updated = [newEvent, ...prev].slice(0, 20)
        // Remove isNew flag after animation
        setTimeout(() => {
          setEvents((curr) => curr.map(e => e.id === newEvent.id ? { ...e, isNew: false } : e))
        }, 400)
        return updated
      })
      const nextDelay = 8000 + Math.random() * 7000
      const timer = setTimeout(addEvent, nextDelay)
      return () => clearTimeout(timer)
    }
    const initialDelay = 8000 + Math.random() * 7000
    const timer = setTimeout(addEvent, initialDelay)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HeartPulse}
        title="System Diagnostics"
        description="Platform health, service status, and resource monitoring"
        lastUpdated={lastRefreshText}
        badge="Live"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={refreshData}
          >
            <RefreshCw className="size-3.5" />
            Refresh Now
          </Button>
        }
      />

      {/* ── System Health Overview (4 KPI cards) ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Activity}
          label="Platform Uptime"
          value={kpis.uptime}
          unit="(30d)"
          trend="up"
          trendValue="Stable"
          color={C_GREEN}
          index={0}
        />
        <KPICard
          icon={Zap}
          label="API Response Time"
          value={`${kpis.apiResponseTime}`}
          unit="ms avg"
          trend={kpis.peakResponse > 150 ? 'down' : 'up'}
          trendValue={kpis.peakResponse > 150 ? `Peak ${kpis.peakResponse}ms` : `Peak ${kpis.peakResponse}ms`}
          color={C_CYAN}
          index={1}
          isAlerting={kpis.apiResponseTime > thresholds.apiResponseTime}
        />
        <KPICard
          icon={Wifi}
          label="WebSocket Latency"
          value={`${kpis.wsLatency}`}
          unit="ms"
          trend="up"
          trendValue="Normal"
          color={C_GREEN}
          index={2}
          isAlerting={kpis.wsLatency > thresholds.wsLatency}
        />
        <KPICard
          icon={Network}
          label="Active Connections"
          value={`${kpis.activeConnections}`}
          unit="clients"
          trend={kpis.activeConnections > 26 ? 'up' : 'stable'}
          trendValue={isConnected ? 'WebSocket OK' : 'No WS Client'}
          color={isConnected ? C_GREEN : C_ORANGE}
          index={3}
        />
      </div>

      {/* ── State Architecture (3-Layer Design) ────────────────────── */}
      <div className="animate-slide-up stagger-1">
        <StateArchitectureDiagram />
      </div>

      {/* ── Threshold Configuration Panel ────────────────────────────── */}
      <Collapsible open={thresholdOpen} onOpenChange={setThresholdOpen}>
        <Card className="glass-card animate-slide-up stagger-1">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 pt-5 px-5 cursor-pointer hover:bg-muted/20 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Threshold Configuration</CardTitle>
                  {violations.length > 0 && (
                    <Badge className="text-[10px] border-0 bg-red-500/15 text-red-400 badge-sharp">
                      {violations.length} Active Alert{violations.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground/60">
                  <span className="text-[11px]">API: {thresholds.apiResponseTime}ms · Mem: {thresholds.memoryUsage}% · WS: {thresholds.wsLatency}ms</span>
                  {thresholdOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground/80">API Response Time (ms)</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    value={pendingThresholds.apiResponseTime}
                    onChange={(e) => setPendingThresholds(prev => ({ ...prev, apiResponseTime: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground/80">Memory Usage (%)</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    value={pendingThresholds.memoryUsage}
                    onChange={(e) => setPendingThresholds(prev => ({ ...prev, memoryUsage: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground/80">WebSocket Latency (ms)</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    value={pendingThresholds.wsLatency}
                    onChange={(e) => setPendingThresholds(prev => ({ ...prev, wsLatency: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={applyThresholds}>
                  <CheckCircle2 className="size-3.5" />
                  Apply
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Threshold Alerts ──────────────────────────────────────────── */}
      {violations.length > 0 && (
        <Card className="animate-slide-up threshold-alert-border">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-red-400" />
                <CardTitle className="text-sm font-semibold text-red-400">Threshold Alerts</CardTitle>
                <Badge className="text-[10px] border-0 bg-red-500/15 text-red-400 badge-sharp">
                  {violations.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground/60 hover:text-red-400 gap-1" onClick={clearAllViolations}>
                <Trash2 className="size-3" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground/90">{v.metric}</p>
                      <p className="text-[11px] text-muted-foreground/60">
                        Current: <span className="text-red-400 font-medium badge-sharp">{v.currentValue}{v.unit}</span> · Threshold: <span className="font-medium badge-sharp">{v.threshold}{v.unit}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-[10px] border-0 bg-red-500/15 text-red-400 badge-sharp">
                      +{v.exceeded}{v.unit}
                    </Badge>
                    <button onClick={() => clearViolation(v.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Real-time Performance Charts (2 side-by-side) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Response Time */}
        <Card className="chart-container-glass animate-slide-up stagger-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-cyan-400" />
                  API Response Time
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">Last 60 data points · p95 threshold at 200ms</CardDescription>
              </div>
              <Badge
                className={`text-[10px] border-0 ${
                  kpis.peakResponse > 200
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {kpis.peakResponse > 200 ? 'Threshold Breached' : 'Within Threshold'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={apiData}>
                  <defs>
                    <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_CYAN} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={C_CYAN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="time"
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={14}
                  />
                  <YAxis
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    width={40}
                    domain={[0, 250]}
                  />
                  <Tooltip content={<ChartTooltip valueSuffix=" ms" />} />
                  <ReferenceLine
                    y={200}
                    stroke={C_RED}
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                    label={{
                      value: 'p95 (200ms)',
                      position: 'insideTopRight',
                      fill: C_RED,
                      fontSize: 10,
                      opacity: 0.8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke={C_CYAN}
                    strokeWidth={2}
                    dot={false}
                    name="Response Time"
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="chart-container-glass animate-slide-up stagger-2">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="size-4 text-emerald-400" />
                  Memory Usage
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">Percentage over time · Target 60–80%</CardDescription>
              </div>
              <Badge
                className={`text-[10px] border-0 ${
                  Number(kpis.currentMemory) > 80
                    ? 'bg-amber-500/15 text-amber-400'
                    : Number(kpis.currentMemory) >= 60
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-cyan-500/15 text-cyan-400'
                }`}
              >
                {kpis.currentMemory}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryData}>
                  <defs>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C_GREEN} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="time"
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    interval={14}
                  />
                  <YAxis
                    tick={AXIS_TICK_SM}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                    width={35}
                    domain={[50, 90]}
                  />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} />
                  <ReferenceLine
                    y={60}
                    stroke={C_CYAN}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    label={{
                      value: '60%',
                      position: 'insideTopRight',
                      fill: C_CYAN,
                      fontSize: 9,
                      opacity: 0.7,
                    }}
                  />
                  <ReferenceLine
                    y={80}
                    stroke={C_ORANGE}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    label={{
                      value: '80%',
                      position: 'insideTopRight',
                      fill: C_ORANGE,
                      fontSize: 9,
                      opacity: 0.7,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="usage"
                    stroke={C_GREEN}
                    strokeWidth={2}
                    fill="url(#memGrad)"
                    name="Memory Usage"
                    animationDuration={300}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Service Status Grid ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Server className="size-4 text-muted-foreground" />
            Service Status
          </h2>
          <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            Last checked: {formatDistanceToNow(serviceLastChecked, { addSuffix: true })}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, idx) => {
            const Icon = service.icon
            const healthy = isHealthy(service.status)
            return (
              <Card
                key={service.name}
                className={`kpi-card-hover animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                          healthy
                            ? 'bg-emerald-500/10 ring-emerald-500/20'
                            : 'bg-red-500/10 ring-red-500/20'
                        }`}
                      >
                        <Icon
                          className={`size-5 ${healthy ? 'text-emerald-400' : 'text-red-400'}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground/90">
                          {service.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`size-2 rounded-full ${statusColor(service.status)} ${
                              healthy ? 'animate-pulse-dot' : ''
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              healthy ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {statusLabel(service.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] border-0 ${responseTimeColor(service.responseTime) === 'text-red-400'
                        ? 'bg-red-500/10 text-red-400'
                        : responseTimeColor(service.responseTime) === 'text-amber-400'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {service.responseTime}ms
                    </Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60">Uptime</span>
                      <span className="font-medium text-foreground/80 metric-value">
                        {service.uptime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60">Last Checked</span>
                      <span className="font-medium text-foreground/60">
                        {formatDistanceToNow(service.lastChecked, { addSuffix: true })}
                      </span>
                    </div>
                    {service.details && (
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5 leading-relaxed">
                        {service.details}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── System Resources ─────────────────────────────────────────── */}
      <Card className="animate-slide-up stagger-5">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" />
            System Resources
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time resource utilization with trend indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((res) => (
              <ResourceBar key={res.label} metric={res} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Events Log ───────────────────────────────────────── */}
      <Card className="animate-slide-up stagger-6">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CircleDot className="size-4 text-muted-foreground" />
                System Events
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Last {events.length} events — auto-updating with severity badges
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="text-[11px] text-muted-foreground/60">Live Feed</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                    Type
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                    Severity
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                    Service
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                    Event
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9 text-right">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const config = eventTypeConfig(event.type)
                  const EventIcon = config.icon
                  const sev = severityConfig(event.severity)
                  return (
                    <TableRow
                      key={event.id}
                      className={`border-border/20 hover:bg-muted/30 transition-colors ${event.isNew ? 'feed-item-enter' : ''}`}
                    >
                      <TableCell className="py-2.5">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${config.bg}`}>
                          <EventIcon className={`size-3 ${config.color}`} />
                          <span className={`text-[10px] font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={`text-[9px] border-0 font-semibold ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-xs font-medium text-foreground/80">
                          {event.service}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-xs text-muted-foreground/70 max-w-[400px] truncate block">
                          {event.message}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <span className="text-[11px] text-muted-foreground/50">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </span>
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
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color = C_GREEN,
  index = 0,
  isAlerting = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'neutral' | 'stable'
  trendValue: string
  color?: string
  index?: number
  isAlerting?: boolean
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 group kpi-card-hover animate-slide-up stagger-${Math.min(index + 1, 6)} ${isAlerting ? 'threshold-alert-border' : ''}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <CardContent className="flex items-start justify-between p-5">
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
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 metric-label">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground metric-value">
              {value}
              <span className="text-xs font-normal text-muted-foreground/60 ml-1.5">{unit}</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {(trend === 'up' || trend === 'stable') && (
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
              <span className="text-muted-foreground/60">{trendValue}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Resource Bar ────────────────────────────────────────────────────────
function ResourceBar({ metric }: { metric: ResourceMetric }) {
  const percentage = (metric.value / metric.max) * 100
  const isHigh = percentage > 80
  const isMedium = percentage > 60

  const barColor = isHigh
    ? 'bg-red-500'
    : isMedium
      ? 'bg-amber-500'
      : metric.color === C_GREEN
        ? 'bg-emerald-500'
        : metric.color === C_CYAN
          ? 'bg-cyan-500'
          : 'bg-orange-500'

  const iconMap: Record<string, React.ElementType> = {
    CPU: Cpu,
    Memory: Server,
    Disk: HardDrive,
    Network: Network,
  }
  const ResIcon = iconMap[metric.label] || Activity

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ResIcon className="size-4 text-muted-foreground/70" />
          <span className="text-xs font-semibold text-foreground/80">{metric.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {metric.trend === 'up' && <ArrowUpRight className="size-3 text-amber-400" />}
          {metric.trend === 'down' && <ArrowDownRight className="size-3 text-emerald-400" />}
          {metric.trend === 'stable' && <Minus className="size-3 text-muted-foreground/50" />}
          <span className={`text-sm font-bold metric-value ${isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-foreground'}`}>
            {Math.round(metric.value)}
            <span className="text-[10px] font-normal text-muted-foreground/60 ml-0.5">
              {metric.unit}
            </span>
          </span>
        </div>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
            boxShadow: isHigh
              ? '0 0 12px rgba(239,68,68,0.3)'
              : isMedium
                ? '0 0 8px rgba(245,158,11,0.2)'
                : `0 0 8px ${metric.color}33`,
          }}
        />
        {/* 60% and 80% markers */}
        {metric.label !== 'Network' && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px bg-cyan-500/30"
              style={{ left: '60%' }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-orange-500/30"
              style={{ left: '80%' }}
            />
          </>
        )}
      </div>
    </div>
  )
}
