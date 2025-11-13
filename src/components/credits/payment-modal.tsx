'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  User,
  Calendar
} from 'lucide-react'
import { Credit, PaymentRecord } from '@/types'
import { useAuth } from '@/contexts/auth-context'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPayment: (paymentData: Partial<PaymentRecord>) => void
  credit: Credit | null
}

export function PaymentModal({ isOpen, onClose, onAddPayment, credit }: PaymentModalProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'mixed',
    cashAmount: '',
    transferAmount: '',
    description: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Función para formatear números con puntos
  const formatNumber = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return ''
    return parseInt(numericValue).toLocaleString('es-CO')
  }

  // Función para parsear números formateados
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/[^\d]/g, '')) || 0
  }

  // Función para manejar cambios en inputs numéricos
  const handleNumberChange = (field: string, value: string) => {
    const formatted = formatNumber(value)
    setFormData(prev => ({ ...prev, [field]: formatted }))
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credit) return

    const errors: {[key: string]: string} = {}

    // Validaciones
    const amountValue = parseFormattedNumber(formData.amount)
    if (!formData.amount || amountValue <= 0) {
      errors.amount = 'El monto debe ser mayor a 0'
    }

    if (amountValue > credit.pendingAmount) {
      errors.amount = 'El monto no puede ser mayor al saldo pendiente'
    }

    if (formData.paymentMethod === 'mixed') {
      const cashValue = parseFormattedNumber(formData.cashAmount)
      const transferValue = parseFormattedNumber(formData.transferAmount)
      
      if (!formData.cashAmount || cashValue <= 0) {
        errors.cashAmount = 'El monto en efectivo debe ser mayor a 0'
      }
      if (!formData.transferAmount || transferValue <= 0) {
        errors.transferAmount = 'El monto por transferencia debe ser mayor a 0'
      }
      
      const totalMixed = cashValue + transferValue
      
      if (Math.abs(totalMixed - amountValue) > 0.01) {
        const difference = amountValue - totalMixed
        if (difference > 0) {
          errors.mixed = `Faltan $${difference.toLocaleString('es-CO')} para completar el monto total`
        } else {
          errors.mixed = `Sobran $${Math.abs(difference).toLocaleString('es-CO')} del monto total`
        }
      }
    }

    setErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const paymentData: Partial<PaymentRecord> = {
      creditId: credit.id,
      amount: parseFormattedNumber(formData.amount),
      paymentDate: new Date().toISOString(),
      paymentMethod: formData.paymentMethod,
      description: formData.description,
      userId: user?.id || 'current-user-id',
      userName: user?.name || 'Usuario Actual',
      createdAt: new Date().toISOString()
    }

    if (formData.paymentMethod === 'mixed') {
      paymentData.cashAmount = parseFormattedNumber(formData.cashAmount)
      paymentData.transferAmount = parseFormattedNumber(formData.transferAmount)
    }

    onAddPayment(paymentData)
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      paymentMethod: 'cash',
      cashAmount: '',
      transferAmount: '',
      description: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const handlePaymentMethodChange = (value: 'cash' | 'transfer' | 'mixed') => {
    setFormData(prev => ({ 
      ...prev, 
      paymentMethod: value,
      cashAmount: '',
      transferAmount: ''
    }))
    setErrors({})
  }

  if (!isOpen || !credit) return null

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 xl:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg xl:rounded-xl shadow-2xl w-full h-full xl:w-auto xl:max-w-2xl xl:h-auto xl:max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 md:h-8 md:w-8 text-orange-600" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Agregar Abono
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                Registra un nuevo abono para el crédito seleccionado.
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3 md:p-4">
          <div className="space-y-3 md:space-y-4">
            {/* Información del Crédito */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  Información del Crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
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
                      Factura:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {credit.invoiceNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total:
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${credit.totalAmount.toLocaleString('es-CO')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Saldo Pendiente:
                    </label>
                    <p className="text-lg font-semibold text-red-600">
                      ${credit.pendingAmount.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles del Abono */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  Detalles del Abono
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto del Abono *
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => handleNumberChange('amount', e.target.value)}
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo: ${credit.pendingAmount.toLocaleString('es-CO')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as 'cash' | 'transfer' | 'mixed')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="mixed">Mixto (Efectivo + Transferencia)</option>
                  </select>
                </div>

                {formData.paymentMethod === 'mixed' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monto en Efectivo *
                      </label>
                      <input
                        type="text"
                        value={formData.cashAmount}
                        onChange={(e) => handleNumberChange('cashAmount', e.target.value)}
                        placeholder="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.cashAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.cashAmount && (
                        <p className="text-sm text-red-500 mt-1">{errors.cashAmount}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monto por Transferencia *
                      </label>
                      <input
                        type="text"
                        value={formData.transferAmount}
                        onChange={(e) => handleNumberChange('transferAmount', e.target.value)}
                        placeholder="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.transferAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.transferAmount && (
                        <p className="text-sm text-red-500 mt-1">{errors.transferAmount}</p>
                      )}
                    </div>
                    {errors.mixed && (
                      <p className="text-sm text-red-500 col-span-2">{errors.mixed}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Agregar observaciones sobre el abono..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <Button
            onClick={handleClose}
            variant="outline"
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Registrar Abono
          </Button>
        </div>
      </div>
    </div>
  )
}