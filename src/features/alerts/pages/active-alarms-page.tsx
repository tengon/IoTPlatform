'use client'

import { useMemo, useState } from 'react'
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert, Radio, WifiOff, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import { exportCSV } from '@/shared/utils/export-csv'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'

function SeverityIcon({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const config = {
    critical: { color: 'bg-red-500', size: 'size-3' },
    warning: { color: 'bg-amber-500', size: 'size-2.5' },
    info: { color: 'bg-cyan-500', size: 'size-2.5' },
  }
  const c = config[severity]
  return (
    <span className="relative flex items-center justify-center">
      <span className={`${c.size} rounded-full ${c.color} absolute animate-ping opacity-40`} />
      <span className={`${c.size} rounded-full ${c.color} relative`} />
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    active: {
      className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20',
      label: 'Active',
    },
    acknowledged: {
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20',
      label: 'Acknowledged',
    },
    resolved: {
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20',
      label: 'Resolved',
    },
  }
  const v = variants[status] || variants.active
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
  )
}

function StatsCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <Card className={`${color}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/50 border border-border/50">
          <Icon className="size-4 text-foreground/80" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ActiveAlarmsPage() {
  const { alarms, acknowledgeAlarm, isConnected } = useIIoTStore()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const activeAlarms = useMemo(() => alarms.filter((a) => a.status !== 'resolved'), [alarms])

  const uniqueSources = useMemo(() => {
    const sources = new Set(alarms.map((a) => a.source))
    return Array.from(sources).sort()
  }, [alarms])

  const filteredAlarms = useMemo(() => {
    return activeAlarms.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
      return true
    })
  }, [activeAlarms, severityFilter, sourceFilter])

  const stats = useMemo(() => {
    return {
      total: activeAlarms.length,
      critical: activeAlarms.filter((a) => a.severity === 'critical').length,
      warning: activeAlarms.filter((a) => a.severity === 'warning').length,
      info: activeAlarms.filter((a) => a.severity === 'info').length,
    }
  }, [activeAlarms])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={Bell}
        title="Active Alarms"
        description={`${activeAlarms.length} active alarm${activeAlarms.length !== 1 ? 's' : ''} requiring attention`}
        badge={isConnected ? 'LIVE' : 'OFFLINE'}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              exportCSV({
                data: filteredAlarms.map((a) => ({
                  alarmId: a.alarmId,
                  source: a.source,
                  severity: a.severity,
                  message: a.message,
                  status: a.status,
                  createdAt: a.createdAt,
                })),
                filename: `alarms-${new Date().toISOString().slice(0, 10)}`,
              })
            }}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        }
      />

      {/* Connection indicator */}
      <div className="flex items-center gap-2 px-1">
        {isConnected ? (
          <>
            <Radio className="size-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </>
        ) : (
          <>
            <WifiOff className="size-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">Disconnected</span>
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Active" value={stats.total} color="border-slate-500/30" icon={Bell} />
        <StatsCard label="Critical" value={stats.critical} color="border-red-500/40" icon={ShieldAlert} />
        <StatsCard label="Warning" value={stats.warning} color="border-amber-500/40" icon={AlertTriangle} />
        <StatsCard label="Info" value={stats.info} color="border-cyan-500/30" icon={Info} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
          <SelectTrigger className="w-full sm:w-44 bg-background">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-background">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => {
            exportCSV({
              data: filteredAlarms.map((a) => ({
                alarmId: a.alarmId,
                source: a.source,
                severity: a.severity,
                message: a.message,
                status: a.status,
                createdAt: a.createdAt,
              })),
              filename: `alarms-${new Date().toISOString().slice(0, 10)}`,
            })
          }}
        >
          <Download className="size-3" />
          Export
        </Button>
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
          {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''} shown
        </div>
      </div>

      {/* Alarm table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-slate-400">Alarm ID</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Message</TableHead>
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="size-8 text-emerald-500" />
                        <p className="text-sm font-medium">No active alarms</p>
                        <p className="text-xs">All systems operating normally</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlarms.map((alarm) => (
                    <TableRow
                      key={alarm.id}
                      className={`
                        border-border/30
                        ${alarm.severity === 'critical' ? 'border-l-2 border-l-red-500 bg-red-500/[0.03]' : ''}
                        ${alarm.severity === 'warning' ? 'border-l-2 border-l-amber-500/60' : ''}
                        ${alarm.severity === 'info' ? 'border-l-2 border-l-cyan-500/40' : ''}
                      `}
                    >
                      <TableCell className="py-3">
                        <SeverityIcon severity={alarm.severity} />
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-foreground/80">
                        {alarm.alarmId}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-foreground/90">{alarm.source}</span>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs">
                        <span className={`text-sm ${alarm.severity === 'critical' ? 'text-red-300 font-medium' : 'text-foreground/80'}`}>
                          {alarm.message}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(alarm.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={alarm.status} />
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {alarm.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            onClick={() => acknowledgeAlarm(alarm.id)}
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {alarm.status === 'acknowledged' && (
                          <span className="text-xs text-amber-400/60 italic">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
