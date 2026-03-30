'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState } from 'react'
import { useStoreUrl } from '@/hooks/use-store-url'
import { cn } from '@/lib/utils'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Actualizar URL con el identificador de la tienda
  useStoreUrl()
  
  // Si es la página de login o select-store, no mostrar sidebar ni protección
  if (pathname === '/login' || pathname === '/select-store') {
    return <>{children}</>
  }
  
  // Nueva venta y detalle de factura: scroll sin barras (vertical u horizontal)
  const hideMainScrollbar = pathname.startsWith('/sales/')

  // Misma regla que MobileNavWrapper: sin barra inferior → no reservar hueco
  const showMobileBottomNavInset =
    pathname !== '/login' &&
    pathname !== '/select-store' &&
    !pathname.startsWith('/sales/new')

  // Para todas las demás páginas, mostrar el layout completo con sidebar
  return (
    <ProtectedRoute>
      <div className="flex h-screen min-h-0 min-w-0 bg-white dark:bg-neutral-950">
        <Sidebar onMobileMenuToggle={setIsMobileMenuOpen} />
        <main
          className={cn(
            'relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-white transition-all duration-300 dark:bg-neutral-950 xl:ml-56',
            isMobileMenuOpen && 'blur-sm'
          )}
        >
          <div
            className={cn(
              'min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-white dark:bg-neutral-950',
              /* Espacio bajo el contenido para que tablas/listas terminen por encima de la bottom nav (tablet/móvil). */
              showMobileBottomNavInset &&
                'pb-[max(7rem,calc(5.75rem+env(safe-area-inset-bottom)))] scroll-pb-[max(7rem,calc(5.75rem+env(safe-area-inset-bottom)))] xl:pb-0 xl:scroll-pb-0',
              hideMainScrollbar && 'scrollbar-hide'
            )}
          >
            {/* Ancho completo en pantallas grandes; solo márgenes horizontales para no pegar al borde */}
            <div className="w-full min-w-0 px-3 md:px-6 xl:px-8 2xl:px-10">{children}</div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
