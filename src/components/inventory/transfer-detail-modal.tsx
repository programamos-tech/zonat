'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Package, Store as StoreIcon, Calendar, User, FileText } from 'lucide-react'
import { StoreStockTransfer } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TransferDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: StoreStockTransfer | null
}

export function TransferDetailModal({ isOpen, onClose, transfer }: TransferDetailModalProps) {
  if (!isOpen || !transfer) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>
      case 'in_transit':
        return <Badge className="bg-blue-500 hover:bg-blue-600">En Tránsito</Badge>
      case 'received':
        return <Badge className="bg-green-500 hover:bg-green-600">Recibida</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const totalQuantity = transfer.items && transfer.items.length > 0
    ? transfer.items.reduce((sum, item) => sum + item.quantity, 0)
    : transfer.quantity || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-900 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="h-6 w-6 text-cyan-500" />
            Detalles de Transferencia
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número de Transferencia</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {transfer.transferNumber || transfer.id.substring(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</p>
              {getStatusBadge(transfer.status)}
            </div>
          </div>

          {/* Tiendas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <StoreIcon className="h-3 w-3" />
                Tienda Origen
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.fromStoreName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <StoreIcon className="h-3 w-3" />
                Tienda Destino
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.toStoreName || 'N/A'}</p>
            </div>
          </div>

          {/* Descripción */}
          {transfer.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Descripción
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.description}</p>
            </div>
          )}

          {/* Productos */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Productos</p>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4">
                {transfer.items && transfer.items.length > 0 ? (
                  <div className="space-y-2">
                    {transfer.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">x{item.quantity}</p>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex justify-between">
                        <span>Total:</span>
                        <span>{totalQuantity} unidades</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-900 dark:text-white">{transfer.productName || 'Producto'}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">x{transfer.quantity || 0}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fechas y Usuarios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha de Creación
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {format(new Date(transfer.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
              </p>
            </div>
            {transfer.receivedAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha de Recepción
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(transfer.receivedAt), 'dd MMM yyyy HH:mm', { locale: es })}
                </p>
              </div>
            )}
          </div>

          {transfer.createdByName && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Creado por
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.createdByName}</p>
            </div>
          )}

          {transfer.receivedByName && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Recibido por
              </p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.receivedByName}</p>
            </div>
          )}

          {/* Notas */}
          {transfer.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</p>
              <p className="text-sm text-gray-900 dark:text-white">{transfer.notes}</p>
            </div>
          )}
        </CardContent>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  )
}
