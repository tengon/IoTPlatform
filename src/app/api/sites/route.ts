import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default Indonesian sites data
export const defaultSites = [
  {
    id: 'SITE-001',
    name: 'Main Plant - Jakarta',
    code: 'JKT-01',
    address: 'Kawasan Industri Pulogadung, Jakarta Timur',
    timezone: 'Asia/Jakarta',
    deviceCount: 124,
    machineCount: 32,
    status: 'active' as const,
  },
  {
    id: 'SITE-002',
    name: 'Manufacturing Plant - Karawang',
    code: 'KRW-01',
    address: 'Kawasan Industri KIIC, Karawang Barat',
    timezone: 'Asia/Jakarta',
    deviceCount: 86,
    machineCount: 18,
    status: 'active' as const,
  },
  {
    id: 'SITE-003',
    name: 'Assembly & Logistics - Surabaya',
    code: 'SBY-01',
    address: 'SIER Industrial Estate, Rungkut, Surabaya',
    timezone: 'Asia/Jakarta',
    deviceCount: 42,
    machineCount: 8,
    status: 'commissioning' as const,
  },
  {
    id: 'SITE-004',
    name: 'Regional Plant - Semarang',
    code: 'SMG-01',
    address: 'Kawasan Industri Wijayakusuma, Semarang',
    timezone: 'Asia/Jakarta',
    deviceCount: 28,
    machineCount: 5,
    status: 'active' as const,
  },
]

export async function GET() {
  try {
    const dbSites = await db.site.findMany({
      include: {
        _count: {
          select: {
            devices: true,
            machines: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (dbSites && dbSites.length > 0) {
      const formatted = dbSites.map((s, idx) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        address: s.address || '',
        timezone: s.timezone || 'Asia/Jakarta',
        deviceCount: s._count?.devices || defaultSites[idx]?.deviceCount || 0,
        machineCount: s._count?.machines || defaultSites[idx]?.machineCount || 0,
        status: (s.status as 'active' | 'inactive' | 'commissioning') || 'active',
      }))
      return NextResponse.json({ data: formatted, total: formatted.length })
    }

    return NextResponse.json({ data: defaultSites, total: defaultSites.length })
  } catch (error) {
    console.error('Error fetching sites from database, using fallback:', error)
    return NextResponse.json({ data: defaultSites, total: defaultSites.length })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, code, address, timezone = 'Asia/Jakarta', status = 'active' } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const newSite = await db.site.create({
      data: {
        name,
        code,
        address,
        timezone,
        status,
      },
    })

    return NextResponse.json({ data: newSite, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating site:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create site' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    await db.site.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Site deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting site:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete site' },
      { status: 500 }
    )
  }
}
