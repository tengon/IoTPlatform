'use client'

import { useState, useMemo } from 'react'
import {
  ScrollText,
  Activity,
  UserCog,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Download,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subHours, subMinutes } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import { ExportDialog } from '@/shared/components/export-dialog'
import {
  ChartTooltip,
  AXIS_TICK_SM,
  AXIS_LINE,
  GRID_STROKE,
  C_GREEN,
  C_CYAN,
  C_ORANGE,
  C_RED,
} from '@/shared/components/chart-utils'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────
type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'EXPORT'
type Category = 'User Action' | 'System' | 'Security' | 'Configuration' | 'Data Export'
type DateRange = '1h' | '24h' | '7d' | '30d'

type CategoryFilter = 'all' | Category

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  actionType: ActionType
  category: Category
  resource: string
  details: string
  detailsJson: string
  ipAddress: string
}

// ─── Mock Data ──────────────────────────────────────────────────────────
const now = Date.now()

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'AUD-001',
    timestamp: subMinutes(new Date(now), 5).toISOString(),
    user: 'James Wilson',
    actionType: 'LOGIN',
    category: 'Security',
    resource: 'User Session',
    details: 'Successful login from Chrome on Windows',
    detailsJson: JSON.stringify({ browser: 'Chrome 121', os: 'Windows 11', sessionId: 'sess_9a3f2e', mfaVerified: true }, null, 2),
    ipAddress: '192.168.1.45',
  },
  {
    id: 'AUD-002',
    timestamp: subMinutes(new Date(now), 12).toISOString(),
    user: 'Sarah Chen',
    actionType: 'UPDATE',
    category: 'Configuration',
    resource: 'CNC Machine A1',
    details: 'Updated spindle speed threshold from 8000 to 8500 RPM',
    detailsJson: JSON.stringify({ deviceId: 'DEV-CNC-A1', parameter: 'spindle_speed_max', oldValue: 8000, newValue: 8500, unit: 'RPM' }, null, 2),
    ipAddress: '192.168.1.102',
  },
  {
    id: 'AUD-003',
    timestamp: subMinutes(new Date(now), 18).toISOString(),
    user: 'Michael Park',
    actionType: 'READ',
    category: 'User Action',
    resource: 'Alarm Report Q4',
    details: 'Viewed quarterly alarm summary report',
    detailsJson: JSON.stringify({ reportId: 'RPT-2024-Q4-ALM', pages: 24, duration: '3m 42s' }, null, 2),
    ipAddress: '192.168.1.78',
  },
  {
    id: 'AUD-004',
    timestamp: subMinutes(new Date(now), 25).toISOString(),
    user: 'James Wilson',
    actionType: 'UPDATE',
    category: 'Security',
    resource: 'User Role: Emily Rodriguez',
    details: 'Changed role from Operator to Engineer',
    detailsJson: JSON.stringify({ targetUserId: 'USR-004', oldRole: 'Operator', newRole: 'Engineer', reason: 'Certification completed' }, null, 2),
    ipAddress: '192.168.1.45',
  },
  {
    id: 'AUD-005',
    timestamp: subMinutes(new Date(now), 33).toISOString(),
    user: 'Emily Rodriguez',
    actionType: 'CREATE',
    category: 'Configuration',
    resource: 'Alert Rule: High Vibration',
    details: 'Created new alert rule for vibration monitoring on Robot Arm R1',
    detailsJson: JSON.stringify({ ruleId: 'ALR-NEW-011', metric: 'vibration_mm_s', threshold: 12.5, severity: 'warning', device: 'Robot Arm R1' }, null, 2),
    ipAddress: '192.168.1.88',
  },
  {
    id: 'AUD-006',
    timestamp: subMinutes(new Date(now), 42).toISOString(),
    user: 'System',
    actionType: 'UPDATE',
    category: 'System',
    resource: 'Firmware: Gateway EG-02',
    details: 'Firmware update applied v2.3.1 → v2.4.0',
    detailsJson: JSON.stringify({ deviceId: 'GW-EG02', oldVersion: 'v2.3.1', newVersion: 'v2.4.0', status: 'success', duration: '4m 12s' }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-007',
    timestamp: subMinutes(new Date(now), 55).toISOString(),
    user: 'David Kim',
    actionType: 'EXPORT',
    category: 'Data Export',
    resource: 'Production Data (Jan 2024)',
    details: 'Exported 14,230 production records as CSV',
    detailsJson: JSON.stringify({ format: 'CSV', recordCount: 14230, dateRange: '2024-01-01 to 2024-01-31', fileSize: '4.7 MB' }, null, 2),
    ipAddress: '192.168.1.156',
  },
  {
    id: 'AUD-008',
    timestamp: subMinutes(new Date(now), 68).toISOString(),
    user: 'Sarah Chen',
    actionType: 'UPDATE',
    category: 'Configuration',
    resource: 'Alert Rule: Temp Threshold',
    details: 'Modified critical temperature threshold from 90°C to 95°C',
    detailsJson: JSON.stringify({ ruleId: 'ALR-003', parameter: 'temperature_critical', oldValue: 90, newValue: 95, unit: '°C' }, null, 2),
    ipAddress: '192.168.1.102',
  },
  {
    id: 'AUD-009',
    timestamp: subMinutes(new Date(now), 75).toISOString(),
    user: 'Lisa Thompson',
    actionType: 'READ',
    category: 'User Action',
    resource: 'Dashboard: Live Monitoring',
    details: 'Accessed live monitoring dashboard',
    detailsJson: JSON.stringify({ page: 'live-monitoring', sessionDuration: '12m 05s', widgetsViewed: 6 }, null, 2),
    ipAddress: '192.168.1.201',
  },
  {
    id: 'AUD-010',
    timestamp: subMinutes(new Date(now), 88).toISOString(),
    user: 'System',
    actionType: 'DELETE',
    category: 'System',
    resource: 'Telemetry Buffer',
    details: 'Purged 1.2M expired telemetry records (retention: 30d)',
    detailsJson: JSON.stringify({ operation: 'data_retention_purge', recordsDeleted: 1200000, freedSpace: '2.3 GB', retentionDays: 30 }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-011',
    timestamp: subMinutes(new Date(now), 95).toISOString(),
    user: 'Michael Park',
    actionType: 'UPDATE',
    category: 'User Action',
    resource: 'Alarm: ALM-2024-022',
    details: 'Acknowledged critical I/O communication loss alarm',
    detailsJson: JSON.stringify({ alarmId: 'ALM-2024-022', severity: 'critical', source: 'PLC Controller', acknowledgeNote: 'Investigating cable connection' }, null, 2),
    ipAddress: '192.168.1.78',
  },
  {
    id: 'AUD-012',
    timestamp: subMinutes(new Date(now), 110).toISOString(),
    user: 'James Wilson',
    actionType: 'CREATE',
    category: 'Configuration',
    resource: 'User: Robert Zhang',
    details: 'Created new operator account with default permissions',
    detailsJson: JSON.stringify({ userId: 'USR-010', name: 'Robert Zhang', role: 'Operator', site: 'Plant A', email: 'robert.zhang@factory.io' }, null, 2),
    ipAddress: '192.168.1.45',
  },
  {
    id: 'AUD-013',
    timestamp: subMinutes(new Date(now), 128).toISOString(),
    user: 'Anna Müller',
    actionType: 'EXPORT',
    category: 'Data Export',
    resource: 'OEE Analysis Report',
    details: 'Generated and downloaded OEE analysis for all machines (Q4 2024)',
    detailsJson: JSON.stringify({ format: 'PDF', reportType: 'OEE Analysis', period: 'Q4 2024', machinesIncluded: 13, fileSize: '2.1 MB' }, null, 2),
    ipAddress: '192.168.1.134',
  },
  {
    id: 'AUD-014',
    timestamp: subMinutes(new Date(now), 145).toISOString(),
    user: 'System',
    actionType: 'UPDATE',
    category: 'System',
    resource: 'Data Pipeline',
    details: 'Auto-scaling: increased telemetry ingestion workers from 4 to 8',
    detailsJson: JSON.stringify({ component: 'data_pipeline', configKey: 'ingestion_workers', oldValue: 4, newValue: 8, trigger: 'queue_depth > 10000' }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-015',
    timestamp: subMinutes(new Date(now), 162).toISOString(),
    user: 'Emily Rodriguez',
    actionType: 'UPDATE',
    category: 'Configuration',
    resource: 'Device: Conveyor Belt B3',
    details: 'Updated Modbus TCP polling interval from 1000ms to 500ms',
    detailsJson: JSON.stringify({ deviceId: 'DEV-CNV-B3', protocol: 'Modbus TCP', parameter: 'polling_interval_ms', oldValue: 1000, newValue: 500 }, null, 2),
    ipAddress: '192.168.1.88',
  },
  {
    id: 'AUD-016',
    timestamp: subMinutes(new Date(now), 180).toISOString(),
    user: 'David Kim',
    actionType: 'DELETE',
    category: 'Configuration',
    resource: 'Alert Rule: Legacy Pressure',
    details: 'Removed deprecated pressure alert rule (replaced by ALR-018)',
    detailsJson: JSON.stringify({ ruleId: 'ALR-007', name: 'Legacy Pressure Monitor', replacementRule: 'ALR-018', deletedBy: 'David Kim' }, null, 2),
    ipAddress: '192.168.1.156',
  },
  {
    id: 'AUD-017',
    timestamp: subMinutes(new Date(now), 198).toISOString(),
    user: 'Sarah Chen',
    actionType: 'LOGIN',
    category: 'Security',
    resource: 'User Session',
    details: 'Successful login via SSO from Firefox on macOS',
    detailsJson: JSON.stringify({ browser: 'Firefox 122', os: 'macOS 14', authMethod: 'SSO', sessionId: 'sess_b7c1d4', mfaVerified: true }, null, 2),
    ipAddress: '192.168.1.102',
  },
  {
    id: 'AUD-018',
    timestamp: subMinutes(new Date(now), 215).toISOString(),
    user: 'System',
    actionType: 'CREATE',
    category: 'System',
    resource: 'Automated Backup',
    details: 'Scheduled daily database backup completed successfully',
    detailsJson: JSON.stringify({ backupId: 'BKP-2024-0115', type: 'automated_daily', size: '48.3 MB', duration: '1m 23s', checksum: 'sha256:a3f2...e8d1' }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-019',
    timestamp: subMinutes(new Date(now), 235).toISOString(),
    user: 'James Wilson',
    actionType: 'UPDATE',
    category: 'Security',
    resource: 'Platform Settings',
    details: 'Enabled mandatory 2FA for all Admin and Manager roles',
    detailsJson: JSON.stringify({ setting: 'mfa_required_roles', roles: ['Admin', 'Manager'], previousState: false, newState: true }, null, 2),
    ipAddress: '192.168.1.45',
  },
  {
    id: 'AUD-020',
    timestamp: subMinutes(new Date(now), 252).toISOString(),
    user: 'Lisa Thompson',
    actionType: 'READ',
    category: 'User Action',
    resource: 'Energy Monitoring',
    details: 'Viewed real-time energy consumption for Plant A',
    detailsJson: JSON.stringify({ page: 'energy-monitoring', site: 'Plant A', timeRange: 'Last 24h', metrics: ['kWh', 'voltage', 'power_factor'] }, null, 2),
    ipAddress: '192.168.1.201',
  },
  {
    id: 'AUD-021',
    timestamp: subMinutes(new Date(now), 270).toISOString(),
    user: 'System',
    actionType: 'UPDATE',
    category: 'System',
    resource: 'MQTT Broker',
    details: 'Reconnected to MQTT broker after brief network interruption',
    detailsJson: JSON.stringify({ component: 'mqtt_client', broker: 'mqtt://edge-gw-01:1883', downtime: '12s', autoRecovery: true }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-022',
    timestamp: subMinutes(new Date(now), 288).toISOString(),
    user: 'Michael Park',
    actionType: 'EXPORT',
    category: 'Data Export',
    resource: 'Alarm History (Last 7 Days)',
    details: 'Exported alarm history with full details as Excel',
    detailsJson: JSON.stringify({ format: 'XLSX', recordCount: 87, dateRange: '2024-01-08 to 2024-01-15', columns: 12, fileSize: '1.8 MB' }, null, 2),
    ipAddress: '192.168.1.78',
  },
  {
    id: 'AUD-023',
    timestamp: subMinutes(new Date(now), 310).toISOString(),
    user: 'Anna Müller',
    actionType: 'CREATE',
    category: 'Configuration',
    resource: 'Production Order: PO-2024-0187',
    details: 'Created new production order for Widget Assembly (batch 500)',
    detailsJson: JSON.stringify({ orderId: 'PO-2024-0187', product: 'Widget Assembly', quantity: 500, targetMachine: 'CNC Machine A2', deadline: '2024-01-22' }, null, 2),
    ipAddress: '192.168.1.134',
  },
  {
    id: 'AUD-024',
    timestamp: subMinutes(new Date(now), 335).toISOString(),
    user: 'System',
    actionType: 'DELETE',
    category: 'System',
    resource: 'Expired Sessions',
    details: 'Cleaned up 47 expired user sessions',
    detailsJson: JSON.stringify({ operation: 'session_cleanup', sessionsRemoved: 47, oldestExpired: '2024-01-13T08:00:00Z' }, null, 2),
    ipAddress: '10.0.0.1',
  },
  {
    id: 'AUD-025',
    timestamp: subMinutes(new Date(now), 355).toISOString(),
    user: 'Carlos Silva',
    actionType: 'LOGIN',
    category: 'Security',
    resource: 'User Session',
    details: 'Failed login attempt — incorrect password (attempt 2/5)',
    detailsJson: JSON.stringify({ browser: 'Edge 120', os: 'Windows 10', attempt: 2, maxAttempts: 5, lockoutThreshold: 5 }, null, 2),
    ipAddress: '192.168.2.50',
  },
]

// ─── Action Type Colors ─────────────────────────────────────────────────
const ACTION_CONFIG: Record<ActionType, { className: string; label: string }> = {
  CREATE: { className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'CREATE' },
  UPDATE: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'UPDATE' },
  DELETE: { className: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'DELETE' },
  READ: { className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', label: 'READ' },
  LOGIN: { className: 'bg-violet-500/15 text-violet-400 border-violet-500/30', label: 'LOGIN' },
  EXPORT: { className: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'EXPORT' },
}

const CATEGORY_CONFIG: Record<Category, { className: string; label: string }> = {
  'User Action': { className: 'bg-primary/10 text-primary border-primary/25', label: 'User Action' },
  'System': { className: 'bg-muted/80 text-muted-foreground border-muted-foreground/30', label: 'System' },
  'Security': { className: 'bg-red-500/10 text-red-400 border-red-500/25', label: 'Security' },
  'Configuration': { className: 'bg-amber-500/10 text-amber-400 border-amber-500/25', label: 'Configuration' },
  'Data Export': { className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25', label: 'Data Export' },
}

// ─── Generate hourly chart data ─────────────────────────────────────────
function generateHourlyData() {
  const data: { hour: string; events: number }[] = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const hour = subHours(now, i)
    // Simulate realistic activity pattern: low at night, peaks during work hours
    const h = hour.getHours()
    let base: number
    if (h >= 0 && h < 6) base = 2 + Math.random() * 3
    else if (h >= 6 && h < 8) base = 5 + Math.random() * 6
    else if (h >= 8 && h < 12) base = 10 + Math.random() * 8
    else if (h >= 12 && h < 14) base = 7 + Math.random() * 5
    else if (h >= 14 && h < 18) base = 10 + Math.random() * 8
    else if (h >= 18 && h < 21) base = 5 + Math.random() * 4
    else base = 3 + Math.random() * 3
    data.push({
      hour: format(hour, 'HH:00'),
      events: Math.round(base),
    })
  }
  return data
}

// ─── KPI Card ────────────────────────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color,
  index,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: string
  color?: string
  index?: number
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 group kpi-card-hover animate-slide-up stagger-${Math.min((index ?? 0) + 1, 6)}`}
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
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground metric-value">
              {value}
              <span className="text-xs font-normal text-muted-foreground/60 ml-1.5">{unit}</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {trend === 'up' && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <TrendingUp className="size-3" />
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

// ─── Component ──────────────────────────────────────────────────────────
export function AuditLogPage() {
  const lastUpdate = useIIoTStore((s) => s.lastUpdate)
  const [dateRange, setDateRange] = useState<DateRange>('24h')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [userFilter, setUserFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 10

  // Unique users from log
  const uniqueUsers = useMemo(() => {
    const users = new Set(MOCK_AUDIT_LOG.map((e) => e.user))
    return Array.from(users).sort()
  }, [])

  // Filtered data
  const filtered = useMemo(() => {
    return MOCK_AUDIT_LOG.filter((entry) => {
      const matchSearch =
        !search ||
        entry.user.toLowerCase().includes(search.toLowerCase()) ||
        entry.resource.toLowerCase().includes(search.toLowerCase()) ||
        entry.details.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || entry.category === categoryFilter
      const matchUser = userFilter === 'all' || entry.user === userFilter
      return matchSearch && matchCategory && matchUser
    })
  }, [search, categoryFilter, userFilter])

  // KPI counts
  const kpis = useMemo(() => {
    const total = filtered.length
    const userActions = filtered.filter((e) => e.category === 'User Action' || e.category === 'Security').length
    const systemEvents = filtered.filter((e) => e.category === 'System').length
    const securityEvents = filtered.filter((e) => e.category === 'Security').length
    return { total, userActions, systemEvents, securityEvents }
  }, [filtered])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginatedEntries = filtered.slice((page - 1) * perPage, page * perPage)

  // Reset page when filters change
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1) }
  const handleCategoryChange = (v: string) => { setCategoryFilter(v as CategoryFilter); setPage(1) }
  const handleUserChange = (v: string) => { setUserFilter(v); setPage(1) }
  const handleDateRangeChange = (v: string) => { setDateRange(v as DateRange); setPage(1) }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hourlyData = useMemo(() => generateHourlyData(), [])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Audit Log"
        description="Track all platform activity, user actions, and system events"
        lastUpdated={lastUpdate ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }) : undefined}
        badge={`${filtered.length} events`}
        actions={
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setExportOpen(true)}>
            <Download className="size-3.5" />
            Export Log
          </Button>
        }
      />

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Activity}
          label="Total Events (24h)"
          value={kpis.total}
          unit="events"
          trend="up"
          trendValue="+12% vs yesterday"
          color={C_GREEN}
          index={0}
        />
        <KPICard
          icon={UserCog}
          label="User Actions"
          value={kpis.userActions}
          unit="events"
          trend="up"
          trendValue={`${Math.round((kpis.userActions / Math.max(kpis.total, 1)) * 100)}% of total`}
          color={C_CYAN}
          index={1}
        />
        <KPICard
          icon={Clock}
          label="System Events"
          value={kpis.systemEvents}
          unit="events"
          trend="stable"
          trendValue="Automated processes"
          color={C_ORANGE}
          index={2}
        />
        <KPICard
          icon={Shield}
          label="Security Events"
          value={kpis.securityEvents}
          unit="events"
          trend={kpis.securityEvents > 3 ? 'up' : 'stable'}
          trendValue={kpis.securityEvents > 3 ? 'Elevated activity' : 'Normal'}
          color={C_RED}
          index={3}
        />
      </div>

      {/* ── Activity Timeline Chart ────────────────────────────────── */}
      <Card className="border-border/40 stagger-2 animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Activity Timeline</h3>
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Events per hour (24h)</span>
          </div>
          <div className="chart-container-glass h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={AXIS_TICK_SM}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={AXIS_TICK_SM}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar
                  dataKey="events"
                  fill={C_GREEN}
                  radius={[3, 3, 0, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Filter Bar + Table ─────────────────────────────────────── */}
      <Card className="border-border/40 stagger-3 animate-slide-up">
        <CardContent className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Date Range Quick Select */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Clock className="size-3.5" />
                  Last {dateRange}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleDateRangeChange('1h')}>Last 1h</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange('24h')}>Last 24h</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange('7d')}>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange('30d')}>Last 30 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="User Action">User Action</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Configuration">Configuration</SelectItem>
                <SelectItem value="Data Export">Data Export</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Select value={userFilter} onValueChange={handleUserChange}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="h-8 pl-8 text-xs border-border/50"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="max-h-[calc(100vh-620px)] min-h-[400px] overflow-y-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 w-8" />
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Timestamp</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">User</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3">Action</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden lg:table-cell">Category</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden md:table-cell">Resource</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden xl:table-cell">Details</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 hidden lg:table-cell">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <ScrollText className="size-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium">No audit events found</p>
                        <p className="text-xs text-muted-foreground/60">Try adjusting your search or filter criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEntries.map((entry, idx) => {
                    const isExpanded = expandedRows.has(entry.id)
                    const actionCfg = ACTION_CONFIG[entry.actionType]
                    const catCfg = CATEGORY_CONFIG[entry.category]
                    return (
                      <Collapsible
                        key={entry.id}
                        open={isExpanded}
                        onOpenChange={() => toggleRow(entry.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <TableRow
                            className={cn(
                              'cursor-pointer hover:bg-muted/20 transition-colors duration-150 table-row-interactive zebra-row',
                              isExpanded && 'bg-muted/10'
                            )}
                          >
                            <TableCell className="py-3 w-8">
                              {isExpanded
                                ? <ChevronDown className="size-3.5 text-muted-foreground" />
                                : <ChevronRight className="size-3.5 text-muted-foreground" />
                              }
                            </TableCell>
                            <TableCell className="py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={cn('text-sm font-medium', entry.user === 'System' ? 'text-muted-foreground/70' : 'text-foreground')}>{entry.user}</span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className={cn('text-[10px] font-semibold px-2 py-0.5 badge-sharp', actionCfg.className)}>
                                {actionCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 hidden lg:table-cell">
                              <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', catCfg.className)}>
                                {catCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 hidden md:table-cell">
                              <span className="text-sm text-muted-foreground/80 max-w-[200px] truncate block">
                                {entry.resource}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 hidden xl:table-cell">
                              <span className="text-xs text-muted-foreground/60 max-w-[240px] truncate block">
                                {entry.details}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 hidden lg:table-cell">
                              <code className="text-[11px] text-muted-foreground/50 font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                {entry.ipAddress}
                              </code>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <TableRow className="bg-muted/5 hover:bg-muted/5">
                            <TableCell colSpan={8} className="py-0">
                              <div className="px-4 py-3 animate-slide-up">
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-2 font-semibold">Full Details</p>
                                <pre className="text-xs text-muted-foreground/80 bg-muted/40 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed border border-border/30">
                                  {entry.detailsJson}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} events
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Audit Log"
        data={filtered.map((e) => ({
          timestamp: e.timestamp,
          user: e.user,
          action: e.actionType,
          resource: e.resource,
          ipAddress: e.ipAddress,
          details: e.details,
        }))}
        columns={[
          { key: 'timestamp', label: 'Timestamp' },
          { key: 'user', label: 'User' },
          { key: 'action', label: 'Action' },
          { key: 'resource', label: 'Resource' },
          { key: 'ipAddress', label: 'IP Address' },
          { key: 'details', label: 'Details' },
        ]}
        filename="audit-log"
      />
    </div>
  )
}
