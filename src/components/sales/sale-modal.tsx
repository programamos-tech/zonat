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
import { ProductsService } from '@/lib/products-service'
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed' | ''>('')
  const [clientSearch, setClientSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [includeTax, setIncludeTax] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // Solo ejecutar cuando se abre/cierra el modal

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
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1)
  const [productCache, setProductCache] = useState<Record<string, Product>>({})

  const updateProductCache = useCallback((items: Product[]) => {
    if (!items || items.length === 0) return
    setProductCache(prev => {
      const updated = { ...prev }
      items.forEach(product => {
        if (product && product.id) {
          updated[product.id] = product
        }
      })
      return updated
    })
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      updateProductCache(products)
    }
  }, [products, updateProductCache])

  // Buscar productos cuando el usuario escriba
  useEffect(() => {
    let cancelled = false
    
    const performSearch = async () => {
      if (debouncedProductSearch.trim().length >= 2) {
        setIsSearchingProducts(true)
        try {
          const results = await ProductsService.searchProducts(debouncedProductSearch)
          if (!cancelled) {
            updateProductCache(results)
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


  // Scroll automático cuando se selecciona un producto con las flechas
  useEffect(() => {
    if (selectedProductIndex >= 0 && showProductDropdown) {
      const element = document.getElementById(`product-item-${selectedProductIndex}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedProductIndex, showProductDropdown])

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
      case 'minorista':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600'
      case 'consumidor_final':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600'
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
  const findProductById = useCallback((productId: string) => {
    return productCache[productId] || products.find(p => p.id === productId)
  }, [productCache, products])

  const getAvailableStock = (productId: string) => {
    const product = findProductById(productId)
    if (!product) return 0
    return (product.stock.warehouse || 0) + (product.stock.store || 0)
  }

  // Función para obtener el estado de stock de un producto
  const getStockStatus = (productId: string) => {
    const product = findProductById(productId)
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

  // Solo considerar productos con cantidad > 0 para cálculos
  const validProducts = selectedProducts.filter(item => item.quantity > 0)

  const orderedSelectedProducts = useMemo(() => {
    if (selectedProducts.length === 0) return []
    return [...selectedProducts].sort((a, b) => {
      const aTime = a.addedAt ?? Number(a.id) || 0
      const bTime = b.addedAt ?? Number(b.id) || 0
      return bTime - aTime
    })
  }, [selectedProducts])

  const orderedValidProducts = useMemo(
    () => orderedSelectedProducts.filter(item => item.quantity > 0),
    [orderedSelectedProducts]
  )
  
  // Calcular subtotal (suma de precios)
  const subtotal = validProducts.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)
  
  // IVA automático sobre el total (19% en Colombia)
  const tax = includeTax ? subtotal * 0.19 : 0
  const total = subtotal + tax

  const getRemainingAmount = () => {
    // Si no hay productos seleccionados, no hay pago que completar
    if (validProducts.length === 0) {
      return Math.round(total) // Devolver el total redondeado (que será 0) para que no muestre "Pago completo"
    }
    // Redondear el faltante a números enteros (sin centavos)
    return Math.round(total - getTotalMixedPayments())
  }

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
      const updatedTimestamp = Date.now()
      setSelectedProducts(prev => 
        prev.map(item => {
          if (item.productId === product.id) {
            const updatedItem = { ...item, quantity: item.quantity + 1, addedAt: updatedTimestamp }
            // Recalcular total
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
            return updatedItem
          }
          return item
        })
      )
    } else {
      const now = Date.now()
      const newItem: SaleItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productReferenceCode: product.reference,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'amount',
        tax: 0,
        total: product.price,
        addedAt: now
      }
      setSelectedProducts(prev => [newItem, ...prev])
    }
    setShowProductDropdown(false)
    setProductSearch('')
  }

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return

    // Permitir escribir libremente, la validación se hará al perder el foco
    setSelectedProducts(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, unitPrice: newPrice }
          // Recalcular total
          updatedItem.total = updatedItem.quantity * newPrice
          return updatedItem
        }
        return item
      })
    )
  }

  const handlePriceBlur = (itemId: string) => {
    // Validar solo cuando el campo pierde el foco
    const item = selectedProducts.find(i => i.id === itemId)
    if (item) {
      const product = findProductById(item.productId)
      const productCost = product?.cost || 0
      
      // Si el precio es menor al costo, mostrar alerta y ajustar al costo mínimo
      if (item.unitPrice < productCost) {
        showStockAlert(`El precio debe ser mayor.`, item.productId)
        // Ajustar al costo mínimo
        handleUpdatePrice(itemId, productCost)
      }
    }
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
          // Recalcular total
          updatedItem.total = newQuantity * updatedItem.unitPrice
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
          // Recalcular total
          updatedItem.total = quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      })
    )
  }


  const handleSave = (isDraft: boolean = false) => {
    // Validar que hay cliente, productos, método de pago y que todos tengan cantidad > 0
    if (!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod) return

    // Validar que todos los precios de venta sean >= costo base
    const invalidProducts: string[] = []
    validProducts.forEach(item => {
      const product = findProductById(item.productId)
      const productCost = product?.cost || 0
      if (item.unitPrice < productCost) {
        invalidProducts.push(`${item.productName} (Costo: $${productCost.toLocaleString('es-CO')})`)
      }
    })

    if (invalidProducts.length > 0) {
      showStockAlert(`El precio debe ser mayor.`, undefined)
      return
    }

    // Si NO es borrador, validar pagos mixtos si es necesario
    if (!isDraft && paymentMethod === 'mixed') {
      const totalMixedPayments = getTotalMixedPayments()
      const roundedTotal = Math.round(total)
      const roundedPayments = Math.round(totalMixedPayments)
      
      if (roundedPayments !== roundedTotal) {
        const faltante = Math.abs(roundedTotal - roundedPayments)
        setPaymentError(`El total ingresado ($${roundedPayments.toLocaleString('es-CO', { maximumFractionDigits: 0 })}) no coincide con el total de la venta ($${roundedTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}). Falta: $${faltante.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`)
        return
      }
    }

    const saleItems = validProducts.map(({ addedAt, ...item }) => item)

    const newSale: Omit<Sale, 'id' | 'createdAt'> = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      total: total,
      subtotal: subtotal,
      tax: tax,
      discount: 0,
      discountType: 'amount',
      status: isDraft ? 'draft' : 'completed',
      paymentMethod,
      payments: paymentMethod === 'mixed' ? mixedPayments : undefined,
      items: saleItems // Solo incluir productos con cantidad > 0
    }

    // Actualizar el número de factura antes de guardar
    setInvoiceNumber('Generando...')
    
    onSave(newSale)
    handleClose()
  }

  const handleSaveAsDraft = () => {
    // Solo permitir borrador si es crédito
    if (paymentMethod !== 'credit') return
    handleSave(true)
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
    setIncludeTax(false)
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
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ fontFamily: 'var(--font-inter)' }}>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)] overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header - Compacto */}
        <div className="flex items-center justify-between p-2 md:p-3 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 md:h-6 md:w-6" style={{ color: 'var(--sidebar-orange)' }} />
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Nueva Venta</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Factura {invoiceNumber}</p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#1F1F1F] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-3 bg-white dark:bg-[#1A1A1A]">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-2 md:gap-3">
            {/* Left Column - Client and Products (3/5 del ancho) */}
            <div className="xl:col-span-3 space-y-2 md:space-y-3">
              {/* Client Selection - Compacto */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader className="pb-2 p-2 md:p-3">
                  <CardTitle className="flex items-center text-sm md:text-base text-gray-900 dark:text-white">
                    <User className="h-4 w-4 mr-1.5" style={{ color: 'var(--sidebar-orange)' }} />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-3">
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
                          className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-xl placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A]"
                          style={{ fontFamily: 'var(--font-inter)' }}
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
                    
                    {/* Opción de crear cliente eliminada en el modal de ventas */}
                    
                    {showClientDropdown && (
                      <div className="mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg shadow-lg max-h-48 overflow-y-auto relative z-20">
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
                    <div className="mt-3 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)', borderColor: 'rgba(92, 156, 124, 0.3)' }}>
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

              {/* Product Selection - Compacto */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-2 shadow-lg" style={{ borderColor: 'rgba(92, 156, 124, 0.3)' }}>
                <CardHeader className="pb-2 p-2 md:p-3">
                  <CardTitle className="flex items-center justify-between text-sm md:text-base text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1.5" style={{ color: 'var(--sidebar-orange)' }} />
                      Agregar Productos
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-3">
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
                          setSelectedProductIndex(-1) // Resetear índice al escribir
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onClick={() => setShowProductDropdown(true)}
                        onKeyDown={(e) => {
                          // Permitir navegación solo si hay productos y el dropdown está visible
                          if (e.key === 'ArrowDown' && showProductDropdown && filteredProducts.length > 0) {
                            e.preventDefault()
                            setShowProductDropdown(true)
                            setSelectedProductIndex(prev => 
                              prev < filteredProducts.length - 1 ? prev + 1 : 0
                            )
                          } else if (e.key === 'ArrowUp' && showProductDropdown && filteredProducts.length > 0) {
                            e.preventDefault()
                            setSelectedProductIndex(prev => 
                              prev > 0 ? prev - 1 : filteredProducts.length - 1
                            )
                          } else if (e.key === 'Enter' && selectedProductIndex >= 0 && selectedProductIndex < filteredProducts.length) {
                            e.preventDefault()
                            handleAddProduct(filteredProducts[selectedProductIndex])
                            setProductSearch('')
                            setSelectedProductIndex(-1)
                            setShowProductDropdown(false)
                          } else if (e.key === 'Escape') {
                            setShowProductDropdown(false)
                            setSelectedProductIndex(-1)
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-xl placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A] text-sm"
                        style={{ fontFamily: 'var(--font-inter)' }}
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
                    
                    {/* Product Dropdown - Más grande y prominente */}
                    {showProductDropdown && (
                      <div 
                        id="product-dropdown"
                        className="bg-white dark:bg-[#1A1A1A] border-2 border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-xl shadow-xl max-h-96 md:max-h-[500px] overflow-y-auto relative z-50 mt-3"
                      >
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
                          <div className="px-4 py-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              Buscando productos...
                            </div>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="px-4 py-4 text-center">
                            <Package className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {productSearch.trim() ? 'No se encontraron productos' : 'No hay productos disponibles'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-1.5">
                            {!productSearch.trim() && (
                              <div className="px-2 py-1 mb-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Productos sugeridos
                                </div>
                              </div>
                            )}
                            <div className="space-y-0.5">
                              {filteredProducts.map((product, index) => (
                                <button
                                  key={product.id}
                                  id={`product-item-${index}`}
                                  onClick={() => {
                                    handleAddProduct(product)
                                    setProductSearch('')
                                    setSelectedProductIndex(-1)
                                    setShowProductDropdown(false)
                                  }}
                                  onMouseEnter={() => setSelectedProductIndex(index)}
                                  className={`w-full px-2.5 py-1.5 text-left rounded transition-colors group ${
                                    selectedProductIndex === index
                                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-500 dark:border-green-600'
                                      : 'hover:bg-gray-100 dark:hover:bg-[#1F1F1F] border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm mb-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors truncate" title={product.name}>
                                        {product.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                        {product.brand && <span>{product.brand} • </span>}
                                        <span>Ref: {product.reference}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        {(() => {
                                          const { warehouse, store, total } = product.stock
                                          const isAvailable = total > 0
                                          
                                          return (
                                            <>
                                              <span className="text-gray-500 dark:text-gray-400">
                                                Stock: <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span>
                                              </span>
                                              <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                isAvailable
                                                  ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600' 
                                                  : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
                                              }`}>
                                                {isAvailable ? 'Disponible' : 'Sin Stock'}
                                              </div>
                                            </>
                                          )
                                        })()}
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right ml-2">
                                      <div className="font-bold text-gray-900 dark:text-white text-xs md:text-sm">
                                        ${product.price.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-500">c/u</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
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
                  {orderedSelectedProducts.length > 0 && (
                    <div className="mt-3 md:mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Productos Seleccionados</h3>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600 text-xs">
                          {orderedSelectedProducts.length} producto{orderedSelectedProducts.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                        {orderedSelectedProducts.map(item => (
                          <div key={item.id} className="bg-gray-100 dark:bg-[#1F1F1F] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-2">
                            {/* Product Info Header - Compacto */}
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex-1 min-w-0 pr-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm mb-0.5 truncate" title={item.productName}>{item.productName}</h4>
                                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 mb-1">
                                  <span>Stock: <span className="font-medium">{getAvailableStock(item.productId)}</span></span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                    Precio:
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unitPrice || ''}
                                    onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                                    onBlur={() => handlePriceBlur(item.id)}
                                    className={`w-24 h-7 text-xs text-gray-900 dark:text-white border rounded bg-white dark:bg-[#1A1A1A] px-1.5 ${
                                      item.unitPrice && findProductById(item.productId)?.cost && item.unitPrice < (findProductById(item.productId)?.cost || 0)
                                        ? 'border-red-500 dark:border-red-500'
                                        : 'border-gray-300 dark:border-[rgba(255,255,255,0.06)]'
                                    }`}
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                    min={findProductById(item.productId)?.cost || 0}
                                    step="100"
                                    placeholder="0"
                                    onFocus={(e) => {
                                      if (!item.unitPrice || (findProductById(item.productId)?.cost && item.unitPrice >= (findProductById(item.productId)?.cost || 0))) {
                                        e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (!item.unitPrice || (findProductById(item.productId)?.cost && item.unitPrice >= (findProductById(item.productId)?.cost || 0))) {
                                        e.currentTarget.style.borderColor = ''
                                        e.currentTarget.style.boxShadow = ''
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm md:text-base font-bold text-gray-900 dark:text-white">${item.total.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                              </div>
                            </div>
                            
                            {/* Quantity Controls - Compacto */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cantidad:</span>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    className="h-7 w-7 p-0 border border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-transparent"
                                    style={{ color: 'var(--sidebar-orange)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                                      e.currentTarget.style.backgroundColor = 'rgba(92, 156, 124, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = ''
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </Button>
                                  <input
                                    type="text"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                    className="w-12 h-7 text-xs text-center font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded bg-white dark:bg-[#1A1A1A]"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                    min="1"
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = ''
                                      e.currentTarget.style.boxShadow = ''
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    className="h-7 w-7 p-0 border border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-transparent"
                                    style={{ color: 'var(--sidebar-orange)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                                      e.currentTarget.style.backgroundColor = 'rgba(92, 156, 124, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = ''
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Remove Button - Compacto */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, 0)}
                                className="h-7 px-2 text-xs border border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-transparent transition-all duration-200"
                                style={{ color: '#EF4444' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#EF4444'
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = ''
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <X className="h-3.5 w-3.5 mr-0.5" />
                                <span className="hidden sm:inline">Quitar</span>
                              </Button>
                            </div>
                            
                            {/* Stock Alert - Compacto */}
                            {stockAlert.show && stockAlert.productId === item.productId && (
                              <div className="mt-1.5 p-2 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600 rounded shadow-sm">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                  <div className="text-xs font-medium text-red-800 dark:text-red-200">
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

            {/* Right Column - Payment and Summary (2/5 del ancho) */}
            <div className="xl:col-span-2 flex flex-col space-y-2 md:space-y-3 min-h-0">
              {/* Payment Method - Compacto */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)] flex-shrink-0">
                <CardHeader className="pb-1.5 p-2">
                  <CardTitle className="flex items-center text-sm md:text-base text-gray-900 dark:text-white">
                    <CreditCard className="h-4 w-4 mr-1.5" style={{ color: 'var(--sidebar-orange)' }} />
                    Método de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-2">
                    {/* Selector de Método de Pago */}
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] appearance-none cursor-pointer text-gray-900 dark:text-white"
                        style={{ fontFamily: 'var(--font-inter)' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.boxShadow = ''
                        }}
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
                      <div className="mt-3 p-3 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                        <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                          Desglose de Pago Mixto
                        </h4>
                        <div className="space-y-2">
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
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-md bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-sm"
                                  style={{ fontFamily: 'var(--font-inter)' }}
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-md bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-sm"
                              style={{ fontFamily: 'var(--font-inter)' }}
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
                          
                          {/* Resumen de pagos mixtos */}
                          <div className="pt-3 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] space-y-2">
                            <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-[#1A1A1A] p-2 rounded-md border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Total a pagar:</span>
                              <span className="font-bold text-gray-900 dark:text-white text-base">
                                ${Math.round(total).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Total ingresado:</span>
                              <span className={`font-medium ${Math.round(getTotalMixedPayments()) === Math.round(total) && validProducts.length > 0 ? '' : 'text-gray-900 dark:text-white'}`}
                                style={Math.round(getTotalMixedPayments()) === Math.round(total) && validProducts.length > 0 ? { color: 'var(--sidebar-orange)' } : undefined}
                              >
                                ${Math.round(getTotalMixedPayments()).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            {Math.round(getTotalMixedPayments()) === Math.round(total) && validProducts.length > 0 && (
                              <div className="flex justify-between items-center text-sm font-medium pt-1 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                                <div className="flex items-center gap-2" style={{ color: 'var(--sidebar-orange)' }}>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Pago completo</span>
                                </div>
                              </div>
                            )}
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

              {/* Summary - Optimizado para muchos productos */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)] flex flex-col flex-1 min-h-0">
                <CardHeader className="pb-1.5 p-2 flex-shrink-0">
                  <CardTitle className="text-sm md:text-base text-gray-900 dark:text-white flex items-center">
                    <DollarSign className="h-4 w-4 mr-1.5" style={{ color: 'var(--sidebar-orange)' }} />
                    Resumen de Venta
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 flex flex-col min-h-0">
                  {orderedValidProducts.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                      Agrega productos para ver el resumen
                    </p>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Lista de productos - Scrollable con altura flexible */}
                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 mb-2 min-h-0">
                        {orderedValidProducts.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded bg-gray-100 dark:bg-[#1F1F1F] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] px-2 py-1.5"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-medium text-gray-900 dark:text-white text-xs md:text-sm truncate" title={item.productName}>
                                {item.productName}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {item.quantity} x ${item.unitPrice.toLocaleString('es-CO')}
                              </div>
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm whitespace-nowrap">
                              ${item.total.toLocaleString('es-CO')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totales - Fijos en la parte inferior */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Subtotal:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${subtotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">IVA (19%):</span>
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="checkbox"
                                checked={includeTax}
                                onChange={(e) => setIncludeTax(e.target.checked)}
                                className="h-3.5 w-3.5 border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded bg-white dark:bg-[#1A1A1A]"
                                style={{ accentColor: 'var(--sidebar-orange)' }}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                Incluir IVA
                              </span>
                            </div>
                          </div>
                          {includeTax && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">IVA calculado:</span>
                              <span className="font-medium text-gray-900 dark:text-white">${tax.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] pt-1.5">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-gray-900 dark:text-white">Total:</span>
                            <span className="font-bold" style={{ color: 'var(--sidebar-orange)' }}>
                              ${total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer - Compacto y optimizado */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] p-2 md:p-3" style={{ paddingBottom: 'calc(max(40px, env(safe-area-inset-bottom)) + 0.5rem)' }}>
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 font-medium text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                e.currentTarget.style.backgroundColor = 'rgba(92, 156, 124, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.backgroundColor = ''
              }}
            >
              Cancelar
            </Button>
            {paymentMethod === 'credit' && (
              <Button
                onClick={handleSaveAsDraft}
                disabled={!selectedClient || selectedProducts.length === 0 || validProducts.length === 0}
                className="font-medium text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 shadow-md disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-700 text-white"
              >
                <span className="hidden sm:inline">Guardar como Borrador</span>
                <span className="sm:hidden">Borrador</span>
              </Button>
            )}
            <Button
              onClick={() => handleSave(false)}
              disabled={!selectedClient || selectedProducts.length === 0 || validProducts.length === 0 || !paymentMethod}
              className="font-medium text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 shadow-md disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed text-white"
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
              <span className="hidden sm:inline">Crear Venta</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          </div>
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
