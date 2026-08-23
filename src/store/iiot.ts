import { create } from 'zustand'

export interface TelemetryPoint {
  timestamp: number
  value: number
}

export interface DeviceStatus {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'warning' | 'error'
 lastSeen: string
  metrics: Record<string, number>
}

export interface AlarmItem {
  id: string
  alarmId: string
  severity: 'critical' | 'warning' | 'info'
  source: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: string
}

export interface MachineStatus {
  id: string
  name: string
  type: string
  status: 'running' | 'idle' | 'maintenance' | 'error'
  oee: number
  availability: number
  performance: number
  quality: number
  temperature: number
  rpm: number
  power: number
}

export interface ProductionOrder {
  id: string
  machineName: string
  productName: string
  target: number
  actual: number
  defects: number
  status: 'running' | 'completed' | 'paused'
  startTime: string
  progress: number
}

export interface EnergyData {
  timestamp: number
  kwh: number
  voltage: number
  current: number
  powerFactor: number
}

interface IIoTState {
  devices: DeviceStatus[]
  alarms: AlarmItem[]
  machines: MachineStatus[]
  production: ProductionOrder[]
  energyHistory: EnergyData[]
  liveTelemetry: Record<string, TelemetryPoint[]>
  isConnected: boolean
  lastUpdate: number | null
  setDevices: (devices: DeviceStatus[]) => void
  setAlarms: (alarms: AlarmItem[]) => void
  setMachines: (machines: MachineStatus[]) => void
  setProduction: (orders: ProductionOrder[]) => void
  setEnergyHistory: (data: EnergyData[]) => void
  updateTelemetry: (deviceId: string, point: TelemetryPoint) => void
  setConnected: (connected: boolean) => void
  acknowledgeAlarm: (id: string) => void
}

export const useIIoTStore = create<IIoTState>((set) => ({
  devices: [],
  alarms: [],
  machines: [],
  production: [],
  energyHistory: [],
  liveTelemetry: {},
  isConnected: false,
  lastUpdate: null,
  setDevices: (devices) => set({ devices, lastUpdate: Date.now() }),
  setAlarms: (alarms) => set({ alarms, lastUpdate: Date.now() }),
  setMachines: (machines) => set({ machines, lastUpdate: Date.now() }),
  setProduction: (orders) => set({ production: orders, lastUpdate: Date.now() }),
  setEnergyHistory: (data) => set({ energyHistory: data, lastUpdate: Date.now() }),
  updateTelemetry: (deviceId, point) =>
    set((s) => {
      const existing = s.liveTelemetry[deviceId] || []
      const updated = [...existing.slice(-59), point]
      return { liveTelemetry: { ...s.liveTelemetry, [deviceId]: updated } }
    }),
  setConnected: (connected) => set({ isConnected: connected }),
  acknowledgeAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, status: 'acknowledged' as const } : a
      ),
    })),
}))
