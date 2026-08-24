import { NextRequest, NextResponse } from 'next/server'

// Mock data matching the WebSocket service
const machines = [
  { id: 'MCH-001', name: 'CNC Lathe #1', type: 'CNC Machine', status: 'running', oee: 87.3, availability: 94.2, performance: 95.1, quality: 97.8, temperature: 42.5, rpm: 1200, power: 15.5, siteId: 'SITE-001' },
  { id: 'MCH-002', name: 'CNC Mill #1', type: 'CNC Machine', status: 'running', oee: 82.1, availability: 91.5, performance: 88.7, quality: 99.2, temperature: 45.2, rpm: 800, power: 22.3, siteId: 'SITE-001' },
  { id: 'MCH-003', name: 'Injection Molder #1', type: 'Injection Molding', status: 'warning', oee: 79.5, availability: 88.3, performance: 92.4, quality: 97.1, temperature: 185.4, rpm: 0, power: 35.2, siteId: 'SITE-001' },
  { id: 'MCH-004', name: 'Conveyor Belt #1', type: 'Conveyor', status: 'running', oee: 91.2, availability: 96.8, performance: 95.3, quality: 99.5, temperature: 28.3, rpm: 60, power: 5.8, siteId: 'SITE-002' },
  { id: 'MCH-005', name: 'Robot Arm #1', type: 'Robot', status: 'idle', oee: 85.7, availability: 93.1, performance: 90.8, quality: 98.4, temperature: 35.1, rpm: 0, power: 8.2, siteId: 'SITE-002' },
  { id: 'MCH-006', name: 'Packaging Line #1', type: 'Packaging', status: 'running', oee: 88.9, availability: 95.6, performance: 92.7, quality: 98.9, temperature: 30.2, rpm: 120, power: 12.1, siteId: 'SITE-002' },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    let filtered = [...machines]

    if (id) {
      const machine = filtered.find((m) => m.id === id)
      if (!machine) {
        return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
      }
      return NextResponse.json({ data: machine })
    }

    if (siteId) {
      filtered = filtered.filter((m) => m.siteId === siteId)
    }
    if (status) {
      filtered = filtered.filter((m) => m.status === status)
    }

    return NextResponse.json({ data: filtered, total: filtered.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch machines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, status = 'idle' } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    const newMachine = {
      id: `MCH-${String(machines.length + 1).padStart(3, '0')}`,
      name,
      type,
      status,
      oee: 0,
      availability: 100,
      performance: 100,
      quality: 100,
      temperature: 25,
      rpm: 0,
      power: 0,
      siteId: 'SITE-001',
    }

    return NextResponse.json({ data: newMachine }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create machine' },
      { status: 500 }
    )
  }
}
