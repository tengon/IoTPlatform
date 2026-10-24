import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default mock users when db is empty or for initial display
const mockUsers = [
  { id: 'USR-001', name: 'James Wilson', email: 'james.wilson@factory.io', role: 'admin', status: 'active', lastLogin: '2024-01-15T10:30:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'USR-002', name: 'Sarah Chen', email: 'sarah.chen@factory.io', role: 'manager', status: 'active', lastLogin: '2024-01-15T09:15:00Z', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'USR-003', name: 'Michael Park', email: 'michael.park@factory.io', role: 'supervisor', status: 'active', lastLogin: '2024-01-15T08:45:00Z', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'USR-004', name: 'Emily Rodriguez', email: 'emily.rodriguez@factory.io', role: 'engineer', status: 'active', lastLogin: '2024-01-15T07:00:00Z', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'USR-005', name: 'David Kim', email: 'david.kim@factory.io', role: 'engineer', status: 'active', lastLogin: '2024-01-14T16:30:00Z', createdAt: '2024-01-05T00:00:00Z' },
  { id: 'USR-006', name: 'Lisa Thompson', email: 'lisa.thompson@factory.io', role: 'operator', status: 'active', lastLogin: '2024-01-15T06:00:00Z', createdAt: '2024-01-06T00:00:00Z' },
  { id: 'USR-007', name: 'Robert Zhang', email: 'robert.zhang@factory.io', role: 'operator', status: 'inactive', lastLogin: '2024-01-10T14:20:00Z', createdAt: '2024-01-07T00:00:00Z' },
  { id: 'USR-008', name: 'Anna Müller', email: 'anna.muller@factory.io', role: 'supervisor', status: 'active', lastLogin: '2024-01-15T09:50:00Z', createdAt: '2024-01-08T00:00:00Z' },
  { id: 'USR-009', name: 'Carlos Silva', email: 'carlos.silva@factory.io', role: 'manager', status: 'inactive', lastLogin: '2024-01-05T11:30:00Z', createdAt: '2024-01-09T00:00:00Z' },
]

export async function GET() {
  try {
    const dbUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (dbUsers.length > 0) {
      return NextResponse.json({ data: dbUsers, total: dbUsers.length })
    }

    return NextResponse.json({ data: mockUsers, total: mockUsers.length })
  } catch (error) {
    console.error('Failed to fetch users from DB, falling back to mock:', error)
    return NextResponse.json({ data: mockUsers, total: mockUsers.length })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role = 'operator', status = 'active', password = 'password123' } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
    }

    const newUser = await db.user.create({
      data: {
        name,
        email,
        role: String(role).toLowerCase(),
        status: status || 'active',
        password,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: newUser })
  } catch (error: any) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    // Try deleting from database if existing
    try {
      const existing = await db.user.findUnique({ where: { id } })
      if (existing) {
        await db.user.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'User deleted from database.' })
      }
    } catch (dbErr) {
      console.warn('DB delete error or non-db user:', dbErr)
    }

    return NextResponse.json({ success: true, message: 'User deleted.' })
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, role, status } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    try {
      const updated = await db.user.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(role ? { role: String(role).toLowerCase() } : {}),
          ...(status ? { status } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatar: true,
          lastLogin: true,
          createdAt: true,
        },
      })
      return NextResponse.json({ success: true, data: updated })
    } catch (dbErr) {
      console.warn('DB update error:', dbErr)
      return NextResponse.json({ success: true, data: { id, name, email, role, status } })
    }
  } catch (error: any) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

