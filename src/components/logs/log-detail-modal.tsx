'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRightLeft, ShoppingCart, Package, Users, Tag, UserCheck, FileText, DollarSign, CreditCard, Receipt, TrendingUp, TrendingDown, User, Shield } from 'lucide-react'
import { LogEntry } from '@/types/logs'

interface LogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  log: LogEntry | null
}

export function LogDetailModal({ isOpen, onClose, log }: LogDetailModalProps) {
  if (!isOpen || !log) return null

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
        return X
      case 'sale_stock_deduction':
        return TrendingDown
      case 'sale_cancellation_stock_return':
        return TrendingUp
      case 'product_create':
      case 'product_edit':
      case 'product_delete':
        return Package
      case 'client_create':
      case 'client_edit':
      case 'client_delete':
        return Users
      case 'category_create':
      case 'category_edit':
      case 'category_delete':
        return Tag
      case 'warranty_create':
      case 'warranty_status_update':
      case 'warranty_update':
        return Shield
      default:
        return Package
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
      case 'product_edit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'product_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'client_create':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'client_edit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'client_delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'category_create':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'category_update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-100 dark:bg-gray-700 dark:text-gray-600 dark:text-gray-300'
    }
  }

  const getActionLabel = (action: string, module: string) => {
    // Manejar acciones específicas de ventas
    if (module === 'sales') {
      switch (action) {
        case 'sale_create':
          return 'Crear Venta'
        case 'credit_sale_create':
          return 'Crear Venta a Crédito'
        case 'sale_cancel':
          return 'Cancelar Venta'
        case 'sale_update':
          return 'Actualizar Venta'
        default:
          return action
      }
    }
    
    // Manejar acciones específicas de productos
    if (module === 'products') {
      switch (action) {
      case 'product_create':
        return 'Crear Producto'
      case 'product_update':
        return 'Actualizar Producto'
      case 'product_delete':
        return 'Eliminar Producto'
      case 'stock_transfer':
        return 'Transferir Stock'
      case 'stock_adjustment':
        return 'Ajustar Stock'
        case 'sale_stock_deduction':
          return 'Descontar Stock por Venta'
        case 'sale_cancellation_stock_return':
          return 'Devolver Stock por Cancelación'
        default:
          return action
      }
    }
    
    // Manejar acciones específicas de categorías
    if (module === 'categories') {
      switch (action) {
      case 'category_create':
        return 'Crear Categoría'
      case 'category_update':
        return 'Actualizar Categoría'
      case 'category_delete':
        return 'Eliminar Categoría'
        default:
          return action
      }
    }
    
    // Manejar acciones específicas de clientes
    if (module === 'clients') {
      switch (action) {
        case 'client_create':
          return 'Crear Cliente'
        case 'client_update':
          return 'Actualizar Cliente'
        case 'client_delete':
          return 'Eliminar Cliente'
        default:
          return action
      }
    }
    
    // Manejar acciones específicas de garantías
    if (module === 'warranties') {
      switch (action) {
        case 'warranty_create':
          return 'Crear Garantía'
        case 'warranty_status_update':
          return 'Actualizar Estado de Garantía'
        case 'warranty_update':
          return 'Actualizar Garantía'
        default:
          return action
      }
    }
    
    // Manejar otras acciones
    switch (action) {
      case 'Usuario Creado':
        return 'Crear Usuario'
      case 'Usuario Editado':
        return 'Editar Usuario'
      case 'Usuario Eliminado':
        return 'Eliminar Usuario'
      case 'Permisos Asignados':
        return 'Asignar Permisos'
      case 'Rol Cambiado':
        return 'Cambiar Rol'
      case 'Usuario Desactivado':
        return 'Desactivar Usuario'
      case 'Usuario Reactivado':
        return 'Reactivar Usuario'
      default:
        return action
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'Transferencia de Stock'
      case 'sale':
      case 'sale_create':
        return 'Venta'
      case 'sale_cancel':
        return 'Venta Cancelada'
      case 'sale_stock_deduction':
        return 'Descuento de Stock'
      case 'sale_cancellation_stock_return':
        return 'Devolución de Stock'
      case 'product_create':
        return 'Producto Creado'
      case 'product_edit':
        return 'Producto Editado'
      case 'product_delete':
        return 'Producto Eliminado'
      case 'client_create':
        return 'Cliente Creado'
      case 'client_edit':
        return 'Cliente Editado'
      case 'client_delete':
        return 'Cliente Eliminado'
      case 'category_create':
        return 'Categoría Creada'
      case 'category_update':
        return 'Categoría Actualizada'
      case 'category_edit':
        return 'Categoría Editada'
      case 'category_delete':
        return 'Categoría Eliminada'
      default:
        return type
    }
  }

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  const TypeIcon = getTypeIcon(log.type)

  return (
    <div className="fixed top-0 right-0 bottom-0 left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalles del Registro
            </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Información completa de la actividad registrada
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información General</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Acción:</span>
                  <Badge className={getTypeColor(log.type)}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {getActionLabel(log.action, (log as any).module)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Realizado por:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{(log as any).user_name || 'Desconocido'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                  <span className="text-gray-900 dark:text-white">{formatDateTime((log as any).created_at)}</span>
                </div>
              </div>
            </div>
              
            {/* Información específica según el tipo de acción */}
            {log.details && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                  <TypeIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalles de la Acción</h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Información específica para ventas */}
                  {log.action === 'sale_create' && log.details && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-medium text-gray-600 mb-3">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Detalles de la Venta</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Cliente:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Total:</span>
                          <div className="text-gray-900 dark:text-white font-bold text-lg">${(log.details.total || 0).toLocaleString('es-CO')}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Método de Pago:</span>
                          <div className="text-gray-900 dark:text-white">
                            {log.details.paymentMethod === 'cash' ? 'Efectivo' :
                             log.details.paymentMethod === 'transfer' ? 'Transferencia' :
                             log.details.paymentMethod === 'mixed' ? 'Mixto' :
                             log.details.paymentMethod === 'credit' ? 'Crédito' :
                             log.details.paymentMethod || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Items Vendidos:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.itemsCount || 0} productos</div>
                        </div>
                      </div>
                      
                      {/* Lista de productos vendidos */}
                      {log.details.items && log.details.items.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <span className="text-gray-600 dark:text-gray-300 text-xs block mb-3">Productos Vendidos:</span>
                          <div className="space-y-2">
                            {log.details.items.map((item: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Ref: {item.productReference}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {item.quantity} × ${(item.unitPrice || 0).toLocaleString('es-CO')}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                      ${(item.totalPrice || 0).toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.description || 'Nueva venta creada'}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'credit_sale_create' && log.details && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-medium text-gray-600 mb-3">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Detalles de la Venta a Crédito</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Cliente:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Total:</span>
                          <div className="text-gray-900 dark:text-white font-bold text-lg">${(log.details.total || 0).toLocaleString('es-CO')}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Método de Pago:</span>
                          <div className="text-gray-900 dark:text-white">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              Crédito
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Items Vendidos:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.itemsCount || 0} productos</div>
                        </div>
                      </div>
                      
                      {/* Lista de productos vendidos */}
                      {log.details.items && log.details.items.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <span className="text-gray-600 dark:text-gray-300 text-xs block mb-3">Productos Vendidos:</span>
                          <div className="space-y-2">
                            {log.details.items.map((item: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Ref: {item.productReference}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {item.quantity} × ${(item.unitPrice || 0).toLocaleString('es-CO')}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                      ${(item.totalPrice || 0).toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.description || 'Nueva venta a crédito creada'}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'sale_stock_deduction' && log.details && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-medium text-gray-600 mb-3">
                        <TrendingDown className="h-4 w-4" />
                        <span>Descuento de Stock por Venta</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Producto:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                          <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Cantidad Descontada:</span>
                          <div className="text-red-600 dark:text-red-400 font-bold text-lg">-{log.details.quantityDeducted || 0} unidades</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Ubicación:</span>
                          <div className="text-gray-900 dark:text-white">
                            {log.details.storeDeduction > 0 && log.details.warehouseDeduction > 0 ? 'Local + Bodega' :
                             log.details.storeDeduction > 0 ? 'Local' :
                             log.details.warehouseDeduction > 0 ? 'Bodega' : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Desglose del Descuento:</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="text-blue-400 text-xs">Local</div>
                            <div className="text-gray-900 dark:text-white font-bold text-lg">-{log.details.storeDeduction || 0} unidades</div>
                            <div className="text-gray-600 dark:text-gray-300 text-xs">
                              {log.details.previousStoreStock || 0} → {log.details.newStoreStock || 0}
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="text-orange-400 text-xs">Bodega</div>
                            <div className="text-gray-900 dark:text-white font-bold text-lg">-{log.details.warehouseDeduction || 0} unidades</div>
                            <div className="text-gray-600 dark:text-gray-300 text-xs">
                              {log.details.previousWarehouseStock || 0} → {log.details.newWarehouseStock || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.description || 'Stock descontado por venta'}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'sale_cancel' && log.details && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-medium text-gray-600 mb-3">
                        <X className="h-4 w-4" />
                        <span>Venta Cancelada</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">ID de Venta:</span>
                          <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.saleId || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Reembolso:</span>
                          <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                            {log.details.totalRefund ? `$${log.details.totalRefund.toLocaleString('es-CO')}` : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Motivo de Cancelación:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.reason || 'No especificado'}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.description || 'Venta cancelada'}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'sale_cancellation_stock_return' && log.details && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-medium text-gray-600 mb-3">
                        <TrendingUp className="h-4 w-4" />
                        <span>Devolución de Stock por Cancelación</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Producto:</span>
                          <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                          <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Cantidad Devuelta:</span>
                          <div className="text-green-600 dark:text-green-400 font-bold text-lg">+{log.details.quantityReturned || 0} unidades</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">Ubicación:</span>
                          <div className="text-gray-900 dark:text-white">
                            {log.details.location === 'store' ? 'Local' :
                             log.details.location === 'warehouse' ? 'Bodega' : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Stock Anterior vs Nuevo:</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs">Stock Anterior</div>
                            <div className="text-gray-600 dark:text-gray-300 font-bold text-lg">{log.details.previousStoreStock || 0} unidades</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div className="text-green-600 text-xs">Stock Nuevo</div>
                            <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.newStoreStock || 0} unidades</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Razón:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.reason || 'Venta cancelada'}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                        <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {log.details.description || 'Stock devuelto por cancelación de venta'}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'Permisos Asignados' && (log.details as any).description && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Resumen de permisos:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-2">
                          {(() => {
                            const desc = (log.details as any).description
                            // Extraer el nombre del usuario
                            const userMatch = desc.match(/^([^-]+) -/)
                            const userName = userMatch ? userMatch[1].trim() : 'Usuario'
                            
                            // Extraer cambios específicos
                            const changesMatch = desc.match(/Módulos: (.+?)\. Resumen:/)
                            const changes = changesMatch ? changesMatch[1].trim() : ''
                            
                            // Extraer resumen de permisos
                            const summaryMatch = desc.match(/Resumen: (.+)$/)
                            const summary = summaryMatch ? summaryMatch[1].trim() : ''
                            
                            return (
                              <>
                                <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                                  <UserCheck className="h-4 w-4" />
                                  <span>{userName}</span>
                                </div>
                                
                                {changes && (
                                  <div className="mb-3">
                                    <div className="text-gray-600 dark:text-gray-300 text-xs mb-1">Cambios realizados:</div>
                                    <div className="text-yellow-300 text-xs bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                      {changes
                                        .replace(/Agregados:/g, 'Agregados:')
                                        .replace(/Removidos:/g, 'Removidos:')
                                        .replace(/products:/g, 'Productos:')
                                        .replace(/clients:/g, 'Clientes:')
                                        .replace(/sales:/g, 'Ventas:')
                                        .replace(/payments:/g, 'Abonos:')
                                        .replace(/roles:/g, 'Roles:')
                                        .replace(/dashboard:/g, 'Dashboard:')
                                        .replace(/logs:/g, 'Logs:')
                                        .replace(/view/g, 'Ver')
                                        .replace(/create/g, 'Crear')
                                        .replace(/edit/g, 'Editar')
                                        .replace(/delete/g, 'Eliminar')
                                        .replace(/cancel/g, 'Cancelar')
                                      }
                                    </div>
                                  </div>
                                )}
                                
                                {summary && (
                                  <div>
                                    <div className="text-gray-600 dark:text-gray-300 text-xs mb-2">Permisos actuales:</div>
                                    <div className="space-y-1">
                                      {summary.split(' | ').map((module: any, index: number) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></div>
                                          <span className="text-xs">
                                            {module
                                              .replace(/Productos:/g, 'Productos:')
                                              .replace(/Clientes:/g, 'Clientes:')
                                              .replace(/Ventas:/g, 'Ventas:')
                                              .replace(/Abonos:/g, 'Abonos:')
                                              .replace(/Roles:/g, 'Roles:')
                                              .replace(/Dashboard:/g, 'Dashboard:')
                                              .replace(/Logs:/g, 'Logs:')
                                              .replace(/Ver/g, 'Ver')
                                              .replace(/Crear/g, 'Crear')
                                              .replace(/Editar/g, 'Editar')
                                              .replace(/Eliminar/g, 'Eliminar')
                                              .replace(/Cancelar/g, 'Cancelar')
                                            }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'Usuario Creado' && (log.details as any).newUser && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Nuevo usuario:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm">
                        <strong>{(log.details as any).newUser.name}</strong> - {(log.details as any).newUser.email} ({(log.details as any).newUser.role})
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'Usuario Editado' && (log.details as any).userName && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Usuario editado:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm">
                        <strong>{log.details.userName}</strong>
                        {log.details.changes && Object.keys(log.details.changes).length > 0 && (
                          <span className="text-gray-400 ml-2">
                            - Campos modificados: {Object.keys(log.details.changes).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'Usuario Eliminado' && log.details.deletedUser && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Usuario eliminado:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm">
                        <strong>{log.details.deletedUser.name}</strong> - {log.details.deletedUser.email}
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'Rol Cambiado' && log.details.userName && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Cambio de rol:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm">
                        <strong>{log.details.userName}</strong>
                        {log.details.changes?.role && (
                          <span className="text-gray-400 ml-2">
                            - Nuevo rol: {log.details.changes.role}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Información específica para productos */}
                  {log.action === 'product_create' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Producto creado:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Package className="h-4 w-4" />
                            <span>Resumen del Producto</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Marca:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.brand || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Categoría ID:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-xs">{log.details.category || 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Stock Inicial:</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-blue-400 text-xs">Bodega</div>
                                <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.stockWarehouse || 0} unidades</div>
                              </div>
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-green-600 text-xs">Local</div>
                                <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.stockStore || 0} unidades</div>
                              </div>
                            </div>
                            <div className="mt-2 text-center">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Total: </span>
                              <span className="text-gray-600 font-bold">
                                {(log.details.stockWarehouse || 0) + (log.details.stockStore || 0)} unidades
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Precios:</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-400 text-xs">Precio de Venta:</span>
                                <div className="text-gray-900 dark:text-white font-medium">${(log.details.price || 0).toLocaleString('es-CO')}</div>
                              </div>
                              <div>
                                <span className="text-gray-400 text-xs">Costo:</span>
                                <div className="text-gray-900 dark:text-white font-medium">${(log.details.cost || 0).toLocaleString('es-CO')}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'product_update' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Producto actualizado:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Package className="h-4 w-4" />
                            <span>Cambios Realizados</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Producto:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'ID: ' + (log.details.productId || 'N/A')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600 dark:text-gray-300 text-xs">Campos modificados:</span>
                            <div className="text-gray-600 text-sm">
                              {log.details.changes ? log.details.changes.join(', ') : 'N/A'}
                            </div>
                          </div>
                          
                          {log.details.updatedFields && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Valores actualizados:</span>
                              <div className="space-y-2">
                                {Object.entries(log.details.updatedFields).map(([field, value]) => (
                                  <div key={field} className="flex justify-between items-center bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                    <span className="text-gray-600 dark:text-gray-300 text-xs capitalize">
                                      {field === 'name' ? 'Nombre' :
                                       field === 'reference' ? 'Referencia' :
                                       field === 'brand' ? 'Marca' :
                                       field === 'price' ? 'Precio' :
                                       field === 'cost' ? 'Costo' :
                                       field === 'description' ? 'Descripción' :
                                       field === 'status' ? 'Estado' :
                                       field === 'stock' ? 'Stock' :
                                       field}
                                    </span>
                                    <span className="text-gray-900 dark:text-white text-xs">
                                      {field === 'price' || field === 'cost' ? 
                                        `$${(value as number).toLocaleString('es-CO')}` :
                                        field === 'stock' ? 
                                          JSON.stringify(value) :
                                        String(value)
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {log.details.previousValues && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Valores anteriores:</span>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-400">Nombre:</span>
                                  <div className="text-gray-600 dark:text-gray-300">{log.details.previousValues.name || 'N/A'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Referencia:</span>
                                  <div className="text-gray-600 dark:text-gray-300 font-mono">{log.details.previousValues.reference || 'N/A'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Marca:</span>
                                  <div className="text-gray-600 dark:text-gray-300">{log.details.previousValues.brand || 'N/A'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Precio:</span>
                                  <div className="text-gray-600 dark:text-gray-300">${(log.details.previousValues.price || 0).toLocaleString('es-CO')}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'product_delete' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Producto eliminado:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Package className="h-4 w-4" />
                            <span>Producto Eliminado</span>
                          </div>
                          
                          <div>
                            <span className="text-gray-600 dark:text-gray-300 text-xs">ID del Producto:</span>
                            <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productId || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'stock_transfer' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Transferencia de stock:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <ArrowRightLeft className="h-4 w-4" />
                            <span>Transferencia de Stock</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Producto:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Detalles de la Transferencia:</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-red-400 text-xs">Desde:</div>
                                <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.fromLocationLabel || 'N/A'}</div>
                                <div className="text-gray-600 dark:text-gray-300 text-xs">-{log.details.quantity || 0} unidades</div>
                              </div>
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-green-600 text-xs">Hacia:</div>
                                <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.toLocationLabel || 'N/A'}</div>
                                <div className="text-gray-600 dark:text-gray-300 text-xs">+{log.details.quantity || 0} unidades</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Stock Anterior:</span>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-400">Bodega:</span>
                                <div className="text-gray-600 dark:text-gray-300">{log.details.previousStock?.warehouse || 0} unidades</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Local:</span>
                                <div className="text-gray-600 dark:text-gray-300">{log.details.previousStock?.store || 0} unidades</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Stock Después:</span>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-400">Bodega:</span>
                                <div className="text-gray-900 dark:text-white font-medium">{log.details.newStock?.warehouse || 0} unidades</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Local:</span>
                                <div className="text-gray-900 dark:text-white font-medium">{log.details.newStock?.store || 0} unidades</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'stock_adjustment' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Ajuste de stock:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Package className="h-4 w-4" />
                            <span>Ajuste de Stock</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Producto:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.productName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Referencia:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.productReference || 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Detalles del Ajuste:</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-gray-400 text-xs">Ubicación:</div>
                                <div className="text-gray-900 dark:text-white font-bold text-lg">{log.details.locationLabel || 'N/A'}</div>
                              </div>
                              <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                <div className="text-gray-400 text-xs">Tipo de Ajuste:</div>
                                <div className={`font-bold text-lg ${
                                  log.details.actionType === 'incremento' ? 'text-green-600' : 'text-red-400'
                                }`}>
                                  {log.details.actionType === 'incremento' ? 'Incremento' : 'Reducción'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Cantidades:</span>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-400">Anterior:</span>
                                <div className="text-gray-600 dark:text-gray-300">{log.details.previousQuantity || 0} unidades</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Nueva:</span>
                                <div className="text-gray-900 dark:text-white font-medium">{log.details.newQuantity || 0} unidades</div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="text-gray-400">Diferencia:</span>
                              <div className={`font-bold ${
                                (log.details.difference || 0) > 0 ? 'text-green-600' : 'text-red-400'
                              }`}>
                                {(log.details.difference || 0) > 0 ? '+' : ''}{log.details.difference || 0} unidades
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Razón del Ajuste:</span>
                            <div className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                              {log.details.reason || 'No especificada'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Información específica para categorías */}
                  {log.action === 'category_create' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Categoría creada:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Tag className="h-4 w-4" />
                            <span>Nueva Categoría</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.categoryName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Estado:</span>
                              <div className={`font-medium ${log.details.status === 'active' ? 'text-green-600' : 'text-red-400'}`}>
                                {log.details.status === 'active' ? 'Activa' : 'Inactiva'}
                              </div>
                            </div>
                          </div>
                          
                          {log.details.description && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Descripción:</span>
                              <div className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                {log.details.description}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'category_update' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Categoría actualizada:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Tag className="h-4 w-4" />
                            <span>Categoría Actualizada</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.categoryName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Estado:</span>
                              <div className={`font-medium ${log.details.status === 'active' ? 'text-green-600' : 'text-red-400'}`}>
                                {log.details.status === 'active' ? 'Activa' : 'Inactiva'}
                              </div>
                            </div>
                          </div>
                          
                          {log.details.changes && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Cambios realizados:</span>
                              <div className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 p-3 rounded-lg">
                                {log.details.changes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.action === 'category_delete' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Categoría eliminada:</span>
                      <div className="text-gray-900 dark:text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Tag className="h-4 w-4" />
                            <span>Categoría Eliminada</span>
                          </div>
                          
                          <div>
                            <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                            <div className="text-gray-900 dark:text-white font-medium">{log.details.categoryName || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información específica para clientes */}
                  {log.action === 'client_create' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Cliente creado:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <User className="h-4 w-4" />
                            <span>Información del Cliente</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Email:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.clientEmail || 'Sin email'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Teléfono:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.clientPhone || 'Sin teléfono'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Documento:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.clientDocument || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Tipo:</span>
                              <div className="text-gray-900 dark:text-white">
                                {log.details.clientType === 'mayorista' ? 'Mayorista' :
                                 log.details.clientType === 'minorista' ? 'Minorista' :
                                 log.details.clientType === 'consumidor_final' ? 'Consumidor Final' :
                                 log.details.clientType || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                </div>
              </div>
            )}

                  {log.action === 'client_update' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Cliente actualizado:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <User className="h-4 w-4" />
                            <span>Cambios Realizados</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Cliente:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'ID: ' + (log.details.clientId || 'N/A')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Campos modificados:</span>
                              <div className="text-gray-900 dark:text-white">
                                {log.details.updatedFields && log.details.updatedFields.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {log.details.updatedFields.map((field: string, index: number) => (
                                      <span key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded text-xs">
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  'Información no disponible'
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {log.details.changes && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <span className="text-gray-600 dark:text-gray-300 text-xs block mb-2">Detalles de los cambios:</span>
                              <div className="space-y-2">
                                {Object.entries(log.details.changes).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center bg-gray-200 dark:bg-gray-600 p-2 rounded">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {key === 'name' ? 'Nombre' :
                                       key === 'email' ? 'Email' :
                                       key === 'phone' ? 'Teléfono' :
                                       key === 'document' ? 'Documento' :
                                       key === 'address' ? 'Dirección' :
                                       key === 'city' ? 'Ciudad' :
                                       key === 'state' ? 'Departamento' :
                                       key === 'type' ? 'Tipo de Cliente' :
                                       key === 'creditLimit' ? 'Límite de Crédito' :
                                       key === 'currentDebt' ? 'Deuda Actual' :
                                       key === 'status' ? 'Estado' :
                                       key.charAt(0).toUpperCase() + key.slice(1)}
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {value === null || value === undefined || value === '' ? 'N/A' :
                                       key === 'creditLimit' || key === 'currentDebt' ? `$${parseFloat(value).toLocaleString('es-CO')}` :
                                       key === 'type' ? (value === 'mayorista' ? 'Mayorista' : value === 'minorista' ? 'Minorista' : value === 'consumidor_final' ? 'Consumidor Final' : value) :
                                       key === 'status' ? (value === 'active' ? 'Activo' : value === 'inactive' ? 'Inactivo' : value === 'suspended' ? 'Suspendido' : value) :
                                       String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'client_delete' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Cliente eliminado:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <User className="h-4 w-4" />
                            <span>Información del Cliente Eliminado</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Nombre:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Email:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.clientEmail || 'Sin email'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Documento:</span>
                              <div className="text-gray-900 dark:text-white font-mono text-sm">{log.details.clientDocument || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalles específicos para garantías */}
                  {log.action === 'warranty_create' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Garantía creada:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Información de la Garantía</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Cliente:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.clientName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Estado:</span>
                              <div className="text-gray-900 dark:text-white">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.details.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                  {log.details.status === 'completed' ? 'Completada' : log.details.status}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Producto Defectuoso:</span>
                              <div className="text-gray-900 dark:text-white font-medium">{log.details.productReceivedName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Producto de Reemplazo:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.productDeliveredName || 'Sin producto de reemplazo'}</div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Motivo:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.reason || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {log.action === 'warranty_status_update' && log.details && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Estado de garantía actualizado:</span>
                      <div className="text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-600 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Cambio de Estado</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Estado Anterior:</span>
                              <div className="text-gray-900 dark:text-white">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  {log.details.previousStatus || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Estado Nuevo:</span>
                              <div className="text-gray-900 dark:text-white">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.details.newStatus === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : log.details.newStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                  {log.details.newStatus || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">Notas:</span>
                              <div className="text-gray-900 dark:text-white">{log.details.notes || 'Sin notas adicionales'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}