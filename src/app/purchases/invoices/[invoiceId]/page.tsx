'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { SupplierInvoiceDetailView } from '@/components/supplier-invoices/supplier-invoice-detail-view'
import { SupplierInvoiceModal } from '@/components/supplier-invoices/supplier-invoice-modal'
import { SupplierPaymentModal } from '@/components/supplier-invoices/supplier-payment-modal'
import { SupplierInvoice } from '@/types'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { usePermissions } from '@/hooks/usePermissions'

export default function SupplierInvoiceDetailPage() {
  const params = useParams()
  const invoiceId = typeof params?.invoiceId === 'string' ? params.invoiceId : ''

  const { canCreate, canEdit, canCancel } = usePermissions()
  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await SupplierInvoicesService.getInvoiceById(invoiceId)
      setInvoice(data)
    } catch {
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const openEdit = (_inv: SupplierInvoice) => {
    setInvoiceModalOpen(true)
  }

  const handleSaved = async () => {
    await loadInvoice()
    setInvoiceModalOpen(false)
  }

  return (
    <RoleProtectedRoute module="supplier_invoices" requiredAction="view">
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen pb-24 xl:pb-8">
        <SupplierInvoiceDetailView
          invoice={invoice}
          invoiceLoading={loading}
          onRefresh={loadInvoice}
          onEdit={openEdit}
          onAddPayment={() => setPaymentModalOpen(true)}
          canRecordPayment={canCreate('supplier_invoices')}
          canEdit={canEdit('supplier_invoices')}
          canCancel={canCancel('supplier_invoices')}
        />

        <SupplierInvoiceModal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          onSaved={handleSaved}
          invoice={invoice}
        />

        <SupplierPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={invoice}
          onAddPayment={loadInvoice}
        />
      </div>
    </RoleProtectedRoute>
  )
}
