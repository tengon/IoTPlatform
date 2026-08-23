'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Thermometer,
  RotateCw,
  Zap,
  Gauge,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Factory,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useIIoTStore, type MachineStatus } from '@/store/iiot'
import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Running' },
  idle: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Idle' },
  maintenance: { color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30', label: 'Maintenance' },
  error: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Error' },
}

function TrendArrow({ value, prev }: { value: number; prev: number | undefined }) {
  if (prev === undefined) return <Minus className="size-3 text-muted-foreground" />
  const diff = value - prev
  if (Math.abs(diff) < 0.5) return <Minus className="size-3 text-muted-foreground" />
  if (diff > 0) return <TrendingUp className="size-3 text-emerald-400" />
  return <TrendingDown className="size-3 text-red-400" />
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  prev,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  color: string
  prev?: number
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Icon className={`size-3.5 ${color}`} />
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold metric-value">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {prev !== undefined && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <TrendArrow value={typeof value === 'number' ? value : 0} prev={prev} />
          <span>from previous reading</span>
        </div>
      )}
    </div>
  )
}

function OEEBreakdown({ machine }: { machine: MachineStatus }) {
  const items = [
    { label: 'Availability', value: machine.availability, color: 'bg-cyan-500' },
    { label: 'Performance', value: machine.performance, color: 'bg-amber-500' },
    { label: 'Quality', value: machine.quality, color: 'bg-emerald-500' },
  ]
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold metric-value">{(item.value * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-700`}
              style={{ width: `${item.value * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface MachineDetailDialogProps {
  machine: MachineStatus | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MachineDetailDialog({ machine, open, onOpenChange }: MachineDetailDialogProps) {
  const liveTelemetry = useIIoTStore((s) => s.liveTelemetry)
  const alarms = useIIoTStore((s) => s.alarms)

  const machineAlarms = useMemo(
    () =>
      alarms
        .filter((a) => a.status === 'active' && a.source.toLowerCase().includes(machine?.name.toLowerCase() || ''))
        .slice(0, 5),
    [alarms, machine]
  )

  const tempHistory = useMemo(() => {
    if (!machine) return []
    return liveTelemetry[machine.id] || []
  }, [liveTelemetry, machine])

  if (!machine) return null

  const config = STATUS_CONFIG[machine.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/60">
        <div className="relative">
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Factory className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">{machine.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{machine.type}</p>
                </div>
              </div>
              <Badge variant="outline" className={`${config.bg} ${config.color} text-xs px-2.5 py-0.5`}>
                <span className={`mr-1.5 inline-block size-1.5 rounded-full ${
                  machine.status === 'running' ? 'bg-emerald-500 animate-pulse-dot' : machine.status === 'error' ? 'bg-red-500' : 'bg-current'
                }`} />
                {config.label}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Thermometer}
              label="Temperature"
              value={machine.temperature.toFixed(1)}
              unit="°C"
              color={machine.temperature > 80 ? 'text-red-400' : machine.temperature > 60 ? 'text-amber-400' : 'text-emerald-400'}
              prev={tempHistory.length >= 2 ? tempHistory[tempHistory.length - 2].value : undefined}
            />
            <MetricCard
              icon={RotateCw}
              label="RPM"
              value={machine.rpm.toFixed(0)}
              unit="rpm"
              color="text-cyan-400"
            />
            <MetricCard
              icon={Zap}
              label="Power"
              value={machine.power.toFixed(1)}
              unit="kW"
              color="text-amber-400"
            />
            <MetricCard
              icon={Cpu}
              label="OEE"
              value={(machine.oee * 100).toFixed(1)}
              unit="%"
              color={machine.oee > 85 ? 'text-emerald-400' : machine.oee > 70 ? 'text-amber-400' : 'text-red-400'}
            />
          </div>

          {/* OEE Breakdown */}
          <div className="rounded-xl border border-border/40 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="size-4 text-primary" />
                OEE Breakdown
              </div>
              <span className={`text-lg font-bold metric-value ${
                machine.oee > 85 ? 'text-emerald-400' : machine.oee > 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {(machine.oee * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2">
              <Progress value={machine.oee * 100} className="h-2.5" />
            </div>
            <div className="mt-3">
              <OEEBreakdown machine={machine} />
            </div>
          </div>

          {/* Temperature History Mini Chart */}
          {tempHistory.length > 1 && (
            <div className="rounded-xl border border-border/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Activity className="size-4 text-orange-400" />
                Temperature Trend
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  Last {tempHistory.length} readings
                </span>
              </div>
              <svg viewBox="0 0 400 80" className="w-full h-20">
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={machine.temperature > 80 ? '#ef4444' : machine.temperature > 60 ? '#f59e0b' : '#10b981'} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={machine.temperature > 80 ? '#ef4444' : machine.temperature > 60 ? '#f59e0b' : '#10b981'} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {(() => {
                  const data = tempHistory.slice(-30)
                  const min = Math.min(...data.map((d) => d.value))
                  const max = Math.max(...data.map((d) => d.value))
                  const range = max - min || 1
                  const stepX = 400 / (data.length - 1)
                  const line = data
                    .map((d, i) => {
                      const x = i * stepX
                      const y = 75 - ((d.value - min) / range) * 70
                      return `${x},${y}`
                    })
                    .join(' ')
                  const area = `${line} ${400},${75} 0,75`
                  return (
                    <g>
                      <polygon fill="url(#tempGrad)" points={area} />
                      <polyline
                        fill="none"
                        stroke={machine.temperature > 80 ? '#ef4444' : machine.temperature > 60 ? '#f59e0b' : '#10b981'}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        points={line}
                      />
                      <circle
                        cx={(data.length - 1) * stepX}
                        cy={75 - ((data[data.length - 1].value - min) / range) * 70}
                        r="3"
                        fill={machine.temperature > 80 ? '#ef4444' : machine.temperature > 60 ? '#f59e0b' : '#10b981'}
                      />
                    </g>
                  )
                })()}
              </svg>
            </div>
          )}

          {/* Recent Alarms */}
          {machineAlarms.length > 0 && (
            <div className="rounded-xl border border-border/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Clock className="size-4 text-red-400" />
                Recent Alarms
                <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                  {machineAlarms.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {machineAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-start gap-2.5 rounded-lg bg-muted/20 px-3 py-2"
                  >
                    <div
                      className={`mt-0.5 size-2 rounded-full shrink-0 ${
                        alarm.severity === 'critical' ? 'bg-red-500' : alarm.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium line-clamp-1">{alarm.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(alarm.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
