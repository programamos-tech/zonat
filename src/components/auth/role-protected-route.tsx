'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/usePermissions'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  module: string
  requiredAction?: string
}

export function RoleProtectedRoute({ 
  children, 
  module, 
  requiredAction = 'view' 
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const { hasPermission } = usePermissions()
  const router = useRouter()

        // Los módulos nuevos (suppliers, purchase_orders, profitability) son accesibles para todos los usuarios autenticados
        const isNewModule = module === 'suppliers' || module === 'purchase_orders' || module === 'profitability'

  useEffect(() => {
    if (!isLoading && user) {
      // Verificar si el usuario tiene permisos para este módulo (excepto módulos nuevos)
      if (!isNewModule && !hasPermission(module, requiredAction)) {
        // Redirigir según el rol del usuario
        const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin'
        if (isSuperAdmin) {
          router.push('/dashboard')
        } else {
          router.push('/products')
        }
      }
    }
  }, [user, isLoading, module, requiredAction, hasPermission, router, isNewModule])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-lg">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Si no tiene permisos, mostrar mensaje de acceso denegado (excepto módulos nuevos)
  if (!isNewModule && !hasPermission(module, requiredAction)) {
    return (
      <div className="min-h-screen flex items-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a este módulo. Si lo necesitas, contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
