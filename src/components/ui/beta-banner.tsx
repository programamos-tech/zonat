'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store as StoreIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { StoresService } from '@/lib/stores-service'
import { canAccessAllStores } from '@/lib/store-helper'

export function BetaBanner() {
  const router = useRouter()
  const { user } = useAuth()
  const [storeName, setStoreName] = useState<string | null>(null)

  useEffect(() => {
    const loadStoreName = async () => {
      if (!user) {
        setStoreName(null)
        return
      }
      try {
        if (user.storeId) {
          const store = await StoresService.getStoreById(user.storeId)
          setStoreName(store?.name ?? null)
        } else {
          const mainStore = await StoresService.getMainStore()
          setStoreName(mainStore?.name ?? null)
        }
      } catch {
        setStoreName(null)
      }
    }
    loadStoreName()
  }, [user?.storeId, user])

  const locationLabel = storeName ?? '—'
  const canSwitch = canAccessAllStores(user)

  const handleClick = () => {
    if (canSwitch) {
      router.push('/select-store')
    }
  }

  return (
    <div
      role={canSwitch ? 'button' : undefined}
      tabIndex={canSwitch ? 0 : undefined}
      onClick={canSwitch ? handleClick : undefined}
      onKeyDown={canSwitch ? (e) => e.key === 'Enter' && handleClick() : undefined}
      className={`w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-1.5 px-4 ${canSwitch ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors' : ''}`}
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-center gap-2">
        <StoreIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Tienda actual:
        </span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {locationLabel}
        </span>
      </div>
    </div>
  )
}
