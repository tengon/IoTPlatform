'use client'

import { useMemo } from 'react'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
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

// ─── Solid colors for recharts ──────────────────────────────────────────────
const C_GREEN = '#10b981'
const C_YELLOW = '#eab308'
const C_CYAN = '#06b6d4'
const C_ORANGE = '#f97316'
const C_RED = '#ef4444'

// ─── Dark tooltip ───────────────────────────────────────────────────────────
function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>
  label?: string
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
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function EnergyKPICard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color = C_GREEN,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
          {trend === 'neutral' && <span className="text-xs text-muted-foreground">—</span>}
          <span className="text-xs text-muted-foreground">{trendValue}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-xl font-bold mt-0.5">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </Card>
  )
}

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

// ─── Component ──────────────────────────────────────────────────────────────
export function EnergyMonitoringPage() {
  const { energyHistory } = useIIoTStore()

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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="Energy Monitoring"
        description="Track and optimize energy consumption"
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
        />
        <EnergyKPICard
          icon={Activity}
          label="Today's Consumption"
          value={kpis.totalKwh.toLocaleString()}
          unit="kWh"
          trend="up"
          trendValue="+4.7%"
          color={C_GREEN}
        />
        <EnergyKPICard
          icon={TrendingUp}
          label="Peak Demand"
          value={kpis.peakDemand}
          unit="kW"
          trend="down"
          trendValue="-2.1%"
          color={C_RED}
        />
        <EnergyKPICard
          icon={Zap}
          label="Power Factor"
          value={kpis.powerFactor}
          unit=""
          trend={pfTrend === 'improving' ? 'up' : 'down'}
          trendValue={pfTrend === 'improving' ? '+0.003' : '-0.002'}
          color={C_CYAN}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Power Chart — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Real-time Power Consumption</CardTitle>
            <CardDescription className="text-xs">
              Power draw over the last hour — data from store energyHistory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    interval={9}
                  />
                  <YAxis
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<DarkTooltip />} />
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
          </CardContent>
        </Card>

        {/* Cost Estimation Card */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-sm">Cost Estimation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="text-lg font-bold">${costEstimate.rate}<span className="text-xs font-normal text-muted-foreground ml-1">/kWh</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Daily</p>
                <p className="text-2xl font-bold text-amber-400">${Number(costEstimate.dailyCost).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{costEstimate.dailyKwh.toLocaleString()} kWh projected</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Monthly</p>
                <p className="text-2xl font-bold text-amber-400">${Number(costEstimate.monthlyCost).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Energy Breakdown by Area</CardTitle>
            <CardDescription className="text-xs">
              Consumption distribution across machines and systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ENERGY_BREAKDOWN}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<DarkTooltip />} />
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
          </CardContent>
        </Card>

        {/* Voltage & Current Dual-Axis Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Voltage & Current</CardTitle>
            <CardDescription className="text-xs">
              Dual-axis electrical parameter monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    interval={9}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    width={45}
                    domain={[370, 390]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickLine={false}
                    width={45}
                    domain={[100, 200]}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Voltage"
                    stroke={C_CYAN}
                    strokeWidth={2}
                    dot={false}
                    name="Voltage (V)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Current"
                    stroke={C_ORANGE}
                    strokeWidth={2}
                    dot={false}
                    name="Current (A)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power Factor Trend — simple display */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Power Factor Trend</CardTitle>
          <CardDescription className="text-xs">
            Real-time power factor — target ≥ 0.90
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  {/* Background arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
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
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={Number(kpis.powerFactor) >= 0.90 ? C_GREEN : C_YELLOW}
                    strokeWidth="8"
                    strokeDasharray={`${251.3 * 0.75 * Number(kpis.powerFactor)} ${251.3 * 0.75 * (1 - Number(kpis.powerFactor))}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(135 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{kpis.powerFactor}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Average Power Factor</p>
                <div className="flex items-center gap-1.5">
                  {pfTrend === 'improving' ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-medium ${pfTrend === 'improving' ? 'text-emerald-400' : 'text-red-400'}`}
                  >
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
                  <YAxis
                    tick={{ fill: '#a1a1aa', fontSize: 9 }}
                    tickLine={false}
                    domain={[0.85, 1.0]}
                    width={35}
                  />
                  <Tooltip content={<DarkTooltip />} />
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
        </CardContent>
      </Card>
    </div>
  )
}
