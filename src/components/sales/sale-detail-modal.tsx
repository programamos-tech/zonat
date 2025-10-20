'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Receipt, 
  User, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  Printer,
  Download
} from 'lucide-react'
import { Sale } from '@/types'

interface SaleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  onCancel?: (saleId: string, reason: string) => void
  onPrint?: (sale: Sale) => void
}

export function SaleDetailModal({ 
  isOpen, 
  onClose, 
  sale, 
  onCancel,
  onPrint 
}: SaleDetailModalProps) {
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const cancelFormRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !sale) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
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
    return `${dateStr} ${timeStr}`
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
        return 'bg-green-900/20 text-green-400 border-green-700'
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-700'
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-700'
      default:
        return 'bg-gray-700 text-gray-300 border-gray-600'
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
      default:
        return status
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-900/20 text-green-400 border-green-700'
      case 'credit':
        return 'bg-blue-900/20 text-blue-400 border-blue-700'
      case 'transfer':
        return 'bg-purple-900/20 text-purple-400 border-purple-700'
      case 'warranty':
        return 'bg-orange-900/20 text-orange-400 border-orange-700'
      case 'mixed':
        return 'bg-indigo-900/20 text-indigo-400 border-indigo-700'
      default:
        return 'bg-gray-700 text-gray-300 border-gray-600'
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

  const handleCancel = () => {
    if (cancelReason.trim() && onCancel) {
      onCancel(sale.id, cancelReason)
      setCancelReason('')
      setShowCancelForm(false)
      onClose()
    }
  }

  const handleShowCancelForm = () => {
    setShowCancelForm(true)
    // Scroll to cancel form after a brief delay to ensure it's rendered
    setTimeout(() => {
      cancelFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }, 100)
  }

  // Mock seller email - in a real app this would come from the sale data
  const getSellerEmail = () => {
    return 'admin@zonat.com' // Default admin email
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Receipt className="h-6 w-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Detalle de Venta</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{generateInvoiceNumber(sale)}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
          {/* Sale Information - Single Card */}
          <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Información de la Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Factura</div>
                    <div className="font-bold text-blue-400 text-lg">{generateInvoiceNumber(sale)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cliente</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{sale.clientName}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Fecha</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{formatDateTime(sale.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Tipo de Pago</div>
                    <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Estado</div>
                      <Badge className={getStatusColor(sale.status)}>
                        {getStatusLabel(sale.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(sale.total)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Producto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Cant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Precio</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Subtotal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Vendedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-600">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{getSellerEmail()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cancel Form */}
          {showCancelForm && (
            <div ref={cancelFormRef}>
              <Card className="mt-6 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg text-red-500 dark:text-red-400 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  Anular Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo de anulación:
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ingrese el motivo de la anulación..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-600"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowCancelForm(false)}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-900/20 hover:border-red-400"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={!cancelReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-900/30 disabled:text-red-500/50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: !cancelReason.trim() ? '#991b1b' : '#dc2626' }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-white" />
                    Anular Factura
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
          <div className="flex space-x-3">
            {sale.status !== 'cancelled' && (
              <Button
                onClick={handleShowCancelForm}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 font-medium"
                style={{ backgroundColor: '#dc2626' }}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-white" />
                Anular Factura
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => onPrint?.(sale)}
              variant="outline"
              className="border-orange-500 text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
