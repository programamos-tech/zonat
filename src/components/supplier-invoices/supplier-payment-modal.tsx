'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, DollarSign, CreditCard, Banknote, Shuffle, Upload } from 'lucide-react'
import { SupplierInvoice } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUser } from '@/lib/store-helper'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { supabase } from '@/lib/supabase'
import { compressImageForUpload } from '@/lib/compress-image-for-upload'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function paymentReceiptStoredToPublicUrl(stored: string): string {
  const s = stored.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const path = s.replace(/^\/+/, '').replace(/^supplier-invoices\//, '')
  if (!path) return ''
  return supabase.storage.from('supplier-invoices').getPublicUrl(path).data.publicUrl
}

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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
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
      setImageUrl(null)
      setUploadPreview(null)
      setUploading(false)
      setError('')
      setSubmitting(false)
    }
  }, [isOpen, invoice?.id])

  const receiptPublicUrl = imageUrl ? paymentReceiptStoredToPublicUrl(imageUrl) : ''

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setUploadPreview(blobUrl)
    setUploading(true)
    try {
      const prepared = await compressImageForUpload(file)
      const fd = new FormData()
      fd.append('file', prepared)
      const res = await fetch('/api/storage/upload-supplier-payment-receipt', {
        method: 'POST',
        body: fd,
      })
      const text = await res.text()
      let json: { error?: string; url?: string; path?: string } = {}
      try {
        json = text ? (JSON.parse(text) as typeof json) : {}
      } catch {
        throw new Error(
          res.status === 413
            ? 'La imagen supera el máximo de 2 MB. Intenta con otra foto.'
            : 'No se pudo procesar la respuesta del servidor al subir la imagen.'
        )
      }
      if (!res.ok) throw new Error(json.error || 'Error al subir')
      const path = typeof json.path === 'string' ? json.path.trim() : ''
      const url = typeof json.url === 'string' ? json.url.trim() : ''
      const stored = path || url
      if (!stored) throw new Error('El servidor no devolvió la ruta ni la URL de la imagen')
      setImageUrl(stored)
      toast.success('Comprobante del abono subido')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
      setImageUrl(null)
    } finally {
      URL.revokeObjectURL(blobUrl)
      setUploadPreview(null)
      setUploading(false)
      e.target.value = ''
    }
  }

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
        imageUrl: imageUrl?.trim() || undefined,
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
    'w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

  const methodOptions = [
    { v: 'transfer' as const, label: 'Transferencia', Icon: CreditCard, selected: 'border-brand-lime bg-brand-lime text-white shadow-sm' },
    { v: 'cash' as const, label: 'Efectivo', Icon: Banknote, selected: 'border-brand-gold bg-brand-gold text-white shadow-sm' },
    { v: 'mixed' as const, label: 'Mixto', Icon: Shuffle, selected: 'border-brand-coral bg-brand-coral text-white shadow-sm' },
  ] as const

  return (
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-[min(28rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-700">
          <div className="flex min-w-0 items-center gap-2.5">
            <DollarSign className="h-5 w-5 shrink-0 text-brand-lime" strokeWidth={1.5} />
            <div className="min-w-0">
              <h2
                id="payment-modal-title"
                className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Registrar abono
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {invoice.supplierName} · {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-h-0 w-8 shrink-0 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Pendiente:{' '}
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(pending)}
              </span>
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Monto del abono</Label>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(formatNumber(e.target.value))}
                className={cn(inputClass, 'h-12 text-lg')}
                placeholder="Ej. 500.000"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Método</Label>
              <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                {methodOptions.map(({ v, label, Icon, selected }) => {
                  const active = paymentMethod === v
                  return (
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
                        'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors sm:text-xs',
                        active
                          ? selected
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {paymentMethod === 'mixed' && (
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Desglose del abono mixto</p>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Banknote className="h-4 w-4" strokeWidth={1.5} />
                    Monto en efectivo
                  </Label>
                  <input
                    value={cashStr}
                    onChange={(e) => setCashStr(formatNumber(e.target.value))}
                    className={cn(inputClass, 'h-11 text-base')}
                    placeholder="Ej. 200.000"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                    Monto en transferencia
                  </Label>
                  <input
                    value={transferStr}
                    onChange={(e) => setTransferStr(formatNumber(e.target.value))}
                    className={cn(inputClass, 'h-11 text-base')}
                    placeholder="Ej. 300.000"
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
              <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Notas (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones sobre el abono…"
                className={cn(inputClass, 'min-h-[4rem] resize-y py-2.5 text-sm')}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Comprobante del abono (opcional)
              </Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Foto del recibo o transferencia. Máx. 2 MB; se comprime en el navegador si hace falta.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50">
                  <Upload className="h-4 w-4 text-zinc-500" />
                  {uploading ? 'Subiendo…' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptFile}
                    disabled={uploading || submitting}
                  />
                </label>
                {receiptPublicUrl && (
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-coral underline-offset-4 hover:underline"
                    onClick={() => {
                      setImageUrl(null)
                      setUploadPreview(null)
                    }}
                  >
                    Quitar
                  </button>
                )}
                {receiptPublicUrl && (
                  <a
                    href={receiptPublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-lime underline-offset-4 hover:underline"
                  >
                    Abrir en pestaña nueva
                  </a>
                )}
              </div>
              {(uploadPreview || receiptPublicUrl) && (
                <div className="relative mt-2 max-h-[min(28dvh,180px)] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                  {uploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
                      Subiendo…
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadPreview || receiptPublicUrl || ''}
                    alt="Vista previa del comprobante de abono"
                    className="mx-auto block h-auto w-full max-h-[min(28dvh,180px)] object-contain"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div
            className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))' }}
          >
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || uploading}
              className="border-0 bg-brand-lime text-white hover:bg-brand-lime-muted"
            >
              {submitting ? 'Guardando…' : 'Registrar abono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
