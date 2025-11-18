'use client'

import { User, Permission } from '@/types'
import { useAuth } from '@/contexts/auth-context'

export function usePermissions() {
  const { user: currentUser } = useAuth()

  const hasPermission = (module: string, action: string): boolean => {
    if (!currentUser) return false
    
    // Super admin tiene todos los permisos
    if (currentUser.role === 'superadmin' || currentUser.role === 'Super Admin') return true

    // El dashboard es accesible para todos los usuarios autenticados
    if (module === 'dashboard' && action === 'view') return true
    
    // Verificar que el usuario tenga permisos
    if (!currentUser.permissions || !Array.isArray(currentUser.permissions)) return false
    
    // Buscar el módulo en los permisos del usuario
    const modulePermission = currentUser.permissions.find(p => p.module === module)
    if (!modulePermission) return false
    
    // Soporte para ambas estructuras: "actions" o "permissions"
    const actions = modulePermission.actions || modulePermission.permissions || []
    if (!Array.isArray(actions)) return false
    
    // Verificar si tiene la acción específica
    return actions.includes(action)
  }

  const canView = (module: string): boolean => {
    return hasPermission(module, 'view')
  }

  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create')
  }

  const canEdit = (module: string): boolean => {
    return hasPermission(module, 'edit')
  }

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete')
  }

  const canCancel = (module: string): boolean => {
    return hasPermission(module, 'cancel')
  }

  const getAccessibleModules = (): string[] => {
    if (!currentUser) return []
    
    // Super admin tiene acceso a todos los módulos
    if (currentUser.role === 'superadmin' || currentUser.role === 'Super Admin') {
      return ['dashboard', 'products', 'clients', 'sales', 'payments', 'warranties', 'roles', 'logs', 'admin_clients', 'suppliers', 'purchase_orders', 'profitability']
    }
    
    if (!currentUser.permissions || !Array.isArray(currentUser.permissions)) return []
    
    const modules = currentUser.permissions
      .filter(p => {
        const actions = p.actions || p.permissions || []
        return Array.isArray(actions) && actions.includes('view')
      })
      .map(p => p.module)

    return Array.from(new Set(['dashboard', ...modules]))
  }

  const getModuleActions = (module: string): string[] => {
    if (!currentUser) return []
    
    // Super admin tiene todas las acciones
    if (currentUser.role === 'superadmin' || currentUser.role === 'Super Admin') {
      return ['view', 'create', 'edit', 'delete', 'cancel']
    }
    
    if (!currentUser.permissions || !Array.isArray(currentUser.permissions)) return []
    
    const modulePermission = currentUser.permissions.find(p => p.module === module)
    if (!modulePermission) return []
    
    // Soporte para ambas estructuras: "actions" o "permissions"
    const actions = modulePermission.actions || modulePermission.permissions || []
    return Array.isArray(actions) ? actions : []
  }

  return {
    currentUser,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canCancel,
    getAccessibleModules,
    getModuleActions
  }
}
