'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    
    // Si no hay usuario, redirigir a login
    if (!user) {
      router.push('/login')
      return
    }

    // Siempre enviar a dashboard como página inicial
    router.push('/dashboard')
  }, [router, user, isLoading])

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