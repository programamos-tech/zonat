'use client'

import { useRouterEvents } from '@/hooks/use-router-events'

export function GlobalLoading() {
  const isLoading = useRouterEvents()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-[var(--swatch--gray-950)]/80 backdrop-blur-sm" style={{ fontFamily: 'var(--font-inter)' }}>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner elegante */}
        <div className="relative">
          <div 
            className="w-12 h-12 rounded-full border-4 border-transparent animate-spin"
            style={{ 
              borderTopColor: 'var(--sidebar-orange)',
              borderRightColor: 'var(--sidebar-orange)',
              borderBottomColor: 'rgba(92, 156, 124, 0.2)',
              borderLeftColor: 'rgba(92, 156, 124, 0.2)'
            }}
          ></div>
        </div>
        {/* Texto minimalista */}
        <p 
          className="text-sm font-medium"
          style={{ color: 'var(--sidebar-orange)' }}
        >
          Cargando
        </p>
      </div>
    </div>
  )
}
