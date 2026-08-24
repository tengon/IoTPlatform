import { NextRequest, NextResponse } from 'next/server'

// Generate mock energy history data matching the WebSocket service
// Note: Real-time energy data comes from the WebSocket service on port 3002.
function generateEnergyHistory(from: number, to: number, interval: number) {
  const data: Array<{ timestamp: number; kwh: number; voltage: number; current: number; powerFactor: number }> = []
  let kwh = 245.8

  for (let ts = from; ts <= to; ts += interval) {
    kwh += (Math.random() - 0.45) * 4
    data.push({
      timestamp: ts,
      kwh: Math.round(kwh * 100) / 100,
      voltage: 380 + (Math.random() - 0.5) * 6,
      current: 65 + (Math.random() - 0.5) * 10,
      powerFactor: 0.92 + (Math.random() - 0.5) * 0.04,
    })
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const intervalParam = searchParams.get('interval')

    const now = Date.now()
    const from = fromParam ? parseInt(fromParam, 10) : now - 2 * 60 * 60 * 1000 // default: 2h ago
    const to = toParam ? parseInt(toParam, 10) : now
    const interval = intervalParam ? parseInt(intervalParam, 10) : 60000 // default: 1min

    const data = generateEnergyHistory(from, to, interval)

    return NextResponse.json({ data, total: data.length, from, to, interval })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch energy history' },
      { status: 500 }
    )
  }
}
