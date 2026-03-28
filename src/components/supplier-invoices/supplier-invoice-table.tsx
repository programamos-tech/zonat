'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react'
import { SupplierInvoice } from '@/types'
import { StoreBadge } from '@/components/ui/store-badge'

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4" />
    case 'partial':
      return <Clock className="h-4 w-4" />
    case 'pending':
      return <AlertCircle className="h-4 w-4" />
    case 'cancelled':
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'partial':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'partial':
      return 'Parcial'
    case 'paid':
      return 'Pagada'
    case 'cancelled':
      return 'Anulada'
    default:
      return status
  }
}

interface SupplierInvoiceTableProps {
  invoices: SupplierInvoice[]
  suppliers: { id: string; name: string }[]
  onView: (inv: SupplierInvoice) => void
  onCreate: () => void
  canCreate?: boolean
  isLoading?: boolean
  onRefresh?: () => void
}

export function SupplierInvoiceTable({
  invoices,
  suppliers,
  onView,
  onCreate,
  canCreate = true,
  isLoading = false,
  onRefresh
}: SupplierInvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSupplierId, setFilterSupplierId] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

  const pendingTotal = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== 'cancelled' && i.status !== 'paid')
        .reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0),
    [invoices]
  )

  const filtered = invoices.filter((inv) => {
    const name = (inv.supplierName || '').toLowerCase()
    const num = inv.invoiceNumber.toLowerCase()
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q || name.includes(q) || num.includes(q)
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchesSupplier =
      filterSupplierId === 'all' || inv.supplierId === filterSupplierId
    return matchesSearch && matchesStatus && matchesSupplier
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-orange-600 flex-shrink-0" />
                  <span className="flex-shrink-0">Facturas de proveedores</span>
                  <StoreBadge />
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Cuentas por pagar: registra facturas recibidas y abonos al proveedor
                </p>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  <span className="font-semibold text-orange-600">
                    Por pagar: {formatCurrency(pendingTotal)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4">
                <div className="text-right hidden lg:block">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total por pagar</div>
                  <div className="text-2xl font-extrabold text-orange-600">
                    {formatCurrency(pendingTotal)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {onRefresh && (
                    <Button
                      onClick={onRefresh}
                      variant="outline"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/20 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                    >
                      <RefreshCcw className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                      <span className="hidden md:inline">Actualizar</span>
                    </Button>
                  )}
                  {canCreate && (
                    <Button
                      onClick={onCreate}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none"
                    >
                      <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                      <span className="hidden sm:inline">Nueva factura</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor o folio..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterSupplierId}
              onChange={(e) => {
                setFilterSupplierId(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white md:w-56 w-full"
            >
              <option value="all">Todos los proveedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white md:w-auto w-full"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Anulada</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Cargando facturas...
              </h3>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay facturas
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Registra la primera factura de proveedor con el botón Nueva factura
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3 p-3">
                {paginated.map((inv) => {
                  const pending = Math.max(0, inv.totalAmount - inv.paidAmount)
                  return (
                    <div
                      key={inv.id}
                      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => onView(inv)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {inv.supplierName || 'Proveedor'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-blue-600 dark:text-blue-400 truncate">
                            {inv.invoiceNumber}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(inv.status)} text-xs shrink-0`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(inv.status)}
                            {getStatusLabel(inv.status)}
                          </span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-neutral-700 text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Emisión</div>
                          <div className="font-medium">{formatDate(inv.issueDate)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Pendiente</div>
                          <div
                            className={
                              pending <= 0
                                ? 'font-semibold text-green-600'
                                : 'font-semibold text-red-600'
                            }
                          >
                            {formatCurrency(pending)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-800/80 border-b border-gray-200 dark:border-neutral-700">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Proveedor
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Folio
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Emisión
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Total
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Pagado
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Pendiente
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Estado
                      </th>
                      <th className="w-14 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((inv) => {
                      const pending = Math.max(0, inv.totalAmount - inv.paidAmount)
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-gray-100 dark:border-neutral-800 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 cursor-pointer"
                          onClick={() => onView(inv)}
                        >
                          <td className="p-3 text-gray-900 dark:text-white font-medium">
                            {inv.supplierName || '—'}
                          </td>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">
                            {formatDate(inv.issueDate)}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="p-3 text-right tabular-nums text-green-600 dark:text-green-400">
                            {formatCurrency(inv.paidAmount)}
                          </td>
                          <td className="p-3 text-right tabular-nums text-red-600 dark:text-red-400">
                            {formatCurrency(pending)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={getStatusColor(inv.status)}>
                              <span className="flex items-center justify-center gap-1">
                                {getStatusIcon(inv.status)}
                                {getStatusLabel(inv.status)}
                              </span>
                            </Badge>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => onView(inv)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-neutral-700">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
