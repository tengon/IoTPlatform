// ─── Domain Types for IIoT Platform ─────────────────────────────────────────
// Shared across all state layers: Server, Real-time, UI

// ─── Machine ──────────────────────────────────────────────────────────────────
export type MachineStatusType = 'running' | 'idle' | 'maintenance' | 'error'

export interface Machine {
  id: string
  name: string
  type: string
  status: MachineStatusType
  oee: number
  availability: number
  performance: number
  quality: number
  temperature: number
  rpm: number
  power: number
  healthScore: number
  siteId?: string
}

// ─── Device ───────────────────────────────────────────────────────────────────
export type DeviceStatusType = 'online' | 'offline' | 'warning' | 'error'

export interface Device {
  id: string
  name: string
  type: string
  status: DeviceStatusType
  lastSeen: string
  metrics: Record<string, number>
  siteId?: string
  gatewayId?: string
}

// ─── Alarm ────────────────────────────────────────────────────────────────────
export type AlarmSeverity = 'critical' | 'warning' | 'info'
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved'

export interface Alarm {
  id: string
  alarmId: string
  severity: AlarmSeverity
  source: string
  message: string
  status: AlarmStatus
  createdAt: string
  resolvedAt?: string
  acknowledgedAt?: string
}

// ─── Telemetry ────────────────────────────────────────────────────────────────
export interface TelemetryPoint {
  timestamp: number
  value: number
}

export interface TelemetrySeries {
  deviceId: string
  metric: string
  points: TelemetryPoint[]
}

// ─── Production ───────────────────────────────────────────────────────────────
export type ProductionStatus = 'running' | 'completed' | 'paused'

export interface ProductionOrder {
  id: string
  machineName: string
  productName: string
  target: number
  actual: number
  defects: number
  status: ProductionStatus
  startTime: string
  progress: number
}

// ─── Energy ───────────────────────────────────────────────────────────────────
export interface EnergyDataPoint {
  timestamp: number
  kwh: number
  voltage: number
  current: number
  powerFactor: number
}

// ─── Site / Factory ───────────────────────────────────────────────────────────
export type SiteStatus = 'active' | 'commissioning' | 'inactive'

export interface Site {
  id: string
  name: string
  code: string
  address: string
  timezone: string
  deviceCount: number
  machineCount: number
  status: SiteStatus
}

// ─── Gateway ──────────────────────────────────────────────────────────────────
export type GatewayStatus = 'connected' | 'disconnected' | 'degraded'

export interface Gateway {
  id: string
  name: string
  ip: string
  protocol: string
  deviceCount: number
  status: GatewayStatus
  lastSeen: string
  firmware: string
  siteId?: string
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  total?: number
  from?: number
  to?: number
  interval?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
 page: number
  pageSize: number
  totalPages: number
}

// ─── UI State Types ───────────────────────────────────────────────────────────
export type TimeRangePreset = '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'custom'

export interface TimeRange {
 preset: TimeRangePreset
  from: number
  to: number
  label: string
}

export interface ChartConfig {
  showGrid: boolean
  showLegend: boolean
  showTooltip: boolean
  smoothLines: boolean
  lineWidth: number
  pointSize: number
  animationEnabled: boolean
}

export interface FactoryFilter {
  siteId: string | null  // null = all sites
  siteName: string | null
}

// ─── WebSocket Event Types ────────────────────────────────────────────────────
export type WSEventType = 'init' | 'telemetry' | 'alarms' | 'production' | 'energy' | 'machine-update'

export interface WSInitPayload {
  machines: Array<any>
  devices: Array<any>
  alarms: Array<any>
  production: Array<any>
  energyHistory: Array<any>
}

export interface WSTelemetryPayload {
  deviceId: string
  metric?: string
  point: TelemetryPoint
}

// ─── Backward-compatible aliases ──────────────────────────────────────────────
// These aliases ensure the old `store/iiot.ts` imports continue to work
export type DeviceStatus = Device
export type AlarmItem = Alarm
export type MachineStatus = Machine
export type EnergyData = EnergyDataPoint
