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

    // Si es superadmin, redirigir al dashboard
    const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin'
    if (isSuperAdmin) {
      router.push('/dashboard')
    } else {
      // Para otros usuarios, redirigir a productos
      router.push('/products')
    }
  }, [router, user, isLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
      </div>
    </div>
  )
}