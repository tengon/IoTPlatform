import { useQuery } from '@tanstack/react-query'
import type { Alarm, ApiResponse } from '@/types'

const STALE_TIME = 30 * 1000 // 30s — alarms change frequently

interface AlarmQueryParams {
  severity?: string
  status?: string
  source?: string
}

async function fetchAlarms(params?: AlarmQueryParams): Promise<Alarm[]> {
  const searchParams = new URLSearchParams()
  if (params?.severity) searchParams.set('severity', params.severity)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.source) searchParams.set('source', params.source)

  const qs = searchParams.toString()
  const url = `/api/alarms${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch alarms')
  const json: ApiResponse<Alarm> = await res.json()
  return json.data
}

export function useAlarmsQuery(params?: AlarmQueryParams) {
  return useQuery({
    queryKey: ['alarms', params],
    queryFn: () => fetchAlarms(params),
    staleTime: STALE_TIME,
    refetchInterval: 30 * 1000,
  })
}
