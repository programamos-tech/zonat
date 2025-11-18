'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, Search, Calendar, Package, Building2, Trash2 } from 'lucide-react'
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product } from '@/types'
import { SuppliersService } from '@/lib/suppliers-service'
import { ProductsService } from '@/lib/products-service'
import { useProducts } from '@/contexts/products-context'

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void
  order?: PurchaseOrder | null
}

export function PurchaseOrderModal({ isOpen, onClose, onSave, order }: PurchaseOrderModalProps) {
  const { products, refreshProducts } = useProducts()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([])
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  
  const [supplierSearch, setSupplierSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  // Cargar proveedores y productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      refreshProducts()
    }
  }, [isOpen, refreshProducts])

  const loadSuppliers = async () => {
    try {
      const data = await SuppliersService.getAllSuppliers()
      setSuppliers(data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Inicializar datos si es edición
  useEffect(() => {
    if (order) {
      const supplier = suppliers.find(s => s.id === order.supplierId)
      setSelectedSupplier(supplier || null)
      setSelectedItems(order.items || [])
      setEstimatedDeliveryDate(order.estimatedDeliveryDate || '')
      setNotes(order.notes || '')
    } else {
      setSelectedSupplier(null)
      setSelectedItems([])
      setEstimatedDeliveryDate('')
      setNotes('')
    }
  }, [order, suppliers])

  // Debounce para la búsqueda de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  // Buscar productos
  useEffect(() => {
    let cancelled = false
    
    const performSearch = async () => {
      if (debouncedProductSearch.trim().length >= 2) {
        setIsSearchingProducts(true)
        try {
          const results = await ProductsService.searchProducts(debouncedProductSearch)
          if (!cancelled) {
            setSearchedProducts(results)
          }
        } catch (error) {
          if (!cancelled) {
            setSearchedProducts([])
          }
        } finally {
          if (!cancelled) {
            setIsSearchingProducts(false)
          }
        }
      } else {
        setSearchedProducts([])
        setIsSearchingProducts(false)
      }
    }

    performSearch()
    return () => {
      cancelled = true
    }
  }, [debouncedProductSearch])

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      supplier.nit?.toLowerCase().includes(supplierSearch.toLowerCase())
    )
  }, [suppliers, supplierSearch])

  const availableProducts = useMemo(() => {
    if (debouncedProductSearch.trim().length >= 2) {
      return searchedProducts
    }
    return products.slice(0, 20) // Mostrar primeros 20 productos
  }, [products, searchedProducts, debouncedProductSearch])

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0)
  }, [selectedItems])

  const handleAddProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      setSelectedItems(prev =>
        prev.map(item => {
          if (item.productId === product.id) {
            const updatedItem = { ...item, quantity: item.quantity + 1 }
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
            return updatedItem
          }
          return item
        })
      )
    } else {
      const newItem: PurchaseOrderItem = {
        id: Date.now().toString(),
        purchaseOrderId: '',
        productId: product.id,
        productName: product.name,
        productReference: product.reference,
        quantity: 1,
        unitPrice: product.cost || 0, // Usar costo como precio base
        total: product.cost || 0
      }
      setSelectedItems(prev => [newItem, ...prev])
    }
    setShowProductDropdown(false)
    setProductSearch('')
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, quantity: newQuantity }
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })
    )
  }

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, unitPrice: newPrice }
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier) {
      alert('Por favor selecciona un proveedor')
      return
    }
    if (selectedItems.length === 0) {
      alert('Por favor agrega al menos un producto')
      return
    }

    onSave({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      status: 'pending',
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      total,
      items: selectedItems,
      notes: notes || undefined,
      createdBy: undefined,
      createdByName: undefined
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)]" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 md:h-8 md:w-8" style={{ color: 'var(--sidebar-orange)' }} />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {order ? 'Editar Orden de Compra' : 'Crear Nueva Orden de Compra'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                {order ? 'Modifica la información de la orden' : 'Completa la información de la nueva orden'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Selección de Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Proveedor *
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Building2 className="absolute left-3 h-5 w-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value)
                    setShowSupplierDropdown(true)
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                  }}
                  onBlur={(e) => {
                    setTimeout(() => setShowSupplierDropdown(false), 200)
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.boxShadow = ''
                  }}
                />
              </div>
              {showSupplierDropdown && filteredSuppliers.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        setSupplierSearch(supplier.name)
                        setShowSupplierDropdown(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                      {supplier.nit && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{supplier.nit}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedSupplier && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedSupplier.name}</div>
                {selectedSupplier.phone && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tel: {selectedSupplier.phone}</div>
                )}
              </div>
            )}
          </div>

          {/* Búsqueda de Productos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Agregar Productos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto por nombre o referencia..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProductDropdown(true)
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  setTimeout(() => setShowProductDropdown(false), 200)
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
              {showProductDropdown && availableProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-colors border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{product.name}</div>
                          {product.reference && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Ref: {product.reference}</div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                          ${(product.cost || 0).toLocaleString('es-CO')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Productos Seleccionados */}
          {selectedItems.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Productos Seleccionados
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.productName}
                        </div>
                        {item.productReference && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Ref: {item.productReference}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Cantidad</label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Precio Unit.</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Total</label>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                          ${item.total.toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fecha Estimada y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Fecha Estimada de Entrega
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Total de la Orden
              </label>
              <div className="px-4 py-2 text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                ${total.toLocaleString('es-CO')}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
              placeholder="Notas adicionales sobre la orden..."
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-sm text-white"
              style={{ backgroundColor: 'var(--sidebar-orange)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {order ? 'Actualizar' : 'Crear'} Orden
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

