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

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdjust: (
    productId: string,
    location: 'warehouse' | 'store',
    newQuantity: number,
    reason: string
  ) => Promise<void>
  product?: Product | null
}

export function StockAdjustmentModal({ isOpen, onClose, onAdjust, product }: StockAdjustmentModalProps) {
  const { user } = useAuth()
  const [portalReady, setPortalReady] = useState(false)

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
    location: 'store' as 'warehouse' | 'store',
    newQuantity: 0,
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
    if (product) {
      setFormData({
        location: 'store',
        newQuantity: 0,
        reason: '',
      })
      setErrors({})
    }
  }, [product])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    const newErrors: Record<string, string> = {}

    if (formData.newQuantity < 0) {
      newErrors.newQuantity = 'La cantidad no puede ser negativa'
    }

    if (formData.reason.trim() && formData.reason.trim().length < 10) {
      newErrors.reason = 'Si proporcionas una razón, debe tener al menos 10 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onAdjust(product.id, formData.location, formData.newQuantity, formData.reason)
    } catch (error) {
      console.error('Error in stock adjustment:', error)
    }
  }

  const getCurrentStock = () => {
    if (!product) return 0
    return formData.location === 'warehouse' ? product.stock.warehouse : product.stock.store
  }

  const getStockDifference = () => {
    return formData.newQuantity - getCurrentStock()
  }

  const getLocationLabel = (location: 'warehouse' | 'store') => {
    return location === 'warehouse' ? 'Bodega' : 'Local'
  }

  if (!isOpen || !product) return null
  if (!portalReady || typeof document === 'undefined') return null

  const difference = getStockDifference()
  const hasDifference = formData.newQuantity !== getCurrentStock()

  return createPortal(
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(68rem,calc(100vw-1.5rem))] touch-auto flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
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
                Modificar inventario del producto
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
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-3 md:px-5 md:py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SectionCard title="Información del producto">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Producto
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

                  <div
                    className={cn('grid gap-2.5', isMainStore ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}
                  >
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Local</span>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatNumber(product.stock.store)}{' '}
                        <span className="font-normal text-zinc-500">u.</span>
                      </p>
                    </div>
                    {isMainStore && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                        <div className="mb-1 flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Bodega</span>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                          {formatNumber(product.stock.warehouse)}{' '}
                          <span className="font-normal text-zinc-500">u.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Configuración del ajuste">
                <div className="space-y-3">
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Ubicación a ajustar
                    </span>
                    <div
                      className={cn(
                        'flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50',
                        !isMainStore && 'max-w-xs'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleInputChange('location', 'store')}
                        className={cn(
                          'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
                          formData.location === 'store'
                            ? 'bg-brand-lime text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        )}
                      >
                        <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Local
                      </button>
                      {isMainStore && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('location', 'warehouse')}
                          className={cn(
                            'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors',
                            formData.location === 'warehouse'
                              ? 'bg-brand-coral text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          )}
                        >
                          <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Bodega
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Stock actual en {getLocationLabel(formData.location)}:{' '}
                      <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {formatNumber(getCurrentStock())} u.
                      </span>
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="stock-adjust-qty"
                      className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Nueva cantidad <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      id="stock-adjust-qty"
                      type="text"
                      value={formData.newQuantity === 0 ? '' : formatNumber(formData.newQuantity)}
                      onChange={e => {
                        const rawValue = e.target.value.trim()
                        const numericValue = rawValue === '' ? 0 : parseFormattedNumber(rawValue)
                        handleInputChange('newQuantity', numericValue)
                      }}
                      className={cn(inputBase, errors.newQuantity && 'border-red-400')}
                      placeholder="0"
                    />
                    {errors.newQuantity && (
                      <p className="mt-1 text-xs text-red-500">{errors.newQuantity}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="stock-adjust-reason"
                      className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Razón del ajuste
                    </label>
                    <textarea
                      id="stock-adjust-reason"
                      value={formData.reason}
                      onChange={e => handleInputChange('reason', e.target.value)}
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
                        {formData.reason.length > 0
                          ? `${formData.reason.length}/10 mín.`
                          : 'Opcional'}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {hasDifference && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Diferencia</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {difference > 0 ? 'Incremento' : 'Reducción'} en {getLocationLabel(formData.location)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {difference > 0 ? (
                    <TrendingUp className="h-4 w-4 text-brand-lime" strokeWidth={1.75} />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-brand-coral" strokeWidth={1.75} />
                  )}
                  <span
                    className={cn(
                      'text-base font-semibold tabular-nums',
                      difference > 0 ? 'text-brand-lime' : 'text-brand-coral'
                    )}
                  >
                    {difference > 0 ? '+' : ''}
                    {formatNumber(difference)} u.
                  </span>
                </div>
              </div>
            )}
          </div>

          <footer
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90"
            style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
          >
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="min-h-9">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="min-h-9">
              Ajustar stock
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  )
}
