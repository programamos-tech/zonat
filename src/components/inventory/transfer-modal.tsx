'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trash2, Package, Store as StoreIcon, Warehouse, ArrowRightLeft, AlertTriangle, Search, CheckCircle } from 'lucide-react'
import { Store, Product, TransferItem } from '@/types'
import { ProductsService } from '@/lib/products-service'
import { StoreStockTransferService } from '@/lib/store-stock-transfer-service'
import { toast } from 'sonner'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  stores: Store[]
  fromStoreId?: string
}

interface TransferItemForm {
  productId: string
  productName: string
  productReference: string
  fromLocation: 'warehouse' | 'store'
  quantity: number
}

export function TransferModal({ isOpen, onClose, onSave, stores, fromStoreId }: TransferModalProps) {
  const [toStoreId, setToStoreId] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [items, setItems] = useState<TransferItemForm[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [globalProductSearch, setGlobalProductSearch] = useState<string>('')
  const [stockAlerts, setStockAlerts] = useState<Record<number, string>>({})

  useEffect(() => {
    if (isOpen && fromStoreId) {
      loadAvailableProducts()
      // Resetear formulario al abrir
      setItems([])
      setToStoreId('')
      setDescription('')
      setGlobalProductSearch('')
      setStockAlerts({})
    }
  }, [isOpen, fromStoreId])

  const loadAvailableProducts = async () => {
    if (!fromStoreId) return

    setLoadingProducts(true)
    try {
      // Obtener TODOS los productos de la tienda principal (sin límite)
      // Usamos getAllProductsLegacy que carga todos los productos en lotes
      const allProducts = await ProductsService.getAllProductsLegacy()
      
      // Cargar TODOS los productos, no solo los que tienen stock
      // El usuario puede buscar cualquier producto, incluso si no tiene stock
      setAvailableProducts(allProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos disponibles')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddItem = () => {
    // Verificar si ya hay un item vacío
    const hasEmptyItem = items.some(item => !item.productId || item.quantity === 0)
    if (hasEmptyItem) {
      toast.info('Completa el producto actual antes de agregar otro')
      return
    }
    setItems([...items, { 
      productId: '', 
      productName: '', 
      productReference: '',
      fromLocation: 'warehouse',
      quantity: 0 
    }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSelectProductFromSearch = (product: Product) => {
    // Verificar si el producto ya está en la lista
    if (items.some(item => item.productId === product.id)) {
      toast.info('Este producto ya está en la lista')
      return
    }

    // Agregar el producto a la lista
    setItems([...items, {
      productId: product.id,
      productName: product.name || '',
      productReference: product.reference || '',
      fromLocation: 'warehouse',
      quantity: 0
    }])

    // Limpiar el buscador global
    setGlobalProductSearch('')
  }

  const handleItemChange = (index: number, field: keyof TransferItemForm, value: string | number) => {
    const newItems = [...items]
    if (field === 'productId') {
      const product = availableProducts.find(p => p.id === value)
      newItems[index] = {
        ...newItems[index],
        productId: value as string,
        productName: product?.name || '',
        productReference: product?.reference || '',
        fromLocation: newItems[index].fromLocation,
        quantity: newItems[index].quantity
      }
      // Limpiar alerta cuando cambia el producto
      setStockAlerts(prev => {
        const newAlerts = { ...prev }
        delete newAlerts[index]
        return newAlerts
      })
    } else if (field === 'fromLocation') {
      newItems[index] = { ...newItems[index], [field]: value }
      // Limpiar alerta cuando cambia la ubicación
      setStockAlerts(prev => {
        const newAlerts = { ...prev }
        delete newAlerts[index]
        return newAlerts
      })
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setItems(newItems)
  }

  const handleSave = async () => {
    if (!fromStoreId || !toStoreId) {
      toast.error('Debes seleccionar la tienda destino')
      return
    }

    // Filtrar solo los items completos para validar
    const completeItems = items.filter(item => item.productId && item.quantity > 0)
    
    if (completeItems.length === 0) {
      toast.error('Debes agregar al menos un producto con cantidad válida')
      return
    }

    // Validar que todos los items completos tengan stock suficiente
    for (const item of completeItems) {

      const product = availableProducts.find(p => p.id === item.productId)
      if (!product) {
        toast.error(`Producto no encontrado: ${item.productName}`)
        return
      }

      const availableStock = item.fromLocation === 'warehouse' 
        ? (product.stock?.warehouse || 0)
        : (product.stock?.store || 0)

      if (item.quantity > availableStock) {
        toast.error(`No hay suficiente stock en ${item.fromLocation === 'warehouse' ? 'Bodega' : 'Local'} para ${item.productName}. Disponible: ${availableStock}`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Filtrar solo los items completos (con producto y cantidad > 0)
      const completeItems = items.filter(item => item.productId && item.quantity > 0)
      
      if (completeItems.length === 0) {
        toast.error('Debes agregar al menos un producto con cantidad válida')
        setIsSaving(false)
        return
      }

      const transferItems = completeItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productReference: item.productReference,
        quantity: item.quantity,
        fromLocation: item.fromLocation
      }))

      const transfer = await StoreStockTransferService.createTransfer(
        fromStoreId!,
        toStoreId,
        transferItems,
        description || undefined,
        undefined,
        undefined,
        undefined
      )

      if (transfer) {
        toast.success('Transferencia creada exitosamente')
        setItems([])
        setToStoreId('')
        setDescription('')
        setStockAlerts({})
        await loadAvailableProducts() // Recargar productos para actualizar stock
        onSave()
      } else {
        toast.error('Error al crear la transferencia. Verifica que haya stock disponible.')
      }
    } catch (error) {
      toast.error('Error al crear la transferencia')
      console.error('Error creating transfer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getAvailableQuantity = (productId: string, location: 'warehouse' | 'store'): number => {
    const product = availableProducts.find(p => p.id === productId)
    if (!product) return 0
    return location === 'warehouse' 
      ? (product.stock?.warehouse || 0)
      : (product.stock?.store || 0)
  }

  const getUsedQuantity = (productId: string, location: 'warehouse' | 'store'): number => {
    return items
      .filter(item => item.productId === productId && item.fromLocation === location)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  const formatNumber = (value: number): string => {
    return value.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  if (!isOpen) return null

  const destinationStores = stores.filter(s => s.id !== fromStoreId && s.isActive)

  return (
    <div className="fixed inset-0 xl:left-56 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg xl:rounded-xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Nueva Transferencia
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Tienda Destino y Descripción en una fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tienda Destino <span className="text-red-500">*</span>
                </label>
                <Select value={toStoreId} onValueChange={setToStoreId}>
                  <SelectTrigger className="w-full h-10 text-sm">
                    <SelectValue placeholder="Seleccionar tienda destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationStores.map(store => (
                      <SelectItem key={store.id} value={store.id} className="text-sm">
                        {store.name} {store.city && `- ${store.city}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (Opcional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Envío mensual"
                  className="w-full h-10 text-sm"
                />
              </div>
            </div>

            {/* Productos */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Productos a Transferir
                </h3>
              </div>
              <div>
                {loadingProducts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando productos...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Buscador global - siempre visible */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Buscar Producto para Agregar
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Buscar por referencia o nombre..."
                          value={globalProductSearch}
                          onChange={(e) => setGlobalProductSearch(e.target.value)}
                          className="pl-10 h-10 text-sm"
                        />
                      </div>
                      
                      {/* Resultados de búsqueda */}
                      {globalProductSearch && (
                        <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                          {availableProducts
                            .filter(p => {
                              // Filtrar productos ya seleccionados
                              if (items.some(item => item.productId === p.id)) {
                                return false
                              }
                              // Filtrar por término de búsqueda
                              const searchTerm = (globalProductSearch?.trim() || '').toLowerCase()
                              if (searchTerm) {
                                // Buscar en referencia (sin espacios, sin caracteres especiales)
                                const cleanReference = (p.reference || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
                                const cleanSearchTerm = searchTerm.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
                                const matchesReference = cleanReference.includes(cleanSearchTerm) || (p.reference || '').toLowerCase().includes(searchTerm)
                                
                                // Buscar en nombre
                                const matchesName = (p.name || '').toLowerCase().includes(searchTerm)
                                
                                return matchesReference || matchesName
                              }
                              return false
                            })
                            .map(product => {
                              const warehouseStock = product.stock?.warehouse || 0
                              const storeStock = product.stock?.store || 0
                              const totalStock = warehouseStock + storeStock
                              const hasStock = totalStock > 0
                              
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSelectProductFromSearch(product)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                                    !hasStock ? 'opacity-60' : ''
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className={`font-medium ${hasStock ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {product.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Ref: {product.reference}</span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                      <span className={`text-xs ${hasStock ? 'text-gray-600 dark:text-gray-300' : 'text-red-500 dark:text-red-400'}`}>
                                        Bodega: {formatNumber(warehouseStock)} | Local: {formatNumber(storeStock)}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          {availableProducts.filter(p => {
                            if (items.some(item => item.productId === p.id)) return false
                            const searchTerm = (globalProductSearch?.trim() || '').toLowerCase()
                            if (searchTerm) {
                              const cleanReference = (p.reference || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
                              const cleanSearchTerm = searchTerm.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
                              const matchesReference = cleanReference.includes(cleanSearchTerm) || (p.reference || '').toLowerCase().includes(searchTerm)
                              const matchesName = (p.name || '').toLowerCase().includes(searchTerm)
                              return matchesReference || matchesName
                            }
                            return false
                          }).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                              No se encontraron productos con "{globalProductSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lista de productos agregados */}
                    {items.length > 0 && (
                      <div className="space-y-3">
                    {[...items].reverse().map((item, originalIndex) => {
                      // Calcular el índice original para mantener las referencias correctas
                      const index = items.length - 1 - originalIndex
                      const product = availableProducts.find(p => p.id === item.productId)
                      const warehouseStock = product ? (product.stock?.warehouse || 0) : 0
                      const storeStock = product ? (product.stock?.store || 0) : 0
                      const usedWarehouse = item.productId ? getUsedQuantity(item.productId, 'warehouse') : 0
                      const usedStore = item.productId ? getUsedQuantity(item.productId, 'store') : 0
                      const remainingWarehouse = warehouseStock - (usedWarehouse - (item.fromLocation === 'warehouse' ? item.quantity : 0))
                      const remainingStore = storeStock - (usedStore - (item.fromLocation === 'store' ? item.quantity : 0))
                      const availableQty = item.fromLocation === 'warehouse' ? remainingWarehouse : remainingStore
                      const isComplete = item.quantity > 0 && item.productId && item.fromLocation

                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 flex items-start gap-2">
                              {isComplete && (
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900 dark:text-white">
                                  {item.productName || 'Seleccionar producto'}
                                </div>
                                {item.productReference && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Ref: {item.productReference}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Controles cuando hay producto seleccionado */}
                          {item.productId && (
                            <div className="grid grid-cols-3 gap-3">
                              {/* Stock y Selección de Ubicación */}
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Transferir desde
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  {(['warehouse', 'store'] as const).map((location) => {
                                    const isSelected = item.fromLocation === location
                                    const stock = location === 'warehouse' ? warehouseStock : storeStock
                                    const used = location === 'warehouse' ? usedWarehouse : usedStore
                                    const remaining = stock - (used - (isSelected ? item.quantity : 0))
                                    const isDisabled = remaining <= 0 && !isSelected
                                    const Icon = location === 'warehouse' ? Warehouse : StoreIcon

                                    return (
                                      <button
                                        key={location}
                                        type="button"
                                        onClick={() => !isDisabled && handleItemChange(index, 'fromLocation', location)}
                                        disabled={isDisabled}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                                          isDisabled
                                            ? 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                                            : isSelected
                                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <Icon className={`h-4 w-4 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
                                          <span className={`text-sm font-medium ${isSelected ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {location === 'warehouse' ? 'Bodega' : 'Local'}
                                          </span>
                                        </div>
                                        <div className={`text-xs ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                          Stock: {formatNumber(stock)} • Disponible: {formatNumber(remaining)}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                              {/* Cantidad */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Cantidad
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.quantity || ''}
                                  onChange={(e) => {
                                    // Solo permitir números
                                    const value = e.target.value.replace(/[^\d]/g, '')
                                    const qty = value === '' ? 0 : parseInt(value, 10)
                                    
                                    // Validar stock disponible
                                    if (qty > availableQty) {
                                      setStockAlerts(prev => ({
                                        ...prev,
                                        [index]: `Stock insuficiente. Disponible: ${formatNumber(availableQty)}`
                                      }))
                                    } else {
                                      setStockAlerts(prev => {
                                        const newAlerts = { ...prev }
                                        delete newAlerts[index]
                                        return newAlerts
                                      })
                                    }
                                    
                                    handleItemChange(index, 'quantity', qty)
                                  }}
                                  onBlur={(e) => {
                                    // Asegurar que no tenga ceros a la izquierda
                                    const value = e.target.value.replace(/^0+/, '') || '0'
                                    const qty = parseInt(value, 10) || 0
                                    if (qty !== item.quantity) {
                                      handleItemChange(index, 'quantity', qty)
                                    }
                                  }}
                                  disabled={!item.productId || availableQty <= 0}
                                  className="w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />
                                {stockAlerts[index] ? (
                                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{stockAlerts[index]}</span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Max: {formatNumber(availableQty)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen compacto */}
            {items.length > 0 && (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Productos</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{items.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Total Unidades</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatNumber(items.reduce((sum, item) => sum + item.quantity, 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Destino</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {stores.find(s => s.id === toStoreId)?.name || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSaving}
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-gray-400"
            disabled={isSaving || !toStoreId || items.length === 0}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </div>
            ) : (
              'Crear Transferencia'
            )}
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}
