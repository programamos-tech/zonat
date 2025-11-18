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
  RefreshCcw,
  CreditCard
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
  todaySalesTotal?: number
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
  onRefresh,
  todaySalesTotal
}: SalesTableProps) {
  const { canCreate, currentUser } = usePermissions()
  const canCreateSales = canCreate('sales')
  
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
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
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
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
      case 'transfer':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
      case 'warranty':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
      case 'mixed':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
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
    <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <Receipt className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                  <span className="flex-shrink-0">Gestión de Ventas</span>
                  {todaySalesTotal !== undefined && (
                    <span className="text-xs md:text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                      <span className="hidden md:inline">• Ventas directas hoy: </span>
                      <span className="font-semibold">{new Intl.NumberFormat('es-CO', { 
                        style: 'currency', 
                        currency: 'COP',
                        minimumFractionDigits: 0 
                      }).format(todaySalesTotal)}</span>
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Administra tus ventas y genera facturas
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Administra tus ventas
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
                    <RefreshCcw className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Actualizar</span>
                  </Button>
                )}
                {(canCreateSales || currentUser?.role === 'vendedor' || currentUser?.role === 'Vendedor' || currentUser?.role === 'vendedora' || currentUser?.role === 'Vendedora') && (
                  <Button 
                    onClick={onCreate} 
                    className="text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none"
                    style={{ backgroundColor: 'var(--sidebar-orange)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden sm:inline">Nueva Venta</span>
                    <span className="sm:hidden">Nueva</span>
                  </Button>
                )}
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
                placeholder={isSearching ? "Buscando..." : "Buscar factura..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-10 md:pr-4 py-2 md:py-2.5 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
              {isSearching && (
                <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
                </div>
              )}
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
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          {isSearching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
              <p className="text-gray-500 dark:text-gray-400">Buscando ventas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm.trim() ? 'No se encontraron ventas' : 'No hay ventas registradas'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm.trim() ? 'Intenta con otros criterios de búsqueda' : 'Comienza creando una nueva venta'}
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {filteredSales.map((sale, index) => {
                  const { date, time } = formatDateTime(sale.createdAt)
                  return (
                    <div
                      key={sale.id}
                      className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            {sale.paymentMethod === 'credit' && (
                              <CreditCard className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{generateInvoiceNumber(sale)}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={sale.clientName}>
                            {sale.clientName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={getPaymentMethodLabel(sale.paymentMethod)}>
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(sale.status)} text-xs shrink-0`}>
                          <div className="flex items-center space-x-1">
                            {sale.status === 'completed' ? (
                              <span className="text-green-600 dark:text-green-400">●</span>
                            ) : sale.status === 'cancelled' ? (
                              <span className="text-red-600 dark:text-red-400">●</span>
                            ) : (
                              <span className="text-yellow-600 dark:text-yellow-400">●</span>
                            )}
                            <span className="hidden sm:inline">{getStatusLabel(sale.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Fecha</div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white">{date}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} text-xs`} title={getPaymentMethodLabel(sale.paymentMethod)}>
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(sale)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPrint(sale)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full table-fixed" style={{ fontFamily: 'var(--font-inter)' }}>
                  <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
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
                  <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                    {filteredSales.map((sale) => {
                      const { date, time } = formatDateTime(sale.createdAt)
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                          <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {sale.paymentMethod === 'credit' && (
                                <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                              )}
                              <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                {generateInvoiceNumber(sale)}
                              </div>
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
                                className="h-8 w-8 p-0"
                                style={{ color: 'var(--sidebar-orange)' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onPrint(sale)}
                                className="h-8 w-8 p-0"
                                style={{ color: 'var(--sidebar-orange)' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    <span className="hidden sm:inline">Mostrando </span>
                    <span className="font-semibold">{sales.length}</span>
                    <span className="hidden sm:inline"> de </span>
                    <span className="sm:hidden">/</span>
                    <span className="font-semibold">{totalSales}</span>
                    <span className="hidden md:inline"> ventas</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 md:space-x-2">
                    {/* Botón Anterior */}
                    <button
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-2 md:px-3 py-1.5 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      ‹
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex items-center space-x-0.5 md:space-x-1">
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
                                <span className="px-1 md:px-2 text-gray-400 text-xs md:text-sm">...</span>
                              )}
                              <button
                                onClick={() => onPageChange(page)}
                                disabled={loading}
                                className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors min-w-[28px] md:min-w-[32px] active:scale-95 ${
                                  page === currentPage 
                                    ? "font-medium" 
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]"
                                }`}
                                style={page === currentPage ? { backgroundColor: 'rgba(92, 156, 124, 0.2)', color: 'var(--sidebar-orange)' } : undefined}
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
                      className="px-2 md:px-3 py-1.5 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
