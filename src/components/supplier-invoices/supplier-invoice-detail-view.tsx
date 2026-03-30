'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  CreditCard,
  ExternalLink,
  ImageIcon,
  Banknote,
  Shuffle,
  Hash,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SupplierInvoice, SupplierPaymentRecord } from '@/types'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'

const panel =
  'rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'

/** Iconos inline: contraste legible en claro y oscuro */
const iconMuted = 'shrink-0 text-zinc-500 dark:text-zinc-300'

function statusBadgeClassSupplier(status: string) {
  switch (status) {
    case 'pending':
      return 'border-amber-500/25 bg-amber-500/[0.06] text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300/90'
    case 'partial':
      return 'border-orange-500/20 bg-orange-500/[0.06] text-orange-900 dark:border-orange-500/25 dark:bg-orange-950/40 dark:text-orange-300/90'
    case 'paid':
      return 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-300/90'
    case 'cancelled':
      return 'border-rose-500/30 bg-rose-500/[0.06] text-rose-900 dark:border-zinc-600 dark:bg-rose-950/35 dark:text-rose-200/90'
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'partial':
      return 'Parcial'
    case 'paid':
      return 'Pagada'
    case 'cancelled':
      return 'Anulada'
    default:
      return status
  }
}

interface SupplierInvoiceDetailViewProps {
  invoice: SupplierInvoice | null
  invoiceLoading: boolean
  canEdit: boolean
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  )
}

export function SupplierInvoiceDetailView({
  invoice,
  invoiceLoading,
  canEdit,
}: SupplierInvoiceDetailViewProps) {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  useEffect(() => {
    if (!invoice?.id) {
      setPayments([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPayments(true)
      try {
        const list = await SupplierInvoicesService.getPaymentHistory(invoice.id)
        if (!cancelled) setPayments(list.filter((p) => p.status === 'active'))
      } catch {
        if (!cancelled) setPayments([])
      } finally {
        if (!cancelled) setLoadingPayments(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [invoice?.id, invoice?.paidAmount, invoice?.updatedAt])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  const methodIcon = (m: string) => {
    const ic = cn('h-4 w-4', iconMuted)
    if (m === 'cash') return <Banknote className={ic} strokeWidth={1.5} />
    if (m === 'mixed' || m === 'card') return <Shuffle className={ic} strokeWidth={1.5} />
    return <CreditCard className={ic} strokeWidth={1.5} />
  }

  const methodLabel = (m: string) => {
    if (m === 'cash') return 'Efectivo'
    if (m === 'mixed' || m === 'card') return 'Mixto'
    return 'Transferencia'
  }

  if (invoiceLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando factura…</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">Factura no encontrada</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No existe o no tienes acceso desde esta tienda.
        </p>
        <Link
          href="/purchases/invoices"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Volver al listado
        </Link>
      </div>
    )
  }

  const canEditInvoice = canEdit && invoice.status !== 'cancelled' && invoice.status !== 'paid'
  const pending = Math.max(0, invoice.totalAmount - invoice.paidAmount)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-80">
        <div className={panel}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Estado de la factura</p>
            <div className="mt-3">
              <Badge
                variant="outline"
                className={`inline-flex border px-2.5 py-1 text-sm font-medium ${statusBadgeClassSupplier(invoice.status)}`}
              >
                {statusLabel(invoice.status)}
              </Badge>
            </div>
          </div>
          <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Total</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(invoice.totalAmount)}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Pagado</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(invoice.paidAmount)}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Pendiente</dt>
              <dd
                className={`mt-1 text-base font-semibold tabular-nums ${
                  pending <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(pending)}
              </dd>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <Hash className={cn('mt-0.5 h-4 w-4', iconMuted)} strokeWidth={1.5} />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">ID interno</dt>
                <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {invoice.id}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <Receipt className={cn('mt-0.5 h-4 w-4', iconMuted)} strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Número de factura</dt>
                <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">{invoice.invoiceNumber}</dd>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <Calendar className={cn('mt-0.5 h-4 w-4', iconMuted)} strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Emisión</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{formatDate(invoice.issueDate)}</dd>
              </div>
            </div>
            {invoice.dueDate && (
              <div className="flex gap-3 px-4 py-3">
                <Calendar className={cn('mt-0.5 h-4 w-4', iconMuted)} strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Vencimiento</dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{formatDate(invoice.dueDate)}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className={panel}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Datos de la factura</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Proveedor, referencias y notas.</p>
          </div>
          <section className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="px-4 py-5 md:px-6">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className={cn('h-4 w-4', iconMuted)} strokeWidth={1.5} />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Proveedor</h3>
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8">
                <Field label="Nombre">{invoice.supplierName || '—'}</Field>
                <Field label="Número">{invoice.invoiceNumber}</Field>
              </dl>
            </div>
            {invoice.notes && (
              <div className="px-4 py-5 md:px-6">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Notas</dt>
                <dd className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100">
                  {invoice.notes}
                </dd>
              </div>
            )}
            {invoice.status === 'cancelled' && invoice.cancellationReason && (
              <div className="px-4 py-5 md:px-6">
                <div className="rounded-lg border border-red-200/80 bg-red-50/80 p-3 dark:border-red-900/40 dark:bg-red-950/25">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-red-800 dark:text-red-300">
                    Motivo de anulación
                  </div>
                  <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                    {invoice.cancellationReason}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {invoice.imageUrl ? (
          <div className={panel}>
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <ImageIcon className={cn('h-4 w-4', iconMuted)} strokeWidth={1.5} />
                Comprobante
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Imagen adjunta al registro.</p>
            </div>
            <div className="p-4 md:p-6">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.imageUrl}
                  alt={`Comprobante ${invoice.invoiceNumber}`}
                  className="mx-auto block max-h-[min(70vh,640px)] w-full object-contain"
                />
              </div>
              <a
                href={invoice.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Abrir en pestaña nueva
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sin comprobante ·{' '}
            {canEditInvoice ? 'Edita la factura para subir una foto.' : 'No hay imagen registrada.'}
          </p>
        )}

        <div className={panel}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <DollarSign className={cn('h-4 w-4', iconMuted)} strokeWidth={1.5} />
              Historial de abonos
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Pagos registrados contra esta factura.</p>
          </div>
          <div className="p-4 pt-2 md:px-6 md:pb-5">
            {loadingPayments ? (
              <div className="flex justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No hay abonos registrados</div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40"
                  >
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        {methodIcon(p.paymentMethod)}
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Monto</div>
                          <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(p.amount)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Método</div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{methodLabel(p.paymentMethod)}</div>
                        {p.paymentMethod === 'mixed' &&
                          p.cashAmount != null &&
                          p.transferAmount != null && (
                            <div className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              Efectivo {formatCurrency(p.cashAmount)}
                              <span className="mx-1 text-zinc-400">·</span>
                              Transferencia {formatCurrency(p.transferAmount)}
                            </div>
                          )}
                      </div>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Fecha</div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(p.paymentDate)}</div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{p.userName}</div>
                      </div>
                    </div>
                    {p.notes && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
