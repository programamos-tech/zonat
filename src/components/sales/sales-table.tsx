'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Receipt,
  Download,
  Printer,
  RefreshCcw
} from 'lucide-react'
import { Sale } from '@/types'
import { usePermissions } from '@/hooks/usePermissions'

interface SalesTableProps {
  sales: Sale[]
  loading: boolean
  currentPage: number
  totalSales: number
  hasMore: boolean
  onEdit: (sale: Sale) => void
  onDelete: (sale: Sale) => void
  onView: (sale: Sale) => void
  onCreate: () => void
  onPrint: (sale: Sale) => void
  onPageChange: (page: number) => void
  onSearch: (searchTerm: string) => Promise<Sale[]>
  onRefresh?: () => void
}

export function SalesTable({ 
  sales, 
  loading,
  currentPage,
  totalSales,
  hasMore,
  onEdit, 
  onDelete, 
  onView, 
  onCreate, 
  onPrint,
  onPageChange,
  onSearch,
  onRefresh
}: SalesTableProps) {
  const { canCreate, currentUser } = usePermissions()
  const canCreateSales = canCreate('sales')
  
  // Debug: Log de permisos en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SalesTable] Usuario:', currentUser?.name, 'Rol:', currentUser?.role)
      console.log('[SalesTable] Permisos:', currentUser?.permissions)
      console.log('[SalesTable] canCreateSales:', canCreateSales)
    }
  }, [canCreateSales, currentUser])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchResults, setSearchResults] = useState<Sale[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Efecto para manejar la búsqueda
  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim()) {
        setIsSearching(true)
        try {
          const results = await onSearch(searchTerm)
          setSearchResults(results)
        } catch (error) {
      // Error silencioso en producción
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }

    // Debounce la búsqueda para evitar muchas llamadas
    const timeoutId = setTimeout(handleSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, onSearch])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const timeStr = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    return { date: dateStr, time: timeStr }
  }

  const generateInvoiceNumber = (sale: Sale) => {
    // Usar el invoiceNumber de la base de datos si existe
    if (sale.invoiceNumber) {
      return sale.invoiceNumber
    }
    // Fallback: usar los últimos 4 caracteres del ID como último recurso
    return `#FV${sale.id.slice(-4)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
      case 'draft':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      case 'draft':
        return 'Borrador'
      default:
        return status
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
      case 'credit':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300'
      case 'transfer':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300'
      case 'warranty':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 dark:hover:text-orange-300'
      case 'mixed':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 hover:text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Efectivo/Contado'
      case 'credit':
        return 'Crédito'
      case 'transfer':
        return 'Transferencia'
      case 'warranty':
        return 'Garantía'
      case 'mixed':
        return 'Mixto'
      default:
        return method
    }
  }

  const statuses = ['all', 'completed', 'pending', 'cancelled']

  // Usar resultados de búsqueda si hay un término de búsqueda, sino usar todas las ventas
  // Pero si está buscando, no mostrar nada hasta que termine la búsqueda
  const salesToShow = searchTerm.trim() ? (isSearching ? [] : searchResults) : sales
  
  // Eliminar duplicados por ID antes de filtrar
  const uniqueSales = salesToShow.filter((sale, index, self) => 
    index === self.findIndex((s) => s.id === sale.id)
  )
  
  const filteredSales = uniqueSales.filter(sale => {
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus
    return matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-visible">
        <CardHeader className="overflow-visible">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-shrink-0">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-blue-600" />
                  Gestión de Ventas
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Administra tus ventas y genera facturas
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 flex-wrap w-full sm:w-auto">
                {onRefresh && (
                  <Button 
                    onClick={onRefresh} 
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20 whitespace-nowrap flex-1 sm:flex-initial"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Actualizar</span>
                  </Button>
                )}
              {(canCreateSales || currentUser?.role === 'vendedor' || currentUser?.role === 'Vendedor' || currentUser?.role === 'vendedora' || currentUser?.role === 'Vendedora') && (
                <Button 
                  onClick={onCreate} 
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap flex-1 sm:flex-initial min-w-[140px] sm:min-w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Venta
                </Button>
              )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={isSearching ? "Buscando..." : "Buscar por número de factura..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                </div>
              )}
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'Todos los estados' : getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {isSearching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Buscando ventas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm.trim() ? 'No se encontraron ventas' : 'No hay ventas registradas'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm.trim() ? 'Intenta con otros criterios de búsqueda' : 'Comienza creando una nueva venta'}
              </p>
              {!searchTerm.trim() && (
                <Button 
                  onClick={onCreate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Venta
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {filteredSales.map((sale) => {
                  const { date, time } = formatDateTime(sale.createdAt)
                  return (
                    <div key={sale.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
                            {generateInvoiceNumber(sale)}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[220px]">
                            {sale.clientName}
                          </div>
                        </div>
                        <Badge className={getStatusColor(sale.status)}>{getStatusLabel(sale.status)}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </Badge>
                        <div className="text-right">
                          <div className="text-gray-900 dark:text-white font-semibold">
                            {formatCurrency(sale.total)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{date} • {time}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onView(sale)} className="h-8 px-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onPrint(sale)} className="h-8 px-2">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="w-20 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        # Factura
                      </th>
                      <th className="w-32 md:w-40 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="w-28 md:w-32 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="w-28 md:w-36 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="w-32 md:w-36 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                        Fecha
                      </th>
                      <th className="w-24 md:w-28 px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                        Estado
                      </th>
                      <th className="w-24 px-3 md:px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSales.map((sale) => {
                      const { date, time } = formatDateTime(sale.createdAt)
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                              {generateInvoiceNumber(sale)}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-4">
                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate" title={sale.clientName}>
                              {sale.clientName}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                            <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} text-xs`}>
                              {getPaymentMethodLabel(sale.paymentMethod)}
                            </Badge>
                          </td>
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {formatCurrency(sale.total)}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              <div className="font-medium">{date}</div>
                              <div className="text-gray-500 dark:text-gray-400">{time}</div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                            <Badge className={`${getStatusColor(sale.status)} text-xs whitespace-nowrap`}>
                              {getStatusLabel(sale.status)}
                            </Badge>
                          </td>
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onView(sale)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onPrint(sale)}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación - solo mostrar si no hay búsqueda activa */}
              {!searchTerm.trim() && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {sales.length} de {totalSales} ventas
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* Botón Anterior */}
                    <button
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.ceil(totalSales / 10) }, (_, i) => i + 1)
                        .filter(page => {
                          // Mostrar solo páginas cercanas a la actual
                          return page === 1 || 
                                 page === Math.ceil(totalSales / 10) || 
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
                                onClick={() => onPageChange(page)}
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
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalSales / 10) || loading}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
