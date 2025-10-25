'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  CreditCard, 
  User, 
  Package, 
  Calendar, 
  DollarSign, 
  Plus, 
  Minus,
  Search,
  ShoppingCart
} from 'lucide-react'
import { Credit, Client, SaleItem, Product } from '@/types'
import { useProducts } from '@/contexts/products-context'
import { useClients } from '@/contexts/clients-context'
import { useAuth } from '@/contexts/auth-context'
import { SalesService } from '@/lib/sales-service'
import { CreditsService } from '@/lib/credits-service'

interface CreditModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateCredit: (credit: Credit) => void
}

export function CreditModal({ isOpen, onClose, onCreateCredit }: CreditModalProps) {
  const { clients, getAllClients } = useClients()
  const { products, refreshProducts } = useProducts()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    notes: ''
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      getAllClients()
      refreshProducts()
    }
  }, [isOpen, getAllClients, refreshProducts])

  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId)
      setSelectedClient(client || null)
    }
  }, [formData.clientId, clients])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.referenceCode?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addProduct = (product: Product) => {
    const totalStock = (product.stock?.warehouse || 0) + (product.stock?.store || 0)
    
    if (totalStock <= 0) {
      alert(`❌ El producto "${product.name}" no tiene stock disponible.\nStock actual: ${totalStock}`)
      return
    }
    
    const existingItem = selectedProducts.find(item => item.productId === product.id)
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1
      if (newQuantity > totalStock) {
        alert(`❌ No hay suficiente stock para "${product.name}".\nStock disponible: ${totalStock}`)
        return
      }
      setSelectedProducts(prev => 
        prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    } else {
      setSelectedProducts(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        productReference: product.referenceCode || '',
        quantity: 1,
        unitPrice: product.sellingPrice || 0,
        totalPrice: product.sellingPrice || 0
      }])
    }
    
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }
    
    const product = products.find(p => p.id === productId)
    if (product) {
      const totalStock = (product.stock?.warehouse || 0) + (product.stock?.store || 0)
      if (newQuantity > totalStock) {
        alert(`❌ No hay suficiente stock para "${product.name}".\nStock disponible: ${totalStock}`)
        return
      }
    }
    
    setSelectedProducts(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { 
              ...item, 
              quantity: newQuantity,
              totalPrice: item.unitPrice * newQuantity
            }
          : item
      )
    )
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + item.totalPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) {
      alert('❌ Por favor selecciona un cliente')
      return
    }
    
    if (!formData.dueDate) {
      alert('❌ Por favor selecciona una fecha de vencimiento')
      return
    }
    
    if (selectedProducts.length === 0) {
      alert('❌ Por favor agrega al menos un producto')
      return
    }
    
    setLoading(true)
    
    try {
      // Crear la venta
      const saleData = {
        clientId: formData.clientId,
        items: selectedProducts,
        total: calculateTotal(),
        paymentMethod: 'credit',
        notes: formData.notes
      }
      
      const newSale = await SalesService.createSale(saleData)
      
      // Crear el crédito
      const creditData = {
        saleId: newSale.id,
        clientId: formData.clientId,
        amount: calculateTotal(),
        dueDate: formData.dueDate,
        status: 'pending',
        notes: formData.notes
      }
      
      const newCredit = await CreditsService.createCredit(creditData)
      
      // Registrar actividad
      await CreditsService.logActivity({
        creditId: newCredit.id,
        action: 'credit_created',
        details: `Crédito creado por ${user?.email} - Monto: $${calculateTotal().toLocaleString()}`,
        userId: user?.id || ''
      })
      
      onCreateCredit(newCredit)
      handleClose()
      
    } catch (error) {
      console.error('Error creating credit:', error)
      alert('❌ Error al crear el crédito. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: '',
      notes: ''
    })
    setSelectedClient(null)
    setSelectedProducts([])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-pink-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Venta a Crédito
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Crea una nueva venta a crédito y registra el crédito correspondiente.
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cliente */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-600" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Cliente *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedClient && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedClient.name}
                      </div>
                      <div>{selectedClient.email}</div>
                      <div>{selectedClient.phone}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productos */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-pink-600" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Producto
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o referencia..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(e.target.value.length > 0)
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  {showProductDropdown && productSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Ref: {product.referenceCode || 'N/A'} | 
                            Stock: {(product.stock?.warehouse || 0) + (product.stock?.store || 0)} | 
                            Precio: ${(product.sellingPrice || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedProducts.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedProducts.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Ref: {item.productReference} | ${item.unitPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => removeProduct(item.productId)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración del Crédito */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  Configuración del Crédito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Agregar observaciones sobre la venta a crédito..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen de la Venta */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-pink-600" />
                  Resumen de la Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProducts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Selecciona productos para ver el resumen de la venta
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {item.quantity} x ${item.unitPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${item.totalPrice.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Total:
                        </span>
                        <span className="text-lg font-bold text-pink-600">
                          ${calculateTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            onClick={handleClose}
            variant="outline"
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedProducts.length === 0 || !formData.clientId || !formData.dueDate}
            className="bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-400"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Crear Venta a Crédito
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}