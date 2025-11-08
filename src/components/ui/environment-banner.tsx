'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function EnvironmentBanner() {
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [deploymentDate, setDeploymentDate] = useState<string>('')

  useEffect(() => {
    // Mostrar banner en desarrollo, staging, o ambientes de pruebas
    // Ocultar solo en producción explícita
    
    if (typeof window === 'undefined') return
    
    const hostname = window.location.hostname
    const isProduction = process.env.NEXT_PUBLIC_ENV === 'production' || 
                         hostname.includes('zonat.') && !hostname.includes('develop') && !hostname.includes('staging')
    
    // Mostrar si:
    // - Es localhost/local
    // - Contiene 'develop' en el hostname (como en Vercel)
    // - Contiene 'staging' o 'test'
    // - NO es producción
    const shouldShow = !isProduction || 
                      hostname.includes('localhost') ||
                      hostname.includes('local') ||
                      hostname.includes('develop') ||
                      hostname.includes('staging') ||
                      hostname.includes('test') ||
                      hostname.includes('127.0.0.1')
    
    setIsDevelopment(shouldShow)

    // Obtener fecha de despliegue
    // Intentar usar variable de entorno, si no existe usar fecha actual
    const deploymentDateEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_DATE
    if (deploymentDateEnv) {
      try {
        const date = new Date(deploymentDateEnv)
        setDeploymentDate(date.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
      } catch {
        setDeploymentDate(deploymentDateEnv)
      }
    } else {
      // Si no hay variable de entorno, usar fecha actual
      setDeploymentDate(new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
  }, [])

  const handleReportError = () => {
    const message = encodeURIComponent("Hola! Tengo un error o necesito soporte técnico en el sistema Zonat. ¿Podrías ayudarme?")
    const phoneNumber = "3002061711"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  if (!isDevelopment) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 xl:left-64 z-[100] border-b-2 shadow-lg"
      style={{ 
        backgroundColor: '#1a1a1a',
        borderColor: '#2a2a2a',
        fontFamily: 'var(--font-fira-code), "Courier New", monospace'
      }}
    >
      <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 px-2 md:px-4 py-1.5 md:py-2">
        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm font-semibold text-white flex-wrap md:flex-nowrap justify-center">
          <img 
            src="/logo_programamos.st.png" 
            alt="Programamos.st" 
            className="h-4 w-4 md:h-6 md:w-6 flex-shrink-0 object-contain"
          />
          <span className="whitespace-nowrap hidden md:inline">programamos.st</span>
          <span className="whitespace-nowrap md:hidden">p.st</span>
          <span className="mx-0.5 md:mx-1">-</span>
          <span className="whitespace-nowrap">Ambiente de Pruebas</span>
          <span className="mx-0.5 md:mx-1 hidden md:inline">-</span>
          <span className="whitespace-nowrap hidden md:inline">Versión 1</span>
          {deploymentDate && (
            <>
              <span className="mx-0.5 md:mx-1 hidden md:inline">-</span>
              <span className="whitespace-nowrap hidden md:inline">Desplegado: {deploymentDate}</span>
            </>
          )}
        </div>
        <Button
          onClick={handleReportError}
          className="bg-transparent hover:bg-white/10 border border-white/30 text-white text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 h-auto font-semibold whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-fira-code), "Courier New", monospace' }}
        >
          <span className="hidden md:inline">Reportar Error</span>
          <span className="md:hidden">Error</span>
        </Button>
      </div>
    </div>
  )
}

