'use client'

import { Store } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Store as StoreIcon, Crown } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { canAccessAllStores } from '@/lib/store-helper'

interface StoreTableProps {
  stores: Store[]
  onEdit: (store: Store) => void
  onDelete: (store: Store) => void
  onToggleStatus: (store: Store) => void
  onCreate: () => void
  onRefresh: () => void
}

interface StoreCardProps {
  store: Store
  isMainStore: boolean
  isCurrentStore: boolean
  isSuperAdmin: boolean
  onStoreClick: (e: React.MouseEvent) => void
  onEdit: () => void
  onToggleStatus: () => void
}

function StoreCard({ 
  store, 
  isMainStore, 
  isCurrentStore, 
  isSuperAdmin,
  onStoreClick,
  onEdit,
  onToggleStatus
}: StoreCardProps) {

  return (
    <Card
      onClick={onStoreClick}
      className={`group relative overflow-visible rounded-xl border border-zinc-200/80 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950/50 ${
        isCurrentStore ? 'ring-1 ring-zinc-300/80 shadow-sm dark:ring-zinc-600' : ''
      } ${isSuperAdmin ? 'cursor-pointer hover:shadow-md dark:hover:border-zinc-700' : ''}`}
      title={isSuperAdmin ? `Haz click para ver el dashboard de ${store.name}` : undefined}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Indicador de Tienda Actual - Sutil */}
          {isCurrentStore && (
            <div
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-zinc-400 shadow-sm dark:bg-zinc-500"
              title="Vista actual"
              aria-hidden
            />
          )}
          
          {/* Logo - Protagonista, Circular */}
          <div className="relative">
            {store.logo ? (
              <div
                className={`relative h-20 w-20 overflow-hidden rounded-full ring-1 transition-transform ${
                  isCurrentStore
                    ? 'ring-zinc-300 dark:ring-zinc-600'
                    : 'ring-zinc-200/80 dark:ring-zinc-700'
                }`}
              >
                <Image
                  src={store.logo}
                  alt={store.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 ring-1 dark:bg-zinc-800/80 ${
                  isCurrentStore ? 'ring-zinc-300 dark:ring-zinc-600' : 'ring-zinc-200/80 dark:ring-zinc-700'
                }`}
              >
                <Image
                  src="/zonat-logo.png"
                  alt="Zona T Logo"
                  width={56}
                  height={56}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            {/* Icono de Tienda Principal - Corona */}
            {isMainStore && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-zinc-900 p-1 text-white shadow-sm dark:border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
                <Crown className="h-2.5 w-2.5" strokeWidth={2} />
              </div>
            )}
          </div>
          
          {/* Nombre de la Tienda */}
          <div className="w-full">
            <h3 className="line-clamp-2 text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-50">
              {store.name}
            </h3>
          </div>

          {/* Botones de Acción - Visibles */}
          <div 
            className="w-full flex items-center justify-center gap-3 pt-2"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onEdit()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <div 
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className="flex items-center gap-2"
            >
              <Switch
                checked={store.isActive}
                onCheckedChange={() => {
                  onToggleStatus()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                title={store.isActive ? 'Desactivar' : 'Activar'}
                className="data-[state=checked]:bg-zinc-700 focus-visible:ring-zinc-400 dark:data-[state=checked]:bg-zinc-300 dark:focus-visible:ring-zinc-500"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StoreTable({
  stores,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
  onRefresh
}: StoreTableProps) {
  const router = useRouter()
  const { user, switchStore } = useAuth()
  const isSuperAdmin = user && canAccessAllStores(user)
  const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
  
  // Determinar cuál es la tienda actualmente seleccionada
  const getCurrentStoreId = (): string | undefined => {
    if (!user) return undefined
    // Si storeId es undefined o MAIN_STORE_ID, entonces está en la tienda principal
    return user.storeId || MAIN_STORE_ID
  }
  
  const currentStoreId = getCurrentStoreId()

  const handleStoreClick = (store: Store, e: React.MouseEvent) => {
    // Solo permitir click si es super admin y no se hizo click en los botones de acción
    if (!isSuperAdmin || !switchStore) return
    
    const target = e.target as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    
    // Si se hizo click en un botón, switch, o en sus hijos, no cambiar de tienda
    if (
      target.closest('button') || 
      target.closest('[role="button"]') ||
      target.closest('[role="switch"]') ||
      target.closest('label') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'LABEL' ||
      // Verificar si el click fue en el área de botones
      (currentTarget.querySelector('.w-full.flex.items-center.justify-center.gap-3')?.contains(target))
    ) {
      return
    }

    // Prevenir propagación adicional
    e.stopPropagation()
    e.preventDefault()

    // Cambiar de tienda
    const newStoreId = store.id === MAIN_STORE_ID ? MAIN_STORE_ID : store.id
    switchStore(newStoreId)
    
    // Crear slug de la tienda para la URL
    const storeSlug = store.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)
    
    // Usar setTimeout para asegurar que el estado se actualice antes de navegar
    setTimeout(() => {
      router.push(`/dashboard?store=${storeSlug}`)
    }, 0)
  }

  return (
    <Card className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <CardHeader className="space-y-0 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-xl">
              <StoreIcon className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} aria-hidden />
              Micro Tiendas
            </CardTitle>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Gestiona las micro tiendas del sistema
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              onClick={onCreate}
              size="sm"
              className="h-9 flex-1 bg-zinc-900 text-sm font-medium text-white shadow-none hover:translate-y-0 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white sm:flex-none"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Nueva Tienda</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {stores.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-300 dark:border-zinc-600">
              <StoreIcon className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">No hay tiendas registradas</p>
            <Button
              onClick={onCreate}
              size="sm"
              className="mt-4 bg-zinc-900 text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Crear Primera Tienda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {stores.map((store) => {
                  const isMainStore = store.id === MAIN_STORE_ID
                  const isCurrentStore = store.id === currentStoreId
                  
                  return (
                    <StoreCard
                      key={store.id}
                      store={store}
                      isMainStore={isMainStore}
                      isCurrentStore={isCurrentStore}
                      isSuperAdmin={isSuperAdmin || false}
                      onStoreClick={(e) => handleStoreClick(store, e)}
                      onEdit={() => onEdit(store)}
                      onToggleStatus={() => onToggleStatus(store)}
                    />
                  )
                })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
