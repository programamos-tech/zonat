'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Shield, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  Trash2
} from 'lucide-react'
import { Warranty } from '@/types'
import { WarrantyService } from '@/lib/warranty-service'
import { ProductsService } from '@/lib/products-service'
import { toast } from 'sonner'

interface WarrantyEditModalProps {
  warranty: Warranty | null
  isOpen: boolean
  onClose: () => void
  onSave: (warranty: Warranty) => void
}

export function WarrantyEditModal({ 
  warranty, 
  isOpen, 
  onClose,
  onSave 
}: WarrantyEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen && warranty) {
      setNotes(warranty.notes || '')
    }
  }, [isOpen, warranty])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !warranty) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
      case 'discarded':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'in_progress':
        return 'En Proceso'
      case 'completed':
        return 'Completado'
      case 'rejected':
        return 'Rechazado'
      case 'discarded':
        return 'Descartado'
      default:
        return status
    }
  }

  const handleCancelWarranty = async () => {
    if (!warranty) return

    setIsLoading(true)
    try {
      // 1. Devolver producto al inventario
      if (warranty.productDeliveredId) {
        await ProductsService.updateProductStock(warranty.productDeliveredId, {
          local: 1, // Devolver 1 unidad al stock local
          warehouse: 0
        })
      }

      // 2. Actualizar estado de la garantía a 'rejected'
      const updatedWarranty = await WarrantyService.updateWarrantyStatus(
        warranty.id, 
        'rejected', 
        notes || 'Garantía cancelada - Producto devuelto al inventario'
      )

      if (updatedWarranty) {
        toast.success('Garantía cancelada y producto devuelto al inventario')
        onSave(updatedWarranty)
        onClose()
      }
    } catch (error) {
      console.error('Error canceling warranty:', error)
      toast.error('Error al cancelar la garantía')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteWarranty = async () => {
    if (!warranty) return

    setIsLoading(true)
    try {
      // 1. Actualizar estado de la garantía a 'completed'
      const updatedWarranty = await WarrantyService.updateWarrantyStatus(
        warranty.id, 
        'completed', 
        notes || 'Garantía completada exitosamente'
      )

      if (updatedWarranty) {
        toast.success('Garantía completada exitosamente')
        onSave(updatedWarranty)
        onClose()
      }
    } catch (error) {
      console.error('Error completing warranty:', error)
      toast.error('Error al completar la garantía')
    } finally {
      setIsLoading(false)
    }
  }


  const canCancel = warranty.status === 'pending' || warranty.status === 'in_progress'
  const canComplete = warranty.status === 'pending' || warranty.status === 'in_progress'

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Editar Garantía #{warranty.id.slice(-6)}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Estado actual: <Badge className={getStatusColor(warranty.status)}>
                    {getStatusLabel(warranty.status)}
                  </Badge>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información de la Garantía */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Información de la Garantía
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente:</span>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.clientName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto Defectuoso:</span>
                    <p className="text-sm text-gray-900 dark:text-white">{warranty.productReceivedName}</p>
                  </div>
                  {warranty.productDeliveredName && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto Entregado:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{warranty.productDeliveredName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo:</span>
                    <p className="text-sm text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      {warranty.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones Disponibles */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Acciones Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canCancel && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium text-red-800 dark:text-red-200">Cancelar Garantía</h4>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Esta acción devolverá el producto al inventario y marcará la garantía como rechazada.
                      </p>
                      <Button
                        onClick={handleCancelWarranty}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {isLoading ? 'Procesando...' : 'Cancelar Garantía'}
                      </Button>
                    </div>
                  )}

                  {canComplete && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800 dark:text-green-200">Completar Garantía</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Marcar la garantía como completada exitosamente.
                      </p>
                      <Button
                        onClick={handleCompleteWarranty}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isLoading ? 'Procesando...' : 'Completar Garantía'}
                      </Button>
                    </div>
                  )}

                  {!canCancel && !canComplete && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Esta garantía ya está {getStatusLabel(warranty.status).toLowerCase()}. No hay acciones disponibles.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notas Adicionales */}
            <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Agregar notas sobre la garantía..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(warranty)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

    </>
  )
}
