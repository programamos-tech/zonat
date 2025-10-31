'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Shield, 
  User, 
  Package, 
  Search, 
  Plus, 
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lock,
  Lightbulb
} from 'lucide-react'
import { Warranty, Sale, Client, Product } from '@/types'
import { SalesService } from '@/lib/sales-service'
import { ClientsService } from '@/lib/clients-service'
import { ProductsService } from '@/lib/products-service'
import { WarrantyService } from '@/lib/warranty-service'

interface WarrantyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (warrantyData: Omit<Warranty, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  warranty?: Warranty | null
}

export function WarrantyModal({ isOpen, onClose, onSave, warranty }: WarrantyModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Estados para búsqueda
  const [searchSale, setSearchSale] = useState('')
  const [searchReplacement, setSearchReplacement] = useState('')
  
  // Estados para resultados de búsqueda
  const [saleResults, setSaleResults] = useState<Sale[]>([])
  const [replacementResults, setReplacementResults] = useState<Product[]>([])
  const [showReplacementSearch, setShowReplacementSearch] = useState(false)
  const [stockValidation, setStockValidation] = useState<{
    hasStock: boolean
    checking: boolean
    stockCount: number
  }>({ hasStock: false, checking: false, stockCount: 0 })
  const [hasExistingWarranty, setHasExistingWarranty] = useState(false)
  const [checkingWarranty, setCheckingWarranty] = useState(false)
  
  // Estados para selecciones
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedReplacementProduct, setSelectedReplacementProduct] = useState<Product | null>(null)
  const [defectiveQuantity, setDefectiveQuantity] = useState<number>(1)
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    reason: '',
    notes: '',
    productSerial: ''
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      if (warranty) {
        // Modo edición
        setFormData({
          reason: warranty.reason || '',
          notes: warranty.notes || '',
          productSerial: warranty.productReceivedSerial || ''
        })
        // Cargar datos existentes
        loadExistingData()
      } else {
        // Modo creación
        resetForm()
      }
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, warranty])

  const loadExistingData = async () => {
    if (!warranty) return

    try {
      // Cargar venta original
      const sale = await SalesService.getSaleById(warranty.originalSaleId)
      if (sale) setSelectedSale(sale)

      // Cargar producto defectuoso
      const product = await ProductsService.getProductById(warranty.productReceivedId)
      if (product) setSelectedProduct(product)

      // Cargar producto de reemplazo si existe
      if (warranty.productDeliveredId) {
        const replacementProduct = await ProductsService.getProductById(warranty.productDeliveredId)
        if (replacementProduct) setSelectedReplacementProduct(replacementProduct)
      }
    } catch (error) {
      // Error silencioso en producción
    }
  }

  const resetForm = () => {
    setFormData({
      reason: '',
      notes: '',
      productSerial: ''
    })
    setSelectedSale(null)
    setSelectedProduct(null)
    setSelectedReplacementProduct(null)
    setDefectiveQuantity(1)
    setSearchSale('')
    setSearchReplacement('')
    setSaleResults([])
    setReplacementResults([])
    setStockValidation({ hasStock: false, checking: false, stockCount: 0 })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const searchSales = async (query: string) => {
    if (query.length < 2) {
      setSaleResults([])
      return
    }

    try {
      const results = await SalesService.searchSalesForWarranty(query)
      setSaleResults(results.slice(0, 10))
    } catch (error) {
      // Error silencioso en producción
    }
  }

  // Función para validar si la garantía está vigente (ejemplo: 30 días)
  const isWarrantyValid = (saleDate: string) => {
    const sale = new Date(saleDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 30 // 30 días de garantía
  }

  const searchReplacementProducts = async (query: string) => {
    if (query.length < 2) {
      setReplacementResults([])
      return
    }

    try {
      const results = await ProductsService.searchProducts(query)
      setReplacementResults(results.slice(0, 10))
    } catch (error) {
      // Error silencioso en producción
    }
  }

  // Función para verificar si un producto tiene stock disponible
  const checkProductStock = async (productId: string): Promise<boolean> => {
    try {
      const product = await ProductsService.getProductById(productId)
      if (!product) return false
      
      const totalStock = (product.stock?.local || 0) + (product.stock?.warehouse || 0)
      return totalStock >= defectiveQuantity
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Función para validar stock del producto de reemplazo
  const validateReplacementStock = async () => {
    if (!selectedReplacementProduct) return
    
    setStockValidation({ hasStock: false, checking: true, stockCount: 0 })
    try {
      const productWithStock = await ProductsService.getProductById(selectedReplacementProduct.id)
      if (productWithStock) {
        const totalStock = (productWithStock.stock?.local || 0) + (productWithStock.stock?.warehouse || 0)
        setStockValidation({ 
          hasStock: totalStock >= 1, // Siempre validamos para 1 unidad
          checking: false, 
          stockCount: totalStock 
        })
      }
    } catch (error) {
      // Error silencioso en producción
      setStockValidation({ hasStock: false, checking: false, stockCount: 0 })
    }
  }

  // Función para verificar si ya existe una garantía para este producto específico
  const checkExistingWarranty = async (saleId: string, productId: string) => {
    setCheckingWarranty(true)
    try {
      const result = await WarrantyService.getAllWarranties()
      // WarrantyService.getAllWarranties() devuelve { warranties, total, hasMore }
      const warranties = result.warranties || []
      
      // Contar garantías existentes para este producto específico en esta venta
      const existingWarrantiesCount = warranties.filter(w => 
        w.originalSaleId === saleId && w.productReceivedId === productId
      ).length
      
      // Obtener la cantidad comprada de este producto específico en la venta
      const sale = await SalesService.getSaleById(saleId)
      const productInSale = sale?.items?.find(item => item.productId === productId)
      const quantityPurchased = productInSale?.quantity || 0
      
      // Solo bloquear si ya se alcanzó el límite de garantías para este producto específico
      const hasReachedLimit = existingWarrantiesCount >= quantityPurchased
      setHasExistingWarranty(hasReachedLimit)

    } catch (error) {
      // Error silencioso en producción
      setHasExistingWarranty(false)
    } finally {
      setCheckingWarranty(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedSale) {
      newErrors.sale = 'Debe seleccionar una venta'
    }

    if (hasExistingWarranty) {
      newErrors.warranty = 'Este producto ya tiene una garantía registrada'
    }

    if (!selectedProduct) {
      newErrors.product = 'Debe seleccionar un producto defectuoso'
    }

    // Motivo de la garantía es opcional, no validamos

    if (!selectedReplacementProduct) {
      newErrors.replacementProduct = 'Debe seleccionar un producto de reemplazo'
    }

    // Validar stock del producto de reemplazo
    if (selectedReplacementProduct && !stockValidation.hasStock) {
      newErrors.replacementProduct = `Sin stock disponible: solo hay ${stockValidation.stockCount} unidades`
    }

    // Validar vigencia de garantía
    if (selectedSale && !isWarrantyValid(selectedSale.createdAt)) {
      newErrors.warranty = 'La garantía ha vencido (más de 30 días)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const warrantyData: Omit<Warranty, 'id' | 'createdAt' | 'updatedAt'> = {
        originalSaleId: selectedSale!.id,
        clientId: selectedSale!.clientId,
        clientName: selectedSale!.clientName,
        productReceivedId: selectedProduct!.id,
        productReceivedName: selectedProduct!.name,
        productReceivedSerial: formData.productSerial || undefined,
        productDeliveredId: selectedReplacementProduct?.id,
        productDeliveredName: selectedReplacementProduct?.name,
        reason: formData.reason,
        notes: `${formData.notes || ''}\n\nCantidad: ${defectiveQuantity} producto(s) defectuoso(s) → ${defectiveQuantity} producto(s) de reemplazo`.trim(),
        status: 'completed'
      }

      await onSave(warrantyData)
      handleClose()
    } catch (error) {
      // Error silencioso en producción
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 xl:left-64 bg-black/60 backdrop-blur-sm z-50 flex flex-col xl:items-center xl:justify-center xl:pl-6 xl:pr-4 pt-10 xl:pt-0">
      <div className="bg-white dark:bg-gray-900 rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-auto xl:w-auto xl:max-w-6xl xl:max-h-[95vh] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 md:h-8 md:w-8 text-orange-600" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {warranty ? 'Editar Garantía' : 'Nueva Garantía'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                {warranty ? 'Modificar información de la garantía' : 'Crear una nueva garantía para un producto defectuoso'}
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Selección de Venta */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Venta Original
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedSale ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por número de factura o cliente..."
                        value={searchSale}
                        onChange={(e) => {
                          setSearchSale(e.target.value)
                          searchSales(e.target.value)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    {/* Mensaje informativo sobre facturas canceladas */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          <p className="font-medium mb-1">Información importante:</p>
                          <p>Esta búsqueda incluye todas las facturas (activas y canceladas). Las facturas canceladas aparecerán marcadas como "ANULADA" pero no se pueden seleccionar para crear garantías.</p>
                        </div>
                      </div>
                    </div>
                    
                    {saleResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {saleResults.map((sale) => (
                          <div
                            key={sale.id}
                            onClick={sale.status === 'cancelled' ? undefined : async () => {
                              try {
                                // Cargar la venta completa con todos sus items
                                const fullSale = await SalesService.getSaleById(sale.id)
                                if (fullSale) {
                                  setSelectedSale(fullSale)
                                } else {
                                  setSelectedSale(sale)
                                }
                              } catch (error) {
                                // Si falla, usar la venta de la búsqueda
                                setSelectedSale(sale)
                              }
                              setSearchSale('')
                              setSaleResults([])
                              // Resetear selecciones cuando cambie la venta
                              setSelectedProduct(null)
                              setSelectedReplacementProduct(null)
                              setHasExistingWarranty(false)
                            }}
                            className={`p-3 border rounded-lg ${
                              sale.status === 'cancelled' 
                                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-75' 
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                Factura: {sale.invoiceNumber}
                              </div>
                              {sale.status === 'cancelled' && (
                                <div className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-medium">
                                  ANULADA
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Cliente: {sale.clientName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Fecha: {new Date(sale.createdAt).toLocaleDateString('es-CO')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Total: ${sale.total.toLocaleString()}
                            </div>
                            {sale.status === 'cancelled' && (
                              <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                                <Lock className="h-3 w-3" />
                                No se pueden crear garantías para facturas anuladas
                              </div>
                            )}
                            {sale.status !== 'cancelled' && !isWarrantyValid(sale.createdAt) && (
                              <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Garantía vencida
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mensaje cuando no hay resultados */}
                    {searchSale.length >= 2 && saleResults.length === 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            <p className="font-medium mb-1">No se encontraron facturas</p>
                            <p>No se encontraron facturas que coincidan con tu búsqueda. Intenta con otro número de factura o nombre de cliente.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : checkingWarranty ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      Verificando garantías existentes...
                    </span>
                  </div>
                ) : hasExistingWarranty ? (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedSale.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Cliente: {selectedSale.clientName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Total: ${(selectedSale.total || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Fecha: {new Date(selectedSale.createdAt).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Información cargada automáticamente
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedSale(null)
                            setSelectedProduct(null)
                            setSelectedReplacementProduct(null)
                            setHasExistingWarranty(false)
                          }}
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/20"
                        >
                          Cambiar Venta
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Este producto ya tiene una garantía registrada. Selecciona otra venta o producto.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Factura: {selectedSale.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Cliente: {selectedSale.clientName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Fecha: {new Date(selectedSale.createdAt).toLocaleDateString('es-CO')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Total: ${selectedSale.total.toLocaleString()}
                        </div>
                        {!isWarrantyValid(selectedSale.createdAt) && (
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Garantía vencida (más de 30 días)
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedSale(null)
                          setSelectedProduct(null)
                          setSelectedReplacementProduct(null)
                          setHasExistingWarranty(false)
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {errors.sale && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.sale}
                  </p>
                )}
                {errors.warranty && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.warranty}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Información del Cliente (Automática) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSale ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedSale.clientName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Cliente de la factura #{selectedSale.invoiceNumber}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Información cargada automáticamente
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Selecciona una venta para ver la información del cliente
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selección de Producto Defectuoso */}
            {!hasExistingWarranty && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-600" />
                  Producto Defectuoso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedSale ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Selecciona una venta para ver los productos
                    </div>
                  </div>
                ) : !selectedProduct ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Selecciona el producto que tiene defecto:
                    </div>
                    <div className={`max-h-48 overflow-y-auto space-y-2 ${hasExistingWarranty ? 'opacity-50 pointer-events-none' : ''}`}>
                      {selectedSale.items && selectedSale.items.length > 0 ? selectedSale.items.map((item) => (
                        <div
                          key={item.productId}
                          onClick={hasExistingWarranty ? undefined : async () => {
                            setSelectedProduct({
                              id: item.productId,
                              name: item.productName,
                              reference: item.productReferenceCode || 'N/A',
                              price: item.price,
                              cost: 0,
                              stock: { local: item.quantity || 0, warehouse: 0 },
                              categoryId: '',
                              brand: '',
                              description: '',
                              status: 'active',
                              createdAt: '',
                              updatedAt: ''
                            })
                            setDefectiveQuantity(1) // Resetear cantidad defectuosa
                            
                            // Verificar si ya existe una garantía para este producto específico
                            await checkExistingWarranty(selectedSale.id, item.productId)
                            
                            // Limpiar producto de reemplazo y mostrar búsqueda
                            setSelectedReplacementProduct(null)
                            setShowReplacementSearch(true)
                            setStockValidation({ hasStock: false, checking: false, stockCount: 0 })
                          }}
                          className={`p-3 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors ${
                            hasExistingWarranty 
                              ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
                              : 'hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Ref: {item.productReferenceCode || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Cantidad comprada: {item.quantity || 0} | Precio: ${(item.price || 0).toLocaleString()}
                          </div>
                          <div className={`text-xs mt-1 ${
                            hasExistingWarranty 
                              ? 'text-gray-400 dark:text-gray-500' 
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {hasExistingWarranty ? (
                              <span className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Selección deshabilitada
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Haz clic para seleccionar este producto
                              </span>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            No hay productos en esta venta
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedProduct.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Ref: {selectedProduct.reference}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Precio: ${(selectedProduct.price || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Producto defectuoso
                        </div>
                      </div>
                      <Button
                        onClick={hasExistingWarranty ? undefined : () => setSelectedProduct(null)}
                        variant="ghost"
                        size="sm"
                        disabled={hasExistingWarranty}
                        className={`text-gray-500 hover:text-gray-700 ${hasExistingWarranty ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Control de cantidad defectuosa */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad:
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          1 unidad
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {errors.product && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.product}
                  </p>
                )}
              </CardContent>
            </Card>
            )}

            {/* Selección de Producto de Reemplazo */}
            {!hasExistingWarranty && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Producto de Reemplazo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedProduct ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Primero selecciona el producto defectuoso
                    </div>
                  </div>
                ) : !selectedReplacementProduct ? (
                  <div className={`space-y-3 ${hasExistingWarranty ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Buscar producto alternativo:
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar producto de reemplazo..."
                            value={searchReplacement}
                            disabled={hasExistingWarranty}
                            onChange={hasExistingWarranty ? undefined : (e) => {
                              setSearchReplacement(e.target.value)
                              searchReplacementProducts(e.target.value)
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-yellow-500" />
                          Busca el mismo producto o uno equivalente para reemplazar
                        </div>
                        {errors.replacementProduct && (
                          <p className="text-sm text-red-500">{errors.replacementProduct}</p>
                        )}
                        {replacementResults.length > 0 && (
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {replacementResults.map((product) => (
                              <div
                                key={product.id}
                                onClick={async () => {
                                  setSelectedReplacementProduct(product)
                                  setSearchReplacement('')
                                  setReplacementResults([])
                                  
                                  // Validar stock del producto de reemplazo
                                  setStockValidation({ hasStock: false, checking: true, stockCount: 0 })
                                  try {
                                    const productWithStock = await ProductsService.getProductById(product.id)
                                    if (productWithStock) {
                                      const totalStock = (productWithStock.stock?.local || 0) + (productWithStock.stock?.warehouse || 0)
                                      setStockValidation({ 
                                        hasStock: totalStock >= 1, 
                                        checking: false, 
                                        stockCount: totalStock 
                                      })
                                    }
                                  } catch (error) {
      // Error silencioso en producción
                                    setStockValidation({ hasStock: false, checking: false, stockCount: 0 })
                                  }
                                  
                                  // Limpiar error de producto de reemplazo
                                  if (errors.replacementProduct) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors.replacementProduct
                                      return newErrors
                                    })
                                  }
                                }}
                                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  Ref: {product.reference}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  Precio: ${(product.price || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Stock: {((product.stock?.local || 0) + (product.stock?.warehouse || 0))} unidades
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <div className="flex-1">
                            {errors.reason && (
                              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                {errors.reason}
                              </p>
                            )}
                          </div>
                        </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selectedReplacementProduct.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Ref: {selectedReplacementProduct.reference}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Precio: ${(selectedReplacementProduct.price || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Producto de reemplazo seleccionado
                        </div>
                        {stockValidation.hasStock && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Stock disponible: {stockValidation.stockCount} unidades
                          </div>
                        )}
                        {!stockValidation.hasStock && !stockValidation.checking && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Sin stock suficiente: {stockValidation.stockCount} disponibles
                          </div>
                        )}
                        {stockValidation.checking && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Verificando stock...
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setSelectedReplacementProduct(null)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Información de cantidad */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad:
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          1 unidad
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Información Adicional */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className={`space-y-4 ${hasExistingWarranty ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Serie (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.productSerial}
                    disabled={hasExistingWarranty}
                    onChange={hasExistingWarranty ? undefined : (e) => setFormData(prev => ({ ...prev, productSerial: e.target.value }))}
                    placeholder="Ingrese el número de serie del producto defectuoso"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo de la Garantía (opcional)
                  </label>
                  <textarea
                    value={formData.reason}
                    disabled={hasExistingWarranty}
                    onChange={hasExistingWarranty ? undefined : (e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Describa el problema o defecto del producto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.reason && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      {errors.reason}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas Adicionales (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    disabled={hasExistingWarranty}
                    onChange={hasExistingWarranty ? undefined : (e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Agregue cualquier información adicional relevante..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-10 flex-shrink-0" style={{ paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)` }}>
          <Button
            onClick={handleClose}
            variant="outline"
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || hasExistingWarranty}
            className={`bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 ${hasExistingWarranty ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {warranty ? 'Actualizar Garantía' : 'Crear Garantía'}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
