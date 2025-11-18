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
  ShieldCheck,
  UserCircle,
  Building2,
  ShoppingCart,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { Logo } from './logo'
// ThemeToggle removed
import { usePermissions } from '@/hooks/usePermissions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'Productos', href: '/products', icon: Package, module: 'products' },
  { name: 'Clientes', href: '/clients', icon: Users, module: 'clients' },
  { name: 'Ventas', href: '/sales', icon: Receipt, module: 'sales' },
  { name: 'Garantías', href: '/warranties', icon: ShieldCheck, module: 'warranties' },
  { name: 'Créditos', href: '/payments', icon: CreditCard, module: 'payments' },
  { name: 'Proveedores', href: '/suppliers', icon: Building2, module: 'suppliers' },
  { name: 'Órdenes de Compra', href: '/purchase-orders', icon: ShoppingCart, module: 'purchase_orders' },
  { name: 'Rentabilidad', href: '/profitability', icon: TrendingUp, module: 'profitability' },
  { name: 'Clientes Oviler', href: '/admin/clients', icon: Briefcase, module: 'admin_clients' },
  { name: 'Roles', href: '/roles', icon: Shield, module: 'roles' },
  { name: 'Registro de Actividades', href: '/logs', icon: Activity, module: 'logs' },
  { name: 'Perfil', href: '/profile', icon: UserCircle, module: 'dashboard' },
]

interface SidebarProps {
  className?: string
  onMobileMenuToggle?: (isOpen: boolean) => void
}

export function Sidebar({ className, onMobileMenuToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { canView } = usePermissions()
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
      {/* Hidden hamburger on mobile: usamos bottom nav */}

      {/* Mobile/Tablet overlay - removido para evitar pantalla negra */}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 shadow-xl transform transition-all duration-300 ease-in-out xl:translate-x-0 w-64 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FF] to-[#E1EEFF] dark:bg-[var(--swatch--gray-950)]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{
          fontFamily: 'var(--font-inter)'
        }}
      >
        <div className="flex flex-col h-full">
                 {/* Logo Oviler */}
                 <div className="flex flex-col h-20 px-4 justify-center">
                   <Link href="/dashboard" className="cursor-pointer hover:opacity-90 transition-opacity ml-2">
                     <span className="text-3xl font-black tracking-tighter animate-logo-entrance text-[#2D2D2D] dark:text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                       Oviler
                     </span>
                   </Link>
                   <p className="text-[10px] text-gray-600 dark:text-white/70 mt-0.5 ml-2.5 animate-logo-entrance" style={{ animationDelay: '0.7s', opacity: 0 }}>
                     Gestión de tu Negocio
                   </p>
                 </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              // Los módulos nuevos (suppliers, purchase_orders, profitability, admin_clients) son visibles para todos los usuarios autenticados
              // Los demás módulos requieren permisos
              const isNewModule = item.module === 'suppliers' || item.module === 'purchase_orders' || item.module === 'profitability' || item.module === 'admin_clients'
              if (!isNewModule && !canView(item.module)) return null
              
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium transition-all duration-200 rounded-xl border",
                  isActive 
                    ? 'text-[#0F172A] bg-white border-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 border-transparent hover:border-white/40 hover:bg-white/60'
                )}
                style={{
                  boxShadow: isActive ? '0 12px 30px rgba(92, 169, 245, 0.25)' : 'none'
                }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.classList.add('bg-gray-100', 'dark:bg-white/10')
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-white/10')
                    }
                  }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3",
                    isActive 
                      ? 'text-[#0D1324]' 
                      : 'text-[#6B7A8C]'
                  )} />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Theme Toggle removed */}
          </nav>
        </div>
      </div>
    </>
  )
}
