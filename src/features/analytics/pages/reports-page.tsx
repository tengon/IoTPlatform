'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart3,
  Zap,
  Gauge,
  Factory,
  Wrench,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
  CalendarDays,
  X,
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
import { useIIoTStore } from '@/store/iiot'
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
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Chart color constants ──────────────────────────────────────────────
const C_GREEN = '#10b981'
const C_CYAN = '#06b6d4'
const C_YELLOW = '#eab308'
const C_ORANGE = '#f97316'
const C_RED = '#ef4444'
const GRID_STROKE = 'rgba(255,255,255,0.05)'
const AXIS_TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 11 }
const AXIS_LINE = { stroke: 'rgba(255,255,255,0.06)' }

// ─── Report type definitions ────────────────────────────────────────────
interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  lastGenerated: string
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'production-summary',
    name: 'Production Summary',
    description: 'Overview of production output, targets, defect rates, and order completion across all lines.',
    icon: Factory,
    color: C_GREEN,
    bgColor: 'rgba(16,185,129,0.1)',
    lastGenerated: '2 hours ago',
  },
  {
    id: 'alarm-analysis',
    name: 'Alarm Analysis',
    description: 'Breakdown of alarm frequency, severity distribution, response times, and root cause trends.',
    icon: AlertTriangle,
    color: C_ORANGE,
    bgColor: 'rgba(249,115,22,0.1)',
    lastGenerated: '5 hours ago',
  },
  {
    id: 'energy-consumption',
    name: 'Energy Consumption',
    description: 'Power usage trends, peak demand analysis, cost breakdown, and efficiency metrics.',
    icon: Zap,
    color: C_YELLOW,
    bgColor: 'rgba(234,179,8,0.1)',
    lastGenerated: '1 day ago',
  },
  {
    id: 'oee-performance',
    name: 'OEE Performance',
    description: 'Overall Equipment Effectiveness analysis with availability, performance, and quality breakdowns.',
    icon: Gauge,
    color: C_CYAN,
    bgColor: 'rgba(6,182,212,0.1)',
    lastGenerated: '3 hours ago',
  },
  {
    id: 'machine-utilization',
    name: 'Machine Utilization',
    description: 'Machine uptime, idle time, and runtime analysis across the entire production floor.',
    icon: BarChart3,
    color: C_GREEN,
    bgColor: 'rgba(16,185,129,0.1)',
    lastGenerated: '6 hours ago',
  },
  {
    id: 'maintenance-summary',
    name: 'Maintenance Summary',
    description: 'Planned vs unplanned maintenance, MTTR/MTBF metrics, and upcoming maintenance schedule.',
    icon: Wrench,
    color: C_RED,
    bgColor: 'rgba(239,68,68,0.1)',
    lastGenerated: '12 hours ago',
  },
]

// ─── Quick select options ───────────────────────────────────────────────
const QUICK_RANGES = ['Last 24h', 'Last 7 Days', 'Last 30 Days', 'Custom'] as const

type QuickRange = (typeof QUICK_RANGES)[number]

// ─── Recent reports mock data ───────────────────────────────────────────
interface RecentReport {
  id: string
  name: string
  type: string
  typeColor: string
  dateRange: string
  generatedAt: string
  size: string
}

const RECENT_REPORTS: RecentReport[] = [
  {
    id: 'rpt-001',
    name: 'Production Summary - Weekly',
    type: 'Production',
    typeColor: C_GREEN,
    dateRange: 'Jun 10 – Jun 16, 2025',
    generatedAt: '2025-06-16 14:32',
    size: '2.4 MB',
  },
  {
    id: 'rpt-002',
    name: 'Alarm Analysis - Critical Review',
    type: 'Alarm',
    typeColor: C_ORANGE,
    dateRange: 'Jun 1 – Jun 15, 2025',
    generatedAt: '2025-06-15 09:18',
    size: '1.8 MB',
  },
  {
    id: 'rpt-003',
    name: 'Energy Consumption - Monthly',
    type: 'Energy',
    typeColor: C_YELLOW,
    dateRange: 'May 16 – Jun 15, 2025',
    generatedAt: '2025-06-15 08:00',
    size: '3.1 MB',
  },
  {
    id: 'rpt-004',
    name: 'OEE Performance - Line A',
    type: 'OEE',
    typeColor: C_CYAN,
    dateRange: 'Jun 9 – Jun 15, 2025',
    generatedAt: '2025-06-15 16:45',
    size: '1.2 MB',
  },
  {
    id: 'rpt-005',
    name: 'Machine Utilization - All Lines',
    type: 'Utilization',
    typeColor: C_GREEN,
    dateRange: 'Jun 10 – Jun 16, 2025',
    generatedAt: '2025-06-16 10:22',
    size: '2.7 MB',
  },
  {
    id: 'rpt-006',
    name: 'Maintenance Summary - Q2',
    type: 'Maintenance',
    typeColor: C_RED,
    dateRange: 'Apr 1 – Jun 15, 2025',
    generatedAt: '2025-06-14 11:30',
    size: '4.2 MB',
  },
  {
    id: 'rpt-007',
    name: 'Production Summary - Daily',
    type: 'Production',
    typeColor: C_GREEN,
    dateRange: 'Jun 15, 2025',
    generatedAt: '2025-06-15 23:59',
    size: '0.8 MB',
  },
  {
    id: 'rpt-008',
    name: 'Alarm Analysis - Shift Report',
    type: 'Alarm',
    typeColor: C_ORANGE,
    dateRange: 'Jun 16, 06:00 – 14:00',
    generatedAt: '2025-06-16 14:05',
    size: '0.6 MB',
  },
  {
    id: 'rpt-009',
    name: 'OEE Performance - All Lines',
    type: 'OEE',
    typeColor: C_CYAN,
    dateRange: 'Jun 1 – Jun 15, 2025',
    generatedAt: '2025-06-15 18:00',
    size: '2.9 MB',
  },
  {
    id: 'rpt-010',
    name: 'Energy Consumption - Peak Analysis',
    type: 'Energy',
    typeColor: C_YELLOW,
    dateRange: 'Jun 10 – Jun 16, 2025',
    generatedAt: '2025-06-16 12:15',
    size: '1.5 MB',
  },
]

// ─── Mock report preview data ───────────────────────────────────────────
const PREVIEW_SUMMARY_DATA = [
  { metric: 'Total Output', value: '128,450', unit: 'units', change: '+4.2%', positive: true },
  { metric: 'Defect Rate', value: '1.23', unit: '%', change: '-0.3%', positive: true },
  { metric: 'OEE Average', value: '84.7', unit: '%', change: '+1.8%', positive: true },
  { metric: 'Downtime Hours', value: '12.5', unit: 'hrs', change: '-2.1 hrs', positive: true },
  { metric: 'Energy Used', value: '45,230', unit: 'kWh', change: '+3.5%', positive: false },
  { metric: 'Alarms Triggered', value: '47', unit: 'total', change: '-8', positive: true },
]

const PREVIEW_CHART_DATA = [
  { name: 'Mon', output: 18200, target: 19000 },
  { name: 'Tue', output: 20100, target: 19000 },
  { name: 'Wed', output: 17800, target: 19000 },
  { name: 'Thu', output: 21500, target: 19000 },
  { name: 'Fri', output: 19300, target: 19000 },
  { name: 'Sat', output: 16500, target: 15000 },
  { name: 'Sun', output: 15050, target: 15000 },
]

const PREVIEW_MACHINE_DATA = [
  { machine: 'CNC Mill A-01', status: 'Running', oee: 91.2, output: 22450 },
  { machine: 'Lathe B-03', status: 'Running', oee: 87.5, output: 18920 },
  { machine: 'Press C-02', status: 'Idle', oee: 72.8, output: 15680 },
  { machine: 'Grinder D-01', status: 'Running', oee: 89.1, output: 21300 },
  { machine: 'Drill E-04', status: 'Maintenance', oee: 65.3, output: 12100 },
  { machine: 'Robot F-02', status: 'Running', oee: 93.7, output: 24100 },
]

// ─── Custom dark tooltip ────────────────────────────────────────────────
function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip rounded-lg bg-card/95 border border-border/60 px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ─── Type badge color map ───────────────────────────────────────────────
function getTypeBadgeVariant(type: string) {
  switch (type) {
    case 'Production':
    case 'Utilization':
      return 'default' as const
    case 'Alarm':
      return 'destructive' as const
    case 'Energy':
      return 'warning' as const
    case 'OEE':
      return 'default' as const
    case 'Maintenance':
      return 'destructive' as const
    default:
      return 'secondary' as const
  }
}

// ─── Main Component ─────────────────────────────────────────────────────
export function ReportsPage() {
  const machines = useIIoTStore((s) => s.machines)
  const alarms = useIIoTStore((s) => s.alarms)
  const production = useIIoTStore((s) => s.production)

  // State
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [quickRange, setQuickRange] = useState<QuickRange>('Last 7 Days')
  const [startDate, setStartDate] = useState('2025-06-10')
  const [endDate, setEndDate] = useState('2025-06-16')
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [generateState, setGenerateState] = useState<'idle' | 'generating' | 'complete'>('idle')
  const [progress, setProgress] = useState(0)
  const [previewReport, setPreviewReport] = useState<RecentReport | null>(null)

  // Handle quick range selection
  const handleQuickRange = useCallback((range: QuickRange) => {
    setQuickRange(range)
    if (range === 'Custom') {
      setIsCustomRange(true)
    } else {
      setIsCustomRange(false)
      const now = new Date('2025-06-16T14:00:00')
      let start = new Date(now)
      if (range === 'Last 24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      else if (range === 'Last 7 Days') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      else if (range === 'Last 30 Days') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    }
    // Reset generate state when range changes
    setGenerateState('idle')
    setProgress(0)
  }, [])

  // Simulate report generation
  const handleGenerate = useCallback(() => {
    if (!selectedType) return
    setGenerateState('generating')
    setProgress(0)
  }, [selectedType])

  useEffect(() => {
    if (generateState !== 'generating') return
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5
        if (next >= 100) {
          setGenerateState('complete')
          return 100
        }
        return next
      })
    }, 300)
    return () => clearInterval(interval)
  }, [generateState])

  // Compute some store-derived stats for the page header
  const activeMachineCount = machines.filter((m) => m.status === 'running').length
  const activeAlarmCount = alarms.filter((a) => a.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        description="Generate, view, and download operational reports across all industrial systems."
        icon={FileText}
        badge={`${RECENT_REPORTS.length} reports`}
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeMachineCount} machines active
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span>{activeAlarmCount} active alarms</span>
          </div>
        }
      />

      {/* Report Type Selector */}
      <section className="animate-slide-up">
        <h2 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3">
          Select Report Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report, idx) => {
            const Icon = report.icon
            const isSelected = selectedType === report.id
            return (
              <Card
                key={report.id}
                className={
                  `kpi-card-hover cursor-pointer transition-all animate-slide-up stagger-${idx + 1} ` +
                  (isSelected
                    ? 'ring-1 ring-primary/40 border-primary/30 bg-primary/5'
                    : 'hover:border-border/60')
                }
                onClick={() => {
                  setSelectedType(report.id)
                  setGenerateState('idle')
                  setProgress(0)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: report.bgColor }}
                    >
                      <Icon className="size-5" style={{ color: report.color }} />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-5 text-primary animate-scale-in" />
                    )}
                  </div>
                  <CardTitle className="text-sm font-semibold mt-2">{report.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60 leading-relaxed">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                    <Clock className="size-3" />
                    <span>Last generated: {report.lastGenerated}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Separator className="opacity-30" />

      {/* Date Range Picker + Generate */}
      <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3">
          Date Range
        </h2>
        <Card className="border-border/40">
          <CardContent className="p-4 md:p-6">
            {/* Quick range buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_RANGES.map((range) => (
                <Button
                  key={range}
                  variant={quickRange === range ? 'default' : 'outline'}
                  size="sm"
                  className={
                    quickRange === range
                      ? 'text-xs h-8'
                      : 'text-xs h-8 border-border/40 text-muted-foreground/70 hover:text-foreground hover:border-border/60'
                  }
                  onClick={() => handleQuickRange(range)}
                >
                  <CalendarDays className="size-3.5 mr-1.5" />
                  {range}
                </Button>
              ))}
            </div>

            {/* Date inputs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground/60 font-medium mb-1.5 block">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setIsCustomRange(true)
                      setQuickRange('Custom')
                      setGenerateState('idle')
                      setProgress(0)
                    }}
                    className="pl-8 h-9 text-xs bg-muted/30 border-border/40"
                    disabled={!isCustomRange && quickRange !== 'Custom'}
                  />
                </div>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground/60 font-medium mb-1.5 block">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setIsCustomRange(true)
                      setQuickRange('Custom')
                      setGenerateState('idle')
                      setProgress(0)
                    }}
                    className="pl-8 h-9 text-xs bg-muted/30 border-border/40"
                    disabled={!isCustomRange && quickRange !== 'Custom'}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedType || generateState === 'generating'}
                className="h-9 text-xs min-w-[140px]"
              >
                {generateState === 'generating' ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Generating…
                  </>
                ) : generateState === 'complete' ? (
                  <>
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                    Generated!
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5 mr-1.5" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {/* Progress bar */}
            {generateState === 'generating' && (
              <div className="mt-4 animate-fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground/60">
                    Generating report…
                  </span>
                  <span className="text-xs font-medium metric-value text-primary">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {generateState === 'complete' && (
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 animate-fade-in">
                <CheckCircle2 className="size-4" />
                <span className="font-medium">
                  Report generated successfully — ready to download or preview.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="opacity-30" />

      {/* Recent Reports Table */}
      <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Recent Reports
          </h2>
          <span className="text-xs text-muted-foreground/50">
            {RECENT_REPORTS.length} reports total
          </span>
        </div>
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10">
                      Report Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10 hidden md:table-cell">
                      Date Range
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10 hidden lg:table-cell">
                      Generated At
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10 hidden sm:table-cell">
                      Size
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-10 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RECENT_REPORTS.map((report, idx) => (
                    <TableRow
                      key={report.id}
                      className={`table-row-interactive border-border/20 zebra-row animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <FileText className="size-3.5 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm font-medium">{report.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={getTypeBadgeVariant(report.type)}
                          className="text-[10px] font-medium px-2 py-0"
                          style={
                            report.type === 'Energy'
                              ? { backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308', borderColor: 'rgba(234,179,8,0.25)' }
                              : report.type === 'OEE'
                                ? { backgroundColor: 'rgba(6,182,212,0.15)', color: '#06b6d4', borderColor: 'rgba(6,182,212,0.25)' }
                                : report.type === 'Utilization'
                                  ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.25)' }
                                  : undefined
                          }
                        >
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground/70 hidden md:table-cell">
                        {report.dateRange}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground/50 metric-value hidden lg:table-cell">
                        {report.generatedAt}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground/60 hidden sm:table-cell">
                        {report.size}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="ghost-action-btn"
                            title="View report"
                            onClick={() => setPreviewReport(report)}
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            className="ghost-action-btn"
                            title="Download report"
                            onClick={() => {/* Download simulation */}}
                          >
                            <Download className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Report Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold">{previewReport?.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/60 mt-1">
                  {previewReport?.dateRange} • Generated {previewReport?.generatedAt} • {previewReport?.size}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setPreviewReport(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Key Metrics Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PREVIEW_SUMMARY_DATA.map((item, idx) => (
                    <div
                      key={item.metric}
                      className={`rounded-lg border border-border/30 bg-muted/20 p-3 animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
                    >
                      <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">
                        {item.metric}
                      </p>
                      <p className="text-lg font-bold metric-value">
                        {item.value}
                        <span className="text-xs font-normal text-muted-foreground/50 ml-0.5">
                          {item.unit}
                        </span>
                      </p>
                      <p
                        className={`text-[11px] font-medium mt-0.5 ${item.positive ? 'text-emerald-400' : 'text-amber-400'}`}
                      >
                        {item.change}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="opacity-30" />

              {/* Chart Preview */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Daily Output vs Target
                </h3>
                <div className="chart-container-glass">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={PREVIEW_CHART_DATA} barGap={4}>
                      <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} />
                      <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} width={50} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar
                        dataKey="output"
                        name="Actual Output"
                        fill={C_GREEN}
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey="target"
                        name="Target"
                        fill="rgba(255,255,255,0.08)"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator className="opacity-30" />

              {/* Machine detail table */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Machine Performance Breakdown
                </h3>
                <div className="rounded-lg border border-border/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                          Machine
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9">
                          Status
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9 text-right">
                          OEE
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9 text-right">
                          Output
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PREVIEW_MACHINE_DATA.map((row) => (
                        <TableRow key={row.machine} className="table-row-interactive border-border/20 zebra-row">
                          <TableCell className="py-2.5 text-xs font-medium">{row.machine}</TableCell>
                          <TableCell className="py-2.5">
                            <span
                              className={
                                `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ` +
                                (row.status === 'Running'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : row.status === 'Idle'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-blue-500/10 text-blue-400')
                              }
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  row.status === 'Running'
                                    ? 'bg-emerald-400'
                                    : row.status === 'Idle'
                                      ? 'bg-amber-400'
                                      : 'bg-blue-400'
                                }`}
                              />
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span className={`metric-value text-xs font-bold ${row.oee >= 85 ? 'text-emerald-400' : row.oee >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                              {row.oee}%
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-xs text-muted-foreground/70 metric-value">
                            {row.output.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
