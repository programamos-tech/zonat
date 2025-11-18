'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart,
  RefreshCw,
  Package,
  Calendar,
  Eye,
  CheckCircle
} from 'lucide-react'
import { PurchaseOrder } from '@/types'

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[]
  onEdit: (order: PurchaseOrder) => void
  onDelete: (order: PurchaseOrder) => void
  onView: (order: PurchaseOrder) => void
  onReceive?: (order: PurchaseOrder) => void
  onCreate: () => void
  onRefresh?: () => void
}

export function PurchaseOrderTable({ 
  orders, 
  onEdit, 
  onDelete,
  onView,
  onReceive,
  onCreate,
  onRefresh
}: PurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'received':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'partial':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'in_transit':
        return 'En Tránsito'
      case 'received':
        return 'Recibida'
      case 'partial':
        return 'Parcial'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                  <span className="flex-shrink-0">Órdenes de Compra</span>
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Gestiona tus órdenes de compra a proveedores
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Gestiona tus órdenes
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {onRefresh && (
                  <Button 
                    onClick={onRefresh} 
                    variant="outline"
                    className="text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-all duration-200 cursor-pointer"
                    style={{ color: 'var(--sidebar-orange)' }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Actualizar</span>
                  </Button>
                )}
                <Button 
                  onClick={onCreate}
                  className="text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none"
                  style={{ backgroundColor: 'var(--sidebar-orange)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline">Nueva Orden</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ fontFamily: 'var(--font-inter)' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-inter)' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_transit">En Tránsito</option>
              <option value="received">Recibida</option>
              <option value="partial">Parcial</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron órdenes
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Comienza creando una nueva orden de compra
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">{order.orderNumber}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={order.supplierName}>
                          {order.supplierName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} text-xs shrink-0`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">
                          ${order.total.toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Fecha Est.</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">
                          {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString('es-CO') : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(order)}
                          className="h-8 px-2 text-xs active:scale-95"
                          style={{ color: 'var(--sidebar-orange)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {(order.status === 'pending' || order.status === 'in_transit') && onReceive && (
                          <Button
                            size="sm"
                            onClick={() => onReceive(order)}
                            className="h-8 px-2 text-xs active:scale-95 text-white"
                            style={{ backgroundColor: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Recibir
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(order)}
                          className="h-8 w-8 p-0 active:scale-95"
                          style={{ color: 'var(--sidebar-orange)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(order)}
                          className="h-8 w-8 p-0 active:scale-95"
                          style={{ color: '#EF4444' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista de Tabla para Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed" style={{ fontFamily: 'var(--font-inter)' }}>
                <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
                  <tr>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="w-1/4 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                      <td className="px-3 py-3">
                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </div>
                        {order.invoiceNumber && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Fact: {order.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={order.supplierName}>
                          {order.supplierName}
                        </div>
                        {order.estimatedDeliveryDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.estimatedDeliveryDate).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Package className="h-4 w-4 text-gray-400" />
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${order.total.toLocaleString('es-CO')}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(order)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(order.status === 'pending' || order.status === 'in_transit') && onReceive && (
                            <Button
                              size="sm"
                              onClick={() => onReceive(order)}
                              className="h-8 px-2 text-xs active:scale-95 text-white"
                              style={{ backgroundColor: 'var(--sidebar-orange)' }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                              title="Recibir mercancía"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Recibir
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(order)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(order)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: '#EF4444' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

