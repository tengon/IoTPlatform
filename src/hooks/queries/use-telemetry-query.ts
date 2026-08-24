import { useQuery } from '@tanstack/react-query'
import type { TelemetrySeries, ApiResponse } from '@/types'

const STALE_TIME = 2 * 60 * 1000 // 2 min

interface TelemetryQueryParams {
  deviceId?: string
  metric?: string
  from?: number
  to?: number
  interval?: number
}

async function fetchTelemetry(params?: TelemetryQueryParams): Promise<TelemetrySeries[]> {
  const searchParams = new URLSearchParams()
  if (params?.deviceId) searchParams.set('deviceId', params.deviceId)
  if (params?.metric) searchParams.set('metric', params.metric)
  if (params?.from) searchParams.set('from', String(params.from))
  if (params?.to) searchParams.set('to', String(params.to))
  if (params?.interval) searchParams.set('interval', String(params.interval))

  const qs = searchParams.toString()
  const url = `/api/telemetry${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch telemetry')
  const json: ApiResponse<TelemetrySeries> = await res.json()
  return json.data
}

export function useTelemetryQuery(params?: TelemetryQueryParams) {
  return useQuery({
    queryKey: ['telemetry', params],
    queryFn: () => fetchTelemetry(params),
    staleTime: STALE_TIME,
    refetchInterval: 2 * 60 * 1000,
    enabled: !!(params?.deviceId),
  })
}
