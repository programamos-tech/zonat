'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { SupplierInvoiceTable } from '@/components/supplier-invoices/supplier-invoice-table'
import { SupplierInvoiceModal } from '@/components/supplier-invoices/supplier-invoice-modal'
import { SupplierInvoice } from '@/types'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/usePermissions'

export default function SupplierInvoicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { canCreate } = usePermissions()
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [supplierOptions, setSupplierOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [inv, sup] = await Promise.all([
        SupplierInvoicesService.getInvoices(),
        SupplierInvoicesService.getSuppliers(true)
      ])
      setInvoices(inv)
      setSupplierOptions(sup.map((s) => ({ id: s.id, name: s.name })))
    } catch {
      setInvoices([])
      setSupplierOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (user) loadAll()
  }, [user?.storeId, loadAll])

  const goToDetail = (inv: SupplierInvoice) => {
    router.push(`/purchases/invoices/${inv.id}`)
  }

  const openNewInvoice = () => {
    setInvoiceModalOpen(true)
  }

  return (
    <RoleProtectedRoute module="supplier_invoices" requiredAction="view">
      <div className="min-h-screen bg-gradient-to-b from-zinc-50/90 via-white to-zinc-50/80 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 pb-24 xl:pb-8">
        <div className="py-4 md:py-8">
          <SupplierInvoiceTable
            invoices={invoices}
            suppliers={supplierOptions}
            onView={goToDetail}
            onCreate={openNewInvoice}
            canCreate={canCreate('supplier_invoices')}
            isLoading={loading}
            onRefresh={loadAll}
          />
        </div>

        <SupplierInvoiceModal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          onSaved={loadAll}
          invoice={null}
        />
      </div>
    </RoleProtectedRoute>
  )
}
