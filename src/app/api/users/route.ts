import { NextResponse } from 'next/server'

// Mock users data
const users = [
  { id: 'USR-001', name: 'James Wilson', email: 'james.wilson@factory.io', role: 'Admin', status: 'active', lastLogin: '2024-01-15T10:30:00Z' },
  { id: 'USR-002', name: 'Sarah Chen', email: 'sarah.chen@factory.io', role: 'Manager', status: 'active', lastLogin: '2024-01-15T09:15:00Z' },
  { id: 'USR-003', name: 'Michael Park', email: 'michael.park@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T08:45:00Z' },
  { id: 'USR-004', name: 'Emily Rodriguez', email: 'emily.rodriguez@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-15T07:00:00Z' },
  { id: 'USR-005', name: 'David Kim', email: 'david.kim@factory.io', role: 'Engineer', status: 'active', lastLogin: '2024-01-14T16:30:00Z' },
  { id: 'USR-006', name: 'Lisa Thompson', email: 'lisa.thompson@factory.io', role: 'Operator', status: 'active', lastLogin: '2024-01-15T06:00:00Z' },
  { id: 'USR-007', name: 'Robert Zhang', email: 'robert.zhang@factory.io', role: 'Operator', status: 'inactive', lastLogin: '2024-01-10T14:20:00Z' },
  { id: 'USR-008', name: 'Anna Müller', email: 'anna.muller@factory.io', role: 'Supervisor', status: 'active', lastLogin: '2024-01-15T09:50:00Z' },
  { id: 'USR-009', name: 'Carlos Silva', email: 'carlos.silva@factory.io', role: 'Manager', status: 'inactive', lastLogin: '2024-01-05T11:30:00Z' },
]

export async function GET() {
  try {
    return NextResponse.json({ data: users, total: users.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
