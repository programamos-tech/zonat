import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  User, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
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

export function CreditDetailModal({ isOpen, onClose, credit, onAddPayment, onViewSale }: CreditDetailModalProps) {
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
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200'
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
        return 'bg-green-100 text-green-800 border-green-200'
      case 'transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!credit) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-pink-50 dark:bg-pink-900/20 border-b border-gray-200 dark:border-gray-600 -mx-6 -mt-6 mb-6 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Eye className="h-6 w-6 text-pink-600" />
            <div>
              <h2 className="text-2xl font-bold">Detalles del Crédito</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{credit.invoiceNumber}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Crédito */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Receipt className="h-5 w-5 text-pink-600" />
                Información del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium">Factura:</span>
                  </div>
                  <p className="text-lg font-semibold">{credit.invoiceNumber}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium">Cliente:</span>
                  </div>
                  <p className="text-lg font-semibold">{credit.clientName}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium">Monto Total:</span>
                  </div>
                  <p className="text-lg font-semibold">${credit.totalAmount.toLocaleString('es-CO')}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium">Estado:</span>
                  </div>
                  <Badge className={`${getStatusColor(credit.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(credit.status)}
                    {credit.status === 'completed' ? 'Completado' :
                     credit.status === 'partial' ? 'Parcial' :
                     credit.status === 'pending' ? 'Pendiente' :
                     credit.status === 'overdue' ? 'Vencido' :
                     credit.status === 'cancelled' ? 'Anulado' : 'Desconocido'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Pagado:</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600">${credit.paidAmount.toLocaleString('es-CO')}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Pendiente:</span>
                  </div>
                  <p className="text-lg font-semibold text-red-600">${credit.pendingAmount.toLocaleString('es-CO')}</p>
                </div>

                {credit.dueDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium">Fecha de Vencimiento:</span>
                    </div>
                    <p className="text-lg font-semibold">{new Date(credit.dueDate).toLocaleDateString('es-CO')}</p>
                  </div>
                )}

                {credit.createdByName && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium">Registrado por:</span>
                    </div>
                    <p className="text-lg font-semibold">{credit.createdByName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historial de Pagos */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CreditCard className="h-5 w-5 text-pink-600" />
                  Historial de Abonos
                </div>
                <Button 
                  onClick={() => onAddPayment(credit)}
                  disabled={credit?.status === 'cancelled'}
                  className={`${
                    credit?.status === 'cancelled' 
                      ? 'bg-gray-400 hover:bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-pink-600 hover:bg-pink-700 text-white'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {credit?.status === 'cancelled' ? 'Crédito Anulado' : 'Nuevo Abono'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay abonos registrados</p>
                  <Button 
                    onClick={() => onAddPayment(credit)}
                    className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Abono
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className={`border rounded-lg p-4 ${
                      credit?.status === 'cancelled' 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className={`font-semibold ${
                            credit?.status === 'cancelled' ? 'text-red-600 dark:text-red-400' : ''
                          }`}>
                            ${payment.amount.toLocaleString('es-CO')}
                          </span>
                          <Badge className={`${getPaymentMethodColor(payment.paymentMethod)} flex items-center gap-1`}>
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
                        <span className="text-sm text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      
                      {payment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {payment.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Registrado por: {payment.userName}</span>
                        <span>{new Date(payment.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className="bg-pink-600 hover:bg-pink-700 text-white border-pink-600 hover:border-pink-700"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
