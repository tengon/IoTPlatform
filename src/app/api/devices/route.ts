import { NextRequest, NextResponse } from 'next/server'

// Mock data matching the WebSocket service
// Note: Real-time device data comes from the WebSocket service on port 3002.
// This API returns the static baseline for REST-based consumers.
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

export async function GET() {
  try {
    return NextResponse.json({ data: devices, total: devices.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type = 'sensor', status = 'offline' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const newDevice = {
      id: `DEV-${String(devices.length + 1).padStart(3, '0')}`,
      name,
      type,
      status,
      metrics: {},
    }

    return NextResponse.json({ data: newDevice }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}
