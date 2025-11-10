'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect } from 'react'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Si es la página de login, no mostrar sidebar ni protección
  if (pathname === '/login') {
    return <>{children}</>
  }
  
  // Para todas las demás páginas, mostrar el layout completo con sidebar
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <Sidebar onMobileMenuToggle={setIsMobileMenuOpen} />
        <main className={`flex-1 xl:ml-64 relative z-10 bg-white dark:bg-gray-900 transition-all duration-300 ${
          isMobileMenuOpen ? 'blur-sm' : ''
        }`}>
          <div className="h-full overflow-auto bg-white dark:bg-gray-900">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
