'use client'

import { useState, useEffect } from 'react'
import { PurchaseOrderTable } from '@/components/purchase-orders/purchase-order-table'
import { PurchaseOrderModal } from '@/components/purchase-orders/purchase-order-modal'
import { ReceiveOrderModal } from '@/components/purchase-orders/receive-order-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { PurchaseOrdersService } from '@/lib/purchase-orders-service'
import { PurchaseOrder } from '@/types'
import { toast } from 'sonner'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await PurchaseOrdersService.getAllPurchaseOrders()
      setOrders(data)
    } catch (error) {
      toast.error('Error cargando órdenes de compra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleDelete = (order: PurchaseOrder) => {
    setOrderToDelete(order)
    setIsDeleteModalOpen(true)
  }

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleReceive = (order: PurchaseOrder) => {
    setOrderToReceive(order)
    setIsReceiveModalOpen(true)
  }

  const handleReceiveComplete = () => {
    loadOrders()
  }

  const confirmDelete = async () => {
    if (orderToDelete) {
      const success = await PurchaseOrdersService.deletePurchaseOrder(orderToDelete.id)
      if (success) {
        toast.success('Orden de compra eliminada exitosamente')
        setIsDeleteModalOpen(false)
        setOrderToDelete(null)
        loadOrders()
      } else {
        toast.error('Error eliminando orden de compra')
      }
    }
  }

  const handleCreate = () => {
    setSelectedOrder(null)
    setIsModalOpen(true)
  }

  const handleSaveOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    if (selectedOrder) {
      const result = await PurchaseOrdersService.updatePurchaseOrder(selectedOrder.id, orderData)
      if (result.order) {
        toast.success('Orden de compra actualizada exitosamente')
        setIsModalOpen(false)
        setSelectedOrder(null)
        loadOrders()
      } else {
        toast.error(result.error || 'Error actualizando orden de compra')
      }
    } else {
      const result = await PurchaseOrdersService.createPurchaseOrder(orderData)
      if (result.order) {
        toast.success('Orden de compra creada exitosamente')
        setIsModalOpen(false)
        loadOrders()
      } else {
        toast.error(result.error || 'Error creando orden de compra')
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
    <RoleProtectedRoute module="purchase_orders" requiredAction="view">
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[var(--swatch--gray-950)] min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>
        <PurchaseOrderTable
          orders={orders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onReceive={handleReceive}
          onCreate={handleCreate}
          onRefresh={loadOrders}
        />

        <PurchaseOrderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOrder(null)
          }}
          onSave={handleSaveOrder}
          order={selectedOrder}
        />

        <ReceiveOrderModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false)
            setOrderToReceive(null)
          }}
          order={orderToReceive}
          onReceive={handleReceiveComplete}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setOrderToDelete(null)
          }}
          onConfirm={confirmDelete}
          title="Eliminar Orden de Compra"
          message={`¿Estás seguro de que quieres eliminar la orden "${orderToDelete?.orderNumber}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </RoleProtectedRoute>
  )
}

