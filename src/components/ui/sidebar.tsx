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
  ShieldCheck,
  UserCircle,
  Store,
  Warehouse,
  ArrowRightLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Crown
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { Logo } from './logo'
// ThemeToggle removed
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/auth-context'
import { canAccessAllStores, isMainStoreUser } from '@/lib/store-helper'
import { StoresService } from '@/lib/stores-service'
import type { Store } from '@/types/store'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { 
    name: 'Inventario', 
    href: '/inventory/products', 
    icon: Warehouse, 
    module: 'products',
    submenu: [
      { name: 'Productos', href: '/inventory/products', icon: Package, module: 'products' },
      { name: 'Transferencias', href: '/inventory/transfers', icon: ArrowRightLeft, module: 'transfers' },
      { name: 'Recepciones', href: '/inventory/receptions', icon: CheckCircle, module: 'receptions' },
    ]
  },
  { 
    name: 'Comercial', 
    href: '/clients', 
    icon: Users, 
    module: 'clients',
    submenu: [
      { name: 'Clientes', href: '/clients', icon: Users, module: 'clients' },
      { name: 'Ventas', href: '/sales', icon: Receipt, module: 'sales' },
      { name: 'Créditos', href: '/payments', icon: CreditCard, module: 'payments' },
      { name: 'Garantías', href: '/warranties', icon: ShieldCheck, module: 'warranties' },
    ]
  },
  { 
    name: 'Administración', 
    href: '/stores', 
    icon: Shield, 
    module: 'roles',
    submenu: [
      { name: 'Tiendas', href: '/stores', icon: Store, module: 'roles', requiresAllStoresAccess: true },
      { name: 'Roles', href: '/roles', icon: Shield, module: 'roles' },
      { name: 'Actividades', href: '/logs', icon: Activity, module: 'logs' },
    ]
  },
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
  const { user, logout } = useAuth()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  // Inicializar con todos los menús expandidos por defecto
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['Inventario', 'Comercial', 'Administración']))

  // Mantener expandidos los menús cuando estamos en alguna de sus rutas
  useEffect(() => {
    if (pathname?.startsWith('/inventory')) {
      setExpandedMenus(prev => new Set([...prev, 'Inventario']))
    }
    if (pathname?.startsWith('/clients') || pathname?.startsWith('/sales') || pathname?.startsWith('/payments') || pathname?.startsWith('/warranties')) {
      setExpandedMenus(prev => new Set([...prev, 'Comercial']))
    }
    if (pathname?.startsWith('/stores') || pathname?.startsWith('/roles') || pathname?.startsWith('/logs')) {
      setExpandedMenus(prev => new Set([...prev, 'Administración']))
    }
  }, [pathname])

  // Notificar al layout cuando cambie el estado del menú móvil
  useEffect(() => {
    onMobileMenuToggle?.(isMobileMenuOpen)
  }, [isMobileMenuOpen, onMobileMenuToggle])

  // Cargar información de la tienda del usuario
  useEffect(() => {
    const loadStoreInfo = async () => {
      if (user?.storeId) {
        try {
          const store = await StoresService.getStoreById(user.storeId)
          setCurrentStore(store)
        } catch (error) {
          console.error('Error loading store info:', error)
        }
      } else {
        // Si no tiene storeId, es de la tienda principal
        try {
          const mainStore = await StoresService.getMainStore()
          setCurrentStore(mainStore)
        } catch (error) {
          console.error('Error loading main store:', error)
        }
      }
    }

    if (user) {
      loadStoreInfo()
    }
  }, [user])

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
          "fixed inset-y-0 left-0 z-40 overflow-hidden rounded-r-2xl xl:rounded-r-3xl shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_30px_-4px_rgba(0,0,0,0.4)] transform transition-all duration-300 ease-in-out xl:translate-x-0 w-56",
          "bg-gradient-to-r from-transparent via-white/35 dark:via-neutral-950/40 to-white/70 dark:to-neutral-950/75 backdrop-blur-2xl border-r border-white/15 dark:border-neutral-600/30",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo y Tienda */}
          <div className={cn(
            "px-4 py-4 border-b transition-all duration-300",
            "border-white/30 dark:border-neutral-700/40"
          )}>
            <Link href="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center relative">
              <div className="relative">
              {currentStore?.logo ? (
                <img 
                  src={currentStore.logo} 
                  alt={currentStore.name}
                  className="h-12 w-12 rounded-lg object-cover mb-2"
                />
              ) : (
                  <div className="mb-2">
                <Logo size="lg" />
                  </div>
                )}
                {isMainStoreUser(user) && (
                  <div className="absolute -top-1 -right-1 bg-emerald-400 dark:bg-emerald-500 rounded-full p-1 shadow-md">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
              )}
              </div>
              {currentStore && (
                <div className="mt-2 text-center">
                  <p className="text-xs font-semibold truncate max-w-[180px] text-gray-800 dark:text-white transition-colors">
                    {currentStore.name}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              // Solo mostrar el item si el usuario tiene permisos para verlo
              if (!canView(item.module)) return null
              
              // Para el módulo de Tiendas, siempre mostrarlo pero solo permitir acceso si es super admin
              const isStoresModule = item.href === '/stores'
              const canAccessStores = isStoresModule ? canAccessAllStores(user) : true
              
              // Si requiere acceso a todas las tiendas (y no es stores), verificar
              if (item.requiresAllStoresAccess && !isStoresModule && !canAccessAllStores(user)) return null
              
              // Verificar si tiene submenú
              const hasSubmenu = item.submenu && item.submenu.length > 0
              const isExpanded = expandedMenus.has(item.name)
              
              // Verificar si algún subitem está activo
              const isSubmenuActive = hasSubmenu && item.submenu?.some(subitem => {
                if (subitem.href === '/inventory/products' && pathname?.startsWith('/inventory/products')) return true
                if (subitem.href === '/inventory/transfers' && pathname?.startsWith('/inventory/transfers')) return true
                if (subitem.href === '/inventory/receptions' && pathname?.startsWith('/inventory/receptions')) return true
                if (subitem.href === '/clients' && pathname?.startsWith('/clients')) return true
                if (subitem.href === '/sales' && pathname?.startsWith('/sales')) return true
                if (subitem.href === '/payments' && pathname?.startsWith('/payments')) return true
                if (subitem.href === '/warranties' && pathname?.startsWith('/warranties')) return true
                if (subitem.href === '/stores' && pathname?.startsWith('/stores')) return true
                if (subitem.href === '/roles' && pathname?.startsWith('/roles')) return true
                if (subitem.href === '/logs' && pathname?.startsWith('/logs')) return true
                return pathname === subitem.href
              })
              
              // Para créditos, productos, ventas y stores, también considerar activo si la ruta empieza con el href
              const isActive = pathname === item.href || 
                (item.href === '/payments' && pathname?.startsWith('/payments')) ||
                (item.href === '/inventory/products' && pathname?.startsWith('/inventory')) ||
                (item.href === '/clients' && (pathname?.startsWith('/clients') || pathname?.startsWith('/sales') || pathname?.startsWith('/payments') || pathname?.startsWith('/warranties'))) ||
                (item.href === '/stores' && (pathname?.startsWith('/stores') || pathname?.startsWith('/roles') || pathname?.startsWith('/logs'))) ||
                (item.href === '/stores' && pathname?.startsWith('/stores')) ||
                isSubmenuActive
              
              // Selector activo: solo gris/blanco
              const getActiveColor = () =>
                'bg-white/90 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'

              // Color del icono según el módulo
              const getIconColorForItem = (active: boolean) => {
                if (item.name === 'Inventario') return active ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                if (item.name === 'Comercial') return active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                if (item.name === 'Administración') return active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                if (item.module === 'dashboard') return active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                return active ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white'
              }

              const toggleSubmenu = (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                setExpandedMenus(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(item.name)) {
                    newSet.delete(item.name)
                  } else {
                    newSet.add(item.name)
                  }
                  return newSet
                })
              }
              
              return (
                <div key={item.name}>
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={toggleSubmenu}
                        className={cn(
                          "group w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive || isSubmenuActive
                            ? getActiveColor()
                            : "text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <item.icon className={cn(
                            "h-5 w-5 transition-all duration-200 flex-shrink-0 mr-3",
                            getIconColorForItem(!!(isActive || isSubmenuActive))
                          )} />
                          <span className="flex-1 truncate text-left">{item.name}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && item.submenu && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subitem) => {
                            if (!canView(subitem.module)) return null
                            
                            // Ocultar "Transferencias" para usuarios de microtienda
                            if (subitem.href === '/inventory/transfers' && !isMainStoreUser(user)) return null
                            
                            // Verificar si requiere acceso a todas las tiendas (para el subitem de Tiendas)
                            if (subitem.requiresAllStoresAccess && !canAccessAllStores(user)) return null
                            
                            const isSubActive = pathname === subitem.href ||
                              (subitem.href === '/inventory/products' && pathname?.startsWith('/inventory/products')) ||
                              (subitem.href === '/inventory/transfers' && pathname?.startsWith('/inventory/transfers')) ||
                              (subitem.href === '/inventory/receptions' && pathname?.startsWith('/inventory/receptions')) ||
                              (subitem.href === '/clients' && pathname?.startsWith('/clients')) ||
                              (subitem.href === '/sales' && pathname?.startsWith('/sales')) ||
                              (subitem.href === '/payments' && pathname?.startsWith('/payments')) ||
                              (subitem.href === '/warranties' && pathname?.startsWith('/warranties')) ||
                              (subitem.href === '/stores' && pathname?.startsWith('/stores')) ||
                              (subitem.href === '/roles' && pathname?.startsWith('/roles')) ||
                              (subitem.href === '/logs' && pathname?.startsWith('/logs'))

                            // Color del icono del subítem según módulo
                            const getSubitemIconColor = (href: string) => {
                              if (href.startsWith('/inventory')) return isSubActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                              if (href === '/clients') return isSubActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                              if (href === '/sales') return isSubActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                              if (href === '/payments') return isSubActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                              if (href === '/warranties') return isSubActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                              if (href === '/stores') return isSubActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                              if (href === '/roles') return isSubActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              if (href === '/logs') return isSubActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                              return isSubActive ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white'
                            }
                            
                            return (
                              <Link
                                key={subitem.name}
                                href={subitem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  "group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                  isSubActive
                                    ? 'bg-white/90 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                )}
                              >
                                <subitem.icon className={cn(
                                  "h-4 w-4 transition-all duration-200 flex-shrink-0 mr-2",
                                  getSubitemIconColor(subitem.href)
                                )} />
                                <span className="flex-1 truncate">{subitem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {isStoresModule && !canAccessStores ? (
                        <div
                          className={cn(
                            "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-not-allowed opacity-50",
                            "text-gray-600 dark:text-gray-400"
                          )}
                          title="Solo disponible para Super Administradores"
                        >
                          <item.icon className="h-5 w-5 transition-all duration-200 flex-shrink-0 mr-3 text-purple-500 dark:text-purple-400" />
                          <span className="flex-1 truncate">{item.name}</span>
                        </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? getActiveColor()
                          : "text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-200 flex-shrink-0 mr-3",
                        getIconColorForItem(isActive)
                      )} />
                      <span className="flex-1 truncate">{item.name}</span>
                    </Link>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold text-white">
                      {user?.name?.charAt(0) || 'D'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'Diego Admin'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
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
                className="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200"
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
