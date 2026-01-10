'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, ArrowRightLeft, RefreshCw, X, Store as StoreIcon, ChevronDown, ChevronUp, Calendar, User, FileText, Download } from 'lucide-react'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { StoreStockTransfer, Store } from '@/types'
import { StoreStockTransferService } from '@/lib/store-stock-transfer-service'
import { StoresService } from '@/lib/stores-service'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUserStoreId, canAccessAllStores } from '@/lib/store-helper'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TransferModal } from '@/components/inventory/transfer-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { PDFService } from '@/lib/pdf-service'

export default function TransfersPage() {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState<StoreStockTransfer[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [transferToCancel, setTransferToCancel] = useState<StoreStockTransfer | null>(null)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [expandedTransfers, setExpandedTransfers] = useState<Set<string>>(new Set())
  
  const currentStoreId = getCurrentUserStoreId()
  const canManageAllStores = canAccessAllStores(user)

  const toggleTransfer = (transferId: string) => {
    setExpandedTransfers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transferId)) {
        newSet.delete(transferId)
      } else {
        newSet.add(transferId)
      }
      return newSet
    })
  }

  // Cargar tiendas solo una vez al montar
  useEffect(() => {
    loadStores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  // Cargar transferencias cuando cambia el filtro o el storeId
  useEffect(() => {
    loadTransfers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, currentStoreId])

  const loadStores = async () => {
    try {
      const storesData = await StoresService.getAllStores(true)
      setStores(storesData)
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const loadTransfers = async () => {
    if (!currentStoreId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const transfersData = await StoreStockTransferService.getStoreTransfers(
        currentStoreId,
        filter === 'all' ? 'all' : filter
      )
      setTransfers(transfersData)
    } catch (error) {
      toast.error('Error al cargar las transferencias')
      console.error('Error loading transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransfer = () => {
    setIsCreateModalOpen(true)
  }


  const handleCancel = (transfer: StoreStockTransfer) => {
    setTransferToCancel(transfer)
    setIsCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!transferToCancel) return

    try {
      const success = await StoreStockTransferService.cancelTransfer(transferToCancel.id)
      if (success) {
        toast.success('Transferencia cancelada exitosamente')
        setIsCancelModalOpen(false)
        setTransferToCancel(null)
        loadTransfers()
      } else {
        toast.error('Error al cancelar la transferencia')
      }
    } catch (error) {
      toast.error('Error al cancelar la transferencia')
      console.error('Error cancelling transfer:', error)
    }
  }

  const handleDownloadPDF = async (transfer: StoreStockTransfer) => {
    try {
      toast.loading('Generando PDF...')
      await PDFService.generateTransferPDF(transfer, {
        logoUrl: '/zonat-logo.png',
        companyName: transfer.fromStoreName || 'Zona T',
        companyAddress: '',
        companyPhone: ''
      })
      toast.dismiss()
      toast.success('PDF generado exitosamente')
    } catch (error) {
      toast.dismiss()
      toast.error('Error al generar el PDF')
      console.error('Error generating PDF:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <RoleProtectedRoute module="products" requiredAction="view">
      <div className="p-4 md:p-6 pb-20 lg:pb-6 space-y-4 md:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Transferencias de Inventario</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestiona las transferencias de productos entre tiendas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadTransfers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {canManageAllStores && (
              <Button onClick={handleCreateTransfer} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Nueva Transferencia
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('sent')}
              >
                Enviadas
              </Button>
              <Button
                variant={filter === 'received' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('received')}
              >
                Recibidas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transferencias */}
        {transfers.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay transferencias
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {canManageAllStores 
                    ? 'Crea una nueva transferencia para comenzar'
                    : 'No hay transferencias pendientes o recibidas'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => {
              const isExpanded = expandedTransfers.has(transfer.id)
              const totalQuantity = transfer.items && transfer.items.length > 0
                ? transfer.items.reduce((sum, item) => sum + item.quantity, 0)
                : transfer.quantity || 0

              return (
                <Card
                  key={transfer.id}
                  className={`bg-white dark:bg-gray-800 border-l-4 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    isExpanded 
                      ? 'border-l-cyan-500 dark:border-l-cyan-400 border-cyan-300 dark:border-cyan-600' 
                      : 'border-l-cyan-500 dark:border-l-cyan-400'
                  }`}
                  onClick={() => toggleTransfer(transfer.id)}
                >
                  <CardContent className="p-4 md:p-6">
                    {/* Header de la Transferencia */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                          <ArrowRightLeft className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de Transferencia</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                  {transfer.transferNumber || `#${transfer.id.substring(0, 8)}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              <StoreIcon className="h-3 w-3" />
                              {transfer.fromStoreName || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hacia</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              <StoreIcon className="h-3 w-3" />
                              {transfer.toStoreName || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Productos</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {transfer.items && transfer.items.length > 0 
                                ? `${transfer.items.length} producto(s)`
                                : '1 producto'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total / Estado</div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {totalQuantity} unidades
                              </div>
                              {getStatusBadge(transfer.status)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Fecha de Creación:</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {format(new Date(transfer.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleTransfer(transfer.id)
                          }}
                          className="h-8 w-8 p-0 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400 font-bold" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-cyan-600 dark:text-cyan-400 font-bold" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Detalle Expandible */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                        {/* Información Adicional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {transfer.description && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Descripción
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {transfer.description}
                              </div>
                            </div>
                          )}
                          {transfer.createdByName && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Creado por
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {transfer.createdByName}
                              </div>
                            </div>
                          )}
                          {transfer.receivedAt && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Fecha de Recepción
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {format(new Date(transfer.receivedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                              </div>
                            </div>
                          )}
                          {transfer.receivedByName && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Recibido por
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {transfer.receivedByName}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Lista de Productos */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Package className="h-4 w-4 text-cyan-600" />
                              Productos ({transfer.items && transfer.items.length > 0 ? transfer.items.length : 1})
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            {transfer.items && transfer.items.length > 0 ? (
                              transfer.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                      <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Producto</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {item.productName}
                                        </div>
                                        {item.productReference && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Ref: {item.productReference}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cantidad</div>
                                      <div className="text-base font-bold text-gray-900 dark:text-white">
                                        {item.quantity} unidades
                                      </div>
                                    </div>
                                    {item.fromLocation && (
                                      <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Origen</div>
                                        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-xs">
                                          {item.fromLocation === 'warehouse' ? 'Bodega' : 'Local'}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Producto</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {transfer.productName || 'Producto'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cantidad</div>
                                    <div className="text-base font-bold text-gray-900 dark:text-white">
                                      {transfer.quantity || 0} unidades
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadPDF(transfer)
                            }}
                            className="flex-1 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </Button>
                          {transfer.status === 'pending' && 
                           transfer.fromStoreId === currentStoreId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancel(transfer)
                              }}
                              className="flex-1 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 transition-all"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Modales */}
        <TransferModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async () => {
            setIsCreateModalOpen(false)
            await loadTransfers()
          }}
          stores={stores}
          fromStoreId={currentStoreId || undefined}
        />


        <ConfirmModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false)
            setTransferToCancel(null)
          }}
          onConfirm={confirmCancel}
          title="Cancelar Transferencia"
          message={`¿Estás seguro de que quieres cancelar la transferencia ${transferToCancel?.transferNumber || transferToCancel?.id.substring(0, 8)}? El stock será devuelto a la tienda origen.`}
          confirmText="Cancelar Transferencia"
          cancelText="No Cancelar"
          type="danger"
        />
      </div>
    </RoleProtectedRoute>
  )
}
