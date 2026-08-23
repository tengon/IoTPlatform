import { NextRequest, NextResponse } from 'next/server'

// Mock data matching the WebSocket service
const alarms = [
  { id: 'ALM-001', alarmId: 'ALM-20250101-001', severity: 'critical', source: 'CNC Lathe #1', message: 'Spindle temperature exceeds threshold (>80°C)', status: 'active', createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'ALM-002', alarmId: 'ALM-20250101-002', severity: 'warning', source: 'Flow Meter D1', message: 'Flow rate below minimum threshold', status: 'active', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'ALM-003', alarmId: 'ALM-20250101-003', severity: 'warning', source: 'pH Sensor G1', message: 'Sensor communication lost', status: 'active', createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: 'ALM-004', alarmId: 'ALM-20250101-004', severity: 'info', source: 'Conveyor Belt #1', message: 'Scheduled maintenance in 2 hours', status: 'acknowledged', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'ALM-005', alarmId: 'ALM-20250101-005', severity: 'critical', source: 'Injection Molder #1', message: 'Hydraulic pressure drop detected', status: 'active', createdAt: new Date(Date.now() - 60000).toISOString() },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    let filtered = [...alarms]

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity)
    }
    if (status) {
      filtered = filtered.filter((a) => a.status === status)
    }
    if (source) {
      filtered = filtered.filter((a) => a.source.toLowerCase().includes(source.toLowerCase()))
    }

    return NextResponse.json({ data: filtered, total: filtered.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch alarms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alarmId } = body

    if (!alarmId) {
      return NextResponse.json(
        { error: 'alarmId is required for acknowledgement' },
        { status: 400 }
      )
    }

    const alarm = alarms.find((a) => a.alarmId === alarmId || a.id === alarmId)
    if (!alarm) {
      return NextResponse.json(
        { error: 'Alarm not found' },
        { status: 404 }
      )
    }

    alarm.status = 'acknowledged'

    return NextResponse.json({ data: alarm })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to acknowledge alarm' },
      { status: 500 }
    )
  }
}
