'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import {
  Thermometer,
  RotateCw,
  Zap,
  Gauge,
  Signal,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Maximize2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '@/shared/components/page-header'
import { useIIoTStore, type MachineStatus, type DeviceStatus } from '@/store/iiot'
import { MachineDetailDialog } from '@/shared/components/machine-detail-dialog'
import { HealthScoreRing } from '@/shared/components/health-score-ring'
import { formatDistanceToNow } from 'date-fns'

// ─── Status color maps ───────────────────────────────────────────────

const machineStatusColors: Record<MachineStatus['status'], string> = {
  running: 'bg-emerald-500',
  idle: 'bg-amber-500',
  maintenance: 'bg-slate-400',
  error: 'bg-red-500',
}

const machineStatusBorder: Record<MachineStatus['status'], string> = {
  running: 'border-emerald-500/30',
  idle: 'border-amber-500/20',
  maintenance: 'border-slate-500/20',
  error: 'border-red-500/30',
}

const machineStatusGlow: Record<MachineStatus['status'], string> = {
  running: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
  idle: '',
  maintenance: '',
  error: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
}

const machineStatusLabel: Record<MachineStatus['status'], string> = {
  running: 'Running',
  idle: 'Idle',
  maintenance: 'Maintenance',
  error: 'Error',
}

const machineStatusBadgeClass: Record<MachineStatus['status'], string> = {
  running: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  maintenance: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const deviceStatusColors: Record<DeviceStatus['status'], string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

const deviceStatusBadgeClass: Record<DeviceStatus['status'], string> = {
  online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  offline: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
}

// ─── Helper: OEE color ───────────────────────────────────────────────

function oeeColor(oee: number): string {
  if (oee > 85) return 'text-emerald-400'
  if (oee > 70) return 'text-amber-400'
  return 'text-red-400'
}

function oeeBarColor(oee: number): string {
  if (oee > 85) return 'bg-emerald-500'
  if (oee > 70) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── TinySparkline Component ─────────────────────────────────────────

function TinySparkline({ data, color, width = 60, height = 20 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 1

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)
  const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)

  const gradientId = `spark-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="inline-block ml-1.5 align-middle">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points.join(' ')} ${lastX},${height} ${padding},${height}`}
        fill={`url(#${gradientId})`}
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  )
}

// ─── Helper: Temperature bar color ───────────────────────────────────

function tempColor(temp: number): string {
  if (temp > 80) return 'bg-red-500'
  if (temp > 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function tempTextColor(temp: number): string {
  if (temp > 80) return 'text-red-400'
  if (temp > 60) return 'text-amber-400'
  return 'text-emerald-400'
}

// ─── Trend Arrow ─────────────────────────────────────────────────────

function TrendArrow({ value, prev }: { value: number; prev: number | undefined }) {
  if (prev === undefined) return <Minus className="size-3 text-muted-foreground" />
  const diff = value - prev
  if (Math.abs(diff) < 0.5) return <Minus className="size-3 text-muted-foreground" />
  if (diff > 0) return <TrendingUp className="size-3 text-emerald-400" />
  return <TrendingDown className="size-3 text-red-400" />
}

// ─── Mini Sparkline (enhanced with gradient) ─────────────────────────

function MiniChart({ data, color }: { data: { timestamp: number; value: number }[]; color: string }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-16 w-full flex items-center justify-center text-muted-foreground text-xs">
        No data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Machine Status Card (enhanced) ──────────────────────────────────

function MachineCard({ machine, telemetry, onSelect }: {
  machine: MachineStatus
  telemetry: { timestamp: number; value: number }[]
  onSelect: () => void
}) {
  const isRunning = machine.status === 'running'
  const tempPct = Math.min(100, Math.max(0, ((machine.temperature - 20) / 80) * 100))
  const prevTemp = telemetry.length >= 2 ? telemetry[telemetry.length - 2].value : undefined

  return (
    <Card
      className={`relative overflow-hidden border ${machineStatusBorder[machine.status]} ${machineStatusGlow[machine.status]} transition-all duration-300 hover:shadow-lg group cursor-pointer animate-slide-up`}
      onClick={onSelect}
    >
      {/* Running pulse bar */}
      {isRunning && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70 animate-pulse" />
      )}

      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`size-2.5 rounded-full shrink-0 ${machineStatusColors[machine.status]} ${isRunning ? 'animate-pulse-dot' : ''}`} />
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{machine.name}</CardTitle>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{machine.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HealthScoreRing score={machine.healthScore ?? 85} size={40} strokeWidth={3} />
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${machineStatusBadgeClass[machine.status]}`}>
              {machineStatusLabel[machine.status]}
            </Badge>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/50"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
            >
              <Maximize2 className="size-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3.5">
        {/* Temperature Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Thermometer className={`size-3 ${tempTextColor(machine.temperature)}`} />
              <span>Temperature</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-mono text-sm font-bold metric-value ${tempTextColor(machine.temperature)}`}>
                {machine.temperature.toFixed(1)}°C
              </span>
              <TinySparkline
                data={telemetry.map((p) => p.value).slice(-30)}
                color={machine.temperature > 80 ? '#ef4444' : machine.temperature > 60 ? '#f59e0b' : '#10b981'}
              />
              <TrendArrow value={machine.temperature} prev={prevTemp} />
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${tempColor(machine.temperature)}`}
              style={{ width: `${tempPct}%` }}
            />
          </div>
        </div>

        {/* RPM & Power row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RotateCw className="size-3 text-cyan-400" />
              <span>RPM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base font-mono font-bold metric-value">{machine.rpm.toFixed(0)}</span>
              <TrendArrow value={machine.rpm} prev={undefined} />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="size-3 text-amber-400" />
              <span>Power</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base font-mono font-bold metric-value">{machine.power.toFixed(1)}</span>
              <span className="text-[11px] text-muted-foreground">kW</span>
            </div>
          </div>
        </div>

        {/* OEE Solid Bar with Target Marker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className={`size-3 ${oeeColor(machine.oee)}`} />
              <span>OEE</span>
            </div>
            <span className={`text-base font-mono font-bold metric-value ${oeeColor(machine.oee)}`}>
              {machine.oee.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${oeeBarColor(machine.oee)}`}
              style={{ width: `${Math.min(100, machine.oee)}%` }}
            />
            {/* 85% Target marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/30"
              style={{ left: '85%' }}
              title="Target: 85%"
            />
          </div>
        </div>

        {/* Mini Temperature Chart */}
        <div className="rounded-lg bg-muted/15 p-1.5">
          <MiniChart
            data={telemetry}
            color={
              machine.temperature > 80
                ? '#ef4444'
                : machine.temperature > 60
                  ? '#f59e0b'
                  : '#10b981'
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Telemetry Flash Value (enhanced) ────────────────────────────────

function TelemetryValue({ label, value, unit, tick, index }: { label: string; value: number; unit?: string; tick: number; index: number }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors duration-300 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
      <span className="text-xs text-muted-foreground truncate mr-2">{label}</span>
      <span
        key={`${tick}-${value}`}
        className="text-sm font-mono font-bold metric-value shrink-0 animate-[telemetryFlash_600ms_ease-out]"
      >
        {value.toFixed(2)}
        {unit && <span className="text-[11px] text-muted-foreground ml-1 font-normal">{unit}</span>}
      </span>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export function LiveMonitoringPage() {
  const isConnected = useIIoTStore((s) => s.isConnected)
  const lastUpdate = useIIoTStore((s) => s.lastUpdate)
  const machines = useIIoTStore((s) => s.machines)
  const devices = useIIoTStore((s) => s.devices)
  const liveTelemetry = useIIoTStore((s) => s.liveTelemetry)

  // Force re-render every 2 seconds to pick up store changes
  const [tick, setTick] = useState(0)
  const [lastUpdatedText, setLastUpdatedText] = useState('—')
  const [selectedMachine, setSelectedMachine] = useState<MachineStatus | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setTick((k) => k + 1), 2000)
    return () => clearInterval(interval)
  }, [])

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

  // Flatten all live telemetry into a displayable list
  const flatTelemetry = useMemo(() => {
    const entries: { key: string; label: string; value: number; unit?: string }[] = []
    // Device-level telemetry from WebSocket (temperature data)
    Object.entries(liveTelemetry).forEach(([id, points]) => {
      if (points.length > 0) {
        const latest = points[points.length - 1]
        const machine = machines.find((m) => m.id === id)
        const device = devices.find((d) => d.id === id)
        const label = machine?.name || device?.name || id
        entries.push({
          key: `${id}-temp`,
          label: `${label} (Temp)`,
          value: latest.value,
          unit: '°C',
        })
      }
    })
    // Machine-level metrics from store
    machines.forEach((m) => {
      entries.push(
        { key: `${m.id}-rpm`, label: `${m.name} (RPM)`, value: m.rpm, unit: 'rpm' },
        { key: `${m.id}-power`, label: `${m.name} (Power)`, value: m.power, unit: 'kW' },
        { key: `${m.id}-oee`, label: `${m.name} (OEE)`, value: m.oee, unit: '%' },
      )
    })
    return entries
  }, [liveTelemetry, machines, devices])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Live Monitoring"
        description="Real-time machine and device telemetry"
        lastUpdated={lastUpdatedText}
        badge={isConnected ? 'STREAMING' : 'OFFLINE'}
      />

      {/* Connection Status Bar */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-300 animate-fade-in ${
        isConnected
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-red-500/20 bg-red-500/5'
      }`}>
        {isConnected ? (
          <Wifi className="size-4 text-emerald-400" />
        ) : (
          <WifiOff className="size-4 text-red-400" />
        )}
        <div className={`size-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">
          {isConnected ? 'Connected to IIoT Gateway' : 'Disconnected — Reconnecting...'}
        </span>
        {isConnected ? (
          <span className="ml-auto text-xs text-muted-foreground/60 flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
            Streaming live data
          </span>
        ) : (
          <AlertTriangle className="ml-auto size-4 text-amber-400" />
        )}
      </div>

      {/* Main content: Machines + Telemetry panel on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left side: Machine Cards + Device Table */}
        <div className="space-y-6">
          {/* Machine Status Cards */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Activity className="size-4 text-emerald-400" />
              <h2 className="text-base font-semibold">Machine Status</h2>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {machines.length} machines
              </Badge>
            </div>
            {machines.length === 0 ? (
              <Card className="py-12 flex flex-col items-center justify-center gap-2">
                <Activity className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No machines connected</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {machines.map((machine, i) => (
                  <div key={machine.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                    <MachineCard
                      machine={machine}
                      telemetry={liveTelemetry[machine.id] || []}
                      onSelect={() => {
                        setSelectedMachine(machine)
                        setDetailOpen(true)
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Device Telemetry Table */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Signal className="size-4 text-emerald-400" />
              <h2 className="text-base font-semibold">Device Telemetry</h2>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {devices.length} devices
              </Badge>
            </div>
            {devices.length === 0 ? (
              <Card className="py-12 flex flex-col items-center justify-center gap-2">
                <Signal className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No devices detected</p>
              </Card>
            ) : (
              <Card className="py-0 gap-0 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/30">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Device</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Type</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last Metrics</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">Signal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => {
                        const metricEntries = Object.entries(device.metrics)
                        return (
                          <TableRow key={device.id} className="border-border/20 transition-colors hover:bg-muted/20">
                            <TableCell className="font-medium text-sm py-3">{device.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground py-3">{device.type}</TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${deviceStatusColors[device.status]}`} />
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 capitalize ${deviceStatusBadgeClass[device.status]}`}
                                >
                                  {device.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {metricEntries.length > 0 ? (
                                  metricEntries.map(([key, val]) => (
                                    <span key={key} className="text-xs font-mono text-muted-foreground">
                                      <span className="text-foreground/50 text-[11px]">{key}:</span>{' '}
                                      <span className="font-medium text-foreground/80">{typeof val === 'number' ? val.toFixed(1) : val}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <Signal className={`size-3.5 ${
                                  device.status === 'online'
                                    ? 'text-emerald-400'
                                    : device.status === 'warning'
                                      ? 'text-amber-400'
                                      : 'text-muted-foreground'
                                }`} />
                                <span className={`text-xs font-medium ${
                                  device.status === 'online'
                                    ? 'text-emerald-400'
                                    : device.status === 'warning'
                                      ? 'text-amber-400'
                                      : 'text-muted-foreground'
                                }`}>
                                  {device.status === 'online' ? 'Strong' : device.status === 'warning' ? 'Weak' : '—'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </section>
        </div>

        {/* Real-time Telemetry Panel (right side, desktop only) */}
        <aside className="hidden xl:block animate-slide-right">
          <div className="sticky top-[72px] space-y-3">
            <div className="flex items-center gap-2.5">
              <Activity className="size-4 text-emerald-400" />
              <h2 className="text-base font-semibold">Live Telemetry</h2>
              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Live</span>
              </div>
            </div>
            <Card className="py-0 gap-0 overflow-hidden">
              <ScrollArea className="max-h-[calc(100vh-220px)]">
                <div className="p-1.5 space-y-0">
                  {flatTelemetry.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Activity className="size-6 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">Waiting for telemetry data...</p>
                    </div>
                  ) : (
                    flatTelemetry.map((entry, index) => (
                      <TelemetryValue
                        key={entry.key}
                        label={entry.label}
                        value={entry.value}
                        unit={entry.unit}
                        tick={tick}
                        index={index}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </aside>
      </div>

      {/* Machine Detail Dialog */}
      <MachineDetailDialog
        machine={selectedMachine}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
