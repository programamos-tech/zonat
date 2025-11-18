'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { UserCircle, ChevronDown, Briefcase } from 'lucide-react'

export function UserNavbar() {
  const router = useRouter()
  const { user } = useAuth()

  const handleProfileClick = () => {
    router.push('/profile')
  }

  if (!user) return null

  return (
    <div className="fixed top-0 right-0 left-0 xl:left-64 z-30 h-20 bg-white/80 backdrop-blur-xl dark:bg-[var(--swatch--gray-950)] border-b border-transparent flex items-center justify-between px-6 md:px-10" style={{ fontFamily: 'var(--font-inter)' }}>
       {/* Logo Oviler - Solo visible cuando el sidebar está oculto (móvil/tablet) */}
       <div className="xl:hidden flex flex-col">
         <Link href="/dashboard" className="cursor-pointer hover:opacity-90 transition-opacity">
           <span className="text-3xl font-black tracking-tighter animate-logo-entrance text-[#2D2D2D] dark:text-white" style={{ fontFamily: 'var(--font-inter)' }}>
             Oviler
           </span>
         </Link>
         <p className="text-[10px] text-gray-600 dark:text-white/70 mt-0.5 ml-0.5 animate-logo-entrance" style={{ animationDelay: '0.7s', opacity: 0 }}>
           Gestión de tu Negocio
         </p>
       </div>

      {/* Perfil de usuario - Alineado a la derecha */}
      <div className="flex items-center ml-auto gap-3">
        <Link
          href="/admin/clients"
          className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:translate-y-[-1px]"
          style={{ background: 'linear-gradient(135deg, #5CA9F5, #3C7DC2)' }}
        >
          <Briefcase className="h-4 w-4" />
          Panel Oviler
        </Link>
        {/* Logo y nombre del negocio */}
        <div className="hidden md:flex items-center gap-3 px-2 py-1.5 rounded-lg">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex items-center justify-center">
            <Image
              src="/zonat-logo.webp"
              alt="Logo del negocio"
              width={48}
              height={48}
              className="object-contain p-1.5"
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-white">
            Zonat
          </span>
        </div>
        
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#1F1F1F] cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <UserCircle className="h-8 w-8 flex-shrink-0 text-gray-700 dark:text-white" />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-700 dark:text-white">
                Hola, {user.name || 'Usuario'}!
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          </div>
        </button>
      </div>
    </div>
  )
}

