'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  ArrowRightLeft,
  ShoppingCart,
  Package,
  Users,
  Tag,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Shield
} from 'lucide-react'
import { LogEntry } from '@/types/logs'

interface LogsTableProps {
  logs: LogEntry[]
  searchTerm?: string
  onSearchChange?: (term: string) => void
  moduleFilter?: string
  onModuleFilterChange?: (module: string) => void
  actionFilter?: string
  onActionFilterChange?: (action: string) => void
  onRefresh?: () => void
  loading?: boolean
  currentPage?: number
  totalLogs?: number
  hasMore?: boolean
  onPageChange?: (page: number) => void
}

export function LogsTable({ 
  logs, 
  searchTerm = '', 
  onSearchChange,
  moduleFilter = 'all',
  onModuleFilterChange,
  actionFilter = 'all',
  onActionFilterChange,
  onRefresh,
  loading = false,
  currentPage = 1,
  totalLogs = 0,
  hasMore = true,
  onPageChange
}: LogsTableProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [localFilterType, setLocalFilterType] = useState(moduleFilter)
  const [localFilterAction, setLocalFilterAction] = useState(actionFilter)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return ArrowRightLeft
      case 'sale':
      case 'sale_create':
        return ShoppingCart
      case 'credit_sale_create':
        return ShoppingCart
      case 'sale_cancel':
        return Trash2
      case 'sale_stock_deduction':
        return Package
      case 'sale_cancellation_stock_return':
        return Package
      case 'product_create':
        return Plus
      case 'product_update':
        return Edit
      case 'product_edit':
        return Edit
      case 'product_delete':
        return Trash2
      case 'adjustment':
        return Package
      case 'category_create':
        return Tag
      case 'category_update':
        return Edit
      case 'category_delete':
        return Trash2
      case 'client_create':
        return Users
      case 'client_edit':
        return Edit
      case 'client_delete':
        return Trash2
      case 'category_create':
        return Tag
      case 'category_edit':
        return Edit
      case 'category_delete':
        return Trash2
      case 'warranty_create':
      case 'warranty_status_update':
      case 'warranty_update':
        return Shield
      case 'roles':
        return Users
      case 'login':
        return Users
       default:
         return Users
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'sale':
      case 'sale_create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'credit_sale_create':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'sale_cancel':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'sale_stock_deduction':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'sale_cancellation_stock_return':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'product_create':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'product_update':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'product_edit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'product_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'adjustment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'category_create':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'category_update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'category_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'client_create':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'client_edit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'client_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'category_create':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'category_edit':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
      case 'category_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'warranty_create':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'warranty_status_update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'warranty_update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'roles':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'login':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'Transferencia de Stock'
      case 'sale':
      case 'sale_create':
        return 'Venta'
      case 'credit_sale_create':
        return 'Venta a Crédito'
      case 'sale_cancel':
        return 'Venta Cancelada'
      case 'sale_stock_deduction':
        return 'Descuento de Stock'
      case 'sale_cancellation_stock_return':
        return 'Devolución de Stock'
      case 'sale_cancellation_stock_return_batch':
        return 'Devolución de Stock Masiva'
      case 'product_create':
        return 'Producto Creado'
      case 'product_update':
        return 'Producto Actualizado'
      case 'product_edit':
        return 'Producto Editado'
      case 'product_delete':
        return 'Producto Eliminado'
      case 'adjustment':
        return 'Ajuste de Stock'
      case 'category_create':
        return 'Categoría Creada'
      case 'category_update':
        return 'Categoría Actualizada'
      case 'category_delete':
        return 'Categoría Eliminada'
      case 'client_create':
        return 'Cliente Creado'
      case 'client_edit':
        return 'Cliente Editado'
      case 'client_delete':
        return 'Cliente Eliminado'
      case 'category_create':
        return 'Categoría Creada'
      case 'category_edit':
        return 'Categoría Editada'
      case 'category_delete':
        return 'Categoría Eliminada'
      case 'warranty_create':
        return 'Garantía Creada'
      case 'warranty_status_update':
        return 'Estado de Garantía Actualizado'
      case 'warranty_update':
        return 'Garantía Actualizada'
      case 'roles':
        return 'Gestión de Usuarios'
      case 'login':
        return 'Inicio de Sesión'
      default:
        return type || 'Actividad'
    }
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (onSearchChange ? searchTerm : localSearchTerm) === '' ||
      log.description?.toLowerCase().includes((onSearchChange ? searchTerm : localSearchTerm).toLowerCase()) ||
      log.action.toLowerCase().includes((onSearchChange ? searchTerm : localSearchTerm).toLowerCase()) ||
      log.user_name?.toLowerCase().includes((onSearchChange ? searchTerm : localSearchTerm).toLowerCase())

    const matchesType = (onModuleFilterChange ? moduleFilter : localFilterType) === 'all' || log.module === (onModuleFilterChange ? moduleFilter : localFilterType)
    const matchesAction = (onActionFilterChange ? actionFilter : localFilterAction) === 'all' || log.action === (onActionFilterChange ? actionFilter : localFilterAction)

    return matchesSearch && matchesType && matchesAction
  })

  const types = ['all', 'transfer', 'sale', 'product_create', 'product_edit', 'product_delete', 'client_create', 'client_edit', 'client_delete', 'category_create', 'category_edit', 'category_delete', 'roles', 'login']
  const actions = [
    'all', 
    'Transferencia de Stock', 'Nueva Venta', 'Venta Cancelada', 
    'Producto Creado', 'Producto Editado', 'Producto Eliminado', 
    'Cliente Creado', 'Cliente Editado', 'Cliente Eliminado', 
    'Categoría Creada', 'Categoría Editada', 'Categoría Eliminada', 
    'Usuario Creado', 'Usuario Editado', 'Usuario Eliminado', 
    'Permisos Asignados', 'Permisos Revocados', 'Rol Cambiado', 
    'Usuario Desactivado', 'Usuario Reactivado', 'Acceso al Sistema'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                Registro de Actividades
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
                Historial completo de todas las operaciones del sistema
              </p>
            </div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                className="px-4 py-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={onSearchChange ? searchTerm : localSearchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  if (onSearchChange) {
                    onSearchChange(value)
                  } else {
                    setLocalSearchTerm(value)
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={onModuleFilterChange ? moduleFilter : localFilterType}
              onChange={(e) => {
                const value = e.target.value
                if (onModuleFilterChange) {
                  onModuleFilterChange(value)
                } else {
                  setLocalFilterType(value)
                }
              }}
              className="px-3 md:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">Todos los tipos</option>
              {types.slice(1).map(type => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
            <select
              value={onActionFilterChange ? actionFilter : localFilterAction}
              onChange={(e) => {
                const value = e.target.value
                if (onActionFilterChange) {
                  onActionFilterChange(value)
                } else {
                  setLocalFilterAction(value)
                }
              }}
              className="px-3 md:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">Todas las acciones</option>
              {actions.slice(1).map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron registros
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No hay actividades registradas en el sistema
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto logs-table-tablet-container">
              <table className="w-full table-fixed md:table-auto lg:table-fixed logs-table-tablet">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-10 md:w-16 pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="w-28 md:w-40 pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="w-20 md:w-32 pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Descripción
                    </th>
                    <th className="w-20 md:w-32 pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Usuario
                    </th>
                    <th className="w-24 md:w-32 pl-3 md:pl-4 pr-3 md:pr-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log, index) => {
                    // Mapear el tipo basado en el módulo y acción
                    const getLogType = (log: any) => {
                      // Manejar casos específicos independientemente del módulo
                      if (log.action === 'sale_cancellation_stock_return') return 'sale_cancellation_stock_return'
                      if (log.action === 'sale_cancellation_stock_return_batch') return 'sale_cancellation_stock_return'
                      
                      if (log.module === 'sales') {
                        if (log.action === 'sale_create') return 'sale'
                        if (log.action === 'credit_sale_create') return 'credit_sale_create'
                        if (log.action === 'sale_cancel') return 'sale_cancel'
                        if (log.action === 'sale_stock_deduction') return 'sale_stock_deduction'
                        if (log.action === 'sale_cancellation_stock_return') return 'sale_cancellation_stock_return'
                        return 'sale'
                      }
                      if (log.module === 'roles') {
                        if (log.action === 'Usuario Creado') return 'client_create'
                        if (log.action === 'Usuario Editado') return 'client_edit'
                        if (log.action === 'Usuario Eliminado') return 'client_delete'
                        if (log.action === 'Permisos Asignados') return 'client_edit'
                        if (log.action === 'Permisos Revocados') return 'client_edit'
                        if (log.action === 'Rol Cambiado') return 'client_edit'
                        if (log.action === 'Usuario Desactivado') return 'client_edit'
                        if (log.action === 'Usuario Reactivado') return 'client_edit'
                        return 'roles'
                      }
                      if (log.module === 'products') {
                        if (log.action === 'product_create') return 'product_create'
                        if (log.action === 'product_update') return 'product_update'
                        if (log.action === 'product_delete') return 'product_delete'
                        if (log.action === 'stock_transfer') return 'transfer'
                        if (log.action === 'stock_adjustment') return 'adjustment'
                        if (log.action === 'sale_cancellation_stock_return') return 'sale_cancellation_stock_return'
                        return 'product_create'
                      }
                      if (log.module === 'categories') {
                        if (log.action === 'category_create') return 'category_create'
                        if (log.action === 'category_update') return 'category_update'
                        if (log.action === 'category_delete') return 'category_delete'
                        return 'category_create'
                      }
                      if (log.module === 'clients') {
                        if (log.action === 'client_create') return 'client_create'
                        if (log.action === 'client_update') return 'client_edit'
                        if (log.action === 'client_delete') return 'client_delete'
                        return 'client_create'
                      }
                      if (log.module === 'warranties') {
                        if (log.action === 'warranty_create') return 'warranty_create'
                        if (log.action === 'warranty_status_update') return 'warranty_status_update'
                        if (log.action === 'warranty_update') return 'warranty_update'
                        return 'warranty_create'
                      }
                      if (log.module === 'sales') {
                        if (log.action.includes('Venta')) return 'sale'
                        return 'sale'
                      }
                      if (log.module === 'payments') {
                        if (log.action.includes('Transferencia')) return 'transfer'
                        return 'transfer'
                      }
                      if (log.module === 'auth') {
                        return 'login' // Tipo específico para login
                      }
                      return 'roles' // Default
                    }
                    
                    const logType = getLogType(log)
                    const TypeIcon = getTypeIcon(logType)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                            {totalLogs - ((currentPage - 1) * 20) - index}
                          </div>
                        </td>
                        <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4">
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <div className={`p-1.5 md:p-2 rounded-lg ${getTypeColor(logType)} flex-shrink-0`}>
                              <TypeIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate" title={getTypeLabel(logType)}>
                                {getTypeLabel(logType)}
                              </div>
                              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                {log.module === 'roles' ? 'Usuarios' : 
                                 log.module === 'products' ? 'Productos' :
                                 log.module === 'clients' ? 'Clientes' :
                                 log.module === 'warranties' ? 'Garantías' :
                                 log.module === 'sales' ? 'Ventas' :
                                 log.module === 'payments' ? 'Abonos' :
                                 log.module === 'logs' ? 'Logs' :
                                 log.module === 'auth' ? 'Login' :
                                 log.module || 'Sistema'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4">
                          <div 
                            className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate" 
                            title={
                              log.module === 'auth' ? 'Acceso' : 
                              log.module === 'sales' ?
                                (log.action === 'sale_create' ? 'Crear Venta' :
                                 log.action === 'credit_sale_create' ? 'Crear Venta a Crédito' :
                                 log.action === 'sale_cancel' ? 'Cancelar Venta' :
                                 log.action === 'sale_stock_deduction' ? 'Descontar Stock' :
                                 log.action === 'sale_cancellation_stock_return' ? 'Devolver Stock' :
                                 log.action === 'sale_cancellation_stock_return_batch' ? 'Devolver Stock Masivo' :
                                 log.action) :
                              log.module === 'products' ? 
                                (log.action === 'product_create' ? 'Crear' :
                                 log.action === 'product_update' ? 'Actualizar' :
                                 log.action === 'product_delete' ? 'Eliminar' :
                                 log.action === 'stock_transfer' ? 'Transferir' :
                                 log.action === 'stock_adjustment' ? 'Ajustar' :
                                 log.action === 'sale_cancellation_stock_return' ? 'Devolver Stock' :
                                 log.action === 'sale_cancellation_stock_return_batch' ? 'Devolver Stock Masivo' :
                                 log.action) :
                              log.module === 'categories' ?
                                (log.action === 'category_create' ? 'Crear' :
                                 log.action === 'category_update' ? 'Actualizar' :
                                 log.action === 'category_delete' ? 'Eliminar' :
                                 log.action) :
                              log.module === 'clients' ?
                                (log.action === 'client_create' ? 'Crear Cliente' :
                                 log.action === 'client_update' ? 'Actualizar Cliente' :
                                 log.action === 'client_delete' ? 'Eliminar Cliente' :
                                 log.action) :
                              log.module === 'warranties' ?
                                (log.action === 'warranty_create' ? 'Crear Garantía' :
                                 log.action === 'warranty_status_update' ? 'Actualizar Estado' :
                                 log.action === 'warranty_update' ? 'Actualizar Garantía' :
                                 log.action) :
                              log.action
                            }
                          >
                            {log.module === 'auth' ? 'Acceso' : 
                             log.module === 'sales' ?
                               (log.action === 'sale_create' ? 'Crear Venta' :
                                log.action === 'credit_sale_create' ? 'Crear Venta a Crédito' :
                                log.action === 'sale_cancel' ? 'Cancelar Venta' :
                                log.action === 'sale_stock_deduction' ? 'Descontar Stock' :
                                log.action === 'sale_cancellation_stock_return' ? 'Devolver Stock' :
                                log.action === 'sale_cancellation_stock_return_batch' ? 'Devolver Stock Masivo' :
                                log.action) :
                             log.module === 'products' ? 
                               (log.action === 'product_create' ? 'Crear' :
                                log.action === 'product_update' ? 'Actualizar' :
                                log.action === 'product_delete' ? 'Eliminar' :
                                log.action === 'stock_transfer' ? 'Transferir' :
                                log.action === 'stock_adjustment' ? 'Ajustar' :
                                log.action === 'sale_cancellation_stock_return' ? 'Devolver Stock' :
                                log.action === 'sale_cancellation_stock_return_batch' ? 'Devolver Stock Masivo' :
                                log.action) :
                             log.module === 'categories' ?
                               (log.action === 'category_create' ? 'Crear' :
                                log.action === 'category_update' ? 'Actualizar' :
                                log.action === 'category_delete' ? 'Eliminar' :
                                log.action) :
                             log.module === 'clients' ?
                               (log.action === 'client_create' ? 'Crear Cliente' :
                                log.action === 'client_update' ? 'Actualizar Cliente' :
                                log.action === 'client_delete' ? 'Eliminar Cliente' :
                                log.action) :
                             log.module === 'warranties' ?
                               (log.action === 'warranty_create' ? 'Crear Garantía' :
                                log.action === 'warranty_status_update' ? 'Actualizar Estado' :
                                log.action === 'warranty_update' ? 'Actualizar Garantía' :
                                log.action) :
                             log.action}
                          </div>
                        </td>
                        <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4 hidden lg:table-cell">
                          <div 
                            className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed overflow-hidden text-overflow-ellipsis line-clamp-2" 
                            title={
                              log.details ? 
                                (log.module === 'sales' ?
                                  (log.action === 'sale_create' ? `Nueva venta: ${log.details.clientName || 'Cliente'} - $${(log.details.total || 0).toLocaleString('es-CO')}` :
                                   log.action === 'credit_sale_create' ? `Venta a crédito: ${log.details.clientName || 'Cliente'} - $${(log.details.total || 0).toLocaleString('es-CO')}` :
                                   log.action === 'sale_cancel' ? `Venta cancelada: ${log.details.reason || 'Sin motivo'}` :
                                   log.action === 'sale_stock_deduction' ? log.details.description || 'Stock descontado por venta' :
                                   log.action === 'sale_cancellation_stock_return' ? log.details.description || 'Stock devuelto por cancelación' :
                                   log.details.description || log.action) :
                                 log.module === 'roles' ? 
                                  (log.action === 'Usuario Creado' ? `Nuevo usuario: ${log.details.newUser?.name || 'Usuario'}` :
                                   log.action === 'Usuario Editado' ? `Actualización: ${log.details.userName || 'Usuario'}` :
                                   log.action === 'Usuario Eliminado' ? `Usuario eliminado: ${log.details.deletedUser?.name || 'Usuario'}` :
                                   log.action === 'Permisos Asignados' ? `${log.details.description || 'Permisos asignados'}` :
                                   log.action) :
                                  log.module === 'products' ?
                                    (log.details.description || log.action) :
                                  log.module === 'categories' ?
                                    (log.action === 'category_create' ? `Nueva categoría: "${log.details.categoryName || 'Categoría'}"` :
                                     log.action === 'category_update' ? `Categoría actualizada: "${log.details.categoryName || 'Categoría'}"` :
                                     log.action === 'category_delete' ? `Categoría eliminada: "${log.details.categoryName || 'Categoría'}"` :
                                     log.details.description || log.action) :
                                  log.module === 'clients' ?
                                    (log.action === 'client_create' ? `Nuevo cliente: "${log.details.clientName || 'Cliente'}"` :
                                     log.action === 'client_update' ? `Cliente actualizado: "${log.details.clientName || 'Cliente'}"` :
                                     log.action === 'client_delete' ? `Cliente eliminado: "${log.details.clientName || 'Cliente'}"` :
                                     log.details.description || log.action) :
                                  log.module === 'warranties' ?
                                    (log.action === 'warranty_create' ? `Nueva garantía: "${log.details.clientName || 'Cliente'}" - ${log.details.productReceivedName || 'Producto'}` :
                                     log.action === 'warranty_status_update' ? `Estado actualizado: ${log.details.previousStatus || 'N/A'} → ${log.details.newStatus || 'N/A'}` :
                                     log.action === 'warranty_update' ? `Garantía actualizada: "${log.details.clientName || 'Cliente'}"` :
                                     log.details.description || log.action) :
                                  log.module === 'auth' ? 
                                    `Ingresó al sistema` :
                                  log.action) :
                                log.module === 'auth' ? 
                                  `Ingresó al sistema` :
                                log.action
                            }
                          >
                            {log.details ? 
                              (log.module === 'sales' ?
                                (log.action === 'sale_create' ? `Nueva venta: ${log.details.clientName || 'Cliente'} - $${(log.details.total || 0).toLocaleString('es-CO')}` :
                                 log.action === 'credit_sale_create' ? `Venta a crédito: ${log.details.clientName || 'Cliente'} - $${(log.details.total || 0).toLocaleString('es-CO')}` :
                                 log.action === 'sale_cancel' ? `Venta cancelada: ${log.details.reason || 'Sin motivo'}` :
                                 log.action === 'sale_stock_deduction' ? log.details.description || 'Stock descontado por venta' :
                                 log.action === 'sale_cancellation_stock_return' ? log.details.description || 'Stock devuelto por cancelación' :
                                 log.details.description || log.action) :
                               log.module === 'roles' ? 
                                (log.action === 'Usuario Creado' ? `Nuevo usuario: ${log.details.newUser?.name || 'Usuario'}` :
                                 log.action === 'Usuario Editado' ? `Actualización: ${log.details.userName || 'Usuario'}` :
                                 log.action === 'Usuario Eliminado' ? `Usuario eliminado: ${log.details.deletedUser?.name || 'Usuario'}` :
                                 log.action === 'Permisos Asignados' ? `${log.details.description || 'Permisos asignados'}` :
                                 log.action) :
                                log.module === 'products' ?
                                  (log.details.description || log.action) :
                                log.module === 'categories' ?
                                  (log.action === 'category_create' ? `Nueva categoría: "${log.details.categoryName || 'Categoría'}"` :
                                   log.action === 'category_update' ? `Categoría actualizada: "${log.details.categoryName || 'Categoría'}"` :
                                   log.action === 'category_delete' ? `Categoría eliminada: "${log.details.categoryName || 'Categoría'}"` :
                                   log.details.description || log.action) :
                                log.module === 'clients' ?
                                  (log.action === 'client_create' ? `Nuevo cliente: "${log.details.clientName || 'Cliente'}"` :
                                   log.action === 'client_update' ? `Cliente actualizado: "${log.details.clientName || 'Cliente'}"` :
                                   log.action === 'client_delete' ? `Cliente eliminado: "${log.details.clientName || 'Cliente'}"` :
                                   log.details.description || log.action) :
                                log.module === 'warranties' ?
                                  (log.action === 'warranty_create' ? `Nueva garantía: "${log.details.clientName || 'Cliente'}" - ${log.details.productReceivedName || 'Producto'}` :
                                   log.action === 'warranty_status_update' ? `Estado actualizado: ${log.details.previousStatus || 'N/A'} → ${log.details.newStatus || 'N/A'}` :
                                   log.action === 'warranty_update' ? `Garantía actualizada: "${log.details.clientName || 'Cliente'}"` :
                                   log.details.description || log.action) :
                                log.module === 'auth' ? 
                                  `Ingresó al sistema` :
                                log.action) :
                              log.module === 'auth' ? 
                                `Ingresó al sistema` :
                              log.action}
                          </div>
                        </td>
                        <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4 hidden lg:table-cell">
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white truncate" title={log.user_name || 'Desconocido'}>
                            {log.user_name || 'Desconocido'}
                          </div>
                        </td>
                        <td className="pl-3 md:pl-4 pr-3 md:pr-4 py-2 md:py-4">
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            {new Date(log.created_at).toLocaleDateString('es-CO', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalLogs > 20 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          {/* Información de página */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalLogs)} de {totalLogs} registros
          </div>
          
          {/* Controles de paginación */}
          <div className="flex items-center space-x-2">
            {/* Botón Anterior */}
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            
            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.ceil(totalLogs / 20) }, (_, i) => i + 1)
                .filter(page => {
                  // Mostrar solo páginas cercanas a la actual
                  return page === 1 || 
                         page === Math.ceil(totalLogs / 20) || 
                         Math.abs(page - currentPage) <= 2
                })
                .map((page, index, array) => {
                  // Agregar "..." si hay gap
                  const showEllipsis = index > 0 && page - array[index - 1] > 1
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-gray-400 text-sm">...</span>
                      )}
                      <button
                        onClick={() => onPageChange && onPageChange(page)}
                        disabled={loading}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors min-w-[32px] ${
                          page === currentPage 
                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium" 
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  )
                })}
            </div>
            
            {/* Botón Siguiente */}
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalLogs / 20) || loading}
              className="px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
