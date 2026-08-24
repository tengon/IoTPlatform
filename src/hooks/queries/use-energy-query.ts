import { useQuery } from '@tanstack/react-query'
import type { EnergyDataPoint, ApiResponse } from '@/types'

const STALE_TIME = 2 * 60 * 1000 // 2 min

interface EnergyQueryParams {
  from?: number
  to?: number
  interval?: number
}

async function fetchEnergy(params?: EnergyQueryParams): Promise<EnergyDataPoint[]> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', String(params.from))
  if (params?.to) searchParams.set('to', String(params.to))
  if (params?.interval) searchParams.set('interval', String(params.interval))

  const qs = searchParams.toString()
  const url = `/api/energy${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch energy data')
  const json: ApiResponse<EnergyDataPoint> = await res.json()
  return json.data
}

export function useEnergyQuery(params?: EnergyQueryParams) {
  return useQuery({
    queryKey: ['energy', params],
    queryFn: () => fetchEnergy(params),
    staleTime: STALE_TIME,
    refetchInterval: 2 * 60 * 1000,
  })
}
