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
import React, { useState, useEffect, useRef } from 'react'
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
              <div 
                onClick={() => {
                  const message = encodeURIComponent("Hola! Tengo un error o necesito soporte técnico en el sistema Zonat. ¿Podrías ayudarme?");
                  const phoneNumber = "3002061711";
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="group flex items-center gap-4 rounded-xl py-3 px-4 shadow-lg border transition-all duration-300 cursor-pointer backdrop-blur-sm mx-4 mb-4"
                style={{
                  background: 'linear-gradient(135deg, #230f49 0%, #1a0a3a 100%)',
                  borderColor: 'rgba(35, 15, 73, 0.3)',
                  boxShadow: '0 10px 25px rgba(35, 15, 73, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2d1a5a 0%, #230f49 100%)'
                  e.currentTarget.style.transform = 'scale(1.03)'
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(35, 15, 73, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #230f49 0%, #1a0a3a 100%)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(35, 15, 73, 0.2)'
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #230f49 0%, #1a0a3a 100%)',
                      boxShadow: '0 4px 15px rgba(35, 15, 73, 0.4)'
                    }}
                  >
                    <img
                      src="/logo_programamos.st.png"
                      alt="Programamos.st"
                      width={28}
                      height={28}
                      className="rounded opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-white/80 leading-none">
                      ¿Tienes un error?
                    </span>
                    <span className="text-sm font-bold text-white leading-none group-hover:text-purple-200 transition-colors duration-300">
                      Da click aquí
                    </span>
                    <span className="text-xs font-light text-white/60 leading-none">
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
