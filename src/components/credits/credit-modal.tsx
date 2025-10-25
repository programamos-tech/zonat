'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, User, Receipt, Calendar, DollarSign, Package, ShoppingCart, Plus, Minus } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)

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
        alert(`❌ No puedes agregar más unidades de "${product.name}".\nStock disponible: ${totalStock}\nYa seleccionado: ${existingItem.quantity}`)
        return
      }
      
      setSelectedProducts(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity, total: item.unitPrice * newQuantity }
          : item
      ))
    } else {
      const newItem: SaleItem = {
        id: `temp-${Date.now()}-${Math.random()}`,
        productId: product.id,
        productName: product.name,
        productReferenceCode: product.reference || '',
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'amount',
        tax: 0,
        total: product.price
      }
      setSelectedProducts(prev => [...prev, newItem])
    }
    
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }
    
    // Buscar el producto para validar stock
    const product = products.find(p => p.id === productId)
    if (product) {
      const totalStock = (product.stock?.warehouse || 0) + (product.stock?.store || 0)
      
      if (quantity > totalStock) {
        alert(`❌ No puedes seleccionar ${quantity} unidades de "${product.name}".\nStock disponible: ${totalStock}`)
        return
      }
    }
    
    setSelectedProducts(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity, total: item.unitPrice * quantity }
        : item
    ))
  }

  const calculateSubtotal = () => {
    return selectedProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient || selectedProducts.length === 0 || !formData.dueDate) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Validar stock antes de crear la venta
    const stockValidationErrors = []
    for (const item of selectedProducts) {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const totalStock = (product.stock?.warehouse || 0) + (product.stock?.store || 0)
        if (item.quantity > totalStock) {
          stockValidationErrors.push(`${product.name}: Stock disponible ${totalStock}, solicitado ${item.quantity}`)
        }
      }
    }

    if (stockValidationErrors.length > 0) {
      alert(`❌ Error de stock:\n\n${stockValidationErrors.join('\n')}\n\nPor favor ajusta las cantidades antes de continuar.`)
      return
    }

    setIsLoading(true)

    try {
      // Validar que el usuario esté autenticado
      if (!user?.id) {
        throw new Error('Usuario no autenticado. Por favor, inicia sesión nuevamente.')
      }

      console.log('🚀 Iniciando creación de venta a crédito...')
      console.log('Usuario autenticado:', user)
      console.log('Cliente seleccionado:', selectedClient)
      console.log('Productos seleccionados:', selectedProducts)
      console.log('Fecha de vencimiento:', formData.dueDate)

      // Crear la venta (el crédito se crea automáticamente en SalesService.createSale)
      const saleData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email || '',
        clientPhone: selectedClient.phone || '',
        items: selectedProducts,
        paymentMethod: 'credit' as const,
        total: calculateSubtotal(),
        discount: 0,
        discountType: 'amount' as const,
        tax: 0,
        observations: formData.notes,
        dueDate: formData.dueDate, // Agregar fecha de vencimiento a la venta
        sellerId: user.id,
        sellerName: user.name || 'Usuario',
        sellerEmail: user.email || ''
      }

      console.log('📋 Datos de la venta:', saleData)
      const newSale = await SalesService.createSale(saleData, user.id)
      console.log('✅ Venta creada con crédito automático:', newSale)
      
      // El crédito ya fue creado automáticamente por SalesService.createSale()
      // Solo necesitamos notificar que se creó exitosamente
      onCreateCredit({
        id: newSale.id, // Usar el ID de la venta como ID del crédito
        saleId: newSale.id,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        invoiceNumber: newSale.invoiceNumber,
        totalAmount: newSale.total,
        paidAmount: 0,
        pendingAmount: newSale.total,
        status: 'pending',
        dueDate: formData.dueDate,
        lastPaymentAmount: null,
        lastPaymentDate: null,
        lastPaymentUser: null,
        createdBy: user.id,
        createdByName: user.name || 'Usuario',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating credit:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error keys:', error ? Object.keys(error) : 'No keys')
      console.error('Full error object:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Error al crear el crédito. Por favor intenta de nuevo.'
      
      // Manejar diferentes tipos de errores
      if (error && typeof error === 'object') {
        const errorStr = JSON.stringify(error)
        
        if (errorStr.includes('relation "credits" does not exist')) {
          errorMessage = '❌ Las tablas de créditos no existen.\n\nPor favor ejecuta el script SQL en Supabase:\n1. Ve a https://supabase.com/dashboard\n2. Selecciona tu proyecto\n3. Ve a SQL Editor\n4. Ejecuta el script de create-credits-tables.sql'
        } else if (errorStr.includes('relation "sales" does not exist')) {
          errorMessage = '❌ La tabla de ventas no existe. Verifica la configuración de la base de datos.'
        } else if (errorStr.includes('relation "clients" does not exist')) {
          errorMessage = '❌ La tabla de clientes no existe. Verifica la configuración de la base de datos.'
        } else if (errorStr.includes('Insufficient stock')) {
          errorMessage = '❌ Stock insuficiente. Por favor verifica las cantidades seleccionadas.'
        } else if (error.message) {
          errorMessage = `❌ Error: ${error.message}`
        } else if (error.error) {
          errorMessage = `❌ Error: ${error.error}`
        } else {
          errorMessage = `❌ Error desconocido: ${errorStr}`
        }
      } else if (typeof error === 'string') {
        errorMessage = `❌ Error: ${error}`
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-pink-50 dark:bg-pink-900/20 p-6 -m-6 mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-pink-600" />
            Crear Venta a Crédito
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            Crea una nueva venta a crédito y registra el crédito correspondiente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda - Cliente y Productos */}
            <div className="space-y-6">
              {/* Selección de Cliente */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex items-center space-x-3 pb-3">
                  <User className="h-5 w-5 text-pink-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Seleccionar Cliente *</Label>
                    <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.email || client.phone || 'Sin contacto'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClient && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Nombre:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedClient.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.email || 'No especificado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Teléfono:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.phone || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selección de Productos */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex items-center space-x-3 pb-3">
                  <Package className="h-5 w-5 text-pink-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productSearch">Buscar Producto</Label>
                    <div className="relative">
                      <Input
                        id="productSearch"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value)
                          setShowProductDropdown(true)
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Buscar por nombre o referencia..."
                      />
                      {showProductDropdown && productSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.slice(0, 10).map(product => {
                            const totalStock = (product.stock?.warehouse || 0) + (product.stock?.store || 0)
                            const hasStock = totalStock > 0
                            
                            return (
                              <div
                                key={product.id}
                                className={`px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                                  hasStock 
                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                                    : 'bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                                }`}
                                onClick={() => hasStock ? addProduct(product) : null}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className={`font-medium ${hasStock ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Ref: {product.reference || 'N/A'} | 
                                      <span className={hasStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                        Stock: {totalStock}
                                      </span>
                                      {!hasStock && <span className="text-red-600 dark:text-red-400 ml-1">(Sin stock)</span>}
                                    </div>
                                  </div>
                                  <div className={`text-sm font-semibold ${hasStock ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    ${product.price.toLocaleString('es-CO')}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de productos seleccionados */}
                  {selectedProducts.length > 0 && (
                    <div className="space-y-2">
                      <Label>Productos Seleccionados</Label>
                      {selectedProducts.map(item => {
                        const product = products.find(p => p.id === item.productId)
                        const totalStock = product ? (product.stock?.warehouse || 0) + (product.stock?.store || 0) : 0
                        const canIncrease = item.quantity < totalStock
                        
                        return (
                          <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.productName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Ref: {item.productReferenceCode} | ${item.unitPrice.toLocaleString('es-CO')} c/u
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Stock disponible: {totalStock} | Seleccionado: {item.quantity}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={!canIncrease}
                                className={!canIncrease ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeProduct(item.productId)}
                                className="text-red-600 hover:text-red-700 ml-2"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha - Configuración del Crédito */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex items-center space-x-3 pb-3">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configuración del Crédito
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observaciones (Opcional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Agregar observaciones sobre la venta a crédito..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex items-center space-x-3 pb-3">
                  <DollarSign className="h-5 w-5 text-pink-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resumen de la Venta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProducts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Subtotal:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${calculateSubtotal().toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Total a Crédito:</span>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${calculateSubtotal().toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          El cliente podrá realizar abonos parciales hasta completar el pago total.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Selecciona productos para ver el resumen de la venta
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={!selectedClient || selectedProducts.length === 0 || !formData.dueDate || isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Venta a Crédito'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}