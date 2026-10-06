import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

// Filtro rápido: si no hay cookie de sesión, manda al login sin renderizar nada.
// Es solo una comodidad; la verificación real de sesión y rol se hace en el servidor
// con las guardas de lib/auth/guards.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
