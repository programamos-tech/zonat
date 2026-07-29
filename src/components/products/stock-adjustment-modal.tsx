'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Package, Store, TrendingUp, TrendingDown } from 'lucide-react'
import { Product } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

const inputBase =
  'w-full rounded-lg border border-zinc-200/90 bg-white/95 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-[border-color,box-shadow] focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/90 bg-white/80 p-3.5 dark:border-zinc-700/80 dark:bg-zinc-900/80',
        className
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {children}
    </div>
  )
}

export type StockAdjustmentEntry = {
  location: 'warehouse' | 'store'
  newQuantity: number
}

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdjust: (
    productId: string,
    adjustments: StockAdjustmentEntry[],
    reason: string
  ) => Promise<void>
  product?: Product | null
}

export function StockAdjustmentModal({ isOpen, onClose, onAdjust, product }: StockAdjustmentModalProps) {
  const { user } = useAuth()
  const [portalReady, setPortalReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [isOpen])

  const isMainStore = !user?.storeId || user.storeId === MAIN_STORE_ID
  const [formData, setFormData] = useState({
    storeQuantity: 0,
    warehouseQuantity: 0,
    reason: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatNumber = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '0'

    if (Number.isInteger(numValue)) {
      return numValue.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    }
    return numValue.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const parseFormattedNumber = (value: string): number => {
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '')
    return parseFloat(cleanValue) || 0
  }

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        storeQuantity: product.stock.store,
        warehouseQuantity: product.stock.warehouse,
        reason: '',
      })
      setErrors({})
      setSubmitting(false)
    }
  }, [product, isOpen])

  const handleQuantityChange = (field: 'storeQuantity' | 'warehouseQuantity', rawValue: string) => {
    const numericValue = rawValue.trim() === '' ? 0 : parseFormattedNumber(rawValue)
    setFormData(prev => ({ ...prev, [field]: numericValue }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const storeDiff = product ? formData.storeQuantity - product.stock.store : 0
  const warehouseDiff = product ? formData.warehouseQuantity - product.stock.warehouse : 0
  const storeChanged = product ? formData.storeQuantity !== product.stock.store : false
  const warehouseChanged = product && isMainStore ? formData.warehouseQuantity !== product.stock.warehouse : false
  const hasAnyChange = storeChanged || warehouseChanged

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || submitting) return

    const newErrors: Record<string, string> = {}

    if (formData.storeQuantity < 0) {
      newErrors.storeQuantity = 'La cantidad no puede ser negativa'
    }
    if (isMainStore && formData.warehouseQuantity < 0) {
      newErrors.warehouseQuantity = 'La cantidad no puede ser negativa'
    }
    if (!hasAnyChange) {
      newErrors.general = 'No hay cambios que guardar. Modifica Local y/o Bodega.'
    }
    if (formData.reason.trim() && formData.reason.trim().length < 10) {
      newErrors.reason = 'Si proporcionas una razón, debe tener al menos 10 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const adjustments: StockAdjustmentEntry[] = []
    if (storeChanged) {
      adjustments.push({ location: 'store', newQuantity: formData.storeQuantity })
    }
    if (warehouseChanged) {
      adjustments.push({ location: 'warehouse', newQuantity: formData.warehouseQuantity })
    }

    setSubmitting(true)
    try {
      await onAdjust(product.id, adjustments, formData.reason)
    } catch (error) {
      console.error('Error in stock adjustment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !product) return null
  if (!portalReady || typeof document === 'undefined') return null

  return createPortal(
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(40rem,calc(100vw-1.5rem))] touch-auto flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-adjust-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2.5">
            <Package className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h2
                id="stock-adjust-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white"
              >
                Ajustar stock
              </h2>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {isMainStore
                  ? 'Puedes actualizar Local y Bodega a la vez'
                  : 'Actualiza el stock del Local'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain px-4 py-3 md:px-5 md:py-4">
            <SectionCard title="Producto">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </span>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{product.name}</p>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Referencia
                  </span>
                  <p className="font-mono text-sm text-zinc-900 dark:text-zinc-50">{product.reference}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cantidades">
              <div className={cn('grid gap-3', isMainStore ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                <div>
                  <label
                    htmlFor="stock-adjust-store"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    <Store className="h-3.5 w-3.5 text-brand-lime" strokeWidth={1.75} />
                    Local
                  </label>
                  <input
                    id="stock-adjust-store"
                    type="text"
                    inputMode="numeric"
                    value={formData.storeQuantity === 0 ? '' : formatNumber(formData.storeQuantity)}
                    onChange={e => handleQuantityChange('storeQuantity', e.target.value)}
                    className={cn(inputBase, errors.storeQuantity && 'border-red-400')}
                    placeholder="0"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Actual:{' '}
                    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatNumber(product.stock.store)} u.
                    </span>
                    {storeChanged && (
                      <span
                        className={cn(
                          'ml-1.5 font-medium tabular-nums',
                          storeDiff > 0 ? 'text-brand-lime' : 'text-brand-coral'
                        )}
                      >
                        ({storeDiff > 0 ? '+' : ''}
                        {formatNumber(storeDiff)})
                      </span>
                    )}
                  </p>
                  {errors.storeQuantity && (
                    <p className="mt-1 text-xs text-red-500">{errors.storeQuantity}</p>
                  )}
                </div>

                {isMainStore && (
                  <div>
                    <label
                      htmlFor="stock-adjust-warehouse"
                      className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      <Package className="h-3.5 w-3.5 text-brand-coral" strokeWidth={1.75} />
                      Bodega
                    </label>
                    <input
                      id="stock-adjust-warehouse"
                      type="text"
                      inputMode="numeric"
                      value={
                        formData.warehouseQuantity === 0
                          ? ''
                          : formatNumber(formData.warehouseQuantity)
                      }
                      onChange={e => handleQuantityChange('warehouseQuantity', e.target.value)}
                      className={cn(inputBase, errors.warehouseQuantity && 'border-red-400')}
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Actual:{' '}
                      <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {formatNumber(product.stock.warehouse)} u.
                      </span>
                      {warehouseChanged && (
                        <span
                          className={cn(
                            'ml-1.5 font-medium tabular-nums',
                            warehouseDiff > 0 ? 'text-brand-lime' : 'text-brand-coral'
                          )}
                        >
                          ({warehouseDiff > 0 ? '+' : ''}
                          {formatNumber(warehouseDiff)})
                        </span>
                      )}
                    </p>
                    {errors.warehouseQuantity && (
                      <p className="mt-1 text-xs text-red-500">{errors.warehouseQuantity}</p>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Razón del ajuste">
              <textarea
                id="stock-adjust-reason"
                value={formData.reason}
                onChange={e => {
                  setFormData(prev => ({ ...prev, reason: e.target.value }))
                  if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }))
                }}
                className={cn(inputBase, 'min-h-[4rem] resize-y', errors.reason && 'border-red-400')}
                placeholder="Ej: Inventario físico, producto dañado… (opcional)"
                rows={3}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                {errors.reason ? (
                  <p className="text-xs text-red-500">{errors.reason}</p>
                ) : (
                  <span />
                )}
                <span
                  className={cn(
                    'ml-auto text-[11px]',
                    formData.reason.length > 0 && formData.reason.length < 10
                      ? 'text-red-500'
                      : 'text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  {formData.reason.length > 0 ? `${formData.reason.length}/10 mín.` : 'Opcional'}
                </span>
              </div>
            </SectionCard>

            {hasAnyChange && (
              <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Resumen de cambios</p>
                {storeChanged && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Local</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-semibold tabular-nums',
                        storeDiff > 0 ? 'text-brand-lime' : 'text-brand-coral'
                      )}
                    >
                      {storeDiff > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                      {storeDiff > 0 ? '+' : ''}
                      {formatNumber(storeDiff)} u. → {formatNumber(formData.storeQuantity)}
                    </span>
                  </div>
                )}
                {warehouseChanged && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Bodega</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-semibold tabular-nums',
                        warehouseDiff > 0 ? 'text-brand-lime' : 'text-brand-coral'
                      )}
                    >
                      {warehouseDiff > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                      {warehouseDiff > 0 ? '+' : ''}
                      {formatNumber(warehouseDiff)} u. → {formatNumber(formData.warehouseQuantity)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {errors.general && (
              <p className="text-center text-xs text-red-500">{errors.general}</p>
            )}
          </div>

          <footer
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90"
            style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="min-h-9"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !hasAnyChange} className="min-h-9">
              {submitting ? 'Actualizando…' : 'Actualizar stock'}
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  )
}
