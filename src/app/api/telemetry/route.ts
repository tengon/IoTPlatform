import { NextRequest, NextResponse } from 'next/server'
import type { TelemetrySeries } from '@/types'

// Generate mock historical telemetry data for a device/metric pair.
// In production, this would query a time-series database (InfluxDB, TimescaleDB, etc.)
function generateTelemetrySeries(
  deviceId: string,
  metric: string,
  from: number,
  to: number,
  interval: number
): TelemetrySeries {
  const points: Array<{ timestamp: number; value: number }> = []

  // Base values per metric for realistic simulation
  const baseValues: Record<string, { base: number; variance: number; unit: string }> = {
    temperature: { base: 42, variance: 8, unit: '°C' },
    vibration: { base: 0.45, variance: 0.3, unit: 'mm/s' },
    pressure: { base: 4.2, variance: 1.5, unit: 'bar' },
    flow: { base: 12.8, variance: 3, unit: 'L/min' },
    power: { base: 45.2, variance: 10, unit: 'kW' },
    rpm: { base: 800, variance: 100, unit: 'rpm' },
    current: { base: 65, variance: 10, unit: 'A' },
    voltage: { base: 380, variance: 6, unit: 'V' },
  }

  const config = baseValues[metric] || { base: 50, variance: 10, unit: '' }
  let value = config.base

  for (let ts = from; ts <= to; ts += interval) {
    // Random walk with mean reversion
    const drift = (config.base - value) * 0.05
    const noise = (Math.random() - 0.5) * config.variance * 0.3
    value += drift + noise
    value = Math.max(config.base - config.variance * 2, Math.min(config.base + config.variance * 2, value))

    points.push({
      timestamp: ts,
      value: Math.round(value * 100) / 100,
    })
  }

  return {
    deviceId,
    metric,
    points,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId') || 'unknown'
    const metric = searchParams.get('metric') || 'temperature'
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const intervalParam = searchParams.get('interval')

    const now = Date.now()
    const from = fromParam ? parseInt(fromParam, 10) : now - 2 * 60 * 60 * 1000
    const to = toParam ? parseInt(toParam, 10) : now
    const interval = intervalParam ? parseInt(intervalParam, 10) : 60000

    const series = generateTelemetrySeries(deviceId, metric, from, to, interval)

    return NextResponse.json({
      data: [series],
      total: series.points.length,
      from,
      to,
      interval,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch telemetry' },
      { status: 500 }
    )
  }
}
