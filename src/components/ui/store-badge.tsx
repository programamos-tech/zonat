'use client'

import { useState, useEffect } from 'react'
import { Store as StoreIcon, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUserStoreId, isMainStoreUser } from '@/lib/store-helper'
import { StoresService } from '@/lib/stores-service'

interface StoreBadgeProps {
  className?: string
}

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
            // Combinar nombre y ciudad si existe
            const displayName = store.city 
              ? `${store.name} - ${store.city}`
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

  // Si es tienda principal
  if (isMainStoreUser(user)) {
    return (
      <Badge className={`bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm px-3 py-1.5 border border-emerald-300 dark:border-emerald-700 ${className}`}>
        <Crown className="h-4 w-4 mr-1.5" />
        Tienda Principal
      </Badge>
    )
  }

  // Si es microtienda
  if (storeName) {
    return (
      <Badge className={`bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm px-3 py-1.5 border border-green-300 dark:border-green-700 ${className}`}>
        <StoreIcon className="h-4 w-4 mr-1.5" />
        {storeName}
      </Badge>
    )
  }

  return null
}
