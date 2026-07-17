'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, ArrowRightLeft, Package, Store } from 'lucide-react'
import { Product, StockTransfer } from '@/types'
import { cn } from '@/lib/utils'

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

function LocationToggle({
  value,
  onChange,
  disabledLocation,
  stock,
}: {
  value: 'warehouse' | 'store'
  onChange: (location: 'warehouse' | 'store') => void
  disabledLocation?: 'warehouse' | 'store'
  stock: { warehouse: number; store: number }
}) {
  const formatNumber = (n: number) =>
    n.toLocaleString('es-CO', { maximumFractionDigits: 0 })

  const localSelected = value === 'store' && disabledLocation !== 'store'
  const bodegaSelected = value === 'warehouse' && disabledLocation !== 'warehouse'

  return (
    <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
      <button
        type="button"
        disabled={disabledLocation === 'store'}
        onClick={() => onChange('store')}
        className={cn(
          'flex min-h-9 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          disabledLocation === 'store' && 'cursor-not-allowed opacity-35',
          localSelected
            ? 'bg-brand-lime text-white shadow-sm'
            : disabledLocation !== 'store' &&
                'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        )}
      >
        <span className="flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
          Local
        </span>
        <span
          className={cn(
            'text-[11px] font-normal tabular-nums',
            localSelected ? 'text-white/85' : 'text-zinc-400'
          )}
        >
          {formatNumber(stock.store)} u.
        </span>
      </button>
      <button
        type="button"
        disabled={disabledLocation === 'warehouse'}
        onClick={() => onChange('warehouse')}
        className={cn(
          'flex min-h-9 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          disabledLocation === 'warehouse' && 'cursor-not-allowed opacity-35',
          bodegaSelected
            ? 'bg-brand-coral text-white shadow-sm'
            : disabledLocation !== 'warehouse' &&
                'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        )}
      >
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
          Bodega
        </span>
        <span
          className={cn(
            'text-[11px] font-normal tabular-nums',
            bodegaSelected ? 'text-white/85' : 'text-zinc-400'
          )}
        >
          {formatNumber(stock.warehouse)} u.
        </span>
      </button>
    </div>
  )
}

interface StockTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onTransfer: (transfer: Omit<StockTransfer, 'id' | 'createdAt' | 'userId' | 'userName'>) => void
  product: Product | null
}

export function StockTransferModal({ isOpen, onClose, onTransfer, product }: StockTransferModalProps) {
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

  const [formData, setFormData] = useState({
    fromLocation: 'warehouse' as 'warehouse' | 'store',
    toLocation: 'store' as 'warehouse' | 'store',
    quantity: 0,
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0'
    }

    if (formData.fromLocation === formData.toLocation) {
      newErrors.toLocation = 'La ubicación destino debe ser diferente a la origen'
    }

    if (product) {
      const availableStock =
        formData.fromLocation === 'warehouse' ? product.stock.warehouse : product.stock.store

      if (formData.quantity > availableStock) {
        newErrors.quantity = `No hay suficiente stock. Disponible: ${availableStock}`
      }
    }

    if (formData.reason.trim() && formData.reason.trim().length < 10) {
      newErrors.reason = 'Si proporcionas un motivo, debe tener al menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | number) => {
    const processedValue = field === 'quantity' && value === '' ? 0 : value
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFromChange = (location: 'warehouse' | 'store') => {
    setFormData(prev => ({
      ...prev,
      fromLocation: location,
      toLocation: location === 'warehouse' ? 'store' : 'warehouse',
    }))
    if (errors.fromLocation || errors.toLocation) {
      setErrors(prev => ({ ...prev, fromLocation: '', toLocation: '' }))
    }
  }

  const handleToChange = (location: 'warehouse' | 'store') => {
    handleInputChange('toLocation', location)
  }

  const handleTransfer = () => {
    if (validateForm() && product) {
      onTransfer({
        productId: product.id,
        productName: product.name,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        quantity: formData.quantity,
        reason: formData.reason.trim(),
      })
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      fromLocation: 'warehouse',
      toLocation: 'store',
      quantity: 0,
      reason: '',
    })
    setErrors({})
    onClose()
  }

  const getLocationLabel = (location: 'warehouse' | 'store') => {
    return location === 'warehouse' ? 'Bodega' : 'Local'
  }

  const getAvailableStock = () => {
    if (!product) return 0
    return formData.fromLocation === 'warehouse' ? product.stock.warehouse : product.stock.store
  }

  if (!isOpen || !product) return null
  if (!portalReady || typeof document === 'undefined') return null

  const stockAfterWarehouse =
    formData.fromLocation === 'warehouse'
      ? product.stock.warehouse - formData.quantity
      : product.stock.warehouse + (formData.toLocation === 'warehouse' ? formData.quantity : 0)

  const stockAfterStore =
    formData.fromLocation === 'store'
      ? product.stock.store - formData.quantity
      : product.stock.store + (formData.toLocation === 'store' ? formData.quantity : 0)

  return createPortal(
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(68rem,calc(100vw-1.5rem))] touch-auto flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-transfer-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2.5">
            <ArrowRightLeft className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h2
                id="stock-transfer-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white"
              >
                Transferir stock
              </h2>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {product.name} · {product.reference}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={e => {
            e.preventDefault()
            handleTransfer()
          }}
        >
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-3 md:px-5 md:py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SectionCard title="Detalles de la transferencia">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Desde
                      </span>
                      <LocationToggle
                        value={formData.fromLocation}
                        onChange={handleFromChange}
                        stock={product.stock}
                      />
                    </div>
                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Hacia
                      </span>
                      <LocationToggle
                        value={formData.toLocation}
                        onChange={handleToChange}
                        disabledLocation={formData.fromLocation}
                        stock={product.stock}
                      />
                      {errors.toLocation && (
                        <p className="mt-1 text-xs text-red-500">{errors.toLocation}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="stock-transfer-qty"
                        className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        Cantidad <span className="text-zinc-400">*</span>
                      </label>
                      <input
                        id="stock-transfer-qty"
                        type="number"
                        min={1}
                        max={getAvailableStock()}
                        value={formData.quantity || ''}
                        onChange={e =>
                          handleInputChange('quantity', parseInt(e.target.value, 10) || 0)
                        }
                        className={cn(inputBase, errors.quantity && 'border-red-400')}
                        placeholder="0"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Máx: {formatNumber(getAvailableStock())} u.
                      </p>
                      {errors.quantity && (
                        <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="stock-transfer-reason"
                        className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        Motivo
                      </label>
                      <textarea
                        id="stock-transfer-reason"
                        value={formData.reason}
                        onChange={e => handleInputChange('reason', e.target.value)}
                        className={cn(
                          inputBase,
                          'min-h-[4.25rem] resize-y',
                          errors.reason && 'border-red-400'
                        )}
                        placeholder="Opcional"
                        rows={2}
                      />
                      <div className="mt-1 flex justify-between gap-2">
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
                              : 'text-zinc-500'
                          )}
                        >
                          {formData.reason.length > 0 ? `${formData.reason.length}/10` : 'Opcional'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Resumen">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                    <span className="text-xs text-zinc-500">Ruta</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {getLocationLabel(formData.fromLocation)} → {getLocationLabel(formData.toLocation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                    <span className="text-xs text-zinc-500">Transferir</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatNumber(formData.quantity)} u.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-zinc-200 px-3 py-2.5 shadow-sm dark:border-zinc-700">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                        <span className="text-xs text-zinc-500">Local después</span>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatNumber(Math.max(0, stockAfterStore))} u.
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 px-3 py-2.5 shadow-sm dark:border-zinc-700">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                        <span className="text-xs text-zinc-500">Bodega después</span>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatNumber(Math.max(0, stockAfterWarehouse))} u.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          <footer
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90"
            style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
          >
            <Button type="button" variant="outline" size="sm" onClick={handleClose} className="min-h-9">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="min-h-9 gap-1.5">
              <ArrowRightLeft className="h-4 w-4" strokeWidth={1.75} />
              Transferir stock
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  )
}
