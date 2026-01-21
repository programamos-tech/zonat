'use client'

import { useState, useEffect } from 'react'
import { Store } from '@/types'
import { StoresService } from '@/lib/stores-service'
import { toast } from 'sonner'
import { StoreTable } from '@/components/stores/store-table'
import { StoreModal } from '@/components/stores/store-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { useAuth } from '@/contexts/auth-context'
import { canAccessAllStores, getCurrentUserStoreId, isMainStoreUser } from '@/lib/store-helper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Store as StoreIcon, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StoresPage() {
  const { user, switchStore } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

  // Verificar si el usuario puede acceder a esta página
  const canAccess = user && canAccessAllStores(user)
  const isMainStore = isMainStoreUser(user)

  useEffect(() => {
    if (canAccess) {
      loadStores()
      loadCurrentStore()
    }
  }, [canAccess, user])

  const loadCurrentStore = async () => {
    if (!user) return
    
    try {
      const storeId = getCurrentUserStoreId()
      if (storeId && !isMainStoreUser(user)) {
        const store = await StoresService.getStoreById(storeId)
        setCurrentStore(store)
      } else {
        const mainStore = await StoresService.getMainStore()
        setCurrentStore(mainStore)
      }
    } catch (error) {
      console.error('Error loading current store:', error)
    }
  }

  const handleReturnToMainStore = () => {
    if (!switchStore) return
    
    // Volver a la tienda principal
    switchStore(undefined)
    
    // Redirigir al dashboard
    router.push('/dashboard?store=zona-t')
  }

  const loadStores = async () => {
    try {
      setLoading(true)
      const data = await StoresService.getAllStores()
      setStores(data)
    } catch (error) {
      console.error('Error loading stores:', error)
      toast.error('Error al cargar las tiendas')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleDelete = (store: Store) => {
    setStoreToDelete(store)
    setIsDeleteModalOpen(true)
  }

  const handleToggleStatus = async (store: Store) => {
    try {
      const updated = await StoresService.updateStore(store.id, {
        isActive: !store.isActive
      })
      if (updated) {
        toast.success(`Tienda ${updated.isActive ? 'activada' : 'desactivada'} exitosamente`)
        await loadStores()
      } else {
        toast.error('Error al actualizar el estado de la tienda')
      }
    } catch (error) {
      console.error('Error toggling store status:', error)
      toast.error('Error al actualizar el estado de la tienda')
    }
  }

  const confirmDelete = async () => {
    if (storeToDelete) {
      try {
        const success = await StoresService.deleteStore(storeToDelete.id)
        if (success) {
          toast.success('Tienda eliminada exitosamente')
          setIsDeleteModalOpen(false)
          setStoreToDelete(null)
          await loadStores()
        } else {
          toast.error('Error eliminando tienda')
        }
      } catch (error) {
        console.error('Error deleting store:', error)
        toast.error('Error eliminando tienda')
      }
    }
  }

  const handleCreate = () => {
    setSelectedStore(null)
    setIsModalOpen(true)
  }

  const handleSaveStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'deletedAt'>) => {
    try {
      if (selectedStore) {
        // Edit existing store
        const updated = await StoresService.updateStore(selectedStore.id, storeData)
        if (updated) {
          toast.success('Tienda actualizada exitosamente')
          setIsModalOpen(false)
          setSelectedStore(null)
          await loadStores()
        } else {
          toast.error('Error actualizando tienda')
        }
      } else {
        // Create new store
        const newStore = await StoresService.createStore(storeData)
        if (newStore) {
          toast.success('Tienda creada exitosamente')
          setIsModalOpen(false)
          await loadStores()
        } else {
          toast.error('Error creando tienda')
        }
      }
    } catch (error) {
      console.error('Error saving store:', error)
      toast.error('Error al guardar la tienda')
    }
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <RoleProtectedRoute module="roles" requiredAction="view">
      <div className="p-4 md:p-6 pb-20 lg:pb-6 space-y-4 md:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Banner de Tienda Actual - Solo mostrar si no está en la tienda principal */}
        {!isMainStore && currentStore && (
          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {currentStore.logo ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800">
                        <img
                          src={currentStore.logo}
                          alt={currentStore.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-gray-800 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800 flex items-center justify-center">
                        <StoreIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Viendo Dashboard de</div>
                    <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                      {currentStore.name}
                    </div>
                    {currentStore.city && (
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        {currentStore.city}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleReturnToMainStore}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Volver a Tienda Principal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <StoreTable
          stores={stores}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onCreate={handleCreate}
          onRefresh={loadStores}
        />

        <StoreModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedStore(null)
          }}
          onSave={handleSaveStore}
          store={selectedStore}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setStoreToDelete(null)
          }}
          onConfirm={confirmDelete}
          title="Eliminar Tienda"
          message={`¿Estás seguro de que quieres eliminar la tienda "${storeToDelete?.name}"? Esta acción desactivará la tienda y no se podrá deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </RoleProtectedRoute>
  )
}
