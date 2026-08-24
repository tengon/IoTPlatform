import { useQuery } from '@tanstack/react-query'
import type { Site, ApiResponse } from '@/types'

const STALE_TIME = 30 * 60 * 1000 // 30 min — sites rarely change

async function fetchSites(): Promise<Site[]> {
  const res = await fetch('/api/sites')
  if (!res.ok) throw new Error('Failed to fetch sites')
  const json: ApiResponse<Site> = await res.json()
  return json.data
}

export function useSitesQuery() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
    staleTime: STALE_TIME,
  })
}