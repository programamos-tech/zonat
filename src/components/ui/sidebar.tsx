'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Receipt, 
  CreditCard, 
  Shield,
  Activity,
  Menu,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Logo } from './logo'
// ThemeToggle removed
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/auth-context'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'Productos', href: '/products', icon: Package, module: 'products' },
  { name: 'Clientes', href: '/clients', icon: Users, module: 'clients' },
  { name: 'Ventas', href: '/sales', icon: Receipt, module: 'sales' },
  { name: 'Garantías', href: '/warranties', icon: ShieldCheck, module: 'warranties' },
  { name: 'Créditos', href: '/payments', icon: CreditCard, module: 'payments' },
  { name: 'Roles', href: '/roles', icon: Shield, module: 'roles' },
  { name: 'Registro de Actividades', href: '/logs', icon: Activity, module: 'logs' },
]

interface SidebarProps {
  className?: string
  onMobileMenuToggle?: (isOpen: boolean) => void
}

export function Sidebar({ className, onMobileMenuToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { canView } = usePermissions()
  const { user, logout } = useAuth()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Notificar al layout cuando cambie el estado del menú móvil
  useEffect(() => {
    onMobileMenuToggle?.(isMobileMenuOpen)
  }, [isMobileMenuOpen, onMobileMenuToggle])

  // Cerrar menú cuando se hace click fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Mobile/Tablet menu button - solo visible cuando el sidebar está cerrado */}
      {!isMobileMenuOpen && (
        <div className="xl:hidden fixed top-6 left-6 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow-lg transition-all duration-200 flex items-center justify-center w-10 h-10"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      {/* Mobile/Tablet overlay - removido para evitar pantalla negra */}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out xl:translate-x-0 w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <Logo size="lg" />
          </div>


          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              // Solo mostrar el item si el usuario tiene permisos para verlo
              if (!canView(item.module)) return null
              
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Theme Toggle removed */}
          </nav>

              {/* Programamos.st Footer */}
              <div className="px-4 py-3 border-b" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
                <div 
                  onClick={() => {
                    const message = encodeURIComponent("Hola! Tengo un error o necesito soporte técnico en el sistema Zonat. ¿Podrías ayudarme?");
                    const phoneNumber = "3002061711";
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex items-center gap-3 cursor-pointer rounded-lg p-3 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'transparent',
                    ':hover': { backgroundColor: '#e9ecef' }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#230f49' }}>
                      <img
                        src="/logo_programamos.st.png"
                        alt="Programamos.st"
                        width={40}
                        height={40}
                        className="rounded"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium leading-none" style={{ color: '#6c757d' }}>
                      ¿Tienes un error?
                    </span>
                    <span className="text-sm font-bold leading-none" style={{ color: '#230f49' }}>
                      Da click aquí
                    </span>
                    <span className="text-xs font-light leading-none mt-1" style={{ color: '#6c757d' }}>
                      programamos.st
                    </span>
                  </div>
                </div>
              </div>

          {/* User info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0) || 'D'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {user?.name || 'Diego Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'superadmin' ? 'Super Admin' : 
                     user?.role === 'admin' ? 'Admin' :
                     user?.role === 'vendedor' ? 'Vendedor' :
                     user?.role === 'inventario' ? 'Inventario' :
                     user?.role === 'contador' ? 'Contador' : 'Usuario'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
