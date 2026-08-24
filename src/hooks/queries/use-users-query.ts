import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from '@/types'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
}

const STALE_TIME = 10 * 60 * 1000

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  const json: ApiResponse<User> = await res.json()
  return json.data
}

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: STALE_TIME,
  })
}
