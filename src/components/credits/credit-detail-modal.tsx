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
  Plus,
  Check
} from 'lucide-react'
import { Credit, PaymentRecord } from '@/types'
import { CreditsService } from '@/lib/credits-service'

interface CreditDetailModalProps {
  isOpen: boolean
  onClose: () => void
  credit: Credit | null
  clientCredits?: Credit[]
  onAddPayment: (credit: Credit) => void
  onViewSale?: (invoiceNumber: string) => void
}

export function CreditDetailModal({ isOpen, onClose, credit, clientCredits = [], onAddPayment, onViewSale }: CreditDetailModalProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCreditId, setSelectedCreditId] = useState<string>('')

  // Obtener el crédito actualmente seleccionado
  const currentCredit = clientCredits.find(c => c.id === selectedCreditId) || credit

  useEffect(() => {
    if (isOpen && credit) {
      // Inicializar el crédito seleccionado

      setSelectedCreditId(credit.id)
    }
  }, [isOpen, credit])
  
  // Log cuando cambia currentCredit
  useEffect(() => {
    if (currentCredit) {

    }
  }, [currentCredit])
  
  useEffect(() => {
    if (isOpen && currentCredit) {
      loadPaymentHistory()
    }
  }, [isOpen, currentCredit])

  // Forzar re-render cuando cambie la selección
  useEffect(() => {

    if (selectedCreditId && clientCredits.length > 0) {
      const newCredit = clientCredits.find(c => c.id === selectedCreditId)

    }
  }, [selectedCreditId, clientCredits])

  const loadPaymentHistory = async () => {
    if (!currentCredit) return
    
    setIsLoading(true)
    try {
      const history = await CreditsService.getPaymentHistory(currentCredit.id)
      setPaymentHistory(history)
    } catch (error) {
      // Error silencioso en producción
      setPaymentHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  // Función para verificar si un crédito está cancelado
  const isCreditCancelled = (credit: any) => {
    // Si totalAmount y pendingAmount son 0, el crédito está cancelado
    return credit?.totalAmount === 0 && credit?.pendingAmount === 0
  }

  const getStatusColor = (status: string, credit?: any) => {
    // Si el crédito está cancelado (montos en 0), usar color rojo
    if (isCreditCancelled(credit)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-400'
      case 'partial':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300'
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
        return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 hover:text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
    }
  }

  if (!isOpen || !credit) return null

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] flex flex-col border-0 xl:border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 md:h-8 md:w-8 text-orange-600" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Detalles del Crédito
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                {currentCredit?.invoiceNumber}
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
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="space-y-3 md:space-y-4">
            {clientCredits.length > 1 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="p-3 md:p-4">
                  <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    Todos los Créditos de {credit.clientName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clientCredits.map((c) => {
                      const isSelected = selectedCreditId === c.id
                      // Usar colores neutros y uniformes
      const bgColor = isSelected 
        ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500' 
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
      
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCreditId(c.id)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all relative hover:shadow-md ${bgColor}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                Factura: {c.invoiceNumber}
                              </div>
                              <Badge className={`${getStatusColor(c.status, c)} flex items-center gap-1 w-fit mt-1`}>
                                {getStatusIcon(c.status, c)}
                                {isCreditCancelled(c) ? 'Anulado' :
                                 c.status === 'completed' ? 'Completado' :
                                 c.status === 'partial' ? 'Parcial' :
                                 c.status === 'pending' ? 'Pendiente' :
                                 c.status === 'overdue' ? 'Vencido' :
                                 c.status === 'cancelled' ? 'Anulado' : 'Desconocido'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total: ${c.totalAmount.toLocaleString('es-CO')}
                              </div>
                              <div className={`text-sm font-semibold ${
                                c.pendingAmount === 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Pendiente: ${c.pendingAmount.toLocaleString('es-CO')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Información del Crédito y Historial de Abonos - Siempre visible */}
            {currentCredit && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                {/* Información del Crédito */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  Información del Crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factura:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentCredit?.invoiceNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cliente:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentCredit?.clientName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Monto Total:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${currentCredit?.totalAmount?.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado:
                    </label>
                    <Badge className={`${getStatusColor(currentCredit?.status || 'pending', currentCredit)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(currentCredit?.status || 'pending', currentCredit)}
                      {isCreditCancelled(currentCredit) ? 'Anulado' :
                       currentCredit?.status === 'completed' ? 'Completado' :
                       currentCredit?.status === 'partial' ? 'Parcial' :
                       currentCredit?.status === 'pending' ? 'Pendiente' :
                       currentCredit?.status === 'overdue' ? 'Vencido' :
                       currentCredit?.status === 'cancelled' ? 'Anulado' : 'Desconocido'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Pagado:
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      ${currentCredit?.paidAmount?.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      $ Pendiente:
                    </label>
                    <p className={`text-lg font-semibold ${
                      currentCredit?.pendingAmount === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${currentCredit?.pendingAmount?.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Vencimiento:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentCredit?.dueDate 
                        ? new Date(currentCredit.dueDate).toLocaleDateString('es-CO')
                        : 'No definida'
                      }
                    </p>
                  </div>
                  
                  {currentCredit?.createdByName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Registrado por:
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentCredit.createdByName}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Historial de Abonos */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    Historial de Abonos
                  </CardTitle>
                  <Button 
                    onClick={() => {

                      if (currentCredit) {

                        onAddPayment(currentCredit)
                      } else {
      // Error silencioso en producción
                      }
                    }}
                    disabled={!currentCredit || currentCredit?.status === 'cancelled' || isCreditCancelled(currentCredit)}
                    size="sm"
                    className={`w-full sm:w-auto ${
                      !currentCredit || currentCredit?.status === 'cancelled' || isCreditCancelled(currentCredit)
                        ? 'bg-gray-400 hover:bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {!currentCredit || currentCredit?.status === 'cancelled' || isCreditCancelled(currentCredit) ? 'Crédito Anulado' : 'Nuevo Abono'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-4">
                    <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay abonos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className={`border rounded-lg p-3 ${
                        currentCredit?.status === 'cancelled' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              currentCredit?.status === 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              ${payment.amount.toLocaleString('es-CO')}
                            </span>
                            <Badge className={`${getPaymentMethodColor(payment.paymentMethod)} flex items-center gap-1`}>
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              {payment.paymentMethod === 'cash' ? 'Efectivo' :
                               payment.paymentMethod === 'transfer' ? 'Transferencia' : payment.paymentMethod}
                            </Badge>
                            {currentCredit?.status === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Anulado
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {payment.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {payment.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Registrado por: {payment.userName}</span>
                          <span>{new Date(payment.paymentDate).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}