'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Package, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import { PurchaseOrder, PurchaseOrderItem } from '@/types'
import { PurchaseOrdersService } from '@/lib/purchase-orders-service'
import { ProductsService } from '@/lib/products-service'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface ReceiveOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrder | null
  onReceive: () => void
}

export function ReceiveOrderModal({ isOpen, onClose, order, onReceive }: ReceiveOrderModalProps) {
  const { user } = useAuth()
  const [receivedItems, setReceivedItems] = useState<Array<{ itemId: string; receivedQuantity: number; notes?: string }>>([])
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [stockLocation, setStockLocation] = useState<'warehouse' | 'store'>('warehouse')

  // Inicializar cantidades recibidas con las cantidades ordenadas
  useEffect(() => {
    if (order && order.items) {
      setReceivedItems(
        order.items.map(item => ({
          itemId: item.id,
          receivedQuantity: item.receivedQuantity || item.quantity,
          notes: ''
        }))
      )
      setInvoiceNumber(order.invoiceNumber || '')
      setNotes(order.notes || '')
    }
  }, [order])

  if (!isOpen || !order) return null

  const handleUpdateReceivedQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0) return
    const item = order.items.find(i => i.id === itemId)
    if (item && quantity > item.quantity * 1.1) {
      // Permitir hasta 10% más por si hay bonificaciones
      toast.warning('La cantidad recibida no puede ser más del 10% superior a la ordenada')
      return
    }
    setReceivedItems(prev =>
      prev.map(item => {
        if (item.itemId === itemId) {
          return { ...item, receivedQuantity: quantity }
        }
        return item
      })
    )
  }

  const getTotalReceived = () => {
    return receivedItems.reduce((sum, item) => {
      const orderItem = order.items.find(i => i.id === item.itemId)
      if (orderItem) {
        return sum + (item.receivedQuantity * orderItem.unitPrice)
      }
      return sum
    }, 0)
  }

  const isPartial = () => {
    return receivedItems.some(item => {
      const orderItem = order.items.find(i => i.id === item.itemId)
      return orderItem && item.receivedQuantity < orderItem.quantity
    })
  }

  const isComplete = () => {
    return receivedItems.every(item => {
      const orderItem = order.items.find(i => i.id === item.itemId)
      return orderItem && item.receivedQuantity >= orderItem.quantity
    })
  }

  const handleReceive = async () => {
    if (receivedItems.length === 0) {
      toast.error('Debes recibir al menos un producto')
      return
    }

    setIsReceiving(true)
    try {
      // 1. Actualizar stock de cada producto recibido
      for (const receivedItem of receivedItems) {
        const orderItem = order.items.find(i => i.id === receivedItem.itemId)
        if (!orderItem || receivedItem.receivedQuantity <= 0) continue

        try {
          // Obtener producto actual
          const product = await ProductsService.getProductById(orderItem.productId)
          if (!product) continue

          // Calcular nuevo stock según la ubicación seleccionada
          const currentStock = stockLocation === 'warehouse' 
            ? product.stock.warehouse 
            : product.stock.store

          const newStock = currentStock + receivedItem.receivedQuantity
          
          // Usar adjustStock para agregar stock (establece la cantidad total)
          await ProductsService.adjustStock(
            orderItem.productId,
            stockLocation,
            newStock,
            `Recepción de orden ${order.orderNumber}`,
            user?.id
          )
        } catch (error) {
          console.error(`Error actualizando stock del producto ${orderItem.productId}:`, error)
          toast.warning(`No se pudo actualizar el stock de ${orderItem.productName}`)
        }
      }

      // 2. Actualizar la orden con las cantidades recibidas
      const updatedItems = order.items.map(orderItem => {
        const receivedItem = receivedItems.find(r => r.itemId === orderItem.id)
        const receivedQty = receivedItem?.receivedQuantity || 0
        return {
          ...orderItem,
          receivedQuantity: receivedQty,
          // Recalcular total basado en cantidad recibida
          total: receivedQty * orderItem.unitPrice
        }
      })

      // 3. Calcular total basado en cantidades recibidas
      const receivedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0)

      // 4. Determinar el estado final
      const finalStatus = isComplete() ? 'received' : 'partial'
      const receivedDate = new Date().toISOString()

      // 5. Actualizar la orden
      await PurchaseOrdersService.updatePurchaseOrder(order.id, {
        status: finalStatus,
        receivedDate,
        total: receivedTotal, // Actualizar total con lo recibido
        items: updatedItems,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined
      })

      toast.success(`Orden ${finalStatus === 'received' ? 'recibida completamente' : 'recibida parcialmente'}`)
      onReceive()
      onClose()
    } catch (error) {
      console.error('Error recibiendo orden:', error)
      toast.error('Error al procesar la recepción de mercancía')
    } finally {
      setIsReceiving(false)
    }
  }

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)]" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 md:h-8 md:w-8" style={{ color: 'var(--sidebar-orange)' }} />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Recibir Mercancía
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                Orden: {order.orderNumber} - {order.supplierName}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Ubicación de Stock */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Ubicación de Stock
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStockLocation('warehouse')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  stockLocation === 'warehouse'
                    ? 'border-[var(--sidebar-orange)] bg-[rgba(92,156,124,0.1)]'
                    : 'border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A]'
                }`}
                style={stockLocation === 'warehouse' ? { color: 'var(--sidebar-orange)' } : { color: 'inherit' }}
              >
                <div className={`font-medium ${stockLocation === 'warehouse' ? '' : 'text-gray-700 dark:text-gray-300'}`}>Bodega</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Almacenamiento principal</div>
              </button>
              <button
                type="button"
                onClick={() => setStockLocation('store')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  stockLocation === 'store'
                    ? 'border-[var(--sidebar-orange)] bg-[rgba(92,156,124,0.1)]'
                    : 'border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A]'
                }`}
                style={stockLocation === 'store' ? { color: 'var(--sidebar-orange)' } : { color: 'inherit' }}
              >
                <div className={`font-medium ${stockLocation === 'store' ? '' : 'text-gray-700 dark:text-gray-300'}`}>Local</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Punto de venta</div>
              </button>
            </div>
          </div>

          {/* Productos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Productos a Recibir
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {order.items.map((item) => {
                const receivedItem = receivedItems.find(r => r.itemId === item.id)
                const receivedQuantity = receivedItem?.receivedQuantity || 0
                const isComplete = receivedQuantity >= item.quantity
                const isPartial = receivedQuantity > 0 && receivedQuantity < item.quantity
                const isMissing = receivedQuantity === 0

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 ${
                      isComplete
                        ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10'
                        : isPartial
                        ? 'border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10'
                        : 'border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {item.productName}
                        </div>
                        {item.productReference && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {item.productReference}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Precio unitario: ${item.unitPrice.toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {isPartial && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                        {isMissing && (
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                          Ordenado
                        </label>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1A1A1A] rounded border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                          {item.quantity} und
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                          Recibido *
                        </label>
                        <input
                          type="number"
                          value={receivedQuantity}
                          onChange={(e) => handleUpdateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                          min="0"
                          max={Math.ceil(item.quantity * 1.1)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.boxShadow = ''
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                          Diferencia
                        </label>
                        <div
                          className={`px-3 py-2 text-sm font-semibold rounded border ${
                            receivedQuantity === item.quantity
                              ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30'
                              : receivedQuantity < item.quantity
                              ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30'
                              : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30'
                          }`}
                        >
                          {receivedQuantity - item.quantity > 0 ? '+' : ''}
                          {receivedQuantity - item.quantity} und
                        </div>
                      </div>
                    </div>

                    {receivedQuantity < item.quantity && (
                      <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                            Faltan {item.quantity - receivedQuantity} unidades
                          </div>
                    )}
                    {receivedQuantity > item.quantity && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            Excedente de {receivedQuantity - item.quantity} unidades (posible bonificación)
                          </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Ordenado</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${order.total.toLocaleString('es-CO')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Recibido</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--sidebar-orange)' }}>
                  ${getTotalReceived().toLocaleString('es-CO')}
                </div>
              </div>
            </div>
            {isPartial() && (
              <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded">
                <div className="text-xs text-orange-700 dark:text-orange-400">
                  ⚠️ Esta orden será marcada como <strong>Parcial</strong> porque algunos productos no se recibieron completamente.
                </div>
              </div>
            )}
          </div>

          {/* Factura y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Número de Factura
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej: FAC-2024-1234"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notas de Recepción
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones sobre la recepción..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isReceiving}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleReceive}
            disabled={isReceiving || receivedItems.every(item => item.receivedQuantity === 0)}
            className="px-4 py-2 text-sm text-white"
            style={{ backgroundColor: 'var(--sidebar-orange)' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {isReceiving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Recepción
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

