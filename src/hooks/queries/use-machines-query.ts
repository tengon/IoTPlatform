import { useQuery } from '@tanstack/react-query'
import type { Machine, ApiResponse } from '@/types'

const STALE_TIME = 5 * 60 * 1000 // 5 min — baseline changes infrequently

async function fetchMachines(): Promise<Machine[]> {
  const res = await fetch('/api/machines')
  if (!res.ok) throw new Error('Failed to fetch machines')
  const json: ApiResponse<any> = await res.json()
  return json.data
}

async function fetchMachine(id: string): Promise<Machine> {
  const res = await fetch(`/api/machines?id=${id}`)
  if (!res.ok) throw new Error('Failed to fetch machine')
  const json: ApiResponse<any> = await res.json()
  return json.data
}

export function useMachinesQuery() {
  return useQuery({
    queryKey: ['machines'],
    queryFn: fetchMachines,
    staleTime: STALE_TIME,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useMachineQuery(id: string) {
  return useQuery({
    queryKey: ['machines', id],
    queryFn: () => fetchMachine(id),
    enabled: !!id,
    staleTime: STALE_TIME,
  })
}
