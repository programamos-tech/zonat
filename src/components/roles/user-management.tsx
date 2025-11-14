'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { User, Permission } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, X, User, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

const roleOptions = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'inventario', label: 'Inventario' }
]

const moduleOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'products', label: 'Productos' },
  { value: 'clients', label: 'Clientes' },
  { value: 'sales', label: 'Ventas' },
  { value: 'payments', label: 'Abonos' },
  { value: 'warranties', label: 'Garantías' },
  { value: 'roles', label: 'Roles' },
  { value: 'logs', label: 'Logs' }
]

const actionOptions = [
  { value: 'view', label: 'Ver' }
]

// Permisos predefinidos por rol
const rolePermissions = {
  'superadmin': [
    { module: 'dashboard', actions: ['view'] },
    { module: 'products', actions: ['view'] },
    { module: 'clients', actions: ['view'] },
    { module: 'sales', actions: ['view'] },
    { module: 'payments', actions: ['view'] },
    { module: 'roles', actions: ['view'] },
    { module: 'logs', actions: ['view'] }
  ],
  'admin': [
    { module: 'dashboard', actions: ['view'] },
    { module: 'sales', actions: ['view'] },
    { module: 'payments', actions: ['view'] }
  ],
  'vendedor': [
    { module: 'dashboard', actions: ['view'] },
    { module: 'sales', actions: ['view'] },
    { module: 'payments', actions: ['view'] },
    { module: 'warranties', actions: ['view'] }
  ],
  'inventario': [
    { module: 'products', actions: ['view'] }
  ]
}

// Descripciones de cada rol
const roleDescriptions = {
  'superadmin': 'Acceso completo a todos los módulos del sistema (Diego)',
  'admin': 'Acceso al dashboard, ventas y créditos',
  'vendedor': 'Acceso a ventas, créditos y garantías',
  'inventario': 'Acceso únicamente a productos'
}

export function UserManagement() {
  const { user: currentUser, getAllUsers, createUser, updateUser, deleteUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Formulario para crear/editar usuario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor',
    permissions: [] as any[],
    isActive: true
  })


  // Aplicar permisos cuando se cambia el rol (solo al crear, no al editar)
  useEffect(() => {
    // Solo aplicar permisos del rol si estamos creando un usuario nuevo (no hay selectedUser)
    if (formData.role && !selectedUser && isCreateModalOpen) {
      const permissions = rolePermissions[formData.role as keyof typeof rolePermissions] || []
      setFormData(prev => ({ ...prev, permissions }))
    }
  }, [formData.role, selectedUser, isCreateModalOpen])

  // Cargar usuarios
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {

      const usersData = await getAllUsers()

      setUsers(usersData)
    } catch (error) {
      // Error silencioso en producción
      toast.error('Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Crear usuario
  const handleCreateUser = async () => {
    try {

      const success = await createUser(formData)

      if (success) {
        toast.success('Usuario creado exitosamente')
        setIsCreateModalOpen(false)
        resetForm()
        // Recargar usuarios después de crear
        await loadUsers()
      } else {
        toast.error('Error creando usuario')
      }
    } catch (error) {
      // Error silencioso en producción
      toast.error('Error creando usuario')
    }
  }

  // Actualizar usuario
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {

      const success = await updateUser(selectedUser.id, formData)
      if (success) {
        toast.success('Usuario actualizado exitosamente')
        setIsEditModalOpen(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast.error('Error actualizando usuario')
      }
    } catch (error) {
      // Error silencioso en producción
      toast.error('Error actualizando usuario')
    }
  }

  // Abrir modal de confirmación de eliminación
  const openDeleteModal = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario')
      return
    }
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const success = await deleteUser(userToDelete.id)
      if (success) {
        toast.success('Usuario eliminado exitosamente')
        loadUsers()
        setIsDeleteModalOpen(false)
        setUserToDelete(null)
      } else {
        toast.error('Error eliminando usuario')
      }
    } catch (error) {
      toast.error('Error eliminando usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancelar eliminación
  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  // Abrir modal de edición
  const openEditModal = (user: User) => {
    try {
      setSelectedUser(user)
      
      // Validar y normalizar permisos
      // Soporta dos formatos:
      // 1. Formato nuevo: { module: "dashboard", actions: ["view"] }
      // 2. Formato DB actual: { module: "dashboard", permissions: ["view", "create", ...] }
      let normalizedPermissions: Permission[] = []
      if (user.permissions) {
        if (Array.isArray(user.permissions)) {
          normalizedPermissions = user.permissions
            .filter((p: any) => p && typeof p === 'object' && p.module)
            .map((p: any) => {
              // Detectar formato: si tiene 'permissions' (DB) o 'actions' (código)
              const actionsArray = p.actions || p.permissions || []
              return {
                module: String(p.module),
                actions: Array.isArray(actionsArray) ? actionsArray.map((a: any) => String(a)) : []
              }
            })
        } else if (typeof user.permissions === 'string') {
          // Intentar parsear si es un string JSON
          try {
            const parsed = JSON.parse(user.permissions)
            if (Array.isArray(parsed)) {
              normalizedPermissions = parsed
                .filter((p: any) => p && typeof p === 'object' && p.module)
                .map((p: any) => {
                  const actionsArray = p.actions || p.permissions || []
                  return {
                    module: String(p.module),
                    actions: Array.isArray(actionsArray) ? actionsArray.map((a: any) => String(a)) : []
                  }
                })
            }
          } catch (e) {
            console.error('[UserManagement] Error parsing permissions:', e)
            normalizedPermissions = []
          }
        }
      }
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // No mostrar contraseña
        role: user.role || 'vendedor',
        permissions: normalizedPermissions,
        isActive: user.isActive !== undefined ? user.isActive : true
      })
      setIsEditModalOpen(true)
    } catch (error: any) {
      console.error('[UserManagement] Error opening edit modal:', error)
      toast.error('Error al abrir el modal de edición. Por favor, intenta nuevamente.')
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'vendedor',
      permissions: [],
      isActive: true
    })
  }

  // Toggle permiso
  // Normaliza a formato 'actions' (código) al guardar
  const togglePermission = (module: string, action: string) => {
    try {
      if (!formData.permissions || !Array.isArray(formData.permissions)) {
        setFormData({ ...formData, permissions: [{ module, actions: [action] }] })
        return
      }
      
      const newPermissions = [...formData.permissions]
      const existingPermission = newPermissions.find(p => 
        p && typeof p === 'object' && p.module === module
      )
      
      if (existingPermission) {
        // Normalizar: usar 'actions' (eliminar 'permissions' si existe)
        const currentActions = existingPermission.actions || existingPermission.permissions || []
        const actionsArray = Array.isArray(currentActions) ? [...currentActions] : []
        
        if (actionsArray.includes(action)) {
          // Remover acción
          const filteredActions = actionsArray.filter(a => a !== action)
          if (filteredActions.length === 0) {
            // Eliminar permiso completo si no quedan acciones
            const index = newPermissions.indexOf(existingPermission)
            if (index > -1) {
              newPermissions.splice(index, 1)
            }
          } else {
            // Actualizar acciones (normalizar a formato 'actions')
            existingPermission.actions = filteredActions
            delete existingPermission.permissions // Eliminar formato antiguo si existe
          }
        } else {
          // Agregar acción
          actionsArray.push(action)
          existingPermission.actions = actionsArray
          delete existingPermission.permissions // Eliminar formato antiguo si existe
        }
      } else {
        // Crear nuevo permiso en formato normalizado
        newPermissions.push({ module, actions: [action] })
      }
      
      setFormData({ ...formData, permissions: newPermissions })
    } catch (error: any) {
      console.error('[UserManagement] Error toggling permission:', error)
      toast.error('Error al modificar el permiso')
    }
  }

  // Verificar si tiene permiso
  // Soporta ambos formatos: actions (código) y permissions (DB)
  const hasPermission = (module: string, action: string) => {
    try {
      if (!formData.permissions || !Array.isArray(formData.permissions)) {
        return false
      }
      
      const permission = formData.permissions.find(p => 
        p && 
        typeof p === 'object' && 
        p.module === module
      )
      
      if (!permission) {
        return false
      }
      
      // Soportar ambos formatos: 'actions' (código) o 'permissions' (DB)
      const actionsArray = permission.actions || permission.permissions || []
      if (!Array.isArray(actionsArray)) {
        return false
      }
      
      const hasAccess = actionsArray.includes(action) || false
      return hasAccess
    } catch (error: any) {
      console.error('[UserManagement] Error checking permission:', error)
      return false
    }
  }

  // Aplicar permisos predefinidos del rol
  // Solo aplica permisos cuando se está creando un usuario nuevo, no al editar
  const applyRolePermissions = (role: string) => {
    const permissions = rolePermissions[role as keyof typeof rolePermissions] || []
    
    setFormData(prev => {
      // Si estamos editando (hay selectedUser), mantener los permisos existentes
      // Solo cambiar el rol, no los permisos
      if (selectedUser) {
        return { ...prev, role }
      }
      // Si estamos creando, aplicar permisos del rol
      return { ...prev, role, permissions }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 flex-shrink-0" />
                  <span className="flex-shrink-0">Gestión de Usuarios</span>
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Administra los usuarios y sus permisos del sistema
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Administra los usuarios
                </p>
              </div>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden sm:inline">Nuevo Usuario</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modal de creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Crear Nuevo Usuario
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                    Completa la información del nuevo usuario y asigna los permisos correspondientes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda - Información del Usuario */}
                <div className="space-y-6">
                  {/* Información Básica */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        <UserCheck className="h-5 w-5 mr-2 text-blue-400" />
                        Información Básica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre Completo *
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                placeholder="Ej: Juan Pérez"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email *
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                placeholder="juan@zonat.com"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña *
                              </label>
                              <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                placeholder="Mínimo 6 caracteres"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rol *
                              </label>
                              <Select value={formData.role} onValueChange={applyRolePermissions}>
                                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map(role => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                  </Card>

                  {/* Descripción del Rol */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-400" />
                        Descripción del Rol
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              <span className="font-semibold">
                                {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                              </span>
                            </p>
                          </div>
                        </CardContent>
                  </Card>

                  {/* Estado del Usuario */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-400" />
                        Estado del Usuario
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <Switch
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <Label htmlFor="isActive" className="text-base font-medium text-blue-700 dark:text-blue-300">
                              Usuario Activo
                            </Label>
                          </div>
                        </CardContent>
                  </Card>
                </div>

                {/* Columna Derecha - Permisos */}
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-400" />
                        Permisos del Sistema
                      </CardTitle>
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 mt-2">
                        Rol: <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {roleOptions.find(r => r.value === formData.role)?.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                          {moduleOptions.map(module => (
                            <div key={module.value} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                              <label className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(module.value, 'view')}
                                  onChange={() => togglePermission(module.value, 'view')}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="font-semibold text-base text-gray-900 dark:text-white">{module.label}</span>
                              </label>
                            </div>
                          ))}
                        </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 sticky bottom-0"
              style={{
                paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)`
              }}
            >
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 py-2 md:py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div>
                <Label htmlFor="roleFilter" className="text-xs md:text-sm mb-1 md:mb-2 hidden md:block">Filtrar por rol</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roleOptions.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="statusFilter" className="text-xs md:text-sm mb-1 md:mb-2 hidden md:block">Filtrar por estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comienza creando un nuevo usuario
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3">
                {filteredUsers.map((user, index) => {
                  const formatDateTime = (dateString: string) => {
                    if (!dateString) return 'Nunca'
                    const date = new Date(dateString)
                    return date.toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                  return (
                    <div
                      key={user.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate" title={user.email}>
                              {user.email}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={user.name}>
                            {user.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={roleOptions.find(r => r.value === user.role)?.label || user.role}>
                            {roleOptions.find(r => r.value === user.role)?.label || user.role}
                          </p>
                        </div>
                        <Badge className={`${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'} text-xs shrink-0`}>
                          <div className="flex items-center space-x-1">
                            {user.isActive ? (
                              <span className="text-green-600 dark:text-green-400">●</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">●</span>
                            )}
                            <span className="hidden sm:inline">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Rol</div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={roleOptions.find(r => r.value === user.role)?.label || user.role}>
                            {roleOptions.find(r => r.value === user.role)?.label || user.role}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Último Acceso</div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={formatDateTime(user.lastLogin || '')}>
                            {formatDateTime(user.lastLogin || '').split(',')[0]}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={formatDateTime(user.lastLogin || '')}>
                            {user.lastLogin ? formatDateTime(user.lastLogin) : 'Nunca ha iniciado sesión'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(user)}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 active:scale-95"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteModal(user)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100 active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista de Lista para Desktop */}
              <div className="hidden md:block divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <div key={user.id} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          </div>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">
                            {roleOptions.find(r => r.value === user.role)?.label || user.role}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Último acceso: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Editar Usuario
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                    Modifica la información del usuario y sus permisos
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Columna Izquierda - Información del Usuario */}
                <div className="space-y-6">
                  {/* Información Personal */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="editName">Nombre Completo</Label>
                        <Input
                          id="editName"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editEmail">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editPassword">Nueva Contraseña (opcional)</Label>
                        <Input
                          id="editPassword"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Dejar vacío para mantener la actual"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rol y Estado */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Rol y Estado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="editRole">Rol</Label>
                        <Select value={formData.role} onValueChange={applyRolePermissions}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                          <div className="text-sm text-blue-800 dark:text-blue-300">
                            <span className="font-semibold">
                              {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <Switch
                          id="editIsActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor="editIsActive" className="text-base font-medium text-blue-700 dark:text-blue-300">
                          Usuario Activo
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Derecha - Permisos */}
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Permisos del Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {moduleOptions.map(module => (
                        <div key={module.value} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                          <label className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={hasPermission(module.value, 'view')}
                              onChange={() => togglePermission(module.value, 'view')}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="font-semibold text-base text-gray-900 dark:text-white">{module.label}</span>
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-10 flex-shrink-0" style={{ paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)` }}>
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Actualizar Usuario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        description={`¿Estás seguro de que quieres eliminar a ${userToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Usuario"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
