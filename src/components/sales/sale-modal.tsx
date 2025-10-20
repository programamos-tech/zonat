'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Plus, 
  Minus, 
  Search,
  Calculator,
  User,
  Package,
  CreditCard,
  DollarSign,
  CreditCard as CreditCardIcon,
  Building2,
  Shield,
  RefreshCw
} from 'lucide-react'
import { Sale, SaleItem, Product, Client } from '@/types'
import { useClients } from '@/contexts/clients-context'
import { useProducts } from '@/contexts/products-context'
import { ClientModal } from '@/components/clients/client-modal'

interface SaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sale: Omit<Sale, 'id' | 'createdAt'>) => void
}

export function SaleModal({ isOpen, onClose, onSave }: SaleModalProps) {
  const { clients, createClient, getAllClients } = useClients()
  const { products, refreshProducts } = useProducts()
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'transfer' | 'warranty' | 'mixed' | ''>('')
  const [clientSearch, setClientSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [includeTax, setIncludeTax] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('Pendiente') // Número de factura
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [stockAlert, setStockAlert] = useState<{show: boolean, message: string, productId?: string}>({show: false, message: ''})

  // Cargar clientes y productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      getAllClients()
      refreshProducts()
    }
  }, [isOpen, getAllClients, refreshProducts])

  // Debounce para la búsqueda de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients
    return clients.filter(client =>
      client && client.name && client.name.toLowerCase().includes(clientSearch.toLowerCase())
    )
  }, [clients, clientSearch])

  const filteredProducts = useMemo(() => {
    // Mostrar todos los productos activos si no hay búsqueda
    if (!debouncedProductSearch.trim()) {
      return products.filter(product => product && product.status === 'active')
    }
    
    // Buscar en nombre, marca y referencia
    const searchTerm = debouncedProductSearch.toLowerCase().trim()
    return products.filter(product => {
      if (!product || product.status !== 'active') return false
      
      const name = (product.name || '').toLowerCase()
      const brand = (product.brand || '').toLowerCase()
      const reference = (product.reference || '').toLowerCase()
      
      return name.includes(searchTerm) || 
             brand.includes(searchTerm) || 
             reference.includes(searchTerm)
    })
  }, [products, debouncedProductSearch])

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'bg-blue-900/20 text-blue-400 border-blue-700'
      case 'minorista':
        return 'bg-purple-900/20 text-purple-400 border-purple-700'
      case 'consumidor_final':
        return 'bg-green-900/20 text-green-400 border-green-700'
      default:
        return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      case 'credit':
        return <CreditCardIcon className="h-4 w-4" />
      case 'transfer':
        return <Building2 className="h-4 w-4" />
      case 'warranty':
        return <Shield className="h-4 w-4" />
      case 'mixed':
        return <RefreshCw className="h-4 w-4" />
      case '':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Efectivo/Contado'
      case 'credit':
        return 'Crédito'
      case 'transfer':
        return 'Transferencia'
      case 'warranty':
        return 'Garantía'
      case 'mixed':
        return 'Mixto'
      case '':
        return 'Seleccionar método de pago'
      default:
        return 'Seleccionar método de pago'
    }
  }


  // Función para obtener el stock disponible de un producto
  const getAvailableStock = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return 0
    return (product.stock.warehouse || 0) + (product.stock.store || 0)
  }

  // Función para obtener el estado de stock de un producto
  const getStockStatus = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return 'Sin Stock'
    
    const { warehouse, store, total } = product.stock
    
    if (total === 0) {
      return 'Sin Stock'
    }
    
    if (store > 0) {
      if (store >= 10) {
        return 'Disponible Local'
      } else if (store >= 5) {
        return 'Stock Local Bajo'
      } else {
        return 'Stock Local Muy Bajo'
      }
    }
    
    if (warehouse > 0) {
      if (warehouse >= 20) {
        return 'Solo Bodega'
      } else if (warehouse >= 10) {
        return 'Solo Bodega (Bajo)'
      } else {
        return 'Solo Bodega (Muy Bajo)'
      }
    }
    
    return 'Sin Stock'
  }

  // Función para obtener la cantidad ya seleccionada de un producto
  const getSelectedQuantity = (productId: string) => {
    const existingItem = selectedProducts.find(item => item.productId === productId)
    return existingItem ? existingItem.quantity : 0
  }

  // Función para mostrar alerta de stock
  const showStockAlert = (message: string, productId?: string) => {
    setStockAlert({ show: true, message, productId })
  }

  // Función para ocultar alerta de stock
  const hideStockAlert = () => {
    setStockAlert({ show: false, message: '' })
  }

  // Solo considerar productos con cantidad > 0 para cálculos
  const validProducts = selectedProducts.filter(item => item.quantity > 0)
  const subtotal = validProducts.reduce((sum, item) => sum + item.total, 0)
  
  // Calcular descuento
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount
  
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  
  // IVA opcional
  const tax = includeTax ? subtotalAfterDiscount * 0.16 : 0
  const total = subtotalAfterDiscount + tax

  const handleAddProduct = (product: Product) => {
    const availableStock = getAvailableStock(product.id)
    const selectedQuantity = getSelectedQuantity(product.id)
    
    // Verificar si hay stock disponible
    if (availableStock <= 0) {
      showStockAlert('No hay stock disponible para este producto', product.id)
      return
    }
    
    // Verificar si ya se ha seleccionado la cantidad máxima
    if (selectedQuantity >= availableStock) {
      showStockAlert(`Solo hay ${availableStock} unidades disponibles de este producto`, product.id)
      return
    }
    
    const existingItem = selectedProducts.find(item => item.productId === product.id)
    
    if (existingItem) {
      setSelectedProducts(prev => 
        prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      )
    } else {
      const newItem: SaleItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      }
      setSelectedProducts(prev => [...prev, newItem])
    }
    setShowProductDropdown(false)
    setProductSearch('')
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSelectedProducts(prev => prev.filter(item => item.id !== itemId))
      return
    }

    // Encontrar el item para obtener el productId
    const item = selectedProducts.find(item => item.id === itemId)
    if (!item) return

    const availableStock = getAvailableStock(item.productId)
    
    // Verificar que no se exceda el stock disponible
    if (newQuantity > availableStock) {
      showStockAlert(`Solo hay ${availableStock} unidades disponibles de este producto`, item.productId)
      return
    }

    // Si la cantidad es válida, ocultar la alerta
    if (stockAlert.show && stockAlert.productId === item.productId) {
      hideStockAlert()
    }

    setSelectedProducts(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
          : item
      )
    )
  }

  const handleQuantityInputChange = (itemId: string, value: string) => {
    // Solo permitir números (incluyendo 0)
    const numericValue = value.replace(/[^0-9]/g, '')
    const quantity = numericValue === '' ? 0 : parseInt(numericValue, 10)
    
    // Encontrar el item para obtener el productId
    const item = selectedProducts.find(item => item.id === itemId)
    if (!item) return

    const availableStock = getAvailableStock(item.productId)
    
    // Verificar que no se exceda el stock disponible
    if (quantity > availableStock) {
      showStockAlert(`Solo hay ${availableStock} unidades disponibles de este producto`, item.productId)
      return
    }
    
    // Si la cantidad es válida, ocultar la alerta
    if (stockAlert.show && stockAlert.productId === item.productId) {
      hideStockAlert()
    }
    
    // Permitir 0, no eliminar el producto
    setSelectedProducts(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: quantity, total: quantity * item.unitPrice }
          : item
      )
    )
  }

  const handleSave = () => {
    // Validar que hay cliente, productos, método de pago y que todos tengan cantidad > 0
    const validProducts = selectedProducts.filter(item => item.quantity > 0)
    
    if (!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod) return

    const newSale: Omit<Sale, 'id' | 'createdAt'> = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      total,
      subtotal: subtotalAfterDiscount,
      tax,
      discount,
      status: 'completed',
      paymentMethod,
      items: validProducts // Solo incluir productos con cantidad > 0
    }

    // Actualizar el número de factura antes de guardar
    setInvoiceNumber('Generando...')
    
    onSave(newSale)
    handleClose()
  }

  const handleClose = () => {
    setSelectedClient(null)
    setSelectedProducts([])
    setPaymentMethod('')
    setClientSearch('')
    setProductSearch('')
    setDebouncedProductSearch('')
    setShowClientDropdown(false)
    setShowProductDropdown(false)
    setIncludeTax(true)
    setDiscount(0)
    setDiscountType('percentage')
    setInvoiceNumber('Pendiente')
    hideStockAlert()
    onClose()
  }

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await createClient(clientData)
      setSelectedClient(newClient)
      setClientSearch(newClient.name)
      setIsClientModalOpen(false)
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  const handleRemoveClient = () => {
    setSelectedClient(null)
    setClientSearch('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Calculator className="h-6 w-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Venta</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Factura {invoiceNumber}</p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Client and Products */}
            <div className="space-y-6">
              {/* Client Selection */}
              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                    <User className="h-5 w-5 mr-2 text-emerald-500" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Buscar cliente..."
                          value={clientSearch}
                        onChange={(e) => {
                          const value = e.target.value
                          setClientSearch(value)
                          setShowClientDropdown(value.length > 0)
                        }}
                          onFocus={() => setShowClientDropdown(true)}
                          className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-600"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-500">¿No encuentras el cliente?</span>
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/20 rounded-md transition-colors duration-200"
                        title="Crear nuevo cliente"
                      >
                        <User className="h-3 w-3" />
                        <span>Crear</span>
                      </button>
                    </div>
                    
                    {showClientDropdown && (
                      <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto relative z-20">
                        {filteredClients.length === 0 ? (
                          <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No se encontraron clientes
                          </div>
                        ) : (
                          filteredClients.map(client => (
                            <button
                              key={client.id}
                              onClick={() => {
                                setSelectedClient(client)
                                setClientSearch(client.name)
                                setShowClientDropdown(false)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1" title={client.name}>
                                    {client.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight" title={client.email}>
                                    {client.email}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <Badge className={`${getClientTypeColor(client.type)} font-medium text-xs`}>
                                    {client.type === 'mayorista' ? 'Mayorista' : 
                                     client.type === 'minorista' ? 'Minorista' : 'Consumidor Final'}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedClient && (
                    <div className="mt-3 p-3 bg-blue-900/20 rounded-xl border border-blue-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-blue-300">{selectedClient.name}</div>
                          <div className="text-sm text-blue-400 font-semibold">{selectedClient.email}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getClientTypeColor(selectedClient.type)} font-semibold`}>
                            {selectedClient.type === 'mayorista' ? 'Mayorista' : 
                             selectedClient.type === 'minorista' ? 'Minorista' : 'Consumidor Final'}
                          </Badge>
                          <Button
                            onClick={handleRemoveClient}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Selection */}
              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-2 text-emerald-500" />
                      Agregar Productos
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500">
                      {products.filter(p => p.status === 'active').length} disponibles
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar productos por nombre..."
                        value={productSearch}
                        onChange={(e) => {
                          const value = e.target.value
                          setProductSearch(value)
                          setShowProductDropdown(value.length > 0)
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-600 text-sm"
                      />
                    </div>
                    
                    {/* Product Dropdown */}
                    {showProductDropdown && (
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto relative z-20">
                        {filteredProducts.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              {productSearch.trim() ? 'No se encontraron productos' : 'Escribe para buscar productos'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2">
                            {filteredProducts.map(product => (
                              <button
                                key={product.id}
                                onClick={() => handleAddProduct(product)}
                                className="w-full px-3 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {product.brand} • {product.reference}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                                        <span>Bodega: {product.stock.warehouse || 0}</span>
                                        <span>•</span>
                                        <span>Local: {product.stock.store || 0}</span>
                                      </div>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        getStockStatus(product.id) === 'Disponible Local' 
                                          ? 'bg-green-900/20 text-green-400' 
                                          : getStockStatus(product.id).includes('Bodega')
                                          ? 'bg-blue-900/20 text-blue-400'
                                          : getStockStatus(product.id).includes('Bajo')
                                          ? 'bg-yellow-900/20 text-yellow-400'
                                          : 'bg-red-900/20 text-red-400'
                                      }`}>
                                        {getStockStatus(product.id)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 text-right ml-3">
                                    <div className="font-bold text-emerald-400 text-sm">
                                      ${product.price.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">c/u</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Alerta general de stock */}
                  {stockAlert.show && !stockAlert.productId && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
                      <div className="text-xs text-red-400 text-center">
                        {stockAlert.message}
                      </div>
                    </div>
                  )}

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productos Seleccionados</h3>
                        <Badge variant="secondary" className="bg-emerald-900/20 text-emerald-400 border-emerald-700">
                          {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {selectedProducts.map(item => (
                          <div key={item.id} className="bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            {/* Product Info Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{item.productName}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                                  <span>Precio: <span className="font-medium text-emerald-400">${item.unitPrice.toLocaleString()}</span></span>
                                  <span>Stock: <span className="font-medium">{getAvailableStock(item.productId)} unidades</span></span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">${item.total.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                              </div>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-300 font-medium">Cantidad:</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    className="h-8 w-8 p-0 border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <input
                                    type="text"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                    className="w-16 h-8 text-center font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600"
                                    min="1"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    className="h-8 w-8 p-0 border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Remove Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, 0)}
                                className="h-8 px-3 text-red-400 border-red-500 hover:bg-red-900/20 hover:text-red-300"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Quitar
                              </Button>
                            </div>
                            
                            {/* Stock Alert */}
                            {stockAlert.show && stockAlert.productId === item.productId && (
                              <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
                                <div className="text-xs text-red-400 text-center">
                                  {stockAlert.message}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment and Summary */}
            <div className="space-y-6">
              {/* Payment Method */}
              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                    <CreditCard className="h-5 w-5 mr-2 text-emerald-500" />
                    Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Selector de Método de Pago */}
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 appearance-none cursor-pointer text-gray-900 dark:text-white font-medium"
                      >
                        <option value="" className="bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-400">Seleccionar método de pago</option>
                        <option value="cash" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Efectivo/Contado</option>
                        <option value="credit" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Crédito</option>
                        <option value="transfer" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Transferencia</option>
                        <option value="warranty" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Garantía</option>
                        <option value="mixed" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Mixto</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Resumen de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Subtotal:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${subtotal.toLocaleString()}</span>
                    </div>

                    {/* Descuento */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Descuento:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white font-medium bg-white dark:bg-gray-600"
                            min="0"
                            step={discountType === 'percentage' ? '0.1' : '1'}
                            placeholder="0"
                          />
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white font-medium bg-white dark:bg-gray-600"
                          >
                            <option value="percentage" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">%</option>
                            <option value="amount" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">$</option>
                          </select>
                        </div>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Descuento aplicado:</span>
                          <span className="font-medium text-red-500 dark:text-red-400">-${discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtotal después del descuento */}
                    {discountAmount > 0 && (
                      <div className="flex justify-between border-t border-gray-600 pt-2">
                        <span className="text-gray-300 font-medium">Subtotal con descuento:</span>
                        <span className="font-semibold text-white">${subtotalAfterDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* IVA */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">IVA (16%):</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={includeTax}
                            onChange={(e) => setIncludeTax(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Incluir IVA</span>
                        </div>
                      </div>
                      {includeTax && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">IVA calculado:</span>
                          <span className="font-medium text-gray-900 dark:text-white">${tax.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">${total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-8 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium px-6 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 shadow-md disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
          >
            Crear Venta
          </Button>
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleCreateClient}
        onUpdate={() => {}}
        onDelete={() => {}}
        onToggleStatus={() => {}}
        categories={[]}
        client={null}
        isEdit={false}
      />
    </div>
  )
}
