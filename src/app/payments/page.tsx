'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditTable } from '@/components/payments/payment-table'
import { CreditModal } from '@/components/credits/credit-modal'
import { PaymentModal } from '@/components/credits/payment-modal'
import { CreditDetailModal } from '@/components/credits/credit-detail-modal'
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

  const loadCredits = async () => {
    try {
      setIsLoading(true)
      const creditsData = await CreditsService.getAllCredits()
      setCredits(creditsData)
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

  const handleView = (credit: Credit) => {
    setSelectedCredit(credit)
    setIsCreditDetailModalOpen(true)
  }

  const handlePayment = (credit: Credit) => {
    setSelectedCredit(credit)
    setIsPaymentModalOpen(true)
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

  const handleCreate = () => {
    setIsCreditModalOpen(true)
  }

  const handleCreateCredit = async (credit: Credit) => {
    setCredits(prev => [credit, ...prev])
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
        lastPaymentUser: paymentData.userName!
      })

      // Actualizar el estado local
      setCredits(prev => prev.map(credit => 
        credit.id === selectedCredit.id ? updatedCredit : credit
      ))

      setIsPaymentModalOpen(false)
      setSelectedCredit(null)
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
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <CreditTable
        credits={credits}
        onView={handleView}
        onPayment={handlePayment}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onCreateCredit={handleCreateCredit}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onAddPayment={handleAddPayment}
        credit={selectedCredit}
      />

      <CreditDetailModal
        isOpen={isCreditDetailModalOpen}
        onClose={() => setIsCreditDetailModalOpen(false)}
        credit={selectedCredit}
        onAddPayment={handlePayment}
        onViewSale={handleViewSale}
      />
    </div>
  )
}
