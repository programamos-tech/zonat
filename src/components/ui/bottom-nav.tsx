'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Package, Users, CreditCard, ShieldCheck, Activity, Shield, UserCircle, ChevronLeft, ChevronRight, Building2, ShoppingCart, TrendingUp } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/auth-context'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', alwaysVisible: true },
  { href: '/products', label: 'Productos', icon: Package, module: 'products' },
  { href: '/clients', label: 'Clientes', icon: Users, module: 'clients' },
  { href: '/sales', label: 'Ventas', icon: Receipt, module: 'sales' },
  { href: '/warranties', label: 'Garantías', icon: ShieldCheck, module: 'warranties' },
  { href: '/payments', label: 'Créditos', icon: CreditCard, module: 'payments' },
  { href: '/suppliers', label: 'Proveedores', icon: Building2, module: 'suppliers' },
  { href: '/purchase-orders', label: 'Órdenes', icon: ShoppingCart, module: 'purchase_orders' },
  { href: '/profitability', label: 'Rentabilidad', icon: TrendingUp, module: 'profitability' },
  { href: '/roles', label: 'Roles', icon: Shield, module: 'roles' },
  { href: '/logs', label: 'Registro de Actividades', icon: Activity, module: 'logs' },
  { href: '/profile', label: 'Perfil', icon: UserCircle, module: 'dashboard', alwaysVisible: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const { canView } = usePermissions()
  const { user } = useAuth()
  const scrollContainerRef = useRef<HTMLUListElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(false)

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Durante el render inicial, usar pathname vacío para evitar mismatch
  const currentPathname = isMounted ? pathname : ''

  // Filtrar items basado en permisos, pero siempre mostrar Dashboard y Perfil si el usuario está autenticado
  const visibleItems = items
    .filter(item => {
      if (item.alwaysVisible && user) {
        return true
      }
      return canView(item.module)
    })
    .sort((a, b) => {
      // Dashboard siempre primero
      if (a.href === '/dashboard') return -1
      if (b.href === '/dashboard') return 1
      // Perfil siempre al final
      if (a.href === '/profile') return 1
      if (b.href === '/profile') return -1
      // Mantener el orden original para los demás
      return 0
    })

  // Función para verificar si hay scroll disponible
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftButton(scrollLeft > 0)
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1)
  }

  // Verificar botones al montar y cuando cambian los items visibles
  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      // Verificar después de un pequeño delay para asegurar que el DOM esté renderizado
      const timeout = setTimeout(checkScrollButtons, 100)
      
      // Listener para redimensionamiento de ventana
      const handleResize = () => {
        setTimeout(checkScrollButtons, 100)
      }
      window.addEventListener('resize', handleResize)
      
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', handleResize)
        clearTimeout(timeout)
      }
    }
  }, [visibleItems.length, isMounted])

  // Función para hacer scroll
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    
    const scrollAmount = 200 // Píxeles a desplazar
    const currentScroll = scrollContainerRef.current.scrollLeft
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount
    
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 xl:hidden border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] shadow-lg supports-[padding:max(0px,env(safe-area-inset-bottom))]:pb-[max(0px,env(safe-area-inset-bottom))]" style={{ fontFamily: 'var(--font-inter)' }}>
      <div className="relative flex items-center">
        {/* Botón izquierdo */}
        {showLeftButton && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 h-14 md:h-16 px-2 md:px-3 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F] border-r border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Scroll izquierda"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" style={{ color: 'var(--sidebar-orange)' }} />
          </button>
        )}

        {/* Contenedor de scroll */}
        <ul 
          ref={scrollContainerRef}
          className={`flex items-stretch h-14 md:h-16 gap-0.5 overflow-x-auto scrollbar-hide flex-1 ${
            showLeftButton ? 'pl-10 md:pl-12' : 'pl-1 md:pl-1.5'
          } ${
            showRightButton ? 'pr-10 md:pr-12' : 'pr-1 md:pr-1.5'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = currentPathname === href || (href !== '/dashboard' && currentPathname?.startsWith(href))
            return (
              <li key={href} className="flex-shrink-0 flex-1 min-w-[65px] md:min-w-[75px] max-w-[85px] md:max-w-[95px]">
                <Link
                  href={href}
                  className={`flex h-full w-full flex-col items-center justify-center gap-0.5 md:gap-1 text-[8px] md:text-[9px] lg:text-[10px] transition-all duration-200 rounded-t-lg touch-manipulation ${
                    active 
                      ? 'shadow-sm font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F1F1F] hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-[#1F1F1F] active:scale-95'
                  }`}
                  style={{
                    ...(active ? {
                      backgroundColor: 'rgba(92, 156, 124, 0.15)',
                      color: 'var(--sidebar-orange)'
                    } : {}),
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Icon 
                      className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 flex-shrink-0 transition-colors" 
                      style={active ? {
                        color: 'var(--sidebar-orange)'
                      } : {
                        color: 'inherit'
                      }}
                    />
                  </div>
                  <span className="leading-tight text-center truncate max-w-full whitespace-nowrap w-full block">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Botón derecho */}
        {showRightButton && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 h-14 md:h-16 px-2 md:px-3 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F] border-l border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Scroll derecha"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" style={{ color: 'var(--sidebar-orange)' }} />
          </button>
        )}
      </div>
    </nav>
  )
}


