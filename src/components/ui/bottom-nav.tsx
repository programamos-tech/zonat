'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Package, Users, CreditCard, ShieldCheck, Activity, Shield } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { href: '/products', label: 'Productos', icon: Package, module: 'products' },
  { href: '/clients', label: 'Clientes', icon: Users, module: 'clients' },
  { href: '/sales', label: 'Ventas', icon: Receipt, module: 'sales' },
  { href: '/warranties', label: 'Garantías', icon: ShieldCheck, module: 'warranties' },
  { href: '/payments', label: 'Créditos', icon: CreditCard, module: 'payments' },
  { href: '/roles', label: 'Roles', icon: Shield, module: 'roles' },
  { href: '/logs', label: 'Registro de Actividades', icon: Activity, module: 'logs' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const { canView } = usePermissions()

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Durante el render inicial, usar pathname vacío para evitar mismatch
  const currentPathname = isMounted ? pathname : ''

  // Filtrar items basado en permisos
  const visibleItems = items.filter(item => canView(item.module))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 xl:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg supports-[padding:max(0px,env(safe-area-inset-bottom))]:pb-[max(0px,env(safe-area-inset-bottom))]">
      <ul className="flex items-stretch h-14 md:h-16 gap-0.5 px-1 md:px-1.5 overflow-x-auto scrollbar-hide justify-center">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = currentPathname === href || (href !== '/dashboard' && currentPathname?.startsWith(href))
          return (
            <li key={href} className="flex-shrink-0 flex-1 min-w-[65px] md:min-w-[75px] max-w-[85px] md:max-w-[95px]">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 md:gap-1 px-1 md:px-1.5 text-[8px] md:text-[9px] lg:text-[10px] transition-all duration-200 rounded-t-lg touch-manipulation ${
                  active 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-700 active:scale-95'
                }`}
              >
                <Icon className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 flex-shrink-0 transition-colors ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <span className="leading-tight text-center truncate max-w-full px-0.5 whitespace-nowrap">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


