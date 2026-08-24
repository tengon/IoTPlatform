'use client'

import { useEffect, useRef } from 'react'
import { useIIoTStore } from '@/store/iiot'
import { useRealtimeStore } from '@/store/realtime-store'
import type { Device, Alarm, ProductionOrder, EnergyDataPoint, Machine } from '@/types'

// ─── WebSocket Init Component ──────────────────────────────────────────
// Connects to the IIoT WebSocket service and populates:
//   1. Legacy store (useIIoTStore) — for backward compatibility
//   2. New realtime store (useRealtimeStore) — for 3-layer architecture

export function WSInit() {
  const legacyRef = useRef(useIIoTStore.getState())
  const realtimeRef = useRef(useRealtimeStore.getState())
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let socket: any = null

    const init = async () => {
      try {
        const { io } = await import('socket.io-client')

        const wsUrl = window.location.port === '3000'
          ? 'http://localhost:3002'
          : window.location.origin + '/?XTransformPort=3002'

        socket = io(wsUrl, {
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 10000,
        })

        const legacy = legacyRef.current
        const rt = realtimeRef.current

        // ── Connection ──
        socket.on('connect', () => {
          legacy.setConnected(true)
          rt.setConnected(true)
          rt.setLastHeartbeat(Date.now())
        })

        socket.on('disconnect', () => {
          legacy.setConnected(false)
          rt.setConnected(false)
        })

        socket.on('connect_error', () => {})

        // ── Init (full state snapshot) ──
        socket.on('init', (data: any) => {
          // Legacy store
          legacy.setDevices(data.devices.map((d: any) => ({
            id: d.id, name: d.name, type: d.type,
            status: d.status as Device['status'],
            lastSeen: new Date().toISOString(), metrics: d.metrics,
          })))
          legacy.setMachines(data.machines.map((m: any) => ({
            id: m.id, name: m.name, type: m.type,
            status: 'running' as const,
            oee: m.oee, availability: m.availability,
            performance: m.performance, quality: m.quality,
            temperature: m.baseTemp, rpm: m.baseRpm, power: m.basePower,
            healthScore: Math.floor(Math.random() * 29) + 70,
          })))
          legacy.setAlarms(data.alarms.map((a: any) => ({
            id: a.id, alarmId: a.alarmId, severity: a.severity,
            source: a.source, message: a.message, status: a.status, createdAt: a.createdAt,
          })))
          legacy.setProduction(data.production.map((p: any) => ({
            id: p.id, machineName: p.machineName, productName: p.productName,
            target: p.target, actual: p.actual, defects: p.defects,
            status: p.status, startTime: p.startTime, progress: p.progress,
          })))
          legacy.setEnergyHistory(data.energyHistory)

          // New realtime store
          rt.setDevices(data.devices.map((d: any) => ({
            id: d.id, name: d.name, type: d.type,
            status: d.status as Device['status'],
            lastSeen: new Date().toISOString(), metrics: d.metrics,
          })))
          rt.setMachines(data.machines.map((m: any) => ({
            id: m.id, name: m.name, type: m.type,
            status: 'running' as const,
            oee: m.oee, availability: m.availability,
            performance: m.performance, quality: m.quality,
            temperature: m.baseTemp, rpm: m.baseRpm, power: m.basePower,
            healthScore: Math.floor(Math.random() * 29) + 70,
          })))
          rt.setAlarms(data.alarms.map((a: any) => ({
            id: a.id, alarmId: a.alarmId, severity: a.severity,
            source: a.source, message: a.message, status: a.status, createdAt: a.createdAt,
          })))
          rt.setProduction(data.production.map((p: any) => ({
            id: p.id, machineName: p.machineName, productName: p.productName,
            target: p.target, actual: p.actual, defects: p.defects,
            status: p.status, startTime: p.startTime, progress: p.progress,
          })))
          rt.setEnergyHistory(data.energyHistory)
        })

        // ── Telemetry ──
        socket.on('telemetry', (data: { deviceId: string; metric?: string; point: { timestamp: number; value: number } }) => {
          const key = data.metric ? `${data.deviceId}-${data.metric}` : data.deviceId
          legacy.updateTelemetry(key, data.point)
          rt.pushTelemetry(key, data.point)
          rt.setLastHeartbeat(Date.now())
        })

        // ── Alarms ──
        socket.on('alarms', (data: Alarm[]) => {
          legacy.setAlarms(data)
          rt.setAlarms(data)
        })

        // ── Production ──
        socket.on('production', (data: ProductionOrder[]) => {
          legacy.setProduction(data)
          rt.setProduction(data)
        })

        // ── Energy ──
        socket.on('energy', (data: EnergyDataPoint) => {
          const prevLegacy = useIIoTStore.getState().energyHistory
          legacy.setEnergyHistory([...prevLegacy.slice(-119), data])

          const prevRt = useRealtimeStore.getState().energyHistory
          rt.pushEnergyPoint(data)
        })
      } catch (err) {
        console.error('[IIoT] Failed to initialize:', err)
      }
    }

    init()

    return () => {
      if (socket) { socket.removeAllListeners(); socket.disconnect() }
    }
  }, [])

  return null
}
