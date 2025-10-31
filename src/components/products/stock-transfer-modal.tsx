'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, ArrowRightLeft, Package, Store, AlertTriangle, FileText } from 'lucide-react'
import { Product, StockTransfer } from '@/types'

interface StockTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onTransfer: (transfer: Omit<StockTransfer, 'id' | 'createdAt' | 'userId' | 'userName'>) => void
  product: Product | null
}

export function StockTransferModal({ isOpen, onClose, onTransfer, product }: StockTransferModalProps) {
  const [formData, setFormData] = useState({
    fromLocation: 'warehouse' as 'warehouse' | 'store',
    toLocation: 'store' as 'warehouse' | 'store',
    quantity: 0,
    reason: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Función para formatear números con separadores de miles
  const formatNumber = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '0'

    // Para números enteros, no mostrar decimales
    if (Number.isInteger(numValue)) {
      return numValue.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
    // Para números con decimales, mostrar hasta 2 decimales
    return numValue.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0'
    }

    if (formData.fromLocation === formData.toLocation) {
      newErrors.toLocation = 'La ubicación destino debe ser diferente a la origen'
    }

    if (product) {
      const availableStock = formData.fromLocation === 'warehouse' 
        ? product.stock.warehouse 
        : product.stock.store

      if (formData.quantity > availableStock) {
        newErrors.quantity = `No hay suficiente stock. Disponible: ${availableStock}`
      }
    }

    // Campo motivo ahora es opcional - solo validar longitud si se proporciona
    if (formData.reason.trim() && formData.reason.trim().length < 10) {
      newErrors.reason = 'Si proporcionas un motivo, debe tener al menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | number) => {
    // Para el campo quantity, si es string vacío, lo convertimos a 0
    const processedValue = field === 'quantity' && value === '' ? 0 : value
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleTransfer = () => {
    if (validateForm() && product) {
      onTransfer({
        productId: product.id,
        productName: product.name,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        quantity: formData.quantity,
        reason: formData.reason.trim()
      })
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      fromLocation: 'warehouse',
      toLocation: 'store',
      quantity: 0,
      reason: ''
    })
    setErrors({})
    onClose()
  }

  const getLocationLabel = (location: 'warehouse' | 'store') => {
    return location === 'warehouse' ? 'Bodega' : 'Local'
  }

  const getLocationIcon = (location: 'warehouse' | 'store') => {
    return location === 'warehouse' ? Package : Store
  }

  const getAvailableStock = () => {
    if (!product) return 0
    return formData.fromLocation === 'warehouse' 
      ? product.stock.warehouse 
      : product.stock.store
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 lg:left-64 bg-black/60 backdrop-blur-sm z-50 flex flex-col lg:items-center lg:justify-center lg:pl-6 lg:pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl w-full h-full lg:h-auto lg:w-auto lg:max-w-6xl lg:max-h-[95vh] overflow-hidden flex flex-col border-0 lg:border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 md:h-8 md:w-8 text-green-600" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Transferir Stock
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                {product.name} - {product.reference}
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
        <form onSubmit={(e) => { e.preventDefault(); handleTransfer() }} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Stock Actual */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Stock Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Bodega</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(product.stock.warehouse)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Store className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Local</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(product.stock.store)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>

              {/* Resumen de la Transferencia */}
              {formData.quantity > 0 && (
                <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-green-600" />
                      Resumen de la Transferencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Producto:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Transferir:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatNumber(formData.quantity)} unidades de {getLocationLabel(formData.fromLocation)} a {getLocationLabel(formData.toLocation)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Stock después:</span>
                        <div className="text-gray-900 dark:text-white font-medium">
                          <div>Bodega: {formatNumber(formData.fromLocation === 'warehouse' 
                            ? product.stock.warehouse - formData.quantity 
                            : product.stock.warehouse + (formData.toLocation === 'warehouse' ? formData.quantity : 0)
                          )}</div>
                          <div>Local: {formatNumber(formData.fromLocation === 'store' 
                            ? product.stock.store - formData.quantity 
                            : product.stock.store + (formData.toLocation === 'store' ? formData.quantity : 0)
                          )}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detalles de la Transferencia */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-green-600" />
                  Detalles de la Transferencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Desde *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['warehouse', 'store'] as const).map((location) => {
                      const Icon = getLocationIcon(location)
                      const isSelected = formData.fromLocation === location
                      return (
                        <button
                          key={location}
                          type="button"
                          onClick={() => handleInputChange('fromLocation', location)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="text-left">
                              <div className={`font-medium ${isSelected ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {getLocationLabel(location)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Stock: {formatNumber(location === 'warehouse' ? product.stock.warehouse : product.stock.store)}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Hacia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Hacia *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['warehouse', 'store'] as const).map((location) => {
                      const Icon = getLocationIcon(location)
                      const isSelected = formData.toLocation === location
                      const isDisabled = location === formData.fromLocation
                      return (
                        <button
                          key={location}
                          type="button"
                          onClick={() => !isDisabled && handleInputChange('toLocation', location)}
                          disabled={isDisabled}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isDisabled
                              ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${
                              isDisabled 
                                ? 'text-gray-400' 
                                : isSelected 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} />
                            <div className="text-left">
                              <div className={`font-medium ${
                                isDisabled
                                  ? 'text-gray-400 dark:text-gray-500'
                                  : isSelected 
                                  ? 'text-green-600' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {getLocationLabel(location)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Stock: {formatNumber(location === 'warehouse' ? product.stock.warehouse : product.stock.store)}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {errors.toLocation && (
                    <p className="mt-1 text-sm text-red-500">{errors.toLocation}</p>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad a Transferir *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max={getAvailableStock()}
                      value={formData.quantity || ''}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 ${
                        errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Ingrese cantidad"
                    />
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Máx: {formatNumber(getAvailableStock())}
                    </div>
                  </div>
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
                  )}
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo de la Transferencia
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 ${
                      errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ej: Reposición de tienda, devolución a bodega, etc. (opcional)"
                    rows={3}
                  />
                  <div className="mt-1 flex justify-between items-center">
                    {errors.reason && (
                      <p className="text-sm text-red-500">{errors.reason}</p>
                    )}
                    <span className={`text-xs ml-auto ${formData.reason.length > 0 && formData.reason.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.reason.length > 0 ? `${formData.reason.length}/10 caracteres mínimo` : 'Campo opcional'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-10 flex-shrink-0" style={{ paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)` }}>
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transferir Stock
          </Button>
        </div>
      </div>
    </div>
  )
}
