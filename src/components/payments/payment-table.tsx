'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Plus,
  Search,
  Eye,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCcw
} from 'lucide-react'
import { Credit } from '@/types'

// Funciones para manejar estados
const getStatusColor = (status: string, credit?: any) => {
  // Si el crédito está cancelado (montos en 0), usar color rojo
  if (isCreditCancelled(credit)) {
    return 'bg-red-100 text-red-800 border-red-200'
  }
  
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'partial':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: string, credit?: any) => {
  // Si el crédito está cancelado (montos en 0), usar ícono X
  if (isCreditCancelled(credit)) {
    return <XCircle className="h-4 w-4" />
  }
  
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />
    case 'partial':
      return <Clock className="h-4 w-4" />
    case 'pending':
      return <AlertCircle className="h-4 w-4" />
    case 'overdue':
      return <XCircle className="h-4 w-4" />
    case 'cancelled':
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

// Función para verificar si un crédito está cancelado
const isCreditCancelled = (credit: any) => {
  // Si totalAmount y pendingAmount son 0, el crédito está cancelado
  return credit?.totalAmount === 0 && credit?.pendingAmount === 0
}

const getStatusText = (status: string, credit?: any) => {
  // Si el crédito está cancelado (montos en 0), mostrar "Anulado"
  if (isCreditCancelled(credit)) {

    return 'Anulado'
  }

  switch (status) {
    case 'completed':
      return 'Completado'
    case 'partial':
      return 'Parcial'
    case 'pending':
      return 'Pendiente'
    case 'overdue':
      return 'Vencido'
    case 'cancelled':
      return 'Anulado'
    default:
      return status
  }
}

interface CreditTableProps {
  credits: Credit[]
  onView: (credit: Credit) => void
  onPayment: (credit: Credit) => void
  onCreate: () => void
  isLoading?: boolean
  onRefresh?: () => void
  todayPaymentsTotal?: number
}

export function CreditTable({ credits, onView, onPayment, onCreate, isLoading = false, onRefresh, todayPaymentsTotal }: CreditTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getDueDateColor = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'text-red-600 dark:text-red-400 font-bold' // Vencido
    } else if (diffDays <= 7) {
      return 'text-orange-600 dark:text-orange-400 font-bold' // Cercano (0 a 7 días)
    } else {
      return 'text-green-600 dark:text-green-400 font-bold' // Lejano (> 7 días)
    }
  }

  const getInvoiceCount = (invoiceNumber: string) => {
    // Extraer el número de facturas del string como "10 facturas" o "7 facturas"
    const match = invoiceNumber.match(/(\d+)\s+factura/)
    const count = match ? parseInt(match[1]) : 1

    return count
  }

  const getStatusColor = (status: string, credit?: any) => {
    // Si el crédito está cancelado (montos en 0), usar color rojo
    if (isCreditCancelled(credit)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'partial':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string, credit?: any) => {
    // Si el crédito está cancelado (montos en 0), mostrar "Anulado"
    if (isCreditCancelled(credit)) {
      return 'Anulado'
    }
    
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'partial':
        return 'Parcial'
      case 'completed':
        return 'Completado'
      case 'overdue':
        return 'Vencido'
      case 'cancelled':
        return 'Anulado'
      default:
        return status
    }
  }

  const totalDebt = credits
    .filter(credit => credit.status !== 'cancelled')
    .reduce((sum, credit) => sum + credit.pendingAmount, 0)

  const filteredCredits = credits.filter(credit => {
    const matchesSearch = credit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || credit.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
            <div>
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              Gestión de Créditos
              {todayPaymentsTotal !== undefined && (
                <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                  • Hoy: {formatCurrency(todayPaymentsTotal)}
                </span>
              )}
            </CardTitle>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                Administra los créditos y pagos pendientes de tus clientes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-right hidden lg:block">
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Deuda:</div>
                <div className="text-2xl font-extrabold text-orange-600">
                  {formatCurrency(totalDebt)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onRefresh && (
                  <Button 
                    onClick={onRefresh} 
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/20 whitespace-nowrap min-w-[120px]"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                )}
                <Button onClick={onCreate} className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap min-w-[120px]">
                  Nuevo Crédito
                </Button>
              </div>
            </div>
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
                placeholder="Buscar factura o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="completed">Completado</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Anulado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Cargando créditos...
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Por favor espera mientras cargamos la información.
              </p>
            </div>
          ) : filteredCredits.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron créditos pendientes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No hay créditos registrados en el sistema
              </p>
              <Button 
                onClick={onCreate}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Crédito
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto credits-table-tablet-container">
              <table className="w-full table-fixed md:table-auto lg:table-fixed credits-table-tablet">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Total Compra
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Saldo Pendiente
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Último Abono
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Registrado Por
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Fecha Vencimiento
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCredits.map((credit) => (
                    <tr key={credit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 truncate" title={credit.invoiceNumber}>
                          {credit.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-full" title={credit.clientName}>
                          {credit.clientName}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5">
                        <Badge className={`${getStatusColor(credit.status, credit)} flex items-center gap-1 w-fit text-xs`}>
                          {getStatusIcon(credit.status, credit)}
                          <span className="hidden sm:inline">{getStatusLabel(credit.status, credit)}</span>
                        </Badge>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden lg:table-cell">
                        <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(credit.totalAmount)}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 text-right">
                        <div className={`text-xs md:text-sm font-semibold ${credit.pendingAmount === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(credit.pendingAmount)}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-gray-900 dark:text-white">
                          {credit.lastPaymentAmount ? formatCurrency(credit.lastPaymentAmount) : '-'}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate" title={credit.lastPaymentUser || credit.createdByName || '-'}>
                          {credit.lastPaymentUser || credit.createdByName || '-'}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden lg:table-cell">
                        <div className={`text-xs md:text-sm ${credit.status === 'completed' ? 'text-green-600 dark:text-green-400 font-bold' : (credit.dueDate ? getDueDateColor(credit.dueDate) : 'text-gray-600 dark:text-gray-300')}`}>
                          {credit.status === 'completed' ? 'Completado' : (credit.dueDate ? formatDate(credit.dueDate) : '-')}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(credit)}
                            className="h-7 w-7 md:h-8 md:w-8 p-0 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-100 active:scale-95 touch-manipulation"
                            title="Ver detalles"
                          >
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPayment(credit)}
                            disabled={credit.status === 'cancelled' || isCreditCancelled(credit) || getInvoiceCount(credit.invoiceNumber) > 1}
                            className={`h-7 w-7 md:h-8 md:w-8 p-0 active:scale-95 touch-manipulation ${
                              credit.status === 'cancelled' || isCreditCancelled(credit) || getInvoiceCount(credit.invoiceNumber) > 1
                                ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                : 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-100'
                            }`}
                            title={
                              credit.status === 'cancelled' || isCreditCancelled(credit)
                                ? 'Crédito anulado' 
                                : getInvoiceCount(credit.invoiceNumber) > 1 
                                  ? 'Más de 1 factura - Use el detalle para registrar abonos'
                                  : 'Registrar abono'
                            }
                          >
                            <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}