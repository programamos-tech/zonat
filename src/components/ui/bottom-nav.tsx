'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Package, Users, CreditCard, ShieldCheck, Activity, Shield, UserCircle, ArrowRightLeft, CheckCircle, Store } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/auth-context'
import { isMainStoreUser, canAccessAllStores } from '@/lib/store-helper'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', alwaysVisible: true },
  { href: '/inventory/products', label: 'Productos', icon: Package, module: 'products' },
  { href: '/inventory/transfers', label: 'Transferencias', icon: ArrowRightLeft, module: 'transfers', requiresMainStore: true },
  { href: '/inventory/receptions', label: 'Recepciones', icon: CheckCircle, module: 'receptions' },
  { href: '/clients', label: 'Clientes', icon: Users, module: 'clients' },
  { href: '/sales', label: 'Ventas', icon: Receipt, module: 'sales' },
  { href: '/warranties', label: 'Garantías', icon: ShieldCheck, module: 'warranties' },
  { href: '/payments', label: 'Créditos', icon: CreditCard, module: 'payments' },
  { href: '/stores', label: 'Tiendas', icon: Store, module: 'roles' },
  { href: '/roles', label: 'Roles', icon: Shield, module: 'roles' },
  { href: '/logs', label: 'Actividades', icon: Activity, module: 'logs' },
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
      // Ocultar transferencias si el usuario no es de la tienda principal
      if (item.requiresMainStore && !isMainStoreUser(user)) {
        return false
      }
      // Para el módulo de Tiendas, siempre mostrarlo pero solo permitir acceso si es super admin
      if (item.href === '/stores') {
        return canView(item.module) // Mostrar siempre si tiene permisos del módulo
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 xl:hidden supports-[padding:max(0px,env(safe-area-inset-bottom))]:pb-[max(0px,env(safe-area-inset-bottom))]">
      {/* Barra transparente: difuminado en la parte de arriba, esquinas redondeadas */}
      <div className="relative flex flex-col pt-1.5 md:pt-2 rounded-t-2xl md:rounded-t-3xl overflow-hidden bg-gradient-to-b from-transparent via-white/50 dark:via-neutral-950/55 to-white/85 dark:to-neutral-950/90 backdrop-blur-xl shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_30px_-4px_rgba(0,0,0,0.35)]">
        <div className="flex items-stretch h-12 md:h-14 flex-shrink-0">
        {/* Contenedor de scroll: siempre empezando por Dashboard a la izquierda */}
        <ul 
          ref={scrollContainerRef}
          className="flex items-stretch h-full gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0 pl-2 pr-2 md:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleItems.map(({ href, label, icon: Icon, module }) => {
            const isStoresModule = href === '/stores'
            const canAccessStores = isStoresModule ? canAccessAllStores(user) : true
            
            const active = currentPathname === href || 
              (href !== '/dashboard' && currentPathname?.startsWith(href)) ||
              (href === '/payments' && currentPathname?.startsWith('/payments')) ||
              (href === '/inventory/products' && currentPathname?.startsWith('/inventory/products')) ||
              (href === '/inventory/transfers' && currentPathname?.startsWith('/inventory/transfers')) ||
              (href === '/inventory/receptions' && currentPathname?.startsWith('/inventory/receptions')) ||
              (href === '/sales' && currentPathname?.startsWith('/sales')) ||
              (href === '/stores' && currentPathname?.startsWith('/stores'))
            
            // Estado activo: sin selector ni fondo; solo el icono se alumbra con su color
            const getActiveColor = () =>
              ''

            const getIconColor = () => {
              if (!active) return 'text-gray-500 dark:text-gray-400'
              if (module === 'products') return 'text-sky-500 dark:text-sky-400'
              if (module === 'clients') return 'text-orange-500 dark:text-orange-400'
              if (module === 'sales') return 'text-emerald-500 dark:text-emerald-400'
              if (module === 'warranties') return 'text-purple-500 dark:text-purple-400'
              if (module === 'payments') return 'text-orange-500 dark:text-orange-400'
              if (module === 'roles') return 'text-indigo-500 dark:text-indigo-400'
              if (module === 'logs') return 'text-blue-500 dark:text-blue-400'
              if (module === 'dashboard' || module === 'stores') return 'text-emerald-500 dark:text-emerald-400'
              return 'text-emerald-500 dark:text-emerald-400'
            }
            
            return (
              <li key={href} className="flex-shrink-0 flex-1 min-w-[56px] md:min-w-0 md:flex-none md:w-[72px] md:max-w-[76px]">
                {isStoresModule && !canAccessStores ? (
                  <div
                    className={`flex h-full flex-col items-center justify-center gap-0.5 md:gap-1 px-1.5 md:px-2 text-[9px] md:text-[10px] transition-all duration-200 rounded-t-lg cursor-not-allowed opacity-50 ${
                      active 
                        ? `${getActiveColor()} text-gray-600 dark:text-gray-300` 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title="Solo disponible para Super Administradores"
                  >
                    <Icon className={`h-5 w-5 md:h-5 md:w-5 flex-shrink-0 transition-colors ${getIconColor()}`} />
                    <span className="leading-tight text-center truncate max-w-full px-0.5 whitespace-nowrap">{label}</span>
                  </div>
                ) : (
                <Link
                  href={href}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 md:gap-1 px-1.5 md:px-2 text-[9px] md:text-[10px] transition-all duration-200 rounded-t-lg touch-manipulation ${
                    active 
                      ? `${getActiveColor()} text-gray-600 dark:text-gray-300` 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white active:scale-95'
                  }`}
                >
                  <Icon className={`h-5 w-5 md:h-5 md:w-5 flex-shrink-0 transition-colors ${getIconColor()}`} />
                  <span className="leading-tight text-center truncate max-w-full px-0.5 whitespace-nowrap">{label}</span>
                </Link>
                )}
              </li>
            )
          })}
        </ul>
        </div>

        {/* Difuminado derecha: indica que hay más opciones sin quitar espacio */}
        {showRightButton && (
          <div
            className="absolute right-0 top-0 bottom-0 w-8 md:w-10 pointer-events-none z-10 bg-gradient-to-l from-white/90 dark:from-neutral-950/90 to-transparent"
            aria-hidden
          />
        )}
        {/* Difuminado izquierda: cuando hay scroll, indica que hay más a la izquierda */}
        {showLeftButton && (
          <div
            className="absolute left-0 top-0 bottom-0 w-8 md:w-10 pointer-events-none z-10 bg-gradient-to-r from-white/90 dark:from-neutral-950/90 to-transparent"
            aria-hidden
          />
        )}
      </div>
    </nav>
  )
}


