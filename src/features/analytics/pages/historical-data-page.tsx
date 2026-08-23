'use client'

import { useState, useMemo, useCallback } from 'react'
import { Clock, Download, Filter } from 'lucide-react'
import { format, subDays, subHours, addHours } from 'date-fns'
import {
  LineChart,
  Line,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// ─── Solid colors for recharts ──────────────────────────────────────────────
const C_GREEN = '#10b981'
const C_GREEN_LIGHT = 'rgba(16,185,129,0.15)'
const C_CYAN = '#06b6d4'
const C_ORANGE = '#f97316'
const C_RED = '#ef4444'

// ─── Mock data generation ───────────────────────────────────────────────────
function generateHistoricalData(
  metric: string,
  hours: number
): Array<{ timestamp: string; value: number }> {
  const points: Array<{ timestamp: string; value: number }> = []
  const now = new Date()
  const count = Math.max(hours * 6, 200) // 10-min intervals, minimum 200

  for (let i = count; i >= 0; i--) {
    const time = subHours(now, (hours * i) / count)
    const t = i / count
    let value = 0

    switch (metric) {
      case 'temperature':
        // Sine wave base + noise for temperature (60-95°C range)
        value =
          72 +
          12 * Math.sin(t * Math.PI * 8 + 1.5) +
          5 * Math.sin(t * Math.PI * 20) +
          (Math.random() - 0.5) * 3
        break
      case 'pressure':
        // Step changes + noise (3.0-5.5 bar)
        value =
          4.0 +
          (Math.floor(t * 12) % 3) * 0.5 +
          (Math.random() - 0.5) * 0.15
        break
      case 'vibration':
        // Increasing trend with bursts (0.5-4.5 mm/s)
        value =
          1.5 +
          t * 1.8 +
          0.8 * Math.sin(t * Math.PI * 14) +
          (Math.random() > 0.92 ? 1.5 : 0) +
          (Math.random() - 0.5) * 0.3
        break
      case 'rpm':
        // Steady with occasional dips (1400-1600)
        value =
          1500 +
          50 * Math.sin(t * Math.PI * 6) +
          (Math.random() > 0.9 ? -200 : 0) +
          (Math.random() - 0.5) * 20
        break
      case 'production':
        // Step production pattern (0-100 units/hour)
        value =
          65 +
          (Math.floor(t * 8) % 4) * 8 +
          (Math.random() - 0.5) * 10 +
          5 * Math.sin(t * Math.PI * 12)
        value = Math.max(0, Math.min(100, value))
        break
      case 'power':
        // Load cycles (40-120 kW)
        value =
          75 +
          30 * Math.sin(t * Math.PI * 10) +
          10 * Math.cos(t * Math.PI * 25) +
          (Math.random() - 0.5) * 8
        break
      default:
        value = 50 + 20 * Math.sin(t * Math.PI * 4) + (Math.random() - 0.5) * 5
    }

    points.push({
      timestamp: format(time, 'MMM dd HH:mm'),
      value: Math.round(value * 100) / 100,
    })
  }

  return points
}

// ─── Dark tooltip ───────────────────────────────────────────────────────────
function DarkTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          <span
            className="inline-block mr-1.5 size-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{' '}
          <span className="font-semibold text-foreground">
            {p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Metric config ──────────────────────────────────────────────────────────
const METRICS: Record<
  string,
  { label: string; unit: string; color: string }
> = {
  temperature: { label: 'Temperature', unit: '°C', color: C_ORANGE },
  pressure: { label: 'Pressure', unit: ' bar', color: C_CYAN },
  vibration: { label: 'Vibration', unit: ' mm/s', color: C_RED },
  rpm: { label: 'RPM', unit: ' rpm', color: C_GREEN },
  production: { label: 'Production Rate', unit: ' u/h', color: C_GREEN },
  power: { label: 'Power', unit: ' kW', color: C_ORANGE },
}

const DEFAULT_MACHINES = [
  'CNC Mill #1',
  'CNC Mill #2',
  'Lathe #1',
  'Conveyor A',
  'Press #1',
  'Robot Arm #1',
]

const TIME_RANGES: Record<string, number> = {
  '6h': 6,
  '12h': 12,
  '24h': 24,
  '48h': 48,
  '7d': 168,
}

// ─── Component ──────────────────────────────────────────────────────────────
export function HistoricalDataPage() {
  const { machines } = useIIoTStore()

  const [selectedMachine, setSelectedMachine] = useState('all')
  const [selectedMetric, setSelectedMetric] = useState('temperature')
  const [timeRange, setTimeRange] = useState('24h')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 1))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const [tablePage, setTablePage] = useState(0)
  const pageSize = 50

  const machineList =
    machines.length > 0
      ? machines.map((m) => m.name)
      : DEFAULT_MACHINES

  const data = useMemo(() => {
    const hours = TIME_RANGES[timeRange] || 24
    return generateHistoricalData(selectedMetric, hours)
  }, [selectedMetric, timeRange])

  const unit = METRICS[selectedMetric]?.unit || ''
  const color = METRICS[selectedMetric]?.color || C_GREEN

  const stats = useMemo(() => {
    const vals = data.map((d) => d.value)
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const max = Math.max(...vals)
    const min = Math.min(...vals)
    return {
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
      count: vals.length,
    }
  }, [data])

  const paginatedData = useMemo(() => {
    const start = tablePage * pageSize
    return data.slice(start, start + pageSize)
  }, [data, tablePage])

  const totalPages = Math.ceil(data.length / pageSize)

  const handleExport = useCallback(() => {
    // Placeholder for CSV export
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Clock}
        title="Historical Data"
        description="Browse and analyze historical telemetry data"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dateFrom ? format(dateFrom, 'MMM dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-xs">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dateTo ? format(dateTo, 'MMM dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TIME_RANGES).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key === '7d' ? '7 Days' : `${key}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machine */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Device / Machine
              </label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {machineList.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metric */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Metric
              </label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METRICS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Data Points', value: stats.count, suffix: '' },
          { label: 'Average', value: stats.avg, suffix: unit },
          { label: 'Maximum', value: stats.max, suffix: unit },
          { label: 'Minimum', value: stats.min, suffix: unit },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {s.value}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {s.suffix}
              </span>
            </p>
          </Card>
        ))}
      </div>

      {/* Chart / Table Tabs */}
      <Card>
        <Tabs defaultValue="chart">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">
                  {METRICS[selectedMetric]?.label || 'Data'} —{' '}
                  {selectedMachine === 'all' ? 'All Machines' : selectedMachine}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {stats.count} data points over {timeRange === '7d' ? '7 days' : timeRange}
                </CardDescription>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="chart" className="text-xs px-3">
                  Chart
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs px-3">
                  Table
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <TabsContent value="chart" className="mt-0">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      interval={Math.floor(data.length / 8)}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      width={55}
                    />
                    <Tooltip content={<DarkTooltip unit={unit} />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={1.5}
                      dot={false}
                      name={METRICS[selectedMetric]?.label || 'Value'}
                      fill="url(#histGrad)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-12">#</TableHead>
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs text-right">
                        {METRICS[selectedMetric]?.label || 'Value'} ({unit.trim()})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, idx) => {
                      const globalIdx = tablePage * pageSize + idx
                      const val = row.value
                      const isHigh =
                        selectedMetric === 'temperature' && val > 85
                      const isLow =
                        selectedMetric === 'temperature' && val < 65
                      return (
                        <TableRow key={globalIdx}>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {globalIdx + 1}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {row.timestamp}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            <Badge
                              variant={isHigh ? 'destructive' : isLow ? 'outline' : 'secondary'}
                              className="font-mono text-xs"
                            >
                              {val}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Showing {tablePage * pageSize + 1}–
                  {Math.min((tablePage + 1) * pageSize, data.length)} of{' '}
                  {data.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={tablePage === 0}
                    onClick={() => setTablePage(0)}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={tablePage === 0}
                    onClick={() => setTablePage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {tablePage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={tablePage >= totalPages - 1}
                    onClick={() => setTablePage((p) => p + 1)}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={tablePage >= totalPages - 1}
                    onClick={() => setTablePage(totalPages - 1)}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
