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
  running: 'shadow-[0_0_15px_rgba(16,185,129,0.12)]',
  idle: '',
  maintenance: '',
  error: 'shadow-[0_0_15px_rgba(239,68,68,0.12)]',
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

// ─── Mini Sparkline (no axes, transparent) ───────────────────────────

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
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Machine Status Card ─────────────────────────────────────────────

function MachineCard({ machine, telemetry }: {
  machine: MachineStatus
  telemetry: { timestamp: number; value: number }[]
}) {
  const isRunning = machine.status === 'running'
  const tempPct = Math.min(100, Math.max(0, ((machine.temperature - 20) / 80) * 100))
  const prevTemp = telemetry.length >= 2 ? telemetry[telemetry.length - 2].value : undefined

  return (
    <Card
      className={`relative overflow-hidden border ${machineStatusBorder[machine.status]} ${machineStatusGlow[machine.status]} py-0 gap-0 transition-all duration-500`}
    >
      {/* Running pulse ring */}
      {isRunning && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 animate-pulse" />
      )}

      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`size-2.5 rounded-full shrink-0 ${machineStatusColors[machine.status]} ${isRunning ? 'animate-pulse-dot' : ''}`} />
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{machine.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{machine.type}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${machineStatusBadgeClass[machine.status]}`}>
            {machineStatusLabel[machine.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Temperature Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Thermometer className="size-3" />
              <span>Temperature</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-mono font-medium ${tempTextColor(machine.temperature)}`}>
                {machine.temperature.toFixed(1)}°C
              </span>
              <TrendArrow value={machine.temperature} prev={prevTemp} />
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
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
              <RotateCw className="size-3" />
              <span>RPM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono font-medium">{machine.rpm.toFixed(0)}</span>
              <TrendArrow value={machine.rpm} prev={undefined} />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="size-3" />
              <span>Power</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono font-medium">{machine.power.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">kW</span>
              <TrendArrow value={machine.power} prev={undefined} />
            </div>
          </div>
        </div>

        {/* OEE Segmented Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className="size-3" />
              <span>OEE</span>
            </div>
            <span className={`text-sm font-mono font-semibold ${oeeColor(machine.oee)}`}>
              {machine.oee.toFixed(1)}%
            </span>
          </div>
          <div className="flex gap-0.5">
            {[100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5].map((mark) => (
              <div
                key={mark}
                className={`h-1.5 flex-1 rounded-full ${
                  machine.oee >= mark
                    ? oeeBarColor(machine.oee)
                    : 'bg-muted/30'
                } transition-colors duration-500`}
              />
            ))}
          </div>
        </div>

        {/* Mini Temperature Chart */}
        <div className="rounded-md bg-muted/20 p-1">
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

// ─── Telemetry Flash Value ───────────────────────────────────────────

function TelemetryValue({ label, value, unit, tick }: { label: string; value: number; unit?: string; tick: number }) {
  // Use tick as a dependency to detect changes via key-based remount on the value span
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md transition-colors duration-300 hover:bg-muted/30">
      <span className="text-xs text-muted-foreground truncate mr-2">{label}</span>
      <span
        key={`${tick}-${value}`}
        className="text-sm font-mono font-medium shrink-0 animate-[telemetryFlash_600ms_ease-out]"
      >
        {value.toFixed(2)}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export function LiveMonitoringPage() {
  const isConnected = useIIoTStore((s) => s.isConnected)
  const machines = useIIoTStore((s) => s.machines)
  const devices = useIIoTStore((s) => s.devices)
  const liveTelemetry = useIIoTStore((s) => s.liveTelemetry)

  // Force re-render every 2 seconds to pick up store changes
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((k) => k + 1), 2000)
    return () => clearInterval(interval)
  }, [])

  // Flatten all live telemetry into a displayable list
  const flatTelemetry = useMemo(() => {
    const entries: { key: string; label: string; value: number; unit?: string }[] = []
    Object.entries(liveTelemetry).forEach(([id, points]) => {
      if (points.length > 0) {
        const latest = points[points.length - 1]
        const machine = machines.find((m) => m.id === id)
        const device = devices.find((d) => d.id === id)
        const label = machine?.name || device?.name || id
        entries.push({
          key: `${id}-temp`,
          label: `${label} (temp)`,
          value: latest.value,
          unit: '°C',
        })
      }
    })
    // Also add current machine metrics
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
      {/* 1. Page Header */}
      <PageHeader
        icon={Activity}
        title="Live Monitoring"
        description="Real-time machine and device telemetry"
      />

      {/* 2. Connection Status Bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-card">
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
          <span className="ml-auto text-xs text-muted-foreground">Streaming live data</span>
        ) : (
          <AlertTriangle className="ml-auto size-4 text-amber-400" />
        )}
      </div>

      {/* Main content: Machines + Telemetry panel on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left side: Machine Cards + Device Table */}
        <div className="space-y-6">
          {/* 3. Machine Status Cards */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="size-4 text-emerald-400" />
              <h2 className="text-lg font-semibold">Machine Status</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
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
                {machines.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    telemetry={liveTelemetry[machine.id] || []}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 4. Device Telemetry Table */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Signal className="size-4 text-emerald-400" />
              <h2 className="text-lg font-semibold">Device Telemetry</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
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
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Device Name</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Last Metric Values</TableHead>
                        <TableHead className="text-xs text-right">Signal / Health</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => {
                        const metricEntries = Object.entries(device.metrics)
                        return (
                          <TableRow key={device.id}>
                            <TableCell className="font-medium text-sm">{device.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{device.type}</TableCell>
                            <TableCell>
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
                            <TableCell>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {metricEntries.length > 0 ? (
                                  metricEntries.map(([key, val]) => (
                                    <span key={key} className="text-xs font-mono text-muted-foreground">
                                      <span className="text-foreground/70">{key}:</span>{' '}
                                      {typeof val === 'number' ? val.toFixed(1) : val}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
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

        {/* 5. Real-time Telemetry Panel (right side, desktop only) */}
        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-400" />
              <h2 className="text-lg font-semibold">Live Telemetry</h2>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
              </div>
            </div>
            <Card className="py-0 gap-0 overflow-hidden">
              <ScrollArea className="max-h-[calc(100vh-220px)]">
                <div className="p-2 space-y-0.5">
                  {flatTelemetry.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Activity className="size-6 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">Waiting for telemetry data...</p>
                    </div>
                  ) : (
                    flatTelemetry.map((entry) => (
                      <TelemetryValue
                        key={entry.key}
                        label={entry.label}
                        value={entry.value}
                        unit={entry.unit}
                        tick={tick}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}
