'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, XCircle, User, FileText, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sale } from '@/types'
import { supabaseAdmin } from '@/lib/supabase'

interface CancelledInvoiceInfo extends Sale {
  cancellationReason?: string
  cancelledBy?: string
  cancelledByName?: string
  cancelledAt?: string
}

interface CancelledInvoicesModalProps {
  isOpen: boolean
  onClose: () => void
  /** Ventas ya filtradas al período de Reportes (anuladas en ese rango). */
  sales: Sale[]
  periodLabel?: string
}

export function CancelledInvoicesModal({
  isOpen,
  onClose,
  sales,
  periodLabel,
}: CancelledInvoicesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cancelledInvoices, setCancelledInvoices] = useState<CancelledInvoiceInfo[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadCancellationInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sales])

  const loadCancellationInfo = async () => {
    setIsLoading(true)
    try {
      const cancelledSales = sales.filter((sale) => sale.status === 'cancelled')

      let cancellationLogs: any[] = []

      try {
        const { data: logs, error } = await supabaseAdmin
          .from('logs')
          .select(
            `
            id,
            user_id,
            action,
            module,
            details,
            created_at,
            users (
              id,
              name
            )
          `
          )
          .eq('action', 'sale_cancel')
          .eq('module', 'sales')
          .order('created_at', { ascending: false })
          .limit(500)

        if (error) {
          const { data: logsWithoutJoin, error: errorWithoutJoin } = await supabaseAdmin
            .from('logs')
            .select('id, user_id, action, module, details, created_at')
            .eq('action', 'sale_cancel')
            .eq('module', 'sales')
            .order('created_at', { ascending: false })
            .limit(500)

          if (!errorWithoutJoin && logsWithoutJoin) {
            const userIds = [
              ...new Set(logsWithoutJoin.map((log: any) => log.user_id).filter(Boolean)),
            ]
            const userNames: { [key: string]: string } = {}

            if (userIds.length > 0) {
              const { data: users } = await supabaseAdmin
                .from('users')
                .select('id, name')
                .in('id', userIds)

              if (users) {
                users.forEach((user: any) => {
                  userNames[user.id] = user.name
                })
              }
            }

            cancellationLogs = logsWithoutJoin.map((log: any) => {
              let parsedDetails = log.details || {}
              if (typeof log.details === 'string') {
                try {
                  parsedDetails = JSON.parse(log.details)
                } catch {
                  parsedDetails = {}
                }
              }

              return {
                id: log.id,
                user_id: log.user_id,
                details: parsedDetails,
                created_at: log.created_at,
                user_name: log.user_id
                  ? userNames[log.user_id] || 'Usuario desconocido'
                  : 'Usuario desconocido',
              }
            })
          }
        } else if (logs) {
          cancellationLogs = logs.map((log: any) => {
            let parsedDetails = log.details || {}
            if (typeof log.details === 'string') {
              try {
                parsedDetails = JSON.parse(log.details)
              } catch {
                parsedDetails = {}
              }
            }

            return {
              id: log.id,
              user_id: log.user_id,
              details: parsedDetails,
              created_at: log.created_at,
              user_name:
                log.users && typeof log.users === 'object' && log.users.name
                  ? String(log.users.name)
                  : 'Usuario desconocido',
            }
          })
        }
      } catch (err) {
        console.warn('[CancelledInvoicesModal] Error fetching cancellation logs:', err)
      }

      const invoicesWithInfo: CancelledInvoiceInfo[] = cancelledSales.map((sale) => {
        const cancellationLog = cancellationLogs.find((log) => {
          const details = log.details || {}
          if (details.saleId === sale.id) return true
          if (sale.invoiceNumber && details.invoiceNumber === sale.invoiceNumber) return true
          if (details.description && typeof details.description === 'string') {
            if (details.description.includes(sale.id)) return true
            if (sale.invoiceNumber && details.description.includes(sale.invoiceNumber)) return true
          }
          return false
        })

        let reason = sale.cancellationReason || 'No especificado'
        if (cancellationLog?.details) {
          const details = cancellationLog.details
          if (details.reason) {
            reason = String(details.reason)
          } else if (details.description) {
            const desc = String(details.description)
            const motivoMatch = desc.match(/Motivo:\s*(.+?)(?:\s*-|$)/i)
            if (motivoMatch?.[1]) {
              reason = motivoMatch[1].trim()
            } else if (desc.includes('Motivo:')) {
              reason = desc.split('Motivo:')[1]?.split('-')[0]?.trim() || desc
            }
          }
        }

        return {
          ...sale,
          cancellationReason: reason,
          cancelledBy: cancellationLog?.user_id || sale.sellerId,
          cancelledByName:
            cancellationLog?.user_name || sale.sellerName || 'Usuario desconocido',
          cancelledAt: cancellationLog?.created_at || sale.updatedAt || sale.createdAt,
        }
      })

      invoicesWithInfo.sort((a, b) => {
        const dateA = new Date(a.cancelledAt || a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.cancelledAt || b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })

      setCancelledInvoices(invoicesWithInfo)
    } catch {
      setCancelledInvoices(
        sales
          .filter((sale) => sale.status === 'cancelled')
          .map((sale) => ({
            ...sale,
            cancellationReason: sale.cancellationReason || 'No disponible',
            cancelledByName: sale.sellerName || 'Usuario desconocido',
            cancelledAt: sale.updatedAt || sale.createdAt,
          }))
          .sort((a, b) => {
            const dateA = new Date(a.cancelledAt || a.createdAt).getTime()
            const dateB = new Date(b.cancelledAt || b.createdAt).getTime()
            return dateB - dateA
          })
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const totalLostValue = cancelledInvoices.reduce((sum, invoice) => sum + invoice.total, 0)

  if (!isOpen || !mounted) return null

  const modal = (
    <div
      className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 xl:left-60"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="zonat-preserve-surface flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-[min(36rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelled-invoices-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/90 px-4 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <XCircle className="h-5 w-5 shrink-0 text-brand-coral" strokeWidth={1.5} aria-hidden />
            <div className="min-w-0">
              <h2
                id="cancelled-invoices-title"
                className="truncate text-base font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Facturas anuladas
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {periodLabel ? `Período: ${periodLabel}` : 'Ventas canceladas del período'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 min-h-0 w-8 shrink-0 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="rounded-lg bg-brand-coral-soft/60 px-3 py-2.5 dark:bg-brand-coral/10">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Anuladas
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {cancelledInvoices.length}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Valor perdido
            </p>
            <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-brand-coral">
              {formatCurrency(totalLostValue)}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-lime dark:border-zinc-700"
                aria-hidden
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
            </div>
          ) : cancelledInvoices.length > 0 ? (
            <ul className="space-y-2">
              {cancelledInvoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="rounded-lg border border-zinc-200/90 px-3 py-2.5 dark:border-zinc-700/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {invoice.invoiceNumber || 'Sin número'}
                        </span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-brand-coral bg-brand-coral-soft dark:bg-brand-coral/15">
                          Anulada
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                        <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        {invoice.clientName}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-coral">
                      {formatCurrency(invoice.total)}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" strokeWidth={1.5} />
                      {invoice.cancelledByName || 'Usuario desconocido'}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3 w-3" strokeWidth={1.5} />
                      {new Date(
                        invoice.cancelledAt || invoice.updatedAt || invoice.createdAt
                      ).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                    <FileText
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400"
                      strokeWidth={1.5}
                    />
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {invoice.cancellationReason || 'No especificado'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No hay facturas anuladas
              </p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                {periodLabel
                  ? `Ninguna anulación en ${periodLabel.toLowerCase()}.`
                  : 'En este período todas las ventas siguen activas.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-200/90 px-4 py-3 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="min-w-[6.5rem] border-zinc-300 dark:border-zinc-600"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
