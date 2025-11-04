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
      <div className="flex items-center justify-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-white">
          <img 
            src="/logo_programamos.st.png" 
            alt="Programamos.st" 
            className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 object-contain"
          />
          <span className="whitespace-nowrap">programamos.st</span>
          <span className="mx-1">-</span>
          <span className="whitespace-nowrap">Ambiente de Pruebas</span>
          <span className="mx-1">-</span>
          <span className="whitespace-nowrap">Versión 1</span>
          {deploymentDate && (
            <>
              <span className="mx-1">-</span>
              <span className="whitespace-nowrap">Desplegado: {deploymentDate}</span>
            </>
          )}
        </div>
        <Button
          onClick={handleReportError}
          className="bg-transparent hover:bg-white/10 border border-white/30 text-white text-xs px-3 py-1 h-auto font-semibold"
          style={{ fontFamily: 'var(--font-fira-code), "Courier New", monospace' }}
        >
          Reportar Error
        </Button>
      </div>
    </div>
  )
}

