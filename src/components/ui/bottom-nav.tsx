'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Package, Users, CreditCard, ShieldCheck, Activity, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/sales', label: 'Ventas', icon: Receipt },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/payments', label: 'Abonos', icon: CreditCard },
  { href: '/warranties', label: 'Garantías', icon: ShieldCheck },
  { href: '/logs', label: 'Logs', icon: Activity },
  { href: '/roles', label: 'Roles', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[padding:max(0px,env(safe-area-inset-bottom))]:pb-[max(0px,env(safe-area-inset-bottom))] overflow-x-auto">
      <ul className="inline-flex items-stretch h-14 gap-1 px-2 min-w-full">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <li key={href} className="flex-1 min-w-[72px]">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-2 text-[11px] ${active ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


