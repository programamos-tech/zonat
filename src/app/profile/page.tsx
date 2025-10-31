'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { User, LogOut, Mail, Shield, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      superadmin: 'Super Administrador',
      admin: 'Administrador',
      vendedor: 'Vendedor',
      inventario: 'Inventario',
      contador: 'Contador'
    }
    return roles[role] || 'Usuario'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <RoleProtectedRoute module="dashboard" requiredAction="view">
        <div className="p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 dark:border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando perfil...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute module="dashboard" requiredAction="view">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Mi Perfil
                </CardTitle>
                <CardDescription className="mt-1">
                  Información de tu cuenta y configuración
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <Badge 
                    className={`mt-2 ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {user.isActive ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    variant="destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Correo Electrónico
                  </p>
                  <p className="mt-1 text-sm md:text-base text-gray-900 dark:text-white break-words">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rol
                  </p>
                  <p className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Último Inicio de Sesión
                  </p>
                  <p className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                    {formatDate(user.lastLogin)}
                  </p>
                </div>
              </div>

              {/* Account Created */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Cuenta Creada
                  </p>
                  <p className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Permissions */}
              {user.permissions && user.permissions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Módulos Accesibles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs md:text-sm"
                      >
                        {permission.module}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

