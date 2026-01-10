'use client'

import { Store } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Store as StoreIcon,
  Power,
  PowerOff,
  MapPin,
  Building2
} from 'lucide-react'

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
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
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
      <CardContent className="p-0">
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
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    NIT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {store.logo ? (
                          <img
                            src={store.logo}
                            alt={store.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mr-3">
                            <StoreIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {store.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {store.nit || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {store.city || 'N/A'}
                        {store.address && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {store.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={store.isActive ? 'default' : 'secondary'}
                        className={store.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                      >
                        {store.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(store.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => onToggleStatus(store)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title={store.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {store.isActive ? (
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          onClick={() => onEdit(store)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          onClick={() => onDelete(store)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {stores.map((store) => (
                <div key={store.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                          <StoreIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {store.name}
                        </h3>
                        {store.nit && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            NIT: {store.nit}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={store.isActive ? 'default' : 'secondary'}
                      className={store.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                    >
                      {store.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>

                  {(store.city || store.address) && (
                    <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {store.city && <div>{store.city}</div>}
                        {store.address && <div className="mt-1">{store.address}</div>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Creada: {new Date(store.createdAt).toLocaleDateString('es-CO')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onToggleStatus(store)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title={store.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {store.isActive ? (
                          <PowerOff className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Power className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        onClick={() => onEdit(store)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        onClick={() => onDelete(store)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
