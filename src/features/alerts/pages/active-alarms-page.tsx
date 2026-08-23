'use client'

import { Fragment, useCallback, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Radio,
  WifiOff,
  Download,
  ChevronDown,
  ChevronRight,
  Monitor,
  Lightbulb,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import { exportCSV } from '@/shared/utils/export-csv'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

const PAGE_SIZE = 10

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

function getSeverityBorder(severity: string) {
  switch (severity) {
    case 'critical': return 'border-l-red-500'
    case 'warning': return 'border-l-amber-500'
    case 'info': return 'border-l-cyan-500'
    default: return 'border-l-border'
  }
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500/[0.03]'
    case 'warning': return ''
    case 'info': return ''
    default: return ''
  }
}

function getSuggestedAction(severity: string): { icon: React.ElementType; text: string } {
  switch (severity) {
    case 'critical':
      return { icon: ShieldAlert, text: 'Investigate sensor readings immediately. Check for equipment malfunction or safety threshold breach.' }
    case 'warning':
      return { icon: AlertTriangle, text: 'Monitor trends closely. Review recent changes in operating conditions and consider preventive maintenance.' }
    case 'info':
    default:
      return { icon: Lightbulb, text: 'Review notification settings. This alert may indicate a configuration update or routine status change.' }
  }
}

function StatsCard({ label, value, color, icon: Icon, severityClass }: { label: string; value: number; color: string; icon: React.ElementType; severityClass?: string }) {
  return (
    <Card className={`kpi-card-hover border-border/40 transition-all duration-300 ${color} ${severityClass || ''}`}>
      <CardContent className="flex items-center gap-3 pt-5 px-5 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/50 border border-border/50">
          <Icon className="size-4 text-foreground/80" />
        </div>
        <div>
          <p className="text-2xl font-bold metric-value leading-none number-transition">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ActiveAlarmsPage() {
  const { alarms, acknowledgeAlarm, bulkAcknowledgeAlarms, isConnected } = useIIoTStore()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAlarms.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedAlarms = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredAlarms.slice(start, start + PAGE_SIZE)
  }, [filteredAlarms, safePage])

  const pageStart = filteredAlarms.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(safePage * PAGE_SIZE, filteredAlarms.length)

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    const allSelected = paginatedAlarms.every((a) => selectedIds.has(a.id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const a of paginatedAlarms) next.delete(a.id)
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const a of paginatedAlarms) next.add(a.id)
        return next
      })
    }
  }, [paginatedAlarms, selectedIds])

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isAllPageSelected = paginatedAlarms.length > 0 && paginatedAlarms.every((a) => selectedIds.has(a.id))

  const handleBulkAcknowledge = useCallback(() => {
    if (selectedIds.size === 0) return
    bulkAcknowledgeAlarms(Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, bulkAcknowledgeAlarms])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Reset page when filters change
  const handleSeverityFilter = useCallback((v: string) => {
    setSeverityFilter(v as SeverityFilter)
    setCurrentPage(1)
  }, [])

  const handleSourceFilter = useCallback((v: string) => {
    setSourceFilter(v)
    setCurrentPage(1)
  }, [])

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
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
        <StatsCard label="Total Active" value={stats.total} color="" icon={Bell} />
        <StatsCard label="Critical" value={stats.critical} color="" icon={ShieldAlert} severityClass="severity-card-critical" />
        <StatsCard label="Warning" value={stats.warning} color="" icon={AlertTriangle} severityClass="severity-card-warning" />
        <StatsCard label="Info" value={stats.info} color="" icon={Info} severityClass="severity-card-info" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={severityFilter} onValueChange={handleSeverityFilter}>
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
        <Select value={sourceFilter} onValueChange={handleSourceFilter}>
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
          {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.size} alarm{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleBulkAcknowledge}
          >
            <CheckCircle2 className="size-3.5" />
            Acknowledge Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Alarm table */}
      <Card className="border-border/60 flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
        <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all alarms"
                    />
                  </TableHead>
                  <TableHead className="w-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3"></TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Alarm ID</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Source</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Message</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Time</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="size-8 text-emerald-500" />
                        <p className="text-sm font-medium">No active alarms</p>
                        <p className="text-xs">All systems operating normally</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAlarms.map((alarm) => {
                    const isExpanded = expandedIds.has(alarm.id)
                    const suggested = getSuggestedAction(alarm.severity)
                    const severityBorder = getSeverityBorder(alarm.severity)
                    const severityBg = getSeverityBg(alarm.severity)

                    return (
                      <Fragment key={alarm.id}>
                        <TableRow
                          className={`
                            border-border/30 hover:bg-muted/20 transition-all duration-150 py-3
                            border-l-2 ${severityBorder} ${severityBg}
                            table-row-severity
                            ${selectedIds.has(alarm.id) ? 'bg-primary/5' : ''}
                          `}
                        >
                          <TableCell className="py-3">
                            <Checkbox
                              checked={selectedIds.has(alarm.id)}
                              onCheckedChange={() => toggleSelectOne(alarm.id)}
                              aria-label={`Select alarm ${alarm.alarmId}`}
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <button
                              className="p-0.5 rounded hover:bg-muted/40 transition-colors"
                              onClick={() => toggleExpand(alarm.id)}
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              {isExpanded
                                ? <ChevronDown className="size-3.5 text-muted-foreground" />
                                : <ChevronRight className="size-3.5 text-muted-foreground" />
                              }
                            </button>
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
                        {isExpanded && (
                          <TableRow className="border-border/20">
                            <TableCell colSpan={8} className="p-0">
                              <div className={`bg-muted/10 border-l-2 ${severityBorder} px-6 py-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                  {/* Full message */}
                                  <div className="md:col-span-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Message</span>
                                    <p className={`mt-1 ${alarm.severity === 'critical' ? 'text-red-300 font-medium' : 'text-foreground/90'}`}>
                                      {alarm.message}
                                    </p>
                                  </div>

                                  {/* Alarm ID */}
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Alarm ID</span>
                                    <p className="mt-1 font-mono text-xs text-foreground/70 bg-background/50 rounded px-2 py-1 inline-block">
                                      {alarm.alarmId}
                                    </p>
                                  </div>

                                  {/* Source device */}
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Source Device</span>
                                    <p className="mt-1 flex items-center gap-1.5 text-foreground/90">
                                      <Monitor className="size-3.5 text-muted-foreground" />
                                      {alarm.source}
                                    </p>
                                  </div>

                                  {/* Severity */}
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Severity</span>
                                    <p className="mt-1 flex items-center gap-2">
                                      <SeverityIcon severity={alarm.severity} />
                                      <span className={`capitalize font-medium ${
                                        alarm.severity === 'critical' ? 'text-red-400' :
                                        alarm.severity === 'warning' ? 'text-amber-400' :
                                        'text-cyan-400'
                                      }`}>
                                        {alarm.severity}
                                      </span>
                                    </p>
                                  </div>

                                  {/* Created at */}
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Created At</span>
                                    <p className="mt-1 text-foreground/80">
                                      {format(new Date(alarm.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                                    </p>
                                  </div>

                                  {/* Suggested action */}
                                  <div className="md:col-span-2 mt-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Suggested Action</span>
                                    <p className="mt-1 flex items-start gap-2 text-foreground/80">
                                      <suggested.icon className="size-4 mt-0.5 shrink-0 text-amber-400" />
                                      {suggested.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </div>
          {filteredAlarms.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                Showing {pageStart}–{pageEnd} of {filteredAlarms.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 text-xs ${
                      page === safePage
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
      </Card>
    </div>
  )
}
