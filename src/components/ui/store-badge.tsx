'use client'

import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUserStoreId, isMainStoreUser } from '@/lib/store-helper'
import { StoresService } from '@/lib/stores-service'
import { cn } from '@/lib/utils'

interface StoreBadgeProps {
  className?: string
}

const chipClass =
  'inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-200/90 bg-zinc-50/90 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400'

/** Tienda principal: mismo criterio que Facturas proveedor — verde muy sutil (fondo oscuro + texto verde suave). */
const mainStoreChipClass =
  'inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/[0.07] px-2 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/55 dark:text-emerald-400/85'

export function StoreBadge({ className = '' }: StoreBadgeProps) {
  const { user } = useAuth()
  const [storeName, setStoreName] = useState<string | null>(null)

  useEffect(() => {
    const loadStoreInfo = async () => {
      const storeId = getCurrentUserStoreId()

      if (storeId && !isMainStoreUser(user)) {
        try {
          const store = await StoresService.getStoreById(storeId)
          if (store) {
            const displayName = store.city
              ? `${store.name} — ${store.city}`
              : store.name
            setStoreName(displayName)
          }
        } catch (error) {
          console.error('[STORE BADGE] Error loading store info:', error)
        }
      }
    }

    loadStoreInfo()
  }, [user])

  if (isMainStoreUser(user)) {
    return (
      <span className={cn(mainStoreChipClass, 'shrink-0', className)}>
        <Building2 className="h-3 w-3 shrink-0 text-emerald-700/90 dark:text-emerald-400/80" aria-hidden />
        Tienda principal
      </span>
    )
  }

  if (storeName) {
    return (
      <span
        className={cn(chipClass, 'min-w-0 max-w-[min(100%,16rem)] truncate', className)}
        title={storeName}
      >
        <Building2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
        <span className="truncate">{storeName}</span>
      </span>
    )
  }

  return null
}
