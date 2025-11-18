'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router, isMounted])

  // Durante el render inicial en el servidor, no mostrar nada
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--swatch--gray-950)]" style={{ fontFamily: 'var(--font-inter)' }}>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--swatch--gray-950)]" style={{ fontFamily: 'var(--font-inter)' }}>
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

  if (!user) {
    return null
  }

  return <>{children}</>
}
