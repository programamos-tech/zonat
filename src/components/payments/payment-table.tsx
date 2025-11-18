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
        return 'text-white dark:text-white'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusStyle = (status: string, credit?: any) => {
    if (isCreditCancelled(credit)) {
      return undefined
    }
    if (status === 'completed') {
      return {
        backgroundColor: 'rgba(92, 156, 124, 0.2)',
        color: 'var(--sidebar-orange)'
      }
    }
    return undefined
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
    <div className="space-y-4 md:space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                  <span className="flex-shrink-0">Gestión de Créditos</span>
                  {todayPaymentsTotal !== undefined && (
                    <span className="text-xs md:text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                      <span className="hidden md:inline">• Hoy: </span>
                      <span className="font-semibold">{formatCurrency(todayPaymentsTotal)}</span>
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Administra los créditos y pagos pendientes de tus clientes
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Administra los créditos
                </p>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  <span className="font-semibold" style={{ color: 'var(--sidebar-orange)' }}>Deuda: {formatCurrency(totalDebt)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4">
                <div className="text-right hidden md:block lg:hidden">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total Deuda:</div>
                  <div className="text-lg font-extrabold" style={{ color: 'var(--sidebar-orange)' }}>
                    {formatCurrency(totalDebt)}
                  </div>
                </div>
                <div className="text-right hidden lg:block">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Deuda:</div>
                  <div className="text-2xl font-extrabold" style={{ color: 'var(--sidebar-orange)' }}>
                    {formatCurrency(totalDebt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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
                  <Button onClick={onCreate} className="text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none" style={{ backgroundColor: 'var(--sidebar-orange)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden sm:inline">Nuevo Crédito</span>
                    <span className="sm:hidden">Nuevo</span>
                  </Button>
                </div>
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
                placeholder="Buscar crédito..."
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
              <option value="partial">Parcial</option>
              <option value="completed">Completado</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Anulado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
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
              <p className="text-gray-500 dark:text-gray-400">
                No hay créditos registrados en el sistema
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {filteredCredits.map((credit, index) => {
                  return (
                    <div
                      key={credit.id}
                      className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            <CreditCard className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                            <span className="text-xs font-mono font-semibold truncate" style={{ color: 'var(--sidebar-orange)' }} title={credit.invoiceNumber}>
                              {credit.invoiceNumber}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={credit.clientName}>
                            {credit.clientName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={getStatusLabel(credit.status, credit)}>
                            {getStatusLabel(credit.status, credit)}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(credit.status, credit)} text-xs shrink-0`} style={getStatusStyle(credit.status, credit)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(credit.status, credit)}
                            <span className="hidden sm:inline">{getStatusLabel(credit.status, credit)}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(credit.totalAmount)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Pendiente</div>
                          <div className={`text-xs font-semibold ${credit.pendingAmount === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(credit.pendingAmount)}
                          </div>
                        </div>
                      </div>
                      
                      {credit.dueDate && credit.status !== 'completed' && (
                        <div className="pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Vencimiento:</span>
                            <span className={`font-semibold ${getDueDateColor(credit.dueDate)}`}>
                              {formatDate(credit.dueDate)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex-1 min-w-0">
                          {credit.lastPaymentAmount && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`Último abono: ${formatCurrency(credit.lastPaymentAmount)}`}>
                              Último: {formatCurrency(credit.lastPaymentAmount)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(credit)}
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
                            onClick={() => onPayment(credit)}
                            disabled={credit.status === 'cancelled' || isCreditCancelled(credit) || getInvoiceCount(credit.invoiceNumber) > 1}
                            className={`h-8 w-8 p-0 active:scale-95 ${
                              credit.status === 'cancelled' || isCreditCancelled(credit) || getInvoiceCount(credit.invoiceNumber) > 1
                                ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                : ''
                            }`}
                            style={credit.status !== 'cancelled' && !isCreditCancelled(credit) && getInvoiceCount(credit.invoiceNumber) <= 1 ? { color: 'var(--sidebar-orange)' } : undefined}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '0.8'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '1'
                              }
                            }}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista de Tabla para Desktop */}
              <div className="hidden md:block overflow-x-auto credits-table-tablet-container">
                <table className="w-full table-fixed md:table-auto lg:table-fixed credits-table-tablet" style={{ fontFamily: 'var(--font-inter)' }}>
                <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
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
                <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                  {filteredCredits.map((credit) => (
                    <tr key={credit.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                          <div className="text-xs md:text-sm font-mono font-semibold truncate" style={{ color: 'var(--sidebar-orange)' }} title={credit.invoiceNumber}>
                            {credit.invoiceNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-full" title={credit.clientName}>
                          {credit.clientName}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5">
                        <Badge className={`${getStatusColor(credit.status, credit)} flex items-center gap-1 w-fit text-xs`} style={getStatusStyle(credit.status, credit)}>
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
                        <div className={`text-xs md:text-sm ${credit.status === 'completed' ? 'font-bold' : (credit.dueDate ? getDueDateColor(credit.dueDate) : 'text-gray-600 dark:text-gray-300')}`} style={credit.status === 'completed' ? { color: 'var(--sidebar-orange)' } : undefined}>
                          {credit.status === 'completed' ? 'Completado' : (credit.dueDate ? formatDate(credit.dueDate) : '-')}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(credit)}
                            className="h-7 w-7 md:h-8 md:w-8 p-0 active:scale-95 touch-manipulation"
                            title="Ver detalles"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                                : ''
                            }`}
                            style={credit.status !== 'cancelled' && !isCreditCancelled(credit) && getInvoiceCount(credit.invoiceNumber) <= 1 ? { color: 'var(--sidebar-orange)' } : undefined}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '0.8'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.opacity = '1'
                              }
                            }}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}