import { create } from 'zustand'
import type {
  Machine,
  Device,
  Alarm,
  ProductionOrder,
  EnergyDataPoint,
  TelemetryPoint,
} from '@/types'

// ─── Real-time State Interface ──────────────────────────────────────────────
// This store is the SINGLE source of truth for WebSocket-pushed live data.
// It is ephemeral — data arrives via WebSocket and is not persisted.

interface RealtimeState {
  // Connection
  isConnected: boolean
  reconnectCount: number
  lastHeartbeat: number | null

  // Live machine status (updated by WS)
  machines: Machine[]
  // Latest telemetry stream keyed by "deviceId" or "deviceId-metric"
  telemetry: Record<string, TelemetryPoint[]>
  // Active alarms (pushed by WS)
  alarms: Alarm[]
  // Live production orders
  production: ProductionOrder[]
  // Live energy data (rolling window)
  energyHistory: EnergyDataPoint[]
  // Live device status
  devices: Device[]

  // Event log for debugging / activity feed
  eventLog: RealtimeEvent[]

  // Connection actions
  setConnected: (connected: boolean) => void
  incrementReconnect: () => void
  setLastHeartbeat: (ts: number) => void

  // Machine actions
  setMachines: (machines: Machine[]) => void
  updateMachine: (id: string, patch: Partial<Machine>) => void

  // Telemetry actions
  pushTelemetry: (key: string, point: TelemetryPoint) => void

  // Alarm actions
  setAlarms: (alarms: Alarm[]) => void
  acknowledgeAlarm: (id: string) => void
  bulkAcknowledgeAlarms: (ids: string[]) => void
  resolveAlarm: (id: string) => void

  // Production actions
  setProduction: (orders: ProductionOrder[]) => void
  updateProductionOrder: (id: string, patch: Partial<ProductionOrder>) => void

  // Energy actions
  setEnergyHistory: (data: EnergyDataPoint[]) => void
  pushEnergyPoint: (point: EnergyDataPoint) => void

  // Device actions
  setDevices: (devices: Device[]) => void
  updateDevice: (id: string, patch: Partial<Device>) => void

  // Event log
  pushEvent: (event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => void
  clearEventLog: () => void
}

export interface RealtimeEvent {
  id: string
  timestamp: number
  type: 'ws-connect' | 'ws-disconnect' | 'alarm-new' | 'alarm-ack' | 'alarm-resolve' | 'machine-status' | 'telemetry' | 'production' | 'energy' | 'device-status'
  source?: string
  summary: string
  severity?: 'critical' | 'warning' | 'info' | 'success'
}

const MAX_TELEMETRY_POINTS = 60
const MAX_ENERGY_POINTS = 120
const MAX_EVENT_LOG = 100

let eventIdCounter = 0

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  // ── Initial State ──
  isConnected: false,
  reconnectCount: 0,
  lastHeartbeat: null,

  machines: [],
  telemetry: {},
  alarms: [],
  production: [],
  energyHistory: [],
  devices: [],
  eventLog: [],

  // ── Connection ──
  setConnected: (connected) =>
    set((s) => {
      const event = !s.isConnected && connected
        ? { type: 'ws-connect' as const, summary: 'WebSocket connected', severity: 'success' as const }
        : s.isConnected && !connected
          ? { type: 'ws-disconnect' as const, summary: 'WebSocket disconnected', severity: 'warning' as const }
          : null

      if (event) {
        return {
          isConnected: connected,
          lastHeartbeat: connected ? Date.now() : s.lastHeartbeat,
          eventLog: [
            ...s.eventLog.slice(-(MAX_EVENT_LOG - 1)),
            { id: `evt-${++eventIdCounter}`, timestamp: Date.now(), ...event },
          ],
        }
      }
      return { isConnected: connected }
    }),

  incrementReconnect: () =>
    set((s) => ({ reconnectCount: s.reconnectCount + 1 })),

  setLastHeartbeat: (ts) => set({ lastHeartbeat: ts }),

  // ── Machines ──
  setMachines: (machines) => set({ machines }),

  updateMachine: (id, patch) =>
    set((s) => ({
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    })),

  // ── Telemetry ──
  pushTelemetry: (key, point) =>
    set((s) => {
      const existing = s.telemetry[key] || []
      return {
        telemetry: {
          ...s.telemetry,
          [key]: [...existing.slice(-(MAX_TELEMETRY_POINTS - 1)), point],
        },
      }
    }),

  // ── Alarms ──
  setAlarms: (alarms) => set({ alarms }),

  acknowledgeAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() } : a
      ),
    })),

  bulkAcknowledgeAlarms: (ids) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        ids.includes(a.id) ? { ...a, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() } : a
      ),
    })),

  resolveAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : a
      ),
    })),

  // ── Production ──
  setProduction: (orders) => set({ production: orders }),

  updateProductionOrder: (id, patch) =>
    set((s) => ({
      production: s.production.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    })),

  // ── Energy ──
  setEnergyHistory: (data) => set({ energyHistory: data }),

  pushEnergyPoint: (point) =>
    set((s) => ({
      energyHistory: [...s.energyHistory.slice(-(MAX_ENERGY_POINTS - 1)), point],
    })),

  // ── Devices ──
  setDevices: (devices) => set({ devices }),

  updateDevice: (id, patch) =>
    set((s) => ({
      devices: s.devices.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    })),

  // ── Event Log ──
  pushEvent: (event) =>
    set((s) => ({
      eventLog: [
        ...s.eventLog.slice(-(MAX_EVENT_LOG - 1)),
        { id: `evt-${++eventIdCounter}`, timestamp: Date.now(), ...event },
      ],
    })),

  clearEventLog: () => set({ eventLog: [] }),
}))
