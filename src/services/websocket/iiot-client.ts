'use client'

import { useEffect, useRef } from 'react'
import { useIIoTStore } from '@/store/iiot'
import type { DeviceStatus, MachineStatus, AlarmItem, ProductionOrder, EnergyData } from '@/store/iiot'

export function useIIoTWebSocket() {
  const socketRef = useRef<any>(null)
  const storeRef = useRef(useIIoTStore.getState())
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

        const store = storeRef.current

        socket.on('connect', () => {
          store.setConnected(true)
        })

        socket.on('disconnect', () => {
          store.setConnected(false)
        })

        socket.on('connect_error', () => {
          // socket.io will auto-reconnect
        })

        socket.on('init', (data: {
          machines: Array<any>
          devices: Array<any>
          alarms: Array<any>
          production: Array<any>
          energyHistory: Array<any>
        }) => {
          store.setDevices(data.devices.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status as DeviceStatus['status'],
            lastSeen: new Date().toISOString(),
            metrics: d.metrics,
          })))

          store.setMachines(data.machines.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            status: 'running' as const,
            oee: m.oee,
            availability: m.availability,
            performance: m.performance,
            quality: m.quality,
            temperature: m.baseTemp,
            rpm: m.baseRpm,
            power: m.basePower,
            healthScore: Math.floor(Math.random() * 29) + 70,
          })))

          store.setAlarms(data.alarms.map((a: any) => ({
            id: a.id,
            alarmId: a.alarmId,
            severity: a.severity,
            source: a.source,
            message: a.message,
            status: a.status,
            createdAt: a.createdAt,
          })))

          store.setProduction(data.production.map((p: any) => ({
            id: p.id,
            machineName: p.machineName,
            productName: p.productName,
            target: p.target,
            actual: p.actual,
            defects: p.defects,
            status: p.status,
            startTime: p.startTime,
            progress: p.progress,
          })))

          store.setEnergyHistory(data.energyHistory)
        })

        socket.on('telemetry', (data: { deviceId: string; metric?: string; point: { timestamp: number; value: number } }) => {
          const key = data.metric ? `${data.deviceId}-${data.metric}` : data.deviceId
          store.updateTelemetry(key, data.point)
        })

        socket.on('alarms', (data: AlarmItem[]) => {
          store.setAlarms(data)
        })

        socket.on('production', (data: ProductionOrder[]) => {
          store.setProduction(data)
        })

        socket.on('energy', (data: EnergyData) => {
          const prev = useIIoTStore.getState().energyHistory
          store.setEnergyHistory([...prev.slice(-119), data])
        })

        socketRef.current = socket
      } catch (err) {
        console.error('[IIoT] Failed to initialize:', err)
      }
    }

    init()

    return () => {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return socketRef
}
