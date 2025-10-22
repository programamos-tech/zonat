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
  Edit
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
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')

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

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'pending', label: 'Pendiente', icon: <Clock className="h-4 w-4" /> },
      { value: 'in_progress', label: 'En Proceso', icon: <AlertTriangle className="h-4 w-4" /> },
      { value: 'completed', label: 'Completado', icon: <CheckCircle className="h-4 w-4" /> },
      { value: 'rejected', label: 'Rechazado', icon: <XCircle className="h-4 w-4" /> },
      { value: 'discarded', label: 'Descartado', icon: <Trash2 className="h-4 w-4" /> }
    ]

    return allStatuses.filter(status => status.value !== currentStatus)
  }

  const handleStatusChange = () => {
    if (newStatus) {
      onStatusChange(warranty.id, newStatus, statusNotes)
      setShowStatusModal(false)
      setNewStatus('')
      setStatusNotes('')
    }
  }

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Garantía #{warranty.id.slice(-6)}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Factura: {warranty.originalSale?.invoiceNumber || 'N/A'}
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
              {/* Información General */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                    <Badge className={getStatusColor(warranty.status)}>
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
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
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
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-red-600" />
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
                  {warranty.productReceivedSerial && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de Serie:</span>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">{warranty.productReceivedSerial}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de la Garantía:</span>
                    <p className="text-sm text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      {warranty.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Producto Entregado */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
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
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {warranty.status === 'completed' ? 'Producto entregado' : 'Pendiente de entrega'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notas Adicionales */}
            {warranty.notes && (
              <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Notas Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {warranty.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Historial de Estados */}
            {warranty.statusHistory && warranty.statusHistory.length > 0 && (
              <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-orange-600" />
                    Historial de Estados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {warranty.statusHistory
                      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                      .map((history, index) => (
                        <div key={history.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-shrink-0">
                            {getStatusIcon(history.newStatus)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(history.newStatus)}>
                                  {getStatusLabel(history.newStatus)}
                                </Badge>
                                {history.previousStatus && (
                                  <>
                                    <span className="text-gray-400">←</span>
                                    <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                      {getStatusLabel(history.previousStatus)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(history.changedAt).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {history.notes && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                {history.notes}
                              </p>
                            )}
                            {history.changedByUser && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Cambiado por: {history.changedByUser.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => onEdit(warranty)}
                variant="outline"
                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => setShowStatusModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Cambiar Estado
              </Button>
            </div>
            <Button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Estado */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cambiar Estado de Garantía
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nuevo Estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccionar estado...</option>
                  {getStatusOptions(warranty.status).map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Agregar notas sobre el cambio de estado..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setShowStatusModal(false)}
                variant="outline"
                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={!newStatus}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400"
              >
                Confirmar Cambio
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
