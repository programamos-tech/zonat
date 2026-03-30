'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  ArrowLeft,
  Eye
} from 'lucide-react'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { Credit, PaymentRecord } from '@/types'
import { CreditsService } from '@/lib/credits-service'
import { PaymentModal } from '@/components/credits/payment-modal'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/user-avatar'

const cardShell =
  'border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40'

/** Badges discretos (sin verde/rojo/ámbar fuerte) */
function getStatusBadgeClass(_status: string, credit?: Credit) {
  if (credit && isCreditCancelled(credit)) {
    return 'border-zinc-200/90 bg-zinc-100/40 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-500'
  }
  return 'border-zinc-200/90 bg-zinc-50/90 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
}

function isCreditCancelled(credit: Credit) {
  return credit.totalAmount === 0 && credit.pendingAmount === 0
}

export default function ClientCreditsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const [credits, setCredits] = useState<Credit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    if (clientId) {
      loadCredits()
    }
  }, [clientId])

  const loadCredits = async () => {
    try {
      setIsLoading(true)
      const creditsData = await CreditsService.getCreditsByClientId(clientId)
      setCredits(creditsData)
      
      if (creditsData.length > 0) {
        setClientName(creditsData[0].clientName)
      }

      // NO cargar historial y ventas aquí - se cargarán de forma lazy cuando se expanda cada crédito
      // Esto mejora significativamente el rendimiento inicial
    } catch (error) {
      // Error silencioso en producción
      setCredits([])
    } finally {
      setIsLoading(false)
    }
  }

  const goToCreditDetail = (creditId: string) => {
    router.push(`/payments/${clientId}/credit/${creditId}`)
  }

  const handlePayment = (credit: Credit) => {
    setSelectedCredit(credit)
    setIsPaymentModalOpen(true)
  }

  const handleAddPayment = async (paymentData: Partial<PaymentRecord>) => {
    if (!selectedCredit) return

    try {
      const paymentRecord = await CreditsService.createPaymentRecord({
        creditId: selectedCredit.id,
        amount: paymentData.amount!,
        paymentDate: paymentData.paymentDate!,
        paymentMethod: paymentData.paymentMethod!,
        cashAmount: paymentData.cashAmount,
        transferAmount: paymentData.transferAmount,
        description: paymentData.description,
        userId: paymentData.userId,
        userName: paymentData.userName
      })

      const paymentAmount = paymentData.amount!
      const newPaidAmount = selectedCredit.paidAmount + paymentAmount
      const newPendingAmount = selectedCredit.pendingAmount - paymentAmount
      const newStatus = newPendingAmount <= 0 ? 'completed' : 'partial'

      await CreditsService.updateCredit(selectedCredit.id, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        lastPaymentAmount: paymentAmount,
        lastPaymentDate: paymentData.paymentDate!,
        lastPaymentUser: paymentRecord.userId!
      })

      setIsPaymentModalOpen(false)
      setSelectedCredit(null)
      await loadCredits()
    } catch (error) {
      // Error silencioso en producción
      alert('Error al agregar el pago. Por favor intenta de nuevo.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getDueDateClass = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) {
      return 'font-medium tabular-nums text-zinc-800 dark:text-zinc-200'
    }
    if (diffDays <= 7) {
      return 'font-medium tabular-nums text-zinc-700 dark:text-zinc-300'
    }
    return 'tabular-nums text-zinc-600 dark:text-zinc-400'
  }

  const getStatusIcon = (status: string, credit?: Credit) => {
    const ic = 'h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400'
    if (credit && isCreditCancelled(credit)) {
      return <XCircle className={ic} />
    }

    switch (status) {
      case 'completed':
        return <CheckCircle className={ic} />
      case 'partial':
        return <Clock className={ic} />
      case 'pending':
        return <AlertCircle className={ic} />
      case 'overdue':
        return <XCircle className={ic} />
      case 'cancelled':
        return <XCircle className={ic} />
      default:
        return <AlertCircle className={ic} />
    }
  }

  const getStatusLabel = (status: string, credit?: Credit) => {
    if (credit && isCreditCancelled(credit)) {
      return 'Anulado'
    }
    
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'partial':
        return 'Parcial'
      case 'completed':
        return 'Completado'
      case 'overdue':
        return 'Vencido'
      case 'cancelled':
        return 'Anulado'
      default:
        return status
    }
  }

  const getCreditDescription = (credit: Credit): string => {
    // Generar ID del crédito con las primeras 2 letras del cliente + últimos 6 caracteres del UUID
    const clientInitials = credit.clientName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
      .padEnd(2, 'X') // Si el nombre tiene menos de 2 palabras, rellenar con X
    
    const creditSuffix = credit.id.substring(credit.id.length - 6).toLowerCase()
    return `${clientInitials}${creditSuffix}`
  }

  const totalDebt = credits.reduce((sum, credit) => sum + credit.pendingAmount, 0)
  const totalPaid = credits.reduce((sum, credit) => sum + credit.paidAmount, 0)
  const totalAmount = credits.reduce((sum, credit) => sum + credit.totalAmount, 0)

  // Calcular score del cliente (1-5 estrellas)
  const calculateClientScore = (): { stars: number; label: string; color: string; description: string } => {
    if (credits.length === 0) {
      return { stars: 0, label: 'Sin historial', color: 'gray', description: 'No hay créditos registrados' }
    }

    // Si todos los créditos están pagados y no hay deuda, es excelente automáticamente
    if (totalDebt === 0 && credits.every(c => c.status === 'completed' || c.pendingAmount === 0)) {
      return { 
        stars: 5, 
        label: 'Excelente', 
        color: 'green', 
        description: 'Cliente perfecto, todos los créditos pagados completamente' 
      }
    }

    // Parámetros para el score:
    // 1. Porcentaje de créditos completados (50% - más peso)
    const completedCredits = credits.filter(c => c.status === 'completed' || c.pendingAmount === 0).length
    const completionRate = (completedCredits / credits.length) * 100

    // 2. Relación deuda actual vs total histórico (30% - más peso)
    const totalHistorical = credits.reduce((sum, c) => sum + c.totalAmount, 0)
    const debtRatio = totalHistorical > 0 ? ((totalHistorical - totalDebt) / totalHistorical) * 100 : 100

    // 3. Porcentaje de pagos a tiempo - créditos completados antes o en fecha de vencimiento (15%)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const onTimeCredits = credits.filter(c => {
      if (!c.dueDate || c.status !== 'completed') return false
      const dueDate = new Date(c.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      // Si está completado y la fecha de vencimiento es hoy o futura, o si se pagó antes del vencimiento
      if (c.lastPaymentDate) {
        const lastPayment = new Date(c.lastPaymentDate)
        lastPayment.setHours(0, 0, 0, 0)
        return lastPayment <= dueDate
      }
      return dueDate >= today
    }).length
    const creditsWithDueDate = credits.filter(c => c.dueDate && c.status === 'completed').length
    const onTimeRate = creditsWithDueDate > 0 
      ? (onTimeCredits / creditsWithDueDate) * 100 
      : completionRate // Si no hay fechas, usar el rate de completados

    // 4. Velocidad de pago - créditos pagados en menos de 60 días (5% - menos peso)
    const quickPayments = credits.filter(c => {
      if (!c.lastPaymentDate || !c.createdAt || c.status !== 'completed') return false
      const created = new Date(c.createdAt)
      const lastPayment = new Date(c.lastPaymentDate)
      const daysDiff = (lastPayment.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 60 // Más generoso: 60 días
    }).length
    const quickPaymentRate = credits.filter(c => c.status === 'completed').length > 0 
      ? (quickPayments / credits.filter(c => c.status === 'completed').length) * 100 
      : 0

    // Calcular score ponderado (0-100)
    const score = Math.round(
      (completionRate * 0.5) +
      (debtRatio * 0.3) +
      (onTimeRate * 0.15) +
      (quickPaymentRate * 0.05)
    )

    // Convertir a estrellas (1-5) con umbrales más justos
    let stars: number
    let label: string
    let color: string
    let description: string

    if (score >= 95 || (completionRate === 100 && totalDebt === 0)) {
      stars = 5
      label = 'Excelente'
      color = 'green'
      description = 'Cliente muy confiable, paga siempre a tiempo'
    } else if (score >= 80 || (completionRate >= 80 && totalDebt === 0)) {
      stars = 4
      label = 'Bueno'
      color = 'blue'
      description = 'Cliente confiable, buen historial de pagos'
    } else if (score >= 60 || (completionRate >= 60 && debtRatio >= 70)) {
      stars = 3
      label = 'Regular'
      color = 'yellow'
      description = 'Cliente con historial mixto, requiere seguimiento'
    } else if (score >= 40) {
      stars = 2
      label = 'Riesgoso'
      color = 'orange'
      description = 'Cliente con retrasos frecuentes, cuidado'
    } else {
      stars = 1
      label = 'Alto Riesgo'
      color = 'red'
      description = 'Cliente con mal historial, requiere atención'
    }

    return { stars, label, color, description }
  }

  const clientScore = calculateClientScore()

  return (
    <RoleProtectedRoute module="payments" requiredAction="view">
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-zinc-50/90 via-white to-zinc-50/80 py-4 pb-24 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 md:py-6 xl:pb-8">
        <Card className={cardShell}>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-start gap-3">
                  <UserAvatar
                    name={clientName || 'Cliente'}
                    seed={clientId}
                    size="sm"
                    className="shrink-0 md:h-8 md:w-8 md:text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-2xl">
                        {clientName || 'Cliente'}
                      </h1>
                      <div
                        className="flex items-center gap-1 rounded-lg border border-zinc-200/90 bg-zinc-50/80 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/40"
                        title={clientScore.description}
                      >
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              'h-3.5 w-3.5 md:h-4 md:w-4',
                              index < clientScore.stars
                                ? 'fill-zinc-500 text-zinc-500 dark:fill-zinc-400 dark:text-zinc-400'
                                : 'fill-zinc-200 text-zinc-200 dark:fill-zinc-800 dark:text-zinc-800'
                            )}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {clientScore.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 border-t border-zinc-200/90 pt-4 dark:border-zinc-800">
                  <div>
                    <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      Total créditos
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 md:text-xl">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      Total pagado
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-zinc-700 dark:text-zinc-300 md:text-xl">
                      {formatCurrency(totalPaid)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      Total pendiente
                    </div>
                    <div
                      className={cn(
                        'text-lg font-semibold tabular-nums md:text-xl text-zinc-900 dark:text-zinc-100',
                        totalDebt === 0 && 'text-zinc-500 dark:text-zinc-500'
                      )}
                    >
                      {formatCurrency(totalDebt)}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push('/payments')}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Créditos
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className={cardShell}>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando créditos…</p>
              </div>
            </CardContent>
          </Card>
        ) : credits.length === 0 ? (
          <Card className={cardShell}>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-300 dark:border-zinc-600">
                  <CreditCard className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">No hay créditos registrados para este cliente</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={cn(cardShell, 'overflow-hidden')}>
            <div className="border-b border-zinc-200/90 px-4 py-3 dark:border-zinc-800 md:px-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Créditos del cliente</h2>
            </div>
            <CardContent className="p-0">
              <div className="space-y-2 p-3 md:hidden">
                {credits.map(credit => (
                  <button
                    key={credit.id}
                    type="button"
                    className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 text-left transition-colors hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:bg-zinc-800/40"
                    onClick={() => goToCreditDetail(credit.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          #{getCreditDescription(credit)}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-zinc-500">{credit.invoiceNumber}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 border px-2 py-0.5 text-[11px] font-normal',
                          getStatusBadgeClass(credit.status, credit)
                        )}
                      >
                        {getStatusIcon(credit.status, credit)}
                        {getStatusLabel(credit.status, credit)}
                      </Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-200/80 pt-3 text-left dark:border-zinc-800">
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Pendiente</dt>
                        <dd
                          className={cn(
                            'mt-0.5 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100',
                            credit.pendingAmount === 0 && 'text-zinc-500 dark:text-zinc-500'
                          )}
                        >
                          {formatCurrency(credit.pendingAmount)}
                        </dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Vence</dt>
                        <dd className="mt-0.5 text-sm tabular-nums">
                          {credit.dueDate ? (
                            <span className={getDueDateClass(credit.dueDate)}>{formatDate(credit.dueDate)}</span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </button>
                ))}
              </div>

              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          ID
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Factura
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Total
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Pagado
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Pendiente
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Estado
                        </th>
                        <th className="whitespace-nowrap bg-zinc-50/80 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Vencimiento
                        </th>
                        <th className="w-[5.5rem] bg-zinc-50/80 px-2 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {credits.map(credit => (
                        <tr
                          key={credit.id}
                          className="cursor-pointer transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-800/25"
                          onClick={() => goToCreditDetail(credit.id)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                            #{getCreditDescription(credit)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            {credit.invoiceNumber}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                            {formatCurrency(credit.totalAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                            {formatCurrency(credit.paidAmount)}
                          </td>
                          <td
                            className={cn(
                              'whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100',
                              credit.pendingAmount === 0 && 'text-zinc-500 dark:text-zinc-500'
                            )}
                          >
                            {formatCurrency(credit.pendingAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                'inline-flex border px-2 py-0.5 text-[11px] font-normal',
                                getStatusBadgeClass(credit.status, credit)
                              )}
                            >
                              <span className="flex items-center justify-center gap-1">
                                {getStatusIcon(credit.status, credit)}
                                {getStatusLabel(credit.status, credit)}
                              </span>
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {credit.dueDate ? (
                              <span className={getDueDateClass(credit.dueDate)}>{formatDate(credit.dueDate)}</span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-nowrap items-center justify-end gap-1">
                              {credit.pendingAmount > 0 &&
                                !isCreditCancelled(credit) &&
                                credit.status !== 'cancelled' && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    title="Abonar"
                                    aria-label="Abonar"
                                    onClick={() => handlePayment(credit)}
                                  >
                                    <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  </Button>
                                )}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Ver detalle"
                                aria-label="Ver detalle"
                                onClick={() => goToCreditDetail(credit.id)}
                              >
                                <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Pago */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedCredit(null)
          }}
          onAddPayment={handleAddPayment}
          credit={selectedCredit}
        />
      </div>
    </RoleProtectedRoute>
  )
}

