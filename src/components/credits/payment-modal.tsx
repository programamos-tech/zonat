'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, DollarSign, Calendar, User, Receipt } from 'lucide-react'
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

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }))
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }))
    }
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

  if (!credit) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-pink-50 dark:bg-pink-900/20 p-6 -m-6 mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-pink-600" />
            Agregar Abono
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            Registra un nuevo abono para el crédito seleccionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Crédito */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex items-center space-x-3 pb-3">
              <Receipt className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Cliente:</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {credit.clientName}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Factura:</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {credit.invoiceNumber}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total:</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${credit.totalAmount.toLocaleString('es-CO')}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Saldo Pendiente:</span>
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    ${credit.pendingAmount.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Abono */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex items-center space-x-3 pb-3">
              <CreditCard className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalles del Abono
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto del Abono *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={formData.amount}
                  onChange={(e) => handleNumberChange('amount', e.target.value)}
                  placeholder="0"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
                <p className="text-xs text-gray-500">
                  Máximo: ${credit.pendingAmount.toLocaleString('es-CO')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago *</Label>
                <Select value={formData.paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="mixed">Mixto (Efectivo + Transferencia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMethod === 'mixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashAmount">Monto en Efectivo *</Label>
                    <Input
                      id="cashAmount"
                      type="text"
                      value={formData.cashAmount}
                      onChange={(e) => handleNumberChange('cashAmount', e.target.value)}
                      placeholder="0"
                      className={errors.cashAmount ? 'border-red-500' : ''}
                    />
                    {errors.cashAmount && (
                      <p className="text-sm text-red-500">{errors.cashAmount}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Monto por Transferencia *</Label>
                    <Input
                      id="transferAmount"
                      type="text"
                      value={formData.transferAmount}
                      onChange={(e) => handleNumberChange('transferAmount', e.target.value)}
                      placeholder="0"
                      className={errors.transferAmount ? 'border-red-500' : ''}
                    />
                    {errors.transferAmount && (
                      <p className="text-sm text-red-500">{errors.transferAmount}</p>
                    )}
                  </div>
                  {errors.mixed && (
                    <p className="text-sm text-red-500 col-span-2">{errors.mixed}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Observaciones (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Agregar observaciones sobre el abono..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Registrar Abono
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
