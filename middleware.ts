import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple middleware - authentication is handled client-side with fallback to mock users
  // This allows the app to work in development without Supabase dependencies in middleware
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/external).*)',
  ],
}
