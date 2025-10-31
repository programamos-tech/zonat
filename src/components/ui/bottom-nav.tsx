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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[padding:max(0px,env(safe-area-inset-bottom))]:pb-[max(0px,env(safe-area-inset-bottom))] overflow-x-auto">
      <ul className="inline-flex items-stretch h-14 gap-1 px-2 min-w-full">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = currentPathname === href || (href !== '/dashboard' && currentPathname?.startsWith(href))
          return (
            <li key={href} className="flex-1 min-w-[72px]">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-2 text-[10px] md:text-[11px] transition-all duration-200 rounded-t-lg ${
                  active 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 md:h-6 md:w-6 transition-colors ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <span className="leading-tight text-center truncate max-w-[70px]">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


