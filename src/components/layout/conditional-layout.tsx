'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState } from 'react'
import { useStoreUrl } from '@/hooks/use-store-url'
import { cn } from '@/lib/utils'
import { ReleaseNotesModal } from '@/components/ui/release-notes-modal'
import { AppTopBar } from '@/components/layout/app-top-bar'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Actualizar URL con el identificador de la tienda
  useStoreUrl()
  
  // Si es la página de login o select-store, no mostrar sidebar ni protección
  if (pathname === '/login' || pathname === '/select-store' || pathname.startsWith('/tienda')) {
    return <>{children}</>
  }
  
  // Nueva venta y detalle de factura: scroll sin barras (vertical u horizontal)
  const hideMainScrollbar = pathname.startsWith('/sales/')

  const showTopBar = !pathname.startsWith('/sales/new')

  // Misma regla que MobileNavWrapper: sin barra inferior → no reservar hueco
  const showMobileBottomNavInset =
    pathname !== '/login' &&
    pathname !== '/select-store' &&
    !pathname.startsWith('/sales/new')

  // Para todas las demás páginas, mostrar el layout completo con sidebar
  return (
    <ProtectedRoute>
      <div
        className={cn(
          'flex h-dvh min-h-0 min-w-0 bg-white dark:bg-neutral-950',
          /* Reservar hueco inferior en móvil/tablet para que el scroll no intercepte toques del menú fijo (WebKit/iPad). */
          showMobileBottomNavInset && 'max-xl:pb-[var(--zonat-bottom-nav-height)]'
        )}
      >
        <Sidebar onMobileMenuToggle={setIsMobileMenuOpen} />
        <main
          className={cn(
            'zonat-app-main relative z-10 grid min-h-0 min-w-0 w-full flex-1 overflow-hidden bg-white transition-all duration-300 dark:bg-neutral-950 xl:ml-60',
            showTopBar ? 'grid-rows-[auto_1fr]' : 'grid-rows-[1fr]',
            isMobileMenuOpen && 'blur-sm'
          )}
        >
          {showTopBar && (
            <div className="zonat-topbar-slot min-h-0 min-w-0 shrink-0">
              <AppTopBar />
            </div>
          )}
          <div
            className={cn(
              'zonat-app-scroll min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-white dark:bg-neutral-950',
              hideMainScrollbar && 'scrollbar-hide'
            )}
          >
            {/* +1px horizontal vs px-* evita que overflow-auto recorte el borde de las cards a ancho completo */}
            <div className="box-border w-full min-w-0 max-w-full px-[13px] md:px-[25px] xl:px-[33px] 2xl:px-[41px]">
              {children}
            </div>
          </div>
        </main>
      </div>
      <ReleaseNotesModal />
    </ProtectedRoute>
  )
}
