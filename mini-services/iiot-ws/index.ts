import { Server } from 'socket.io'

const io = new Server(3002, {
  cors: { origin: '*' }
})

const machines = [
  { id: 'MCH-001', name: 'CNC Lathe #1', type: 'CNC Machine', baseTemp: 42, baseRpm: 1200, basePower: 15.5, oee: 87.3, availability: 94.2, performance: 95.1, quality: 97.8 },
  { id: 'MCH-002', name: 'CNC Mill #1', type: 'CNC Machine', baseTemp: 45, baseRpm: 800, basePower: 22.3, oee: 82.1, availability: 91.5, performance: 88.7, quality: 99.2 },
  { id: 'MCH-003', name: 'Injection Molder #1', type: 'Injection Molding', baseTemp: 185, baseRpm: 0, basePower: 35.2, oee: 79.5, availability: 88.3, performance: 92.4, quality: 97.1 },
  { id: 'MCH-004', name: 'Conveyor Belt #1', type: 'Conveyor', baseTemp: 28, baseRpm: 60, basePower: 5.8, oee: 91.2, availability: 96.8, performance: 95.3, quality: 99.5 },
  { id: 'MCH-005', name: 'Robot Arm #1', type: 'Robot', baseTemp: 35, baseRpm: 0, basePower: 8.2, oee: 85.7, availability: 93.1, performance: 90.8, quality: 98.4 },
  { id: 'MCH-006', name: 'Packaging Line #1', type: 'Packaging', baseTemp: 30, baseRpm: 120, basePower: 12.1, oee: 88.9, availability: 95.6, performance: 92.7, quality: 98.9 },
]

const devices = [
  { id: 'DEV-001', name: 'Temp Sensor A1', type: 'Temperature', status: 'online', metrics: { temperature: 42.5, humidity: 65.2 } },
  { id: 'DEV-002', name: 'Vibration Sensor B1', type: 'Vibration', status: 'online', metrics: { vibration: 0.45, frequency: 120 } },
  { id: 'DEV-003', name: 'Pressure Sensor C1', type: 'Pressure', status: 'online', metrics: { pressure: 4.2, flow: 12.8 } },
  { id: 'DEV-004', name: 'Flow Meter D1', type: 'Flow', status: 'warning', metrics: { flowRate: 8.5, totalFlow: 12450 } },
  { id: 'DEV-005', name: 'Power Meter E1', type: 'Energy', status: 'online', metrics: { power: 45.2, voltage: 380, current: 68.7 } },
  { id: 'DEV-006', name: 'Level Sensor F1', type: 'Level', status: 'online', metrics: { level: 72.5, capacity: 100 } },
  { id: 'DEV-007', name: 'pH Sensor G1', type: 'Chemical', status: 'error', metrics: { ph: 6.8, orp: 250 } },
  { id: 'DEV-008', name: 'Proximity Sensor H1', type: 'Proximity', status: 'online', metrics: { distance: 15.2, signal: 98 } },
]

const alarms = [
  { id: 'ALM-001', alarmId: 'ALM-20250101-001', severity: 'critical', source: 'CNC Lathe #1', message: 'Spindle temperature exceeds threshold (>80°C)', status: 'active', createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'ALM-002', alarmId: 'ALM-20250101-002', severity: 'warning', source: 'Flow Meter D1', message: 'Flow rate below minimum threshold', status: 'active', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'ALM-003', alarmId: 'ALM-20250101-003', severity: 'warning', source: 'pH Sensor G1', message: 'Sensor communication lost', status: 'active', createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: 'ALM-004', alarmId: 'ALM-20250101-004', severity: 'info', source: 'Conveyor Belt #1', message: 'Scheduled maintenance in 2 hours', status: 'acknowledged', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'ALM-005', alarmId: 'ALM-20250101-005', severity: 'critical', source: 'Injection Molder #1', message: 'Hydraulic pressure drop detected', status: 'active', createdAt: new Date(Date.now() - 60000).toISOString() },
]

const production = [
  { id: 'PO-001', machineName: 'CNC Lathe #1', productName: 'Bearing Housing BH-200', target: 500, actual: 387, defects: 3, status: 'running', startTime: new Date(Date.now() - 28800000).toISOString(), progress: 77.4 },
  { id: 'PO-002', machineName: 'CNC Mill #1', productName: 'Gear Shaft GS-150', target: 200, actual: 198, defects: 1, status: 'running', startTime: new Date(Date.now() - 21600000).toISOString(), progress: 99.0 },
  { id: 'PO-003', machineName: 'Injection Molder #1', productName: 'Plastic Cap PC-50', target: 10000, actual: 7230, defects: 45, status: 'running', startTime: new Date(Date.now() - 43200000).toISOString(), progress: 72.3 },
  { id: 'PO-004', machineName: 'Packaging Line #1', productName: 'Assembly Kit AK-100', target: 1000, actual: 1000, defects: 2, status: 'completed', startTime: new Date(Date.now() - 36000000).toISOString(), progress: 100 },
  { id: 'PO-005', machineName: 'Robot Arm #1', productName: 'Welded Frame WF-300', target: 150, actual: 89, defects: 0, status: 'running', startTime: new Date(Date.now() - 14400000).toISOString(), progress: 59.3 },
]

let energyBase = 245.8
const energyHistory: Array<{ timestamp: number; kwh: number; voltage: number; current: number; powerFactor: number }> = []
const now = Date.now()
for (let i = 120; i >= 0; i--) {
  energyBase += (Math.random() - 0.45) * 8
  energyHistory.push({
    timestamp: now - i * 60000,
    kwh: Math.round(energyBase * 100) / 100,
    voltage: 380 + (Math.random() - 0.5) * 6,
    current: 65 + (Math.random() - 0.5) * 10,
    powerFactor: 0.92 + (Math.random() - 0.5) * 0.04,
  })
}

function jitter(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * range) * 100) / 100
}

let alarmCounter = 6

io.on('connection', (socket) => {
  console.log(`[IIoT WS] Client connected: ${socket.id}`)

  socket.emit('init', { machines, devices, alarms, production, energyHistory })

  const telemetryInterval = setInterval(() => {
    const ts = Date.now()
    machines.forEach((m) => {
      socket.emit('telemetry', {
        deviceId: m.id,
        point: { timestamp: ts, value: jitter(m.baseTemp, 8) },
        metrics: {
          temperature: jitter(m.baseTemp, 8),
          rpm: jitter(m.baseRpm, 50),
          power: jitter(m.basePower, 3),
        },
      })
    })

    devices.forEach((d) => {
      const keys = Object.keys(d.metrics)
      keys.forEach((k) => {
        socket.emit('telemetry', {
          deviceId: d.id,
          metric: k,
          point: { timestamp: ts, value: jitter(d.metrics[k], d.metrics[k] * 0.05) },
        })
      })
    })

    energyBase += (Math.random() - 0.45) * 4
    socket.emit('energy', {
      timestamp: ts,
      kwh: Math.round(energyBase * 100) / 100,
      voltage: 380 + (Math.random() - 0.5) * 6,
      current: 65 + (Math.random() - 0.5) * 10,
      powerFactor: 0.92 + (Math.random() - 0.5) * 0.04,
    })
  }, 2000)

  const productionInterval = setInterval(() => {
    production.forEach((p) => {
      if (p.status === 'running' && p.actual < p.target) {
        p.actual += Math.floor(Math.random() * 3)
        if (p.actual >= p.target) {
          p.actual = p.target
          p.status = 'completed'
        }
        p.progress = Math.round((p.actual / p.target) * 1000) / 10
      }
    })
    socket.emit('production', production)
  }, 5000)

  const alarmInterval = setInterval(() => {
    if (Math.random() > 0.7) {
      alarmCounter++
      const sources = ['CNC Lathe #1', 'CNC Mill #1', 'Injection Molder #1', 'Flow Meter D1', 'pH Sensor G1']
      const msgs = [
        'Temperature fluctuation detected',
        'Vibration level above normal',
        'Communication latency increased',
        'Power consumption spike',
        'Sensor calibration drift',
      ]
      const newAlarm = {
        id: `ALM-${String(alarmCounter).padStart(3, '0')}`,
        alarmId: `ALM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(alarmCounter).padStart(3, '0')}`,
        severity: ['critical', 'warning', 'info'][Math.floor(Math.random() * 3)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: msgs[Math.floor(Math.random() * msgs.length)],
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      alarms.unshift(newAlarm as any)
      if (alarms.length > 50) alarms.pop()
      socket.emit('alarms', [...alarms])
    }
  }, 8000)

  socket.on('acknowledge-alarm', (alarmId: string) => {
    const alarm = alarms.find((a) => a.alarmId === alarmId || a.id === alarmId)
    if (alarm) {
      alarm.status = 'acknowledged'
      socket.emit('alarms', [...alarms])
    }
  })

  socket.on('disconnect', () => {
    console.log(`[IIoT WS] Client disconnected: ${socket.id}`)
    clearInterval(telemetryInterval)
    clearInterval(productionInterval)
    clearInterval(alarmInterval)
  })
})

console.log('[IIoT WS] Service running on port 3002')
