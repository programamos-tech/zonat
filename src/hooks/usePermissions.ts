'use client'

import { User, Permission } from '@/types'
import { useAuth } from '@/contexts/auth-context'

export function usePermissions() {
  const { user: currentUser } = useAuth()

  const hasPermission = (module: string, action: string): boolean => {
    if (!currentUser) return false
    
    // Super admin tiene todos los permisos (cualquier variante del rol)
    const roleNorm = (currentUser.role || '').toLowerCase().trim()
    if (roleNorm === 'superadmin' || (roleNorm.includes('super') && (roleNorm.includes('admin') || roleNorm.includes('administrador')))) return true

    // El dashboard es accesible para todos los usuarios autenticados
    if (module === 'dashboard' && action === 'view') return true
    
    const userRole = currentUser.role?.toLowerCase() || ''

    // Rol inventario: solo productos por defecto (el resto según permisos guardados del usuario)
    if (userRole === 'inventario' && module === 'products') {
      return ['view', 'create', 'edit', 'delete', 'cancel'].includes(action)
    }

    // Restricción especial para vendedores
    if (userRole === 'vendedor' || userRole === 'vendedora') {
      if (module === 'products') {
        return action === 'view' // Solo permitir ver productos
      }
      if (module === 'transfers') {
        return false // Vendedores no pueden transferir
      }
      
      const hasExplicitPermissions = currentUser.permissions && Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0
      if (!hasExplicitPermissions) {
        const defaultVendedorPermissions: { [key: string]: string[] } = {
          'dashboard': ['view', 'create', 'edit', 'delete', 'cancel'],
          'clients': ['view', 'create', 'edit', 'delete', 'cancel'],
          'sales': ['view', 'create', 'edit', 'delete', 'cancel'],
          'payments': ['view', 'create', 'edit', 'delete', 'cancel']
        }
        const allowedActions = defaultVendedorPermissions[module] || []
        return allowedActions.includes(action)
      }
    }
    
    // Verificar que el usuario tenga permisos explícitos
    if (!currentUser.permissions || !Array.isArray(currentUser.permissions) || currentUser.permissions.length === 0) {
      // Si no hay permisos explícitos, NO dar permisos por defecto (excepto para vendedores que ya se manejó arriba)
      return false
    }
    
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
    
    const roleNorm = (currentUser.role || '').toLowerCase().trim()
    if (roleNorm === 'superadmin' || (roleNorm.includes('super') && (roleNorm.includes('admin') || roleNorm.includes('administrador')))) {
      return ['dashboard', 'products', 'transfers', 'receptions', 'clients', 'sales', 'payments', 'warranties', 'roles', 'logs', 'stores']
    }

    // Inventario: dashboard + solo los módulos que tenga marcados en permisos (ej. solo Productos)
    if (currentUser.role?.toLowerCase() === 'inventario') {
      const fromPermissions = currentUser.permissions && Array.isArray(currentUser.permissions)
        ? currentUser.permissions
            .filter(p => (p.actions || p.permissions || []).includes('view'))
            .map(p => p.module)
        : []
      return Array.from(new Set(['dashboard', ...fromPermissions]))
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
    
    const roleNorm = (currentUser.role || '').toLowerCase().trim()
    if (roleNorm === 'superadmin' || (roleNorm.includes('super') && (roleNorm.includes('admin') || roleNorm.includes('administrador')))) {
      return ['view', 'create', 'edit', 'delete', 'cancel']
    }

    if (currentUser.role?.toLowerCase() === 'inventario') {
      if (module === 'products') return ['view', 'create', 'edit', 'delete', 'cancel']
      // transfers y receptions solo si están en los permisos del usuario
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
