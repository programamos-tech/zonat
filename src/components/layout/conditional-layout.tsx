'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserNavbar } from '@/components/ui/user-navbar'
import { SupportButton } from '@/components/ui/support-button'
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
            <div className="flex h-screen">
              <Sidebar onMobileMenuToggle={setIsMobileMenuOpen} />
              <main className={`flex-1 xl:ml-64 relative z-10 transition-all duration-300 ${
                isMobileMenuOpen ? 'blur-sm' : ''
              }`}>
                <UserNavbar />
                <div className="h-full overflow-auto pt-20">
                  {children}
                </div>
                <SupportButton />
              </main>
            </div>
          </ProtectedRoute>
        )
}
