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
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Sale, SaleItem, Product, Client, SalePayment } from '@/types'
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
  const { products, refreshProducts, searchProducts } = useProducts()
  
  // Debug: Log products when modal opens
  useEffect(() => {
    if (isOpen) {

    }
  }, [isOpen, products])
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed' | ''>('')
  const [clientSearch, setClientSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [includeTax, setIncludeTax] = useState(true)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [totalDiscountType, setTotalDiscountType] = useState<'percentage' | 'amount'>('percentage')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('Pendiente') // Número de factura
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [stockAlert, setStockAlert] = useState<{show: boolean, message: string, productId?: string}>({show: false, message: ''})
  
  // Estados para pagos mixtos
  const [mixedPayments, setMixedPayments] = useState<SalePayment[]>([])
  const [showMixedPayments, setShowMixedPayments] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Cargar clientes y productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      getAllClients()
      refreshProducts()
    }
  }, [isOpen, getAllClients, refreshProducts])

  // Manejar cambio de método de pago
  useEffect(() => {
    if (paymentMethod === 'mixed') {
      setShowMixedPayments(true)
      // Inicializar con efectivo y transferencia
      setMixedPayments([
        { id: '', saleId: '', paymentType: 'cash', amount: 0, reference: '', notes: '', createdAt: '', updatedAt: '' },
        { id: '', saleId: '', paymentType: 'transfer', amount: 0, reference: '', notes: '', createdAt: '', updatedAt: '' }
      ])
    } else {
      setShowMixedPayments(false)
      setMixedPayments([])
    }
  }, [paymentMethod])

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

  const [searchedProducts, setSearchedProducts] = useState<Product[]>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  // Buscar productos cuando el usuario escriba
  useEffect(() => {
    let cancelled = false
    
    const performSearch = async () => {
      if (debouncedProductSearch.trim().length >= 2) {
        setIsSearchingProducts(true)
        try {
          const results = await searchProducts(debouncedProductSearch)
          if (!cancelled) {
            setSearchedProducts(results)
          }
        } catch (error) {
      // Error silencioso en producción
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

  const filteredProducts = useMemo(() => {
    // Si no hay búsqueda, mostrar solo los primeros 5 productos como sugerencias
    if (!debouncedProductSearch.trim()) {
      const activeProducts = products.filter(product => product && product.status === 'active')
      return activeProducts.slice(0, 5)
    }
    
    // Si estamos buscando y aún no hay resultados, mostrar vacío
    if (debouncedProductSearch.trim().length >= 2 && isSearchingProducts) {
      return []
    }
    
    // Si hay búsqueda y tenemos resultados buscados, usar esos productos
    if (debouncedProductSearch.trim().length >= 2 && searchedProducts.length > 0) {
      return searchedProducts
    }
    
    // Si hay búsqueda pero no hay resultados buscados y no estamos buscando, usar productos locales
    const searchTerm = debouncedProductSearch.toLowerCase().trim()
    const matchingProducts = products.filter(product => {
      if (!product || product.status !== 'active') return false
      
      const name = (product.name || '').toLowerCase()
      const brand = (product.brand || '').toLowerCase()
      const reference = (product.reference || '').toLowerCase()
      
      return name.includes(searchTerm) || 
             brand.includes(searchTerm) || 
             reference.includes(searchTerm)
    })
    
    // Priorizar resultados: primero por referencia exacta, luego por referencia que empieza con, luego nombre que empieza con, luego el resto
    return matchingProducts.sort((a, b) => {
      const searchTermLower = searchTerm.toLowerCase()
      const aRef = (a.reference || '').toLowerCase()
      const bRef = (b.reference || '').toLowerCase()
      const aName = (a.name || '').toLowerCase()
      const bName = (b.name || '').toLowerCase()
      
      // Referencia exacta primero
      if (aRef === searchTermLower && bRef !== searchTermLower) return -1
      if (aRef !== searchTermLower && bRef === searchTermLower) return 1
      
      // Referencia que empieza con el término
      if (aRef.startsWith(searchTermLower) && !bRef.startsWith(searchTermLower)) return -1
      if (!aRef.startsWith(searchTermLower) && bRef.startsWith(searchTermLower)) return 1
      
      // Nombre que empieza con el término
      if (aName.startsWith(searchTermLower) && !bName.startsWith(searchTermLower)) return -1
      if (!aName.startsWith(searchTermLower) && bName.startsWith(searchTermLower)) return 1
      
      // Ordenar por referencia que contiene el término
      if (aRef.includes(searchTermLower) && !bRef.includes(searchTermLower)) return -1
      if (!aRef.includes(searchTermLower) && bRef.includes(searchTermLower)) return 1
      
      return 0
    })
  }, [products, debouncedProductSearch, searchedProducts, isSearchingProducts])

  // Debug: Log filtered products
  useEffect(() => {

    if (filteredProducts.length > 0) {

    }
  }, [filteredProducts])

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
      case 'minorista':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600'
      case 'consumidor_final':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      case 'transfer':
        return <Building2 className="h-4 w-4" />
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
      case 'transfer':
        return 'Transferencia'
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

  // Funciones para manejar pagos mixtos
  const updateMixedPayment = (index: number, field: keyof SalePayment, value: any) => {
    const updatedPayments = [...mixedPayments]
    updatedPayments[index] = { ...updatedPayments[index], [field]: value }
    setMixedPayments(updatedPayments)
    // Limpiar error cuando el usuario actualiza los pagos
    if (paymentError) {
      setPaymentError('')
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Efectivo'
      case 'transfer': return 'Transferencia'
      default: return type
    }
  }

  const getTotalMixedPayments = () => {
    return mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  }

  const getRemainingAmount = () => {
    // Si no hay productos seleccionados, no hay pago que completar
    if (validProducts.length === 0) {
      return total // Devolver el total (que será 0) para que no muestre "Pago completo"
    }
    return total - getTotalMixedPayments()
  }

  // Solo considerar productos con cantidad > 0 para cálculos
  const validProducts = selectedProducts.filter(item => item.quantity > 0)
  
  // Calcular subtotal (suma de precios sin descuentos por producto)
  const subtotal = validProducts.reduce((sum, item) => {
    const baseTotal = item.quantity * item.unitPrice
    const itemDiscountAmount = item.discountType === 'percentage' 
      ? (baseTotal * (item.discount || 0)) / 100 
      : (item.discount || 0)
    return sum + Math.max(0, baseTotal - itemDiscountAmount)
  }, 0)
  
  // Calcular descuento por total de venta
  const totalDiscountAmount = totalDiscountType === 'percentage' 
    ? (subtotal * totalDiscount) / 100 
    : totalDiscount
  
  const subtotalAfterTotalDiscount = Math.max(0, subtotal - totalDiscountAmount)
  
  // IVA automático sobre el total (19% en Colombia)
  const tax = includeTax ? subtotalAfterTotalDiscount * 0.19 : 0
  const total = subtotalAfterTotalDiscount + tax

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
        prev.map(item => {
          if (item.productId === product.id) {
            const updatedItem = { ...item, quantity: item.quantity + 1 }
            // Recalcular total con descuento (sin IVA por producto)
            const baseTotal = updatedItem.quantity * updatedItem.unitPrice
            const discountAmount = updatedItem.discountType === 'percentage' 
              ? (baseTotal * (updatedItem.discount || 0)) / 100 
              : (updatedItem.discount || 0)
            updatedItem.total = Math.max(0, baseTotal - discountAmount)
            return updatedItem
          }
          return item
        })
      )
    } else {
      const newItem: SaleItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'amount',
        tax: 0,
        total: product.price
      }
      setSelectedProducts(prev => [...prev, newItem])
    }
    setShowProductDropdown(false)
    setProductSearch('')
  }

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return

    setSelectedProducts(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, unitPrice: newPrice }
          // Recalcular total con descuento
          const baseTotal = updatedItem.quantity * newPrice
          const discountAmount = updatedItem.discountType === 'percentage' 
            ? (baseTotal * (updatedItem.discount || 0)) / 100 
            : (updatedItem.discount || 0)
          updatedItem.total = Math.max(0, baseTotal - discountAmount)
          return updatedItem
        }
        return item
      })
    )
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
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, quantity: newQuantity }
          // Recalcular total con descuento (sin IVA por producto)
          const baseTotal = newQuantity * updatedItem.unitPrice
          const discountAmount = updatedItem.discountType === 'percentage' 
            ? (baseTotal * (updatedItem.discount || 0)) / 100 
            : (updatedItem.discount || 0)
          updatedItem.total = Math.max(0, baseTotal - discountAmount)
          return updatedItem
        }
        return item
      })
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
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, quantity: quantity }
          // Recalcular total con descuento (sin IVA por producto)
          const baseTotal = quantity * updatedItem.unitPrice
          const discountAmount = updatedItem.discountType === 'percentage' 
            ? (baseTotal * (updatedItem.discount || 0)) / 100 
            : (updatedItem.discount || 0)
          updatedItem.total = Math.max(0, baseTotal - discountAmount)
          return updatedItem
        }
        return item
      })
    )
  }

  const handleUpdateDiscount = (itemId: string, discount: number, discountType: 'percentage' | 'amount') => {
    setSelectedProducts(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, discount, discountType }
          // Recalcular total con descuento (sin IVA por producto)
          const baseTotal = updatedItem.quantity * updatedItem.unitPrice
          const discountAmount = discountType === 'percentage' 
            ? (baseTotal * discount) / 100 
            : discount
          updatedItem.total = Math.max(0, baseTotal - discountAmount)
          return updatedItem
        }
        return item
      })
    )
  }

  const handleSave = () => {
    // Validar que hay cliente, productos, método de pago y que todos tengan cantidad > 0
    const validProducts = selectedProducts.filter(item => item.quantity > 0)
    
    if (!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod) return

    // Validar pagos mixtos si es necesario
    if (paymentMethod === 'mixed') {
      const totalMixedPayments = getTotalMixedPayments()
      if (Math.abs(totalMixedPayments - total) > 0.01) {
        setPaymentError(`Los pagos mixtos ($${totalMixedPayments.toLocaleString()}) deben sumar exactamente el total ($${total.toLocaleString()})`)
        return
      }
    }

    const newSale: Omit<Sale, 'id' | 'createdAt'> = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      total: total,
      subtotal: subtotalAfterTotalDiscount,
      tax: tax,
      discount: totalDiscount,
      discountType: totalDiscountType,
      status: 'completed',
      paymentMethod,
      payments: paymentMethod === 'mixed' ? mixedPayments : undefined,
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
    setTotalDiscount(0)
    setTotalDiscountType('percentage')
    setInvoiceNumber('Pendiente')
    setMixedPayments([])
    setShowMixedPayments(false)
    setPaymentError('')
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
      // Error silencioso en producción
    }
  }

  const handleRemoveClient = () => {
    setSelectedClient(null)
    setClientSearch('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 md:left-64 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:pl-6 md:pr-4">
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-auto md:max-w-7xl max-h-[92vh] md:max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center space-x-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Venta</h2>
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

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 pb-32 md:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column - Client and Products */}
            <div className="space-y-6">
              {/* Client Selection */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
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
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white">{selectedClient.name}</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{selectedClient.email}</div>
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
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
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
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Agregar Productos
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500">
                      {products.filter(p => p.status === 'active').length} disponibles
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o referencia..."
                        value={productSearch}
                        onChange={(e) => {
                          const value = e.target.value
                          setProductSearch(value)
                          setShowProductDropdown(true) // Siempre mostrar dropdown
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onClick={() => setShowProductDropdown(true)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-600 text-sm"
                      />
                    </div>
                    
                    {/* Debug: Mostrar siempre el estado */}
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: {filteredProducts.length} productos disponibles
                    </div>
                    
                    {/* Product Dropdown */}
                    {showProductDropdown && (
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto relative z-50 mt-2">
                        {/* Botón para cerrar */}
                        <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => setShowProductDropdown(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                          >
                            ✕ Cerrar
                          </button>
                        </div>
                        {isSearchingProducts ? (
                          <div className="px-4 py-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              Buscando productos...
                            </div>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              {productSearch.trim() ? 'No se encontraron productos' : 'No hay productos disponibles'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2">
                            {!productSearch.trim() && (
                              <div className="px-2 py-1 mb-2">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Productos sugeridos
                                </div>
                              </div>
                            )}
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
                                          ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600' 
                                          : getStockStatus(product.id).includes('Bodega')
                                          ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
                                          : getStockStatus(product.id).includes('Bajo')
                                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
                                          : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
                                      }`}>
                                        {getStockStatus(product.id)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 text-right ml-3">
                                    <div className="font-bold text-gray-900 dark:text-white text-sm">
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
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <div className="text-sm font-medium text-red-800 dark:text-red-200">
                          {stockAlert.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productos Seleccionados</h3>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600">
                          {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {selectedProducts.map(item => (
                          <div key={item.id} className="bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            {/* Product Info Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{item.productName}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                                  <span>Precio base: <span className="font-medium text-gray-500 dark:text-gray-400">${products.find(p => p.id === item.productId)?.price.toLocaleString() || 0}</span></span>
                                  <span>Stock: <span className="font-medium">{getAvailableStock(item.productId)} unidades</span></span>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                    Precio de venta:
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unitPrice || ''}
                                    onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-32 h-8 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 px-2"
                                    min="0"
                                    step="100"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">${item.total.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                              </div>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mb-2">
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
                                className="h-8 px-3 text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:hover:border-gray-500 transition-all duration-200"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Quitar
                              </Button>
                            </div>

                            {/* Discount Control */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
                                Descuento por producto
                              </label>
                              <div className="flex space-x-1">
                                <input
                                  type="number"
                                  value={item.discount || ''}
                                  onChange={(e) => handleUpdateDiscount(item.id, parseFloat(e.target.value) || 0, item.discountType || 'amount')}
                                  className="flex-1 h-8 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 px-2"
                                  min="0"
                                  step="0.01"
                                  placeholder="0"
                                />
                                <select
                                  value={item.discountType || 'amount'}
                                  onChange={(e) => handleUpdateDiscount(item.id, item.discount || 0, e.target.value as 'percentage' | 'amount')}
                                  className="h-8 text-xs border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white px-2"
                                >
                                  <option value="amount">$</option>
                                  <option value="percentage">%</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Stock Alert */}
                            {stockAlert.show && stockAlert.productId === item.productId && (
                              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                                    {stockAlert.message}
                                  </div>
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
            <div className="space-y-4">
              {/* Payment Method */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Selector de Método de Pago */}
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 appearance-none cursor-pointer text-gray-900 dark:text-white font-medium"
                      >
                        <option value="" className="bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-400">Seleccionar método de pago</option>
                        <option value="cash" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Efectivo/Contado</option>
                        <option value="transfer" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Transferencia</option>
                        <option value="mixed" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">Mixto</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Sección de Pagos Mixtos */}
                    {showMixedPayments && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Desglose de Pago Mixto
                        </h4>
                        <div className="space-y-3">
                          {mixedPayments.map((payment, index) => (
                            <div key={index} className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {getPaymentTypeLabel(payment.paymentType)}
                                </label>
                                <input
                                  type="text"
                                  value={payment.amount ? payment.amount.toLocaleString('es-CO') : ''}
                                  onChange={(e) => {
                                    // Remover todos los caracteres no numéricos excepto puntos
                                    const cleanValue = e.target.value.replace(/[^\d]/g, '')
                                    const numericValue = cleanValue ? parseInt(cleanValue, 10) : 0
                                    updateMixedPayment(index, 'amount', numericValue)
                                  }}
                                  placeholder="0"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                            </div>
                          ))}
                          
                          {/* Campo de observaciones generales */}
                          <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Observaciones Generales
                            </label>
                            <input
                              type="text"
                              value={mixedPayments[0]?.notes || ''}
                              onChange={(e) => {
                                // Actualizar las notas en todos los pagos
                                const updatedPayments = mixedPayments.map(payment => ({
                                  ...payment,
                                  notes: e.target.value
                                }))
                                setMixedPayments(updatedPayments)
                              }}
                              placeholder="Notas sobre el pago mixto..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          
                          {/* Resumen de pagos mixtos */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Total asignado:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${getTotalMixedPayments().toLocaleString('es-CO')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Total de la venta:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${total.toLocaleString('es-CO')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                              <span className={getRemainingAmount() === 0 && validProducts.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {getRemainingAmount() === 0 && validProducts.length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Pago completo</span>
                                  </div>
                                ) : validProducts.length === 0 ? (
                                  <span className="text-gray-500 dark:text-gray-400">Agregue productos para calcular el pago</span>
                                ) : (
                                  `Faltante: $${getRemainingAmount().toLocaleString('es-CO')}`
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alerta de error de pagos mixtos */}
                    {paymentError && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-red-700 dark:text-red-300">{paymentError}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                    Resumen de Venta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Subtotal */}
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Subtotal:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${subtotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Descuento por total */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Descuento por total:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={totalDiscount || ''}
                            onChange={(e) => setTotalDiscount(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white font-medium bg-white dark:bg-gray-600"
                            min="0"
                            step={totalDiscountType === 'percentage' ? '0.1' : '1'}
                            placeholder="0"
                          />
                          <select
                            value={totalDiscountType}
                            onChange={(e) => setTotalDiscountType(e.target.value as 'percentage' | 'amount')}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white font-medium bg-white dark:bg-gray-600"
                          >
                            <option value="percentage" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">%</option>
                            <option value="amount" className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">$</option>
                          </select>
                        </div>
                      </div>
                      {totalDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Descuento aplicado:</span>
                          <span className="font-medium text-red-500 dark:text-red-400">-${totalDiscountAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtotal después del descuento */}
                    {totalDiscountAmount > 0 && (
                      <div className="flex justify-between border-t border-gray-600 pt-2">
                        <span className="text-gray-300 font-medium">Subtotal con descuento:</span>
                        <span className="font-semibold text-white">${subtotalAfterTotalDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* IVA */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">IVA (19%):</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={includeTax}
                            onChange={(e) => setIncludeTax(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Incluir IVA
                          </span>
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
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 z-[60] flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-lg" style={{ paddingBottom: 'calc(max(0px, env(safe-area-inset-bottom)) + 4px)' }}>
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod}
            className="font-medium px-4 py-2 shadow-md disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
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
