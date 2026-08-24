'use client'

import { useRealtimeStore } from '@/store/realtime-store'
import { useUIStore } from '@/store/ui-store'
import { useIIoTStore } from '@/store/iiot'
import {
  Server,
  Radio,
  Monitor,
  Database,
  Wifi,
  Settings2,
  Clock,
  Zap,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── State Architecture Diagram ──────────────────────────────────────────
// Visualizes the 3-layer state management architecture:
//   Server State (REST + TanStack Query)
//   Real-time State (WebSocket + Zustand)
//   UI State (Zustand + localStorage)

export function StateArchitectureDiagram() {
  const rt = useRealtimeStore()
  const ui = useUIStore()
  const legacy = useIIoTStore()

  const rtMachineCount = rt.machines.length
  const rtAlarmCount = rt.alarms.length
  const rtDeviceCount = rt.devices.length
  const rtTelemetryKeys = Object.keys(rt.telemetry).length
  const rtEventLogCount = rt.eventLog.length

  return (
    <Card className="glass-card border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Layers className="size-4 text-emerald-400" />
          Frontend State Architecture
          <span className="ml-auto text-[10px] font-normal text-muted-foreground/60 tracking-wide uppercase">
            v3.0 — 3-Layer Design
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Architecture Diagram ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SERVER STATE */}
          <div className="state-arch-layer state-arch-server">
            <div className="flex items-center gap-2 mb-3">
              <div className="state-arch-icon state-arch-icon-server">
                <Server className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Server State</p>
                <p className="text-[10px] text-muted-foreground">REST API + TanStack Query</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Machines', endpoint: '/api/machines', stale: '5 min' },
                { label: 'Devices', endpoint: '/api/devices', stale: '5 min' },
                { label: 'Alarms', endpoint: '/api/alarms', stale: '30 sec' },
                { label: 'Production', endpoint: '/api/production', stale: '1 min' },
                { label: 'Energy', endpoint: '/api/energy', stale: '2 min' },
                { label: 'Telemetry', endpoint: '/api/telemetry', stale: '2 min' },
                { label: 'Sites', endpoint: '/api/sites', stale: '30 min' },
              ].map((item) => (
                <div key={item.label} className="state-arch-row">
                  <span className="text-[11px] text-foreground/80 flex-1 truncate">{item.label}</span>
                  <span className="text-[9px] text-muted-foreground/60 font-mono">{item.stale}</span>
                </div>
              ))}
            </div>
          </div>

          {/* REAL-TIME STATE */}
          <div className="state-arch-layer state-arch-realtime">
            <div className="flex items-center gap-2 mb-3">
              <div className="state-arch-icon state-arch-icon-realtime">
                <Wifi className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Real-time State</p>
                <p className="text-[10px] text-muted-foreground">WebSocket + Zustand</p>
              </div>
              <Badge
                variant="outline"
                className={`ml-auto text-[9px] h-5 px-1.5 ${
                  rt.isConnected
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-red-500/40 text-red-400 bg-red-500/10'
                }`}
              >
                {rt.isConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <StateRow label="Machines" value={rtMachineCount} color="emerald" />
              <StateRow label="Devices" value={rtDeviceCount} color="emerald" />
              <StateRow label="Active Alarms" value={rtAlarmCount} color={rtAlarmCount > 3 ? 'red' : 'emerald'} />
              <StateRow label="Production" value={rt.production.length} color="emerald" />
              <StateRow label="Telemetry Keys" value={rtTelemetryKeys} color="emerald" />
              <StateRow label="Energy Points" value={rt.energyHistory.length} color="emerald" />
              <StateRow label="Event Log" value={rtEventLogCount} color="cyan" />
              <StateRow label="Reconnects" value={rt.reconnectCount} color={rt.reconnectCount > 2 ? 'amber' : 'emerald'} />
            </div>
            {rt.lastHeartbeat && (
              <p className="text-[9px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                <Activity className="size-2.5" />
                Last heartbeat: {new Date(rt.lastHeartbeat).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* UI STATE */}
          <div className="state-arch-layer state-arch-ui">
            <div className="flex items-center gap-2 mb-3">
              <div className="state-arch-icon state-arch-icon-ui">
                <Settings2 className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">UI State</p>
                <p className="text-[10px] text-muted-foreground">Zustand + localStorage</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <StateRow
                label="Factory"
                value={ui.factory.siteName || 'All Sites'}
                isText
                color="amber"
              />
              <StateRow
                label="Time Range"
                value={ui.timeRange.label}
                isText
                color="amber"
              />
              <StateRow
                label="Chart Grid"
                value={ui.chartConfig.showGrid ? 'On' : 'Off'}
                isText
                color="amber"
              />
              <StateRow
                label="Smooth Lines"
                value={ui.chartConfig.smoothLines ? 'On' : 'Off'}
                isText
                color="amber"
              />
              <StateRow
                label="Line Width"
                value={`${ui.chartConfig.lineWidth}px`}
                isText
                color="amber"
              />
              <StateRow
                label="Auto-Refresh"
                value={ui.autoRefreshEnabled ? `${ui.autoRefreshInterval}s` : 'Off'}
                isText
                color="amber"
              />
              <StateRow
                label="Table Page Size"
                value={ui.tablePageSize}
                color="amber"
              />
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-2 flex items-center gap-1">
              <Database className="size-2.5" />
              Persisted to localStorage
            </p>
          </div>
        </div>

        {/* ── Data Flow Diagram ── */}
        <div className="mt-4 p-3 rounded-lg border border-border/30 bg-background/40">
          <p className="section-title-accent text-[10px] mb-3">Data Flow</p>
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px]">
            <FlowNode icon={Server} label="REST API" color="cyan" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Database} label="Server Cache" color="cyan" sublabel="TanStack Query" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Monitor} label="UI Components" color="emerald" />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] mt-2">
            <FlowNode icon={Radio} label="WebSocket" color="emerald" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Zap} label="Real-time Store" color="emerald" sublabel="Zustand" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Monitor} label="UI Components" color="emerald" />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] mt-2">
            <FlowNode icon={Settings2} label="User Actions" color="amber" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Settings2} label="UI Store" color="amber" sublabel="Zustand + persist" />
            <ArrowDown className="size-3 text-muted-foreground/40 rotate-[-90deg]" />
            <FlowNode icon={Monitor} label="UI Components" color="emerald" />
          </div>
        </div>

        {/* ── Legacy Compatibility Note ── */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] text-muted-foreground/70 space-y-1">
            <p className="font-medium text-amber-300/80">Migration in Progress</p>
            <p>
              Legacy <code className="text-[9px] px-1 py-0.5 rounded bg-muted/50 font-mono">useIIoTStore</code> is still active
              and receives all WebSocket data. New code should use <code className="text-[9px] px-1 py-0.5 rounded bg-muted/50 font-mono">useRealtimeStore</code> for
              real-time data and <code className="text-[9px] px-1 py-0.5 rounded bg-muted/50 font-mono">use*Query</code> hooks for server data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StateRow({
  label,
  value,
  isText,
  color,
}: {
  label: string
  value: number | string
  isText?: boolean
  color: 'emerald' | 'cyan' | 'amber' | 'red'
}) {
  const colorMap = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  }
  return (
    <div className="state-arch-row">
      <span className="text-[11px] text-foreground/80 flex-1 truncate">{label}</span>
      <span className={`text-[11px] font-mono font-medium ${colorMap[color]}`}>
        {isText ? value : (value as number).toLocaleString()}
      </span>
    </div>
  )
}

function FlowNode({
  icon: Icon,
  label,
  color,
  sublabel,
}: {
  icon: React.ElementType
  label: string
  color: 'emerald' | 'cyan' | 'amber'
  sublabel?: string
}) {
  const colorMap = {
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    cyan: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  }
  return (
    <div className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md border ${colorMap[color]}`}>
      <Icon className="size-3" />
      <span className="font-medium">{label}</span>
      {sublabel && <span className="text-muted-foreground/60">{sublabel}</span>}
    </div>
  )
}