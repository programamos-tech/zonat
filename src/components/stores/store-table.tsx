'use client'

import { Store } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Store as StoreIcon,
  Power,
  PowerOff,
  MapPin,
  Building2,
  FileText,
  Calendar
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { canAccessAllStores } from '@/lib/store-helper'

interface StoreTableProps {
  stores: Store[]
  onEdit: (store: Store) => void
  onDelete: (store: Store) => void
  onToggleStatus: (store: Store) => void
  onCreate: () => void
  onRefresh: () => void
}

export function StoreTable({
  stores,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
  onRefresh
}: StoreTableProps) {
  const router = useRouter()
  const { user, switchStore } = useAuth()
  const isSuperAdmin = user && canAccessAllStores(user)
  const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

  const handleStoreClick = (store: Store, e: React.MouseEvent) => {
    // Solo permitir click si es super admin y no se hizo click en los botones de acción
    if (!isSuperAdmin || !switchStore) return
    
    const target = e.target as HTMLElement
    // Si se hizo click en un botón o en sus hijos, no cambiar de tienda
    if (target.closest('button') || target.closest('[role="button"]')) {
      return
    }

    // Cambiar de tienda
    const newStoreId = store.id === MAIN_STORE_ID ? undefined : store.id
    switchStore(newStoreId)
    
    // Crear slug de la tienda para la URL
    const storeSlug = store.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)
    
    // Redirigir al dashboard con el storeId en la URL
    router.push(`/dashboard?store=${storeSlug}`)
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <StoreIcon className="h-6 w-6 text-emerald-600" />
              Micro Tiendas
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gestiona las micro tiendas del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Tienda</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {stores.length === 0 ? (
          <div className="p-8 text-center">
            <StoreIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay tiendas registradas</p>
            <Button
              onClick={onCreate}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Crear Primera Tienda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {stores.map((store) => (
              <Card
                key={store.id}
                onClick={(e) => handleStoreClick(store, e)}
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden group ${
                  isSuperAdmin 
                    ? 'cursor-pointer hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:-translate-y-1' 
                    : ''
                }`}
                title={isSuperAdmin ? `Haz click para ver el dashboard de ${store.name}` : undefined}
              >
                <CardContent className="p-0">
                  {/* Header con Logo y Estado */}
                  <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Logo */}
                      <div className="relative">
                        {store.logo ? (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800">
                            <Image
                              src={store.logo}
                              alt={store.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800 flex items-center justify-center overflow-hidden">
                            <Image
                              src="/zonat-logo.png"
                              alt="Zona T Logo"
                              width={64}
                              height={64}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Estado */}
                      <Badge
                        variant={store.isActive ? 'default' : 'secondary'}
                        className={`${
                          store.isActive 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {store.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>

                    {/* Nombre de la Tienda */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {store.name}
                    </h3>
                  </div>

                  {/* Información */}
                  <div className="p-6 space-y-4">
                    {/* NIT */}
                    {store.nit && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">NIT</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {store.nit}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ubicación */}
                    {(store.city || store.address) && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ubicación</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {store.city || 'N/A'}
                          </div>
                          {store.address && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {store.address}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fecha de Creación */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha Creación</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {new Date(store.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                      <Button
                        onClick={() => onToggleStatus(store)}
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3"
                        title={store.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {store.isActive ? (
                          <PowerOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </Button>
                      <Button
                        onClick={() => onEdit(store)}
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button
                        onClick={() => onDelete(store)}
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
