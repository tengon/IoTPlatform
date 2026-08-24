import { NextResponse } from 'next/server'

// Mock sites data
const sites = [
  { id: 'SITE-001', name: 'Main Factory - Shanghai', code: 'SH-01', address: '1234 Industrial Blvd, Pudong, Shanghai', timezone: 'Asia/Shanghai', deviceCount: 124, machineCount: 32, status: 'active' },
  { id: 'SITE-002', name: 'Assembly Plant - Suzhou', code: 'SZ-01', address: '5678 Tech Park Rd, SIP, Suzhou', timezone: 'Asia/Shanghai', deviceCount: 86, machineCount: 18, status: 'active' },
  { id: 'SITE-003', name: 'Warehouse - Hangzhou', code: 'HZ-01', address: '9101 Logistics Ave, Xiaoshan, Hangzhou', timezone: 'Asia/Shanghai', deviceCount: 42, machineCount: 8, status: 'commissioning' },
  { id: 'SITE-004', name: 'R&D Center - Beijing', code: 'BJ-01', address: '1115 Innovation St, Haidian, Beijing', timezone: 'Asia/Shanghai', deviceCount: 28, machineCount: 5, status: 'inactive' },
]

export async function GET() {
  try {
    return NextResponse.json({ data: sites, total: sites.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    )
  }
}
