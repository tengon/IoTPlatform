/**
 * Seed script: creates a demo admin user if none exists.
 * Run: node scripts/seed-admin.js
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@iiot.local' },
  })

  if (existing) {
    console.log('Admin user already exists:', existing.email)
    return
  }

  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@iiot.local',
      // Plain text for demo — in production use bcrypt
      password: 'admin123',
      role: 'admin',
      status: 'active',
    },
  })

  console.log('Created admin user:', user.email, '/ password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
