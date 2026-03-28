'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  CreditCard,
  Plus,
  Pencil,
  Ban,
  AlertTriangle,
  X,
  ExternalLink,
  Banknote,
  Shuffle
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SupplierInvoice, SupplierPaymentRecord } from '@/types'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { toast } from 'sonner'

function statusBadgeClassSupplier(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'partial':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
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
  onRefresh: () => void | Promise<void>
  onEdit: (inv: SupplierInvoice) => void
  onAddPayment: (inv: SupplierInvoice) => void
  canRecordPayment: boolean
  canEdit: boolean
  canCancel: boolean
}

export function SupplierInvoiceDetailView({
  invoice,
  invoiceLoading,
  onRefresh,
  onEdit,
  onAddPayment,
  canRecordPayment,
  canEdit,
  canCancel
}: SupplierInvoiceDetailViewProps) {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

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
      minimumFractionDigits: 0
    }).format(n)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

  const methodIcon = (m: string) => {
    if (m === 'cash') return <Banknote className="h-4 w-4" />
    if (m === 'mixed' || m === 'card') return <Shuffle className="h-4 w-4" />
    return <CreditCard className="h-4 w-4" />
  }

  const methodLabel = (m: string) => {
    if (m === 'cash') return 'Efectivo'
    if (m === 'mixed' || m === 'card') return 'Mixto'
    return 'Transferencia'
  }

  if (invoiceLoading) {
    return (
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Cargando factura…</p>
        </CardContent>
      </Card>
    )
  }

  if (!invoice) {
    return (
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Factura no encontrada
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No existe o no tienes acceso desde esta tienda.
          </p>
          <Link
            href="/purchases/invoices"
            className={cn(
              'inline-flex items-center justify-center rounded-xl text-base font-semibold transition-all duration-200',
              'h-12 py-3 px-6 border-2 border-orange-600 text-orange-600 bg-white dark:bg-neutral-900',
              'hover:bg-orange-50 dark:hover:bg-orange-950/30 shadow-lg hover:shadow-xl'
            )}
          >
            Volver al listado
          </Link>
        </CardContent>
      </Card>
    )
  }

  const pending = Math.max(0, invoice.totalAmount - invoice.paidAmount)
  const canPay =
    canRecordPayment &&
    invoice.status !== 'cancelled' &&
    invoice.status !== 'paid' &&
    pending > 0
  const canEditInvoice =
    canEdit && invoice.status !== 'cancelled' && invoice.status !== 'paid'
  const canCancelInvoice = canCancel && invoice.status !== 'cancelled'

  const openCancelModal = () => {
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const closeCancelModal = () => {
    if (cancelling) return
    setCancelModalOpen(false)
    setCancelReason('')
  }

  const confirmCancelInvoice = async () => {
    const trimmed = cancelReason.trim()
    if (!trimmed) {
      toast.error('Escribe el motivo de la anulación')
      return
    }
    setCancelling(true)
    try {
      await SupplierInvoicesService.cancelInvoice(invoice.id, trimmed)
      toast.success('Factura anulada')
      setCancelModalOpen(false)
      setCancelReason('')
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al anular')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {/* Cabecera de página (mismo patrón que /payments/[clientId]) */}
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="h-7 w-7 md:h-8 md:w-8 text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Detalle de factura
                  </h1>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {invoice.supplierName || 'Proveedor'}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/purchases/invoices"
              className={cn(
                'inline-flex items-center justify-center shrink-0 h-10 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
                'border-2 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900',
                'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              Ver listado
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4 mt-4 border-t border-gray-200 dark:border-neutral-600">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
              <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(invoice.totalAmount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</div>
              <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(invoice.paidAmount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pendiente</div>
              <div
                className={`text-lg md:text-xl font-bold ${
                  pending <= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(pending)}
              </div>
            </div>
            <div className="flex items-end pb-0.5">
              <Badge
                className={`${statusBadgeClassSupplier(invoice.status)} text-sm px-3 py-1`}
              >
                {statusLabel(invoice.status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-4 md:p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Acciones
          </p>
          <div className="flex flex-wrap gap-2">
            {canPay && (
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => onAddPayment(invoice)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar abono
              </Button>
            )}
            {canEditInvoice && (
              <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canCancelInvoice && (
              <Button size="sm" variant="destructive" onClick={openCancelModal}>
                <Ban className="h-4 w-4 mr-2" />
                Anular factura
              </Button>
            )}
            {invoice.imageUrl && (
              <a
                href={invoice.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver comprobante
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-orange-600" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-orange-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">Proveedor</div>
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {invoice.supplierName || '—'}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-neutral-600 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Pagado</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Pendiente</span>
                <span
                  className={
                    pending <= 0
                      ? 'font-semibold text-green-600 dark:text-green-400'
                      : 'font-semibold text-red-600 dark:text-red-400'
                  }
                >
                  {formatCurrency(pending)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-neutral-600">
              <Calendar className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Emisión</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(invoice.issueDate)}
                </div>
              </div>
            </div>
            {invoice.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-orange-600 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Vencimiento</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatDate(invoice.dueDate)}
                  </div>
                </div>
              </div>
            )}
            {invoice.notes && (
              <div className="pt-3 border-t border-gray-200 dark:border-neutral-600 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {invoice.notes}
              </div>
            )}
            {invoice.status === 'cancelled' && invoice.cancellationReason && (
              <div className="pt-3 border-t border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/25 p-3 text-sm">
                <div className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                  Motivo de anulación
                </div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {invoice.cancellationReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
              Historial de abonos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loadingPayments ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay abonos registrados
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="border border-gray-200 dark:border-neutral-600 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800/50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="flex items-center gap-2">
                        {methodIcon(p.paymentMethod)}
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Monto</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(p.amount)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Método</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {methodLabel(p.paymentMethod)}
                        </div>
                        {p.paymentMethod === 'mixed' &&
                          p.cashAmount != null &&
                          p.transferAmount != null && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                              Efectivo {formatCurrency(p.cashAmount)}
                              <span className="mx-1 text-gray-400">·</span>
                              Transferencia {formatCurrency(p.transferAmount)}
                            </div>
                          )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Fecha</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(p.paymentDate)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {p.userName}
                        </div>
                      </div>
                    </div>
                    {p.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{p.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {cancelModalOpen && (
        <div
          className="fixed inset-0 xl:left-56 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-invoice-title"
        >
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <h2
                  id="cancel-invoice-title"
                  className="text-lg font-bold text-gray-900 dark:text-white truncate"
                >
                  Anular factura
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Los abonos registrados permanecen en el historial.
              </p>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">¿Por qué anulas esta factura?</Label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={cancelling}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  placeholder="Ej. factura duplicada, error de proveedor, acuerdo comercial…"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex justify-end gap-2 bg-gray-50 dark:bg-neutral-900/80">
              <Button
                type="button"
                variant="outline"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Volver
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmCancelInvoice}
                disabled={cancelling}
              >
                {cancelling ? 'Anulando…' : 'Anular factura'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
