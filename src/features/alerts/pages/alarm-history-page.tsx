'use client'

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  CalendarIcon,
  Download,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react'
import { format, subDays, subHours, subMinutes } from 'date-fns'
import { useIIoTStore, type AlarmItem } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'
type StatusFilter = 'all' | 'active' | 'acknowledged' | 'resolved'

interface HistoricalAlarm extends AlarmItem {
  resolvedAt?: string
}

const MOCK_HISTORY: HistoricalAlarm[] = [
  { id: 'h1', alarmId: 'ALM-2024-001', severity: 'critical', source: 'CNC Machine A1', message: 'Spindle temperature exceeded 95°C threshold', status: 'resolved', createdAt: subDays(new Date(), 6).toISOString(), resolvedAt: subDays(new Date(), 6, 12).toISOString() },
  { id: 'h2', alarmId: 'ALM-2024-002', severity: 'warning', source: 'Conveyor Belt B3', message: 'Motor vibration levels above normal range', status: 'resolved', createdAt: subDays(new Date(), 5).toISOString(), resolvedAt: subDays(new Date(), 5, 8).toISOString() },
  { id: 'h3', alarmId: 'ALM-2024-003', severity: 'info', source: 'SCADA Gateway', message: 'Network latency spike detected on Modbus TCP', status: 'resolved', createdAt: subDays(new Date(), 5).toISOString(), resolvedAt: subDays(new Date(), 5, 1).toISOString() },
  { id: 'h4', alarmId: 'ALM-2024-004', severity: 'critical', source: 'Hydraulic Press C2', message: 'Pressure relief valve activated - overpressure condition', status: 'resolved', createdAt: subDays(new Date(), 4).toISOString(), resolvedAt: subDays(new Date(), 4, 6).toISOString() },
  { id: 'h5', alarmId: 'ALM-2024-005', severity: 'warning', source: 'Robot Arm R1', message: 'Joint 3 encoder signal degradation', status: 'resolved', createdAt: subDays(new Date(), 4).toISOString(), resolvedAt: subDays(new Date(), 4, 3).toISOString() },
  { id: 'h6', alarmId: 'ALM-2024-006', severity: 'critical', source: 'PLC Controller', message: 'Watchdog timer expired on main PLC', status: 'resolved', createdAt: subDays(new Date(), 3).toISOString(), resolvedAt: subDays(new Date(), 3, 2).toISOString() },
  { id: 'h7', alarmId: 'ALM-2024-007', severity: 'warning', source: 'Compressor Unit', message: 'Oil pressure below minimum threshold', status: 'resolved', createdAt: subDays(new Date(), 3).toISOString(), resolvedAt: subDays(new Date(), 3, 5).toISOString() },
  { id: 'h8', alarmId: 'ALM-2024-008', severity: 'info', source: 'Temperature Sensor T4', message: 'Calibration drift detected - scheduled for maintenance', status: 'resolved', createdAt: subDays(new Date(), 3).toISOString(), resolvedAt: subDays(new Date(), 3, 10).toISOString() },
  { id: 'h9', alarmId: 'ALM-2024-009', severity: 'critical', source: 'Arc Welder W2', message: 'Cooling system failure detected', status: 'resolved', createdAt: subDays(new Date(), 2).toISOString(), resolvedAt: subDays(new Date(), 2, 4).toISOString() },
  { id: 'h10', alarmId: 'ALM-2024-010', severity: 'warning', source: 'Conveyor Belt B1', message: 'Belt tension below recommended level', status: 'resolved', createdAt: subDays(new Date(), 2).toISOString(), resolvedAt: subDays(new Date(), 2, 7).toISOString() },
  { id: 'h11', alarmId: 'ALM-2024-011', severity: 'info', source: 'Edge Gateway EG3', message: 'Firmware update available', status: 'resolved', createdAt: subDays(new Date(), 2).toISOString(), resolvedAt: subDays(new Date(), 2, 1).toISOString() },
  { id: 'h12', alarmId: 'ALM-2024-012', severity: 'critical', source: 'CNC Machine A3', message: 'Tool breakage detected at station 2', status: 'resolved', createdAt: subDays(new Date(), 1).toISOString(), resolvedAt: subDays(new Date(), 1, 3).toISOString() },
  { id: 'h13', alarmId: 'ALM-2024-013', severity: 'warning', source: 'Paint Booth P1', message: 'Airflow sensor reading below threshold', status: 'resolved', createdAt: subDays(new Date(), 1).toISOString(), resolvedAt: subDays(new Date(), 1, 9).toISOString() },
  { id: 'h14', alarmId: 'ALM-2024-014', severity: 'info', source: 'Energy Meter EM1', message: 'Power factor correction recommended', status: 'resolved', createdAt: subDays(new Date(), 1).toISOString(), resolvedAt: subDays(new Date(), 1, 2).toISOString() },
  { id: 'h15', alarmId: 'ALM-2024-015', severity: 'critical', source: 'Furnace F1', message: 'Emergency shutdown triggered by safety interlock', status: 'resolved', createdAt: subHours(new Date(), 18).toISOString(), resolvedAt: subHours(new Date(), 15).toISOString() },
  { id: 'h16', alarmId: 'ALM-2024-016', severity: 'warning', source: 'Cooling Tower CT2', message: 'Water level approaching low threshold', status: 'resolved', createdAt: subHours(new Date(), 14).toISOString(), resolvedAt: subHours(new Date(), 11).toISOString() },
  { id: 'h17', alarmId: 'ALM-2024-017', severity: 'info', source: 'SCADA Gateway', message: 'Data historian buffer at 80% capacity', status: 'resolved', createdAt: subHours(new Date(), 10).toISOString(), resolvedAt: subHours(new Date(), 8).toISOString() },
  { id: 'h18', alarmId: 'ALM-2024-018', severity: 'critical', source: 'CNC Machine A2', message: 'Emergency stop button activated', status: 'resolved', createdAt: subHours(new Date(), 8).toISOString(), resolvedAt: subHours(new Date(), 7).toISOString() },
  { id: 'h19', alarmId: 'ALM-2024-019', severity: 'warning', source: 'Robot Arm R2', message: 'Payload weight exceeds 95% of rated capacity', status: 'resolved', createdAt: subHours(new Date(), 6).toISOString(), resolvedAt: subHours(new Date(), 4).toISOString() },
  { id: 'h20', alarmId: 'ALM-2024-020', severity: 'info', source: 'Network Switch SW1', message: 'Port 12 link flapping detected', status: 'resolved', createdAt: subHours(new Date(), 4).toISOString(), resolvedAt: subHours(new Date(), 2).toISOString() },
  { id: 'h21', alarmId: 'ALM-2024-021', severity: 'warning', source: 'Hydraulic Press C1', message: 'Hydraulic fluid temperature rising', status: 'resolved', createdAt: subHours(new Date(), 3).toISOString(), resolvedAt: subHours(new Date(), 1).toISOString() },
  { id: 'h22', alarmId: 'ALM-2024-022', severity: 'critical', source: 'PLC Controller', message: 'I/O module communication loss on rack 3', status: 'resolved', createdAt: subMinutes(new Date(), 90).toISOString(), resolvedAt: subMinutes(new Date(), 60).toISOString() },
  { id: 'h23', alarmId: 'ALM-2024-023', severity: 'info', source: 'Vibration Sensor VS5', message: 'Self-diagnostic check completed - all normal', status: 'resolved', createdAt: subMinutes(new Date(), 45).toISOString(), resolvedAt: subMinutes(new Date(), 30).toISOString() },
]

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    critical: {
      className: 'bg-red-500/15 text-red-400 border-red-500/25',
      label: 'Critical',
    },
    warning: {
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      label: 'Warning',
    },
    info: {
      className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      label: 'Info',
    },
  }
  const v = variants[severity] || variants.info
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
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

function SummaryCard({ icon: Icon, label, value, subtext, accentColor }: { icon: React.ElementType; label: string; value: string; subtext: string; accentColor: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('size-4', accentColor)} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
      </CardContent>
    </Card>
  )
}

export function AlarmHistoryPage() {
  const { alarms } = useIIoTStore()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const allAlarms: HistoricalAlarm[] = useMemo(() => {
    return [...MOCK_HISTORY, ...alarms.map((a) => ({ ...a, resolvedAt: undefined }))]
  }, [alarms])

  const uniqueSources = useMemo(() => {
    const sources = new Set(allAlarms.map((a) => a.source))
    return Array.from(sources).sort()
  }, [allAlarms])

  const filteredAlarms = useMemo(() => {
    return allAlarms.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
      if (dateFrom && new Date(a.createdAt) < dateFrom) return false
      if (dateTo) {
        const toDateEnd = new Date(dateTo)
        toDateEnd.setHours(23, 59, 59, 999)
        if (new Date(a.createdAt) > toDateEnd) return false
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allAlarms, severityFilter, statusFilter, sourceFilter, dateFrom, dateTo])

  // Summary stats (mocked numbers for resolved rate and avg resolution)
  const summaryStats = useMemo(() => {
    const total = allAlarms.length
    const resolved = allAlarms.filter((a) => a.status === 'resolved').length
    const resolvedRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0'
    const avgResMinutes = 47
    return { total, resolvedRate, avgResMinutes }
  }, [allAlarms])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={CheckCircle2}
        title="Alarm History"
        description="Complete historical record of all plant alarms"
        actions={
          <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground">
            <Download className="size-3.5 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={BarChart3}
          label="Total Alarms"
          value={String(summaryStats.total)}
          subtext={`Across ${uniqueSources.length} sources`}
          accentColor="text-emerald-400"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Resolved Rate"
          value={`${summaryStats.resolvedRate}%`}
          subtext={`${summaryStats.total - allAlarms.filter((a) => a.status === 'resolved').length} remaining open`}
          accentColor="text-cyan-400"
        />
        <SummaryCard
          icon={Clock}
          label="Avg Resolution"
          value={`${summaryStats.avgResMinutes} min`}
          subtext="Based on last 30 days"
          accentColor="text-amber-400"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Date range picker */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-normal bg-background border-border/50"
            >
              <CalendarIcon className="size-3.5 mr-2 text-muted-foreground" />
              {dateFrom ? (
                dateTo ? (
                  <span className="text-sm">
                    {format(dateFrom, 'MMM d, yyyy')} - {format(dateTo, 'MMM d, yyyy')}
                  </span>
                ) : (
                  format(dateFrom, 'MMM d, yyyy')
                )
              ) : (
                <span className="text-muted-foreground">Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background border-border/60" align="start">
            <Calendar
              mode="range"
              selected={dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined}
              onSelect={(range) => {
                setDateFrom(range?.from)
                setDateTo(range?.to)
              }}
              numberOfMonths={2}
              defaultMonth={subDays(new Date(), 3)}
            />
          </PopoverContent>
        </Popover>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
          <SelectTrigger className="w-full sm:w-40 bg-background">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-background">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40 bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <div className="sm:ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
          {filteredAlarms.length} record{filteredAlarms.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* History table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-slate-400">ID</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Message</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400">Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Info className="size-8 text-slate-500" />
                        <p className="text-sm font-medium">No alarms match your filters</p>
                        <p className="text-xs">Try adjusting the date range or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlarms.map((alarm) => (
                    <TableRow
                      key={alarm.id}
                      className={`
                        border-border/30
                        ${alarm.severity === 'critical' ? 'border-l-2 border-l-red-500/60' : ''}
                        ${alarm.severity === 'warning' ? 'border-l-2 border-l-amber-500/40' : ''}
                        ${alarm.severity === 'info' ? 'border-l-2 border-l-cyan-500/30' : ''}
                      `}
                    >
                      <TableCell className="py-3 font-mono text-xs text-foreground/70">
                        {alarm.alarmId}
                      </TableCell>
                      <TableCell className="py-3">
                        <SeverityBadge severity={alarm.severity} />
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-foreground/90">{alarm.source}</span>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs">
                        <span className="text-sm text-foreground/70 truncate block">{alarm.message}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={alarm.status} />
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(alarm.createdAt), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {alarm.resolvedAt
                          ? format(new Date(alarm.resolvedAt), 'MMM d, HH:mm')
                          : <span className="text-slate-500">—</span>}
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
