'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { X, DollarSign, CreditCard, Banknote, Shuffle } from 'lucide-react'
import { SupplierInvoice } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUser } from '@/lib/store-helper'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'

interface SupplierPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: SupplierInvoice | null
  onAddPayment: () => void
}

export function SupplierPaymentModal({
  isOpen,
  onClose,
  invoice,
  onAddPayment
}: SupplierPaymentModalProps) {
  const { user } = useAuth()
  const [amountStr, setAmountStr] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed'>('transfer')
  const [cashStr, setCashStr] = useState('')
  const [transferStr, setTransferStr] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const formatNumber = (value: string): string => {
    const numeric = value.replace(/[^\d]/g, '')
    if (!numeric) return ''
    return parseInt(numeric, 10).toLocaleString('es-CO')
  }

  const parseAmount = (value: string) =>
    parseFloat(value.replace(/[^\d]/g, '')) || 0

  useEffect(() => {
    if (isOpen) {
      setAmountStr('')
      setPaymentMethod('transfer')
      setCashStr('')
      setTransferStr('')
      setNotes('')
      setError('')
      setSubmitting(false)
    }
  }, [isOpen, invoice?.id])

  if (!isOpen || !invoice) return null

  const pending = Math.max(0, invoice.totalAmount - invoice.paidAmount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amount = parseAmount(amountStr)
    if (amount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (amount > pending + 0.01) {
      setError(`El monto no puede superar ${pending.toLocaleString('es-CO')} COP pendientes`)
      return
    }
    let cashAmount: number | undefined
    let transferAmount: number | undefined
    if (paymentMethod === 'mixed') {
      const c = parseAmount(cashStr)
      const t = parseAmount(transferStr)
      if (c <= 0 || t <= 0) {
        setError('Indica cuánto es en efectivo y cuánto en transferencia (ambos mayores a 0)')
        return
      }
      if (Math.abs(c + t - amount) > 0.01) {
        setError('La suma de efectivo y transferencia debe ser igual al monto del abono')
        return
      }
      cashAmount = c
      transferAmount = t
    }
    let userId = user?.id
    let userName = user?.name
    if (!userId) {
      const u = getCurrentUser()
      userId = u?.id
      userName = u?.name || userName
    }
    if (!userId) {
      setError('No se pudo identificar el usuario')
      return
    }
    setSubmitting(true)
    try {
      await SupplierInvoicesService.addPayment({
        invoiceId: invoice.id,
        amount,
        paymentMethod,
        cashAmount,
        transferAmount,
        notes: notes.trim() || undefined,
        userId,
        userName: userName || 'Usuario'
      })
      onAddPayment()
      onClose()
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err &&
              typeof err === 'object' &&
              'message' in err &&
              typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Error al registrar el abono'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(n)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm dark:bg-black/60">
      <div className="max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-600 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registrar abono</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {invoice.supplierName} · {invoice.invoiceNumber}
              </CardTitle>
              <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                Pendiente: {formatCurrency(pending)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monto del abono</Label>
                <input
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatNumber(e.target.value))}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 px-4 text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Método</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: 'transfer' as const, label: 'Transferencia', Icon: CreditCard },
                      { v: 'cash' as const, label: 'Efectivo', Icon: Banknote },
                      { v: 'mixed' as const, label: 'Mixto', Icon: Shuffle }
                    ] as const
                  ).map(({ v, label, Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(v)
                        if (v !== 'mixed') {
                          setCashStr('')
                          setTransferStr('')
                        }
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        paymentMethod === v
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                          : 'border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mixed' && (
                <div className="space-y-3 rounded-xl border-2 border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 p-4">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Desglose del abono mixto
                  </p>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Monto en efectivo
                    </Label>
                    <input
                      value={cashStr}
                      onChange={(e) => setCashStr(formatNumber(e.target.value))}
                      className="w-full h-11 rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Monto en transferencia
                    </Label>
                    <input
                      value={transferStr}
                      onChange={(e) => setTransferStr(formatNumber(e.target.value))}
                      className="w-full h-11 rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  {amountStr && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total abono:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(parseAmount(amountStr))}
                      </span>
                      {' · '}
                      Suma desglose:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(
                          parseAmount(cashStr) + parseAmount(transferStr)
                        )}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 px-4 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </CardContent>
          </Card>

          <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex gap-2 justify-end bg-gray-50 dark:bg-neutral-900/80">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitting ? 'Guardando…' : 'Registrar abono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
