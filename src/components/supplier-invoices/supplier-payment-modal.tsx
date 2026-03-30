'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, DollarSign, CreditCard, Banknote, Shuffle } from 'lucide-react'
import { SupplierInvoice } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUser } from '@/lib/store-helper'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { cn } from '@/lib/utils'

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
  onAddPayment,
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

  const parseAmount = (value: string) => parseFloat(value.replace(/[^\d]/g, '')) || 0

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
        userName: userName || 'Usuario',
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
      minimumFractionDigits: 0,
    }).format(n)

  const inputClass =
    'w-full rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm xl:left-56">
      <div
        className="max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/80">
          <div className="flex min-w-0 items-center gap-2.5">
            <DollarSign className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={1.5} />
            <h2 id="payment-modal-title" className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Registrar abono
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-h-0 w-8 shrink-0 rounded-lg p-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {invoice.supplierName} · {invoice.invoiceNumber}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Pendiente:{' '}
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(pending)}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Monto del abono</Label>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(formatNumber(e.target.value))}
                className={cn(inputClass, 'h-12 text-lg')}
                placeholder="0"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Método</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: 'transfer' as const, label: 'Transferencia', Icon: CreditCard },
                    { v: 'cash' as const, label: 'Efectivo', Icon: Banknote },
                    { v: 'mixed' as const, label: 'Mixto', Icon: Shuffle },
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
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                      paymentMethod === v
                        ? 'border-zinc-500 bg-zinc-100 text-zinc-900 dark:border-zinc-400 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'border-zinc-200 bg-transparent text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'mixed' && (
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Desglose del abono mixto</p>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Banknote className="h-4 w-4" strokeWidth={1.5} />
                    Monto en efectivo
                  </Label>
                  <input
                    value={cashStr}
                    onChange={(e) => setCashStr(formatNumber(e.target.value))}
                    className={cn(inputClass, 'h-11 text-base')}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                    Monto en transferencia
                  </Label>
                  <input
                    value={transferStr}
                    onChange={(e) => setTransferStr(formatNumber(e.target.value))}
                    className={cn(inputClass, 'h-11 text-base')}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
                {amountStr && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Total abono:{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(parseAmount(amountStr))}
                    </span>
                    {' · '}
                    Suma desglose:{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(parseAmount(cashStr) + parseAmount(transferStr))}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Notas (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={cn(inputClass, 'min-h-[4rem] resize-y py-2.5 text-sm')}
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Registrar abono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
