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
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 xl:p-8" style={{ fontFamily: 'var(--font-inter)' }}>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-auto xl:w-auto xl:max-w-[95vw] xl:max-h-[85vh] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)]" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 md:h-8 md:w-8" style={{ color: 'var(--sidebar-orange)' }} />
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

        {/* Content - Todo el contenido hace scroll, incluyendo los botones */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(max(64px, env(safe-area-inset-bottom)) + 1rem)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleTransfer() }} className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Columna Izquierda - Stock Actual */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: 'var(--sidebar-orange)' }} />
                    Stock Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center space-x-1.5">
                      <Package className="h-4 w-4" style={{ color: 'var(--sidebar-orange)' }} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Bodega</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(product.stock.warehouse)}</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center space-x-1.5">
                      <Store className="h-4 w-4" style={{ color: 'var(--sidebar-orange)' }} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Local</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(product.stock.store)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalles de la Transferencia */}
            <div className="lg:col-span-4">
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" style={{ color: 'var(--sidebar-orange)' }} />
                    Detalles de la Transferencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* Desde y Hacia en una fila */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Desde */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Desde *
                          </label>
                          <div className="space-y-1.5">
                            {(['warehouse', 'store'] as const).map((location) => {
                              const Icon = getLocationIcon(location)
                              const isSelected = formData.fromLocation === location
                              return (
                                <button
                                  key={location}
                                  type="button"
                                  onClick={() => handleInputChange('fromLocation', location)}
                                  className={`w-full p-2 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'font-medium border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A]'
                                      : 'border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:border-gray-400 dark:hover:border-[rgba(255,255,255,0.1)]'
                                  }`}
                                  style={isSelected ? { borderColor: 'var(--sidebar-orange)', backgroundColor: 'rgba(92, 156, 124, 0.1)', color: 'var(--sidebar-orange)' } : undefined}
                                >
                                  <div className="flex items-center space-x-1.5">
                                    <Icon className="h-4 w-4" style={{ color: isSelected ? 'var(--sidebar-orange)' : '#9CA3AF' }} />
                                    <div className="text-left flex-1 min-w-0">
                                      <div className="text-xs font-medium" style={{ color: isSelected ? 'var(--sidebar-orange)' : undefined }}>
                                        {getLocationLabel(location)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
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
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Hacia *
                          </label>
                          <div className="space-y-1.5">
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
                                  className={`w-full p-2 rounded-lg border-2 transition-all ${
                                    isDisabled
                                      ? 'border-gray-200 dark:border-[rgba(255,255,255,0.06)] text-gray-400 dark:text-gray-500 cursor-not-allowed bg-white dark:bg-[#1A1A1A]'
                                      : isSelected
                                      ? 'font-medium border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A]'
                                      : 'border-gray-300 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:border-gray-400 dark:hover:border-[rgba(255,255,255,0.1)]'
                                  }`}
                                  style={!isDisabled && isSelected ? { borderColor: 'var(--sidebar-orange)', backgroundColor: 'rgba(92, 156, 124, 0.1)', color: 'var(--sidebar-orange)' } : undefined}
                                >
                                  <div className="flex items-center space-x-1.5">
                                    <Icon className="h-4 w-4" style={{ color: isDisabled ? '#9CA3AF' : isSelected ? 'var(--sidebar-orange)' : '#9CA3AF' }} />
                                    <div className="text-left flex-1 min-w-0">
                                      <div className="text-xs font-medium" style={{ color: isDisabled ? '#9CA3AF' : isSelected ? 'var(--sidebar-orange)' : undefined }}>
                                        {getLocationLabel(location)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Stock: {formatNumber(location === 'warehouse' ? product.stock.warehouse : product.stock.store)}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          {errors.toLocation && (
                            <p className="mt-1.5 text-xs text-red-500">{errors.toLocation}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Cantidad a Transferir *
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="number"
                          min="1"
                          max={getAvailableStock()}
                          value={formData.quantity || ''}
                          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A] ${
                            errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-[rgba(255,255,255,0.06)]'
                          }`}
                          onFocus={(e) => {
                            if (!errors.quantity) {
                              e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                            }
                          }}
                          onBlur={(e) => {
                            if (!errors.quantity) {
                              e.currentTarget.style.borderColor = ''
                              e.currentTarget.style.boxShadow = ''
                            }
                          }}
                          placeholder="Ingrese cantidad"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Máx: {formatNumber(getAvailableStock())}
                        </div>
                        {errors.quantity && (
                          <p className="text-xs text-red-500">{errors.quantity}</p>
                        )}
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Motivo de la Transferencia
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A] resize-none ${
                          errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-[rgba(255,255,255,0.06)]'
                        }`}
                        onFocus={(e) => {
                          if (!errors.reason) {
                            e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.reason) {
                            e.currentTarget.style.borderColor = ''
                            e.currentTarget.style.boxShadow = ''
                          }
                        }}
                        placeholder="Ej: Reposición de tienda, devolución a bodega, etc. (opcional)"
                        rows={3}
                      />
                      <div className="mt-1 flex justify-between items-center">
                        {errors.reason && (
                          <p className="text-xs text-red-500">{errors.reason}</p>
                        )}
                        <span className={`text-xs ml-auto ${
                          formData.reason.length > 0 && formData.reason.length < 10 
                            ? 'text-red-500' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formData.reason.length > 0 ? `${formData.reason.length}/10` : 'Opcional'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de la Transferencia - Siempre visible */}
              <Card className="bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)] mt-4">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'var(--sidebar-orange)' }} />
                    Resumen de la Transferencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Producto:</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium truncate">{product.name}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Transferir:</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {formData.quantity > 0 ? `${formatNumber(formData.quantity)} unidades` : '0 unidades'}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Stock después:</div>
                      <div className="text-xs text-gray-900 dark:text-white font-medium">
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
                    <div className="p-2 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">De → A:</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {getLocationLabel(formData.fromLocation)} → {getLocationLabel(formData.toLocation)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Botones dentro del form para que hagan scroll con el contenido */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300"
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
            <Button
              type="submit"
              className="text-white"
              style={{ backgroundColor: 'var(--sidebar-orange)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transferir Stock
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
