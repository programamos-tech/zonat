'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Shield, 
  User, 
  Package, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Trash2,
  History,
} from 'lucide-react'
import { Warranty } from '@/types'

interface WarrantyDetailModalProps {
  warranty: Warranty | null
  isOpen: boolean
  onClose: () => void
  onEdit: (warranty: Warranty) => void
  onStatusChange: (warrantyId: string, newStatus: string, notes?: string) => void
}

export function WarrantyDetailModal({ 
  warranty, 
  isOpen, 
  onClose, 
  onEdit,
  onStatusChange 
}: WarrantyDetailModalProps) {

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
        return 'text-white dark:text-white'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
      case 'discarded':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getStatusStyle = (status: string) => {
    if (status === 'completed') {
      return {
        backgroundColor: 'rgba(92, 156, 124, 0.2)',
        color: 'var(--sidebar-orange)'
      }
    }
    return undefined
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'discarded':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ fontFamily: 'var(--font-inter)' }}>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)]" style={{ fontFamily: 'var(--font-inter)' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 md:h-8 md:w-8" style={{ color: 'var(--sidebar-orange)' }} />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Garantía #{warranty.id.slice(-6)}
                </h2>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#1F1F1F]"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#1A1A1A]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Información General */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                    <Badge className={getStatusColor(warranty.status)} style={getStatusStyle(warranty.status)}>
                      {getStatusIcon(warranty.status)}
                      <span className="ml-1">{getStatusLabel(warranty.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Creación:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(warranty.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {warranty.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Completado:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(warranty.completedAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Última Actualización:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(warranty.updatedAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Cliente */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.clientName}</p>
                  </div>
                  {warranty.client?.email && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{warranty.client.email}</p>
                    </div>
                  )}
                  {warranty.client?.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{warranty.client.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Producto Recibido */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
                    Producto Recibido (Defectuoso)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto:</span>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.productReceivedName}</p>
                  </div>
                  {warranty.productReceived?.reference && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{warranty.productReceived.reference}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad recibida:</span>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.quantityReceived ?? 1} unidad{warranty.quantityReceived !== 1 ? 'es' : ''}</p>
                  </div>
                  {warranty.productReceivedSerial && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de Serie:</span>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">{warranty.productReceivedSerial}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de la Garantía:</span>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                      {warranty.reason || '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Producto Entregado */}
              <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
                    Producto Entregado (Nuevo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {warranty.productDeliveredName ? (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto:</span>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.productDeliveredName}</p>
                      </div>
                      {warranty.productDelivered?.reference && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia:</span>
                          <p className="text-sm text-gray-900 dark:text-white">{warranty.productDelivered.reference}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad entregada:</span>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{warranty.quantityDelivered ?? 1} unidad{warranty.quantityDelivered !== 1 ? 'es' : ''}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      {warranty.notes?.includes('Devolución de dinero') ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(92, 156, 124, 0.2)' }}>
                              <span className="text-2xl">💰</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Devolución de Dinero
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {warranty.productReceived?.price ? 
                                `Valor devuelto: $${(warranty.productReceived.price).toLocaleString()}` : 
                                'Valor del producto defectuoso devuelto'
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {warranty.productDeliveredId ? 'Producto entregado' : 'Sin producto de reemplazo'}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 md:p-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] sticky bottom-0 z-10 flex-shrink-0" style={{ paddingBottom: `calc(max(56px, env(safe-area-inset-bottom)) + 1rem)` }}>
            <div className="flex items-center gap-3">
              {/* Botón de cambiar estado eliminado */}
            </div>
            <Button
              onClick={onClose}
              className="text-white"
              style={{ backgroundColor: 'var(--sidebar-orange)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>

    </>
  )
}
