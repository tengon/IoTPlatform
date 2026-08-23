import { NextResponse } from 'next/server'

// Mock data matching the WebSocket service
// Note: Real-time production data comes from the WebSocket service on port 3002.
const production = [
  { id: 'PO-001', machineName: 'CNC Lathe #1', productName: 'Bearing Housing BH-200', target: 500, actual: 387, defects: 3, status: 'running', startTime: new Date(Date.now() - 28800000).toISOString(), progress: 77.4 },
  { id: 'PO-002', machineName: 'CNC Mill #1', productName: 'Gear Shaft GS-150', target: 200, actual: 198, defects: 1, status: 'running', startTime: new Date(Date.now() - 21600000).toISOString(), progress: 99.0 },
  { id: 'PO-003', machineName: 'Injection Molder #1', productName: 'Plastic Cap PC-50', target: 10000, actual: 7230, defects: 45, status: 'running', startTime: new Date(Date.now() - 43200000).toISOString(), progress: 72.3 },
  { id: 'PO-004', machineName: 'Packaging Line #1', productName: 'Assembly Kit AK-100', target: 1000, actual: 1000, defects: 2, status: 'completed', startTime: new Date(Date.now() - 36000000).toISOString(), progress: 100 },
  { id: 'PO-005', machineName: 'Robot Arm #1', productName: 'Welded Frame WF-300', target: 150, actual: 89, defects: 0, status: 'running', startTime: new Date(Date.now() - 14400000).toISOString(), progress: 59.3 },
]

export async function GET() {
  try {
    return NextResponse.json({ data: production, total: production.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch production orders' },
      { status: 500 }
    )
  }
}
