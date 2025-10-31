'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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

  // Debug: Log formData changes
  useEffect(() => {

  }, [formData])

  // Aplicar permisos cuando se cambia el rol
  useEffect(() => {
    if (formData.role) {

      const permissions = rolePermissions[formData.role as keyof typeof rolePermissions] || []

      setFormData(prev => ({ ...prev, permissions }))
    }
  }, [formData.role])

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
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // No mostrar contraseña
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive
    })
    setIsEditModalOpen(true)
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
  const togglePermission = (module: string, action: string) => {
    const newPermissions = [...formData.permissions]
    const existingPermission = newPermissions.find(p => p.module === module)
    
    if (existingPermission) {
      if (existingPermission.actions.includes(action)) {
        existingPermission.actions = existingPermission.actions.filter(a => a !== action)
        if (existingPermission.actions.length === 0) {
          newPermissions.splice(newPermissions.indexOf(existingPermission), 1)
        }
      } else {
        existingPermission.actions.push(action)
      }
    } else {
      newPermissions.push({ module, actions: [action] })
    }
    
    setFormData({ ...formData, permissions: newPermissions })
  }

  // Verificar si tiene permiso
  const hasPermission = (module: string, action: string) => {

    const permission = formData.permissions.find(p => p.module === module)
    const hasAccess = permission?.actions.includes(action) || false

    return hasAccess
  }

  // Aplicar permisos predefinidos del rol
  const applyRolePermissions = (role: string) => {

    const permissions = rolePermissions[role as keyof typeof rolePermissions] || []

    setFormData(prev => {
      const newData = { ...prev, role, permissions }

      return newData
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-indigo-600" />
                Gestión de Usuarios
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Administra los usuarios y sus permisos del sistema
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                <DialogHeader className="bg-emerald-50 dark:bg-emerald-900/20 p-6 -m-6 mb-6 border-b border-emerald-200 dark:border-emerald-800">
                  <DialogTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center">
                    <UserCheck className="h-6 w-6 mr-2 text-emerald-600" />
                    Crear Nuevo Usuario
                  </DialogTitle>
                  <DialogDescription className="text-emerald-700 dark:text-emerald-300 mt-2">
                    Completa la información del nuevo usuario y asigna los permisos correspondientes.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Izquierda - Información del Usuario */}
                    <div className="space-y-6">
                      {/* Información Básica */}
                      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                            <UserCheck className="h-5 w-5 mr-2 text-emerald-400" />
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                placeholder="Mínimo 6 caracteres"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rol *
                              </label>
                              <Select value={formData.role} onValueChange={applyRolePermissions}>
                                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-800">
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
                            <Shield className="h-5 w-5 mr-2 text-emerald-400" />
                            Descripción del Rol
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
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
                            <User className="h-5 w-5 mr-2 text-emerald-400" />
                            Estado del Usuario
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <Switch
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                            <Label htmlFor="isActive" className="text-base font-medium text-emerald-700 dark:text-emerald-300">
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
                            <Shield className="h-5 w-5 mr-2 text-emerald-400" />
                            Permisos del Sistema
                          </CardTitle>
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 mt-2">
                            Rol: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
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
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar usuarios</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="roleFilter">Filtrar por rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
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
              <Label htmlFor="statusFilter">Filtrar por estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
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
                        className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-100"
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
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 xl:left-64 bg-black/60 backdrop-blur-sm z-50 flex flex-col xl:items-center xl:justify-center xl:pl-6 xl:pr-4 pt-10 xl:pt-0">
          <div className="bg-white dark:bg-gray-900 rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-auto xl:w-auto xl:max-w-6xl xl:max-h-[95vh] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
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
                        <User className="h-5 w-5 text-indigo-600" />
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
                        <Shield className="h-5 w-5 text-indigo-600" />
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
                      <div className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <Switch
                          id="editIsActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                        <Label htmlFor="editIsActive" className="text-base font-medium text-indigo-700 dark:text-indigo-300">
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
                        <Shield className="h-5 w-5 text-indigo-600" />
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
                              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
