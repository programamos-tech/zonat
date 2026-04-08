'use client'

import { Store } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Store as StoreIcon, Crown, Receipt, CircleDollarSign } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { canAccessAllStores } from '@/lib/store-helper'
import { cn } from '@/lib/utils'

/** Misma línea visual que dashboard (zinc + acento esmeralda). */
const storeCardShell =
  'rounded-xl border border-solid border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none'
const storeMetricIcon =
  'h-3.5 w-3.5 shrink-0 text-emerald-600/85 dark:text-emerald-500/80'
const storeMetricLabel =
  'text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

interface StoreTableProps {
  stores: Store[]
  /** Ventas completadas e ingresos por store id (tienda principal = MAIN_STORE_ID). */
  salesByStore: Record<string, { count: number; revenue: number }>
  onEdit: (store: Store) => void
  onDelete: (store: Store) => void
  onCreate: () => void
  onRefresh: () => void
}

interface StoreCardProps {
  store: Store
  salesSummary: { count: number; revenue: number }
  isMainStore: boolean
  isCurrentStore: boolean
  isSuperAdmin: boolean
  onStoreClick: (e: React.MouseEvent) => void
  onEdit: () => void
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function StoreCard({ 
  store,
  salesSummary,
  isMainStore, 
  isCurrentStore, 
  isSuperAdmin,
  onStoreClick,
  onEdit,
}: StoreCardProps) {

  return (
    <div className="aspect-square min-w-0 w-full">
      <Card
        onClick={onStoreClick}
        className={cn(
          'group relative flex h-full w-full flex-col overflow-hidden transition-all duration-200',
          storeCardShell,
          isCurrentStore &&
            'border-zinc-400/90 shadow-md ring-1 ring-zinc-300/80 dark:border-zinc-500 dark:ring-zinc-600/40',
          isSuperAdmin &&
            'cursor-pointer hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600'
        )}
        title={isSuperAdmin ? `Haz click para ver el dashboard de ${store.name}` : undefined}
      >
        <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-3.5">
          {isCurrentStore && (
            <span
              className="absolute right-2 top-2 z-10 rounded-full border border-zinc-200/90 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              title="Vista actual"
            >
              Activa
            </span>
          )}

          <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
            <div className="relative">
              {store.logo ? (
                <div
                  className={cn(
                    'relative h-14 w-14 overflow-hidden rounded-full border border-solid border-zinc-200/90 dark:border-zinc-600',
                    isCurrentStore && 'border-zinc-300 dark:border-zinc-500'
                  )}
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
                  className={cn(
                    'flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-solid border-zinc-200/90 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/80',
                    isCurrentStore && 'border-zinc-300 dark:border-zinc-500'
                  )}
                >
                  <Image
                    src="/zonat-logo.png"
                    alt="Zona T Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              {isMainStore && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-zinc-900 p-0.5 text-amber-100 shadow-sm dark:border-zinc-900 dark:bg-amber-500/90 dark:text-zinc-950">
                  <Crown className="h-2 w-2" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <h3 className="line-clamp-2 w-full px-0.5 text-xs font-semibold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-[13px]">
              {store.name}
            </h3>
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-2 gap-2"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex min-h-0 flex-col justify-center rounded-lg border border-solid border-zinc-200/80 bg-zinc-50/90 p-2 dark:border-zinc-700/80 dark:bg-zinc-800/35">
              <div className="flex items-center gap-1">
                <Receipt className={storeMetricIcon} strokeWidth={1.75} aria-hidden />
                <span className={storeMetricLabel}>Ventas</span>
              </div>
              <p className="mt-1 truncate text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {salesSummary.count.toLocaleString('es-CO')}
              </p>
              <p className="truncate text-[9px] text-zinc-500 dark:text-zinc-500">
                Completadas
              </p>
            </div>
            <div className="flex min-h-0 flex-col justify-center rounded-lg border border-solid border-zinc-200/80 bg-zinc-50/90 p-2 dark:border-zinc-700/80 dark:bg-zinc-800/35">
              <div className="flex items-center gap-1">
                <CircleDollarSign className={storeMetricIcon} strokeWidth={1.75} aria-hidden />
                <span className={storeMetricLabel}>Ingresos</span>
              </div>
              <p
                className="mt-1 line-clamp-2 text-left text-[11px] font-semibold leading-tight tabular-nums text-zinc-900 dark:text-zinc-100 sm:text-xs"
                title={formatCOP(salesSummary.revenue)}
              >
                {formatCOP(salesSummary.revenue)}
              </p>
            </div>
          </div>

          <div
            data-store-card-footer
            className="mt-auto flex shrink-0 items-center border-t border-solid border-zinc-200/80 pt-2 dark:border-zinc-700/80"
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={e => {
              e.stopPropagation()
            }}
          >
            <Button
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                onEdit()
              }}
              onMouseDown={e => {
                e.stopPropagation()
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StoreTable({
  stores,
  salesByStore,
  onEdit,
  onDelete,
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
    
    // Si se hizo click en un botón o en sus hijos, no cambiar de tienda
    if (
      target.closest('button') || 
      target.closest('[role="button"]') ||
      target.tagName === 'BUTTON' ||
      (currentTarget.querySelector('[data-store-card-footer]')?.contains(target))
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
    <Card className="border-zinc-300/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
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
                  const salesSummary =
                    salesByStore[store.id] ?? { count: 0, revenue: 0 }
                  
                  return (
                    <StoreCard
                      key={store.id}
                      store={store}
                      salesSummary={salesSummary}
                      isMainStore={isMainStore}
                      isCurrentStore={isCurrentStore}
                      isSuperAdmin={isSuperAdmin || false}
                      onStoreClick={(e) => handleStoreClick(store, e)}
                      onEdit={() => onEdit(store)}
                    />
                  )
                })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
