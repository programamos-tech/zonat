'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditTable } from '@/components/payments/payment-table'
import { CreditModal } from '@/components/credits/credit-modal'
import { PaymentModal } from '@/components/credits/payment-modal'
import { CreditDetailModal } from '@/components/credits/credit-detail-modal'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { Credit, PaymentRecord } from '@/types'
import { CreditsService } from '@/lib/credits-service'

export default function CreditsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [credits, setCredits] = useState<Credit[]>([])
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCreditDetailModalOpen, setIsCreditDetailModalOpen] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [clientCredits, setClientCredits] = useState<Credit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [initialSearch, setInitialSearch] = useState('')

  // Cargar créditos al montar el componente
  useEffect(() => {
    loadCredits()
  }, [])

  // Manejar parámetros de búsqueda de la URL
  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setInitialSearch(search)
    }
  }, [searchParams])

  // Verificar si hay un crédito seleccionado en sessionStorage
  useEffect(() => {
    const selectedCreditData = sessionStorage.getItem('selectedCredit')
    if (selectedCreditData) {
      try {
        const credit = JSON.parse(selectedCreditData)
        setSelectedCredit(credit)
        setIsCreditDetailModalOpen(true)
        // Limpiar el sessionStorage después de usarlo
        sessionStorage.removeItem('selectedCredit')
      } catch (error) {
        console.error('Error parsing selected credit:', error)
        sessionStorage.removeItem('selectedCredit')
      }
    }
  }, [])

  // Escuchar eventos de crédito cancelado para refrescar la vista
  useEffect(() => {
    console.log('🎧 Configurando listener para eventos creditCancelled')
    
    const handleCreditCancelled = (event: CustomEvent) => {
      console.log('🔄 Crédito cancelado detectado, refrescando vista:', event.detail)
      console.log('🔄 Ejecutando loadCredits()...')
      loadCredits()
    }

    window.addEventListener('creditCancelled', handleCreditCancelled as EventListener)
    console.log('✅ Listener configurado exitosamente')
    
    return () => {
      console.log('🧹 Limpiando listener de eventos creditCancelled')
      window.removeEventListener('creditCancelled', handleCreditCancelled as EventListener)
    }
  }, [])

  const loadCredits = async () => {
    try {
      console.log('🔄 Iniciando loadCredits()...')
      setIsLoading(true)
      const creditsData = await CreditsService.getAllCredits()
      console.log('📊 Créditos obtenidos de la DB:', creditsData.length)
      console.log('📊 Primeros créditos:', creditsData.slice(0, 3).map(c => ({ 
        id: c.id, 
        invoiceNumber: c.invoiceNumber, 
        status: c.status,
        totalAmount: c.totalAmount 
      })))
      
      // Agrupar créditos por cliente
      const groupedCredits = creditsData.reduce((acc, credit) => {
        const key = credit.clientId
        if (!acc[key]) {
          acc[key] = {
            clientId: credit.clientId,
            clientName: credit.clientName,
            credits: [],
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            status: 'pending' as 'pending' | 'partial' | 'completed'
          }
        }
        acc[key].credits.push(credit)
        acc[key].totalAmount += credit.totalAmount
        acc[key].paidAmount += credit.paidAmount
        acc[key].pendingAmount += credit.pendingAmount
        
        // Determinar el estado general del cliente
        if (acc[key].pendingAmount === 0) {
          acc[key].status = 'completed'
        } else if (acc[key].paidAmount > 0) {
          acc[key].status = 'partial'
        } else {
          acc[key].status = 'pending'
        }
        
        return acc
      }, {} as Record<string, any>)
      
      // Convertir a array
      const consolidated = Object.values(groupedCredits).map(group => ({
        ...group,
        // Usar el primer crédito como referencia principal
        id: group.credits[0].id,
        invoiceNumber: `${group.credits.length} factura${group.credits.length > 1 ? 's' : ''}`,
        dueDate: group.credits.sort((a: any, b: any) => 
          new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime()
        )[0]?.dueDate,
        lastPaymentDate: group.credits.sort((a: any, b: any) => 
          new Date(b.lastPaymentDate || '').getTime() - new Date(a.lastPaymentDate || '').getTime()
        )[0]?.lastPaymentDate,
        lastPaymentAmount: group.credits[0].lastPaymentAmount,
        lastPaymentUser: group.credits[0].lastPaymentUser,
        createdAt: group.credits[0].createdAt
      }))
      
      setCredits(consolidated as Credit[])
    } catch (error) {
      console.error('Error loading credits:', error)
      // Si es un error de tabla no encontrada, mostrar mensaje más útil
      if (error instanceof Error && error.message.includes('relation "credits" does not exist')) {
        console.warn('Las tablas de créditos no existen. Ejecuta el script SQL para crearlas.')
        setCredits([]) // Mostrar lista vacía en lugar de error
      } else {
        setCredits([]) // En caso de otros errores, mostrar lista vacía
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (credit: Credit) => {
    // Cargar todos los créditos del cliente
    try {
      const allCredits = await CreditsService.getCreditsByClientId(credit.clientId)
      setClientCredits(allCredits)
      
      // Si tiene múltiples créditos, usar el primero como seleccionado
      // Esto se manejará en el modal para permitir seleccionar entre ellos
      setSelectedCredit(credit)
      setIsCreditDetailModalOpen(true)
    } catch (error) {
      console.error('Error loading client credits:', error)
      setClientCredits([])
      setSelectedCredit(credit)
      setIsCreditDetailModalOpen(true)
    }
  }

  const handlePayment = (credit: Credit) => {
    console.log('handlePayment llamado con:', credit.id, credit.invoiceNumber)
    console.log('Abriendo modal de pagos...')
    setSelectedCredit(credit)
    // NO cerrar el modal de detalles, solo abrir el de pago
    setIsPaymentModalOpen(true)
    console.log('isPaymentModalOpen debería ser true ahora')
  }

  const handleViewSale = (invoiceNumber: string) => {
    // Cerrar el modal de detalles del crédito
    setIsCreditDetailModalOpen(false)
    setSelectedCredit(null)
    
    // Navegar al módulo de ventas
    router.push('/sales')
    
    // Guardar el número de factura en sessionStorage para que la página de ventas lo pueda usar
    sessionStorage.setItem('selectedInvoice', invoiceNumber)
  }

  const handleRefresh = async () => {
    await loadCredits()
  }

  const handleCreate = () => {
    setIsCreditModalOpen(true)
  }

  const handleCreateCredit = async (credit: Credit) => {
    // Recargar créditos para agrupar automáticamente
    await loadCredits()
    setIsCreditModalOpen(false)
  }

  const handleAddPayment = async (paymentData: Partial<PaymentRecord>) => {
    if (!selectedCredit) return

    try {
      // Crear el registro de pago
      const paymentRecord = await CreditsService.createPaymentRecord({
        creditId: selectedCredit.id,
        amount: paymentData.amount!,
        paymentDate: paymentData.paymentDate!,
        paymentMethod: paymentData.paymentMethod!,
        cashAmount: paymentData.cashAmount,
        transferAmount: paymentData.transferAmount,
        description: paymentData.description,
        userId: paymentData.userId || 'current-user-id',
        userName: paymentData.userName || 'Usuario Actual'
      })

      // Actualizar el crédito
      const paymentAmount = paymentData.amount!
      const newPaidAmount = selectedCredit.paidAmount + paymentAmount
      const newPendingAmount = selectedCredit.pendingAmount - paymentAmount
      const newStatus = newPendingAmount <= 0 ? 'completed' : 'partial'

      const updatedCredit = await CreditsService.updateCredit(selectedCredit.id, {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        lastPaymentAmount: paymentAmount,
        lastPaymentDate: paymentData.paymentDate!,
        lastPaymentUser: paymentData.userId!
      })

      // Actualizar el estado local
      setCredits(prev => prev.map(credit => 
        credit.id === selectedCredit.id ? updatedCredit : credit
      ))

      // Recargar los créditos del cliente para actualizar el modal de detalles
      const allCredits = await CreditsService.getCreditsByClientId(selectedCredit.clientId)
      setClientCredits(allCredits)

      setIsPaymentModalOpen(false)
      // NO resetear selectedCredit para mantener el modal de detalles abierto
      // setSelectedCredit(null)
    } catch (error) {
      console.error('Error adding payment:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      
      let errorMessage = 'Error al agregar el pago. Por favor intenta de nuevo.'
      
      if (error instanceof Error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Error: La tabla de pagos no existe. Contacta al administrador.'
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Error: Monto insuficiente para el pago.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      alert(errorMessage)
    }
  }

  return (
    <RoleProtectedRoute module="payments" requiredAction="view">
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <CreditTable
        credits={credits}
        onView={handleView}
        onPayment={handlePayment}
        onCreate={handleCreate}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onCreateCredit={handleCreateCredit}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
        }}
        onAddPayment={handleAddPayment}
        credit={selectedCredit}
      />

      <CreditDetailModal
        isOpen={isCreditDetailModalOpen}
        onClose={() => {
          setIsCreditDetailModalOpen(false)
          setClientCredits([])
        }}
        credit={selectedCredit}
        clientCredits={clientCredits}
        onAddPayment={handlePayment}
        onViewSale={handleViewSale}
      />
    </div>
    </RoleProtectedRoute>
  )
}
