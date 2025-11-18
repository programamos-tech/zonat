'use client'

import { useState, useEffect } from 'react'
import { SupplierTable } from '@/components/suppliers/supplier-table'
import { SupplierModal } from '@/components/suppliers/supplier-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { SuppliersService } from '@/lib/suppliers-service'
import { Supplier } from '@/types'
import { toast } from 'sonner'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const data = await SuppliersService.getAllSuppliers()
      setSuppliers(data)
    } catch (error) {
      toast.error('Error cargando proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (supplierToDelete) {
      const success = await SuppliersService.deleteSupplier(supplierToDelete.id)
      if (success) {
        toast.success('Proveedor eliminado exitosamente')
        setIsDeleteModalOpen(false)
        setSupplierToDelete(null)
        loadSuppliers()
      } else {
        toast.error('Error eliminando proveedor')
      }
    }
  }

  const handleCreate = () => {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedSupplier) {
      const result = await SuppliersService.updateSupplier(selectedSupplier.id, supplierData)
      if (result.supplier) {
        toast.success('Proveedor actualizado exitosamente')
        setIsModalOpen(false)
        setSelectedSupplier(null)
        loadSuppliers()
      } else {
        toast.error(result.error || 'Error actualizando proveedor')
      }
    } else {
      const result = await SuppliersService.createSupplier(supplierData)
      if (result.supplier) {
        toast.success('Proveedor creado exitosamente')
        setIsModalOpen(false)
        loadSuppliers()
      } else {
        toast.error(result.error || 'Error creando proveedor')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ fontFamily: 'var(--font-inter)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
      </div>
    )
  }

  return (
    <RoleProtectedRoute module="suppliers" requiredAction="view">
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[var(--swatch--gray-950)] min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>
        <SupplierTable
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
          onRefresh={loadSuppliers}
        />

        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSupplier(null)
          }}
          onSave={handleSaveSupplier}
          supplier={selectedSupplier}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setSupplierToDelete(null)
          }}
          onConfirm={confirmDelete}
          title="Eliminar Proveedor"
          message={`¿Estás seguro de que quieres eliminar el proveedor "${supplierToDelete?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </RoleProtectedRoute>
  )
}

