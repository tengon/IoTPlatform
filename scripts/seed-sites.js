/**
 * Seed script: creates or updates Indonesian factory sites in the database.
 * Run: node scripts/seed-sites.js
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sites = [
  {
    id: 'SITE-001',
    name: 'Main Plant - Jakarta',
    code: 'JKT-01',
    address: 'Kawasan Industri Pulogadung, Jakarta Timur',
    timezone: 'Asia/Jakarta',
    status: 'active',
  },
  {
    id: 'SITE-002',
    name: 'Manufacturing Plant - Karawang',
    code: 'KRW-01',
    address: 'Kawasan Industri KIIC, Karawang Barat',
    timezone: 'Asia/Jakarta',
    status: 'active',
  },
  {
    id: 'SITE-003',
    name: 'Assembly & Logistics - Surabaya',
    code: 'SBY-01',
    address: 'SIER Industrial Estate, Rungkut, Surabaya',
    timezone: 'Asia/Jakarta',
    status: 'commissioning',
  },
  {
    id: 'SITE-004',
    name: 'Regional Plant - Semarang',
    code: 'SMG-01',
    address: 'Kawasan Industri Wijayakusuma, Semarang',
    timezone: 'Asia/Jakarta',
    status: 'active',
  },
]

async function main() {
  console.log('Seeding Indonesian sites (Jakarta, Karawang, Surabaya, Semarang)...')

  for (const site of sites) {
    const existing = await prisma.site.findFirst({
      where: {
        OR: [
          { id: site.id },
          { code: site.code },
        ],
      },
    })

    if (existing) {
      await prisma.site.update({
        where: { id: existing.id },
        data: {
          name: site.name,
          code: site.code,
          address: site.address,
          timezone: site.timezone,
          status: site.status,
        },
      })
      console.log(`Updated site: ${site.name} (${site.code})`)
    } else {
      await prisma.site.create({
        data: site,
      })
      console.log(`Created site: ${site.name} (${site.code})`)
    }
  }

  const allSites = await prisma.site.findMany({
    select: { id: true, name: true, code: true, timezone: true, status: true },
  })
  console.log('Current sites in database:', allSites)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
