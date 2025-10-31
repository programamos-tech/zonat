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
    <div className="fixed inset-0 lg:left-64 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center lg:pl-6 lg:pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl w-full h-full lg:w-full lg:max-w-4xl lg:h-auto lg:max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 md:h-8 md:w-8 text-pink-600" />
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 mb-6">
          <div className="space-y-4 md:space-y-6">
            {/* Información del Crédito */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-400" />
                  Información del Crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="grid grid-cols-2 gap-4">
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
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-pink-600" />
                  Detalles del Abono
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto del Abono *
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => handleNumberChange('amount', e.target.value)}
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0" style={{ paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)` }}>
          <Button
            onClick={handleClose}
            variant="outline"
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Registrar Abono
          </Button>
        </div>
      </div>
    </div>
  )
}