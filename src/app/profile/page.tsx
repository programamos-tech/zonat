'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { User, LogOut, Mail, Shield, Calendar, CheckCircle, XCircle, UserCircle, Clock, KeyRound } from 'lucide-react'
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

  const getRoleColor = (role: string) => {
    // Todos los avatares usan el verde esmeralda de la plataforma
    return 'bg-emerald-500'
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
        <div className="p-6 space-y-6 bg-white dark:bg-neutral-950 min-h-screen flex items-center justify-center">
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
      <div className="p-4 md:p-6 bg-white dark:bg-neutral-950 min-h-screen">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Información de tu cuenta y configuración
          </p>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className={`w-28 h-28 ${getRoleColor(user.role)} rounded-full flex items-center justify-center`}>
                    <User className="h-14 w-14 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-gray-200 dark:border-neutral-700 flex justify-center">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="px-4 py-1.5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition-all duration-200"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Email */}
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Correo Electrónico
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-white break-words">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Rol
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Último Inicio de Sesión
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(user.lastLogin)}
                  </p>
                </div>
              </div>

              {/* Account Created */}
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Cuenta Creada
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Permissions */}
              {user.permissions && user.permissions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Módulos Accesibles
                  </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <Badge
                        key={index}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium hover:bg-emerald-200 hover:border-emerald-300 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-700 transition-colors"
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

