import { useQuery } from '@tanstack/react-query'
import type { ProductionOrder, ApiResponse } from '@/types'

const STALE_TIME = 60 * 1000 // 1 min

async function fetchProduction(): Promise<ProductionOrder[]> {
  const res = await fetch('/api/production')
  if (!res.ok) throw new Error('Failed to fetch production orders')
  const json: ApiResponse<ProductionOrder> = await res.json()
  return json.data
}

export function useProductionQuery() {
  return useQuery({
    queryKey: ['production'],
    queryFn: fetchProduction,
    staleTime: STALE_TIME,
    refetchInterval: 60 * 1000,
  })
}
