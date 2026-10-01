import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_ROUTES = ['/login']
const AUTH_ROUTE = '/login'
const DEFAULT_REDIRECT = '/'

async function verifySession(token: string | undefined) {
  if (!token) return null
  try {
    const secretKey = process.env.SESSION_SECRET
    if (!secretKey) return null
    const encodedKey = new TextEncoder().encode(secretKey)
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))

  const sessionCookie = request.cookies.get('iiot-session')?.value
  const session = await verifySession(sessionCookie)
  const isAuthenticated = !!session

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL(AUTH_ROUTE, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
