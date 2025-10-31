'use client'

import { useEffect, useState } from 'react'

export function EnvironmentBanner() {
  const [isDevelopment, setIsDevelopment] = useState(false)

  useEffect(() => {
    // Verificar si estamos en desarrollo local
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.includes('local'))
    
    setIsDevelopment(isLocal)
  }, [])

  if (!isDevelopment) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 xl:left-64 z-[100] border-b-2 shadow-lg"
      style={{ 
        backgroundColor: '#230f49',
        borderColor: '#3d1f6b'
      }}
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white">
        <img 
          src="/logo_programamos.st.png" 
          alt="Programamos.st" 
          className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 object-contain"
        />
        <span className="uppercase tracking-wide">Ambiente de Pruebas - DEVELOP</span>
        <span className="hidden md:inline">| programamos.st</span>
      </div>
    </div>
  )
}

