'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  CreditCard, 
  User, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus
} from 'lucide-react'
import { Credit, PaymentRecord } from '@/types'
import { CreditsService } from '@/lib/credits-service'

interface CreditDetailModalProps {
  isOpen: boolean
  onClose: () => void
  credit: Credit | null
  onAddPayment: (credit: Credit) => void
}

export function CreditDetailModal({ isOpen, onClose, credit, onAddPayment }: CreditDetailModalProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && credit) {
      loadPaymentHistory()
    }
  }, [isOpen, credit])

  const loadPaymentHistory = async () => {
    if (!credit) return
    
    setIsLoading(true)
    try {
      const history = await CreditsService.getPaymentHistory(credit.id)
      setPaymentHistory(history)
    } catch (error) {
      console.error('Error loading payment history:', error)
      setPaymentHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-400'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      case 'transfer':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800'
      case 'transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
    }
  }

  if (!isOpen || !credit) return null

  return (
    <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-pink-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detalles del Crédito
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                #{credit.id.slice(-6)}
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
            {/* Información del Crédito */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-pink-600" />
                  Información del Crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factura:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {credit.invoiceNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cliente:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {credit.clientName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Monto Total:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${credit.totalAmount.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado:
                    </label>
                    <Badge className={`${getStatusColor(credit.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(credit.status)}
                      {credit.status === 'completed' ? 'Completado' :
                       credit.status === 'partial' ? 'Parcial' :
                       credit.status === 'pending' ? 'Pendiente' :
                       credit.status === 'overdue' ? 'Vencido' :
                       credit.status === 'cancelled' ? 'Anulado' : 'Desconocido'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Pagado:
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      ${credit.paidAmount.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Pendiente:
                    </label>
                    <p className="text-lg font-semibold text-red-600">
                      ${credit.pendingAmount.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  {credit.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Vencimiento:
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(credit.dueDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  )}
                  
                  {credit.createdByName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Registrado por:
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {credit.createdByName}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Historial de Abonos */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-pink-600" />
                    Historial de Abonos
                  </CardTitle>
                  <Button 
                    onClick={() => onAddPayment(credit)}
                    disabled={credit?.status === 'cancelled'}
                    size="sm"
                    className={`${
                      credit?.status === 'cancelled' 
                        ? 'bg-gray-400 hover:bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-pink-600 hover:bg-pink-700 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {credit?.status === 'cancelled' ? 'Crédito Anulado' : 'Nuevo Abono'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No hay abonos registrados</p>
                    <Button 
                      onClick={() => onAddPayment(credit)}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primer Abono
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className={`border rounded-lg p-3 ${
                        credit?.status === 'cancelled' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              credit?.status === 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              ${payment.amount.toLocaleString('es-CO')}
                            </span>
                            <Badge className={`${getPaymentMethodColor(payment.paymentMethod)} flex items-center gap-1`}>
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              {payment.paymentMethod === 'cash' ? 'Efectivo' :
                               payment.paymentMethod === 'transfer' ? 'Transferencia' : payment.paymentMethod}
                            </Badge>
                            {credit?.status === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Anulado
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(payment.paymentDate).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                        
                        {payment.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {payment.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Registrado por: {payment.userName}</span>
                          <span>{new Date(payment.createdAt).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            onClick={onClose}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}