'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getCurrentUserStoreId, isMainStoreUser } from '@/lib/store-helper'
import { StoresService } from '@/lib/stores-service'

export function BetaBanner() {
  const { user } = useAuth()
  const [storeLabel, setStoreLabel] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (isMainStoreUser(user)) {
        setStoreLabel('Tienda Principal')
        return
      }
      const storeId = getCurrentUserStoreId()
      if (!storeId) return
      try {
        const store = await StoresService.getStoreById(storeId)
        if (store) setStoreLabel(store.city ? `${store.name} - ${store.city}` : store.name)
      } catch {
        setStoreLabel(null)
      }
    }
    load()
  }, [user])

  return (
    <div className="w-full bg-white dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-800 py-1.5 px-2 sm:px-4">
      <div className="max-w-[1920px] mx-auto flex items-center justify-center gap-2 flex-wrap">
        {/* Versión del sistema centrada */}
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          Microtiendas 2.0
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded">
          Beta
        </span>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">•</span>
        <a
          href="https://andresruss.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <span className="hidden sm:inline">powered by </span>
          <span className="font-medium">andresruss.st</span>
        </a>
        {storeLabel && (
          <>
            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium truncate max-w-[180px] sm:max-w-none" title={storeLabel}>
              {storeLabel}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
