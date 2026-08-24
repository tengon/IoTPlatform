import { useQuery } from '@tanstack/react-query'
import type { Device, ApiResponse } from '@/types'

const STALE_TIME = 5 * 60 * 1000

async function fetchDevices(): Promise<Device[]> {
  const res = await fetch('/api/devices')
  if (!res.ok) throw new Error('Failed to fetch devices')
  const json: ApiResponse<any> = await res.json()
  return json.data
}

export function useDevicesQuery() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: STALE_TIME,
    refetchInterval: 5 * 60 * 1000,
  })
}
