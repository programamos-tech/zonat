import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Permitir la página de login
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  // Verificar si hay un usuario en localStorage (simulado con cookie)
  const user = request.cookies.get('zonat_user')
  
  if (!user) {
    // Redirigir a login si no hay usuario
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
