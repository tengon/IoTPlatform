'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  BarChartHorizontal,
  Waves,
  Gauge,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import {
  ChartTooltip,
  AXIS_TICK_SM,
  AXIS_LINE,
  GRID_STROKE,
  LEGEND_STYLE,
  C_GREEN,
  C_CYAN,
  C_ORANGE,
  C_RED,
  C_YELLOW,
} from '@/shared/components/chart-utils'
import { exportCSV } from '@/shared/utils/export-csv'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ─── Mock energy breakdown ─────────────────────────────────────────────────
const ENERGY_BREAKDOWN = [
  { name: 'CNC Mill', kwh: 1240 },
  { name: 'Lathe', kwh: 890 },
  { name: 'Conveyor', kwh: 620 },
  { name: 'Press', kwh: 1050 },
  { name: 'Robot Arm', kwh: 340 },
  { name: 'Welder', kwh: 780 },
  { name: 'Grinder', kwh: 450 },
  { name: 'HVAC', kwh: 920 },
  { name: 'Lighting', kwh: 210 },
  { name: 'Compressor', kwh: 680 },
]

// ─── Chart Card Wrapper ─────────────────────────────────────────────────────
function ChartCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-emerald-400',
  children,
  className,
}: {
  title: string
  description?: string
  icon: React.ElementType
  iconColor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`hover:border-border/60 transition-colors duration-300 ${className || ''}`}>
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon className={`size-4 ${iconColor}`} />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  )
}

// ─── Enhanced KPI Card ───────────────────────────────────────────────────────
function EnergyKPICard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color = C_GREEN,
  index = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color?: string
  index?: number
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 group animate-slide-up stagger-${Math.min(index + 1, 6)}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <CardContent className="flex items-start justify-between p-5 pt-5 pb-5">
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
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground metric-value animate-count-up">
              {value}
              <span className="text-xs font-normal text-muted-foreground/60 ml-1.5">{unit}</span>
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {trend === 'up' && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <TrendingUp className="size-3" />
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center gap-0.5 text-red-400">
                  <TrendingDown className="size-3" />
                </span>
              )}
              {trend === 'neutral' && (
                <span className="flex items-center gap-0.5 text-muted-foreground/60">
                  <Minus className="size-3" />
                </span>
              )}
              <span
                className={
                  trend === 'up'
                    ? 'text-emerald-400/80'
                    : trend === 'down'
                      ? 'text-red-400/80'
                      : 'text-muted-foreground/60'
                }
              >
                {trendValue}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function EnergyMonitoringPage() {
  const { energyHistory, lastUpdate } = useIIoTStore()
  const [lastUpdatedText, setLastUpdatedText] = useState('—')

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

  // Use real store data or fallback to mock
  const chartData = useMemo(() => {
    if (energyHistory.length > 0) {
      return energyHistory.map((e, i) => ({
        time: `${i}`,
        kWh: e.kwh,
        Voltage: e.voltage,
        Current: e.current,
        PF: e.powerFactor,
      }))
    }
    // Generate mock fallback
    const data: Array<{
      time: string
      kWh: number
      Voltage: number
      Current: number
      PF: number
    }> = []
    const now = Date.now()
    for (let i = 59; i >= 0; i--) {
      const t = (60 - i) / 60
      data.push({
        time: new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kWh: 85 + 30 * Math.sin(t * Math.PI * 4) + (Math.random() - 0.5) * 15,
        Voltage: 380 + 5 * Math.sin(t * Math.PI * 8) + (Math.random() - 0.5) * 3,
        Current: 140 + 40 * Math.sin(t * Math.PI * 4 + 0.5) + (Math.random() - 0.5) * 10,
        PF: 0.92 + 0.04 * Math.sin(t * Math.PI * 6) + (Math.random() - 0.5) * 0.02,
      })
    }
    return data
  }, [energyHistory])

  // ── KPI values ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const latest = chartData[chartData.length - 1]
    const prev = chartData[chartData.length - 2] || latest
    const currentPower = latest?.kWh ?? 87.5
    const prevPower = prev?.kWh ?? 85.2
    const totalKwh = chartData.reduce((sum, d) => sum + d.kWh, 0)
    const peakDemand = Math.max(...chartData.map((d) => d.kWh))
    const avgPF = chartData.reduce((sum, d) => sum + d.PF, 0) / chartData.length
    return {
      currentPower: currentPower.toFixed(1),
      totalKwh: Math.round(totalKwh),
      peakDemand: peakDemand.toFixed(1),
      powerFactor: avgPF.toFixed(3),
      powerTrend: currentPower > prevPower ? 'up' as const : currentPower < prevPower ? 'down' as const : 'neutral' as const,
      powerTrendVal: currentPower > prevPower ? '+3.2%' : currentPower < prevPower ? '-1.8%' : '0%',
    }
  }, [chartData])

  // ── Cost estimation ───────────────────────────────────────────────────────
  const costEstimate = useMemo(() => {
    const rate = 0.12 // $/kWh industrial rate
    const dailyKwh = kpis.totalKwh * (1440 / 60) // extrapolate from 1h data
    const dailyCost = dailyKwh * rate
    const monthlyCost = dailyCost * 30
    return {
      rate: rate.toFixed(2),
      dailyKwh: Math.round(dailyKwh),
      dailyCost: dailyCost.toFixed(0),
      monthlyCost: monthlyCost.toFixed(0),
    }
  }, [kpis.totalKwh])

  // ── Power factor trend ────────────────────────────────────────────────────
  const pfTrend = useMemo(() => {
    const recent = chartData.slice(-10)
    const first = recent[0]?.PF ?? 0.92
    const last = recent[recent.length - 1]?.PF ?? 0.93
    return last >= first ? 'improving' : 'declining'
  }, [chartData])

  // ── CSV export handler ─────────────────────────────────────────────────────
  const handleExport = () => {
    exportCSV({
      data: chartData,
      filename: 'energy-monitoring',
      columns: [
        { key: 'time', label: 'Time' },
        { key: 'kWh', label: 'Power (kW)' },
        { key: 'Voltage', label: 'Voltage (V)' },
        { key: 'Current', label: 'Current (A)' },
        { key: 'PF', label: 'Power Factor' },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="Energy Monitoring"
        description="Track and optimize energy consumption"
        lastUpdated={lastUpdatedText}
        actions={
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExport}>
            <Download className="size-3.5" />
            Export CSV
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnergyKPICard
          icon={Zap}
          label="Current Power"
          value={kpis.currentPower}
          unit="kW"
          trend={kpis.powerTrend}
          trendValue={kpis.powerTrendVal}
          color={C_ORANGE}
          index={0}
        />
        <EnergyKPICard
          icon={Activity}
          label="Today's Consumption"
          value={kpis.totalKwh.toLocaleString()}
          unit="kWh"
          trend="up"
          trendValue="+4.7%"
          color={C_GREEN}
          index={1}
        />
        <EnergyKPICard
          icon={TrendingUp}
          label="Peak Demand"
          value={kpis.peakDemand}
          unit="kW"
          trend="down"
          trendValue="-2.1%"
          color={C_RED}
          index={2}
        />
        <EnergyKPICard
          icon={Gauge}
          label="Power Factor"
          value={kpis.powerFactor}
          unit=""
          trend={pfTrend === 'improving' ? 'up' : 'down'}
          trendValue={pfTrend === 'improving' ? '+0.003' : '-0.002'}
          color={C_CYAN}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Power Chart — spans 2 cols */}
        <ChartCard
          title="Real-time Power Consumption"
          description="Power draw over the last hour"
          icon={Zap}
          iconColor="text-emerald-400"
          className="lg:col-span-2 animate-slide-up stagger-1"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="time" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} interval={9} />
                <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} width={45} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="kWh"
                  stroke={C_GREEN}
                  strokeWidth={2}
                  dot={false}
                  fill="url(#powerGrad)"
                  name="Power (kW)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Cost Estimation Card (enhanced) */}
        <Card className="relative overflow-hidden hover:border-border/60 transition-colors duration-300 flex flex-col animate-slide-up stagger-2">
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
            style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}
          />
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 bg-amber-500/10" style={{ ['--tw-ring-color' as string]: 'rgba(245,158,11,0.2)' }}>
                <DollarSign className="h-4 w-4 text-amber-400" />
              </div>
              <CardTitle className="text-sm font-semibold">Cost Estimation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between px-5 pb-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Rate</p>
                  <p className="mt-1 text-lg font-bold">
                    ${costEstimate.rate}
                    <span className="text-xs font-normal text-muted-foreground/60 ml-1.5">/kWh</span>
                  </p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Industrial</Badge>
              </div>
              <div className="rounded-lg border border-border/30 p-3.5 bg-muted/10">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Estimated Daily</p>
                <p className="mt-1.5 text-2xl font-extrabold text-amber-400 metric-value">${Number(costEstimate.dailyCost).toLocaleString()}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">{costEstimate.dailyKwh.toLocaleString()} kWh projected</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Estimated Monthly</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-400 metric-value">${Number(costEstimate.monthlyCost).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Savings opportunity</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                  ~12% optimization potential
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Breakdown by Machine/Area */}
        <ChartCard
          title="Energy Breakdown by Area"
          description="Consumption distribution across machines and systems"
          icon={BarChartHorizontal}
          iconColor="text-orange-400"
          className="animate-slide-up stagger-3"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ENERGY_BREAKDOWN}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis type="number" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} width={80} />
                <Tooltip content={<ChartTooltip valueSuffix=" kWh" />} />
                <Bar dataKey="kwh" name="Consumption (kWh)" radius={[0, 3, 3, 0]} barSize={14}>
                  {ENERGY_BREAKDOWN.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx < 3 ? C_ORANGE : idx < 6 ? C_GREEN : C_CYAN}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Voltage & Current Dual-Axis Chart */}
        <ChartCard
          title="Voltage & Current"
          description="Dual-axis electrical parameter monitoring"
          icon={Waves}
          iconColor="text-cyan-400"
          className="animate-slide-up stagger-4"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="time" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} interval={9} />
                <YAxis yAxisId="left" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} width={45} domain={[370, 390]} />
                <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} width={45} domain={[100, 200]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Line yAxisId="left" type="monotone" dataKey="Voltage" stroke={C_CYAN} strokeWidth={2} dot={false} name="Voltage (V)" />
                <Line yAxisId="right" type="monotone" dataKey="Current" stroke={C_ORANGE} strokeWidth={2} dot={false} name="Current (A)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Power Factor Trend */}
      <ChartCard
        title="Power Factor Trend"
        description="Real-time power factor — target ≥ 0.90"
        icon={Gauge}
        iconColor="text-cyan-400"
        className="animate-slide-up stagger-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="pfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={Number(kpis.powerFactor) >= 0.90 ? C_GREEN : C_YELLOW} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={Number(kpis.powerFactor) >= 0.90 ? C_GREEN : C_YELLOW} stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Background arc */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                  strokeDasharray={`${251.3 * 0.75} ${251.3 * 0.25}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(135 50 50)"
                />
                {/* Value arc */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="url(#pfGrad)"
                  strokeWidth="8"
                  strokeDasharray={`${251.3 * 0.75 * Number(kpis.powerFactor)} ${251.3 * 0.75 * (1 - Number(kpis.powerFactor))}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(135 50 50)"
                  style={{ filter: `drop-shadow(0 0 6px ${Number(kpis.powerFactor) >= 0.90 ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold metric-value">{kpis.powerFactor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Average Power Factor</p>
              <div className="flex items-center gap-1.5">
                {pfTrend === 'improving' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className={`text-xs font-medium ${pfTrend === 'improving' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pfTrend === 'improving' ? 'Improving' : 'Declining'}
                </span>
              </div>
              <Badge
                variant={Number(kpis.powerFactor) >= 0.90 ? 'secondary' : 'outline'}
                className={`text-[10px] ${Number(kpis.powerFactor) >= 0.90 ? 'bg-emerald-500/15 text-emerald-400 border-0' : 'bg-amber-500/15 text-amber-400 border-0'}`}
              >
                {Number(kpis.powerFactor) >= 0.90 ? 'On Target' : 'Below Target'}
              </Badge>
            </div>
          </div>
          <div className="flex-1 h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis tick={AXIS_TICK_SM} tickLine={false} axisLine={AXIS_LINE} domain={[0.85, 1.0]} width={35} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="PF"
                  stroke={C_CYAN}
                  strokeWidth={1.5}
                  dot={false}
                  name="Power Factor"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
