import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/session'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.email({ error: 'Please enter a valid email.' }),
  password: z.string().min(1, { error: 'Password is required.' }),
})

// Simple password comparison - in production use bcrypt
// For demo purposes we support plain text passwords stored in DB
async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  // If the stored password starts with $2 it's a bcrypt hash — skip for demo
  // We just do a direct comparison for demo/seed data
  return plain === stored
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, password: true, status: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is inactive. Please contact your administrator.' }, { status: 403 })
    }

    const passwordMatch = await verifyPassword(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Update lastLogin
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Create session cookie
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
