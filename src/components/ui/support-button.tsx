'use client'

import { AlertCircle, X, MessageCircle } from 'lucide-react'
import { useState } from 'react'

export function SupportButton() {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSupportClick = () => {
    const message = encodeURIComponent('Hola, necesito hablar con soporte rápidamente')
    const whatsappUrl = `https://wa.me/573002061711?text=${message}`
    window.open(whatsappUrl, '_blank')
    setIsExpanded(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="flex flex-col items-end gap-3">
          {/* Botón principal expandido */}
          <button
            onClick={handleSupportClick}
            className="flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-white font-semibold relative"
            style={{ backgroundColor: 'var(--sidebar-orange)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm whitespace-nowrap">Necesito hablar con soporte rápidamente</span>
            {/* Badge de emergencia */}
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              URGENTE
            </span>
          </button>
          {/* Botón para cerrar */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-12 h-12 rounded-full bg-gray-800 dark:bg-gray-700 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        /* Botón flotante compacto */
        <button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white relative"
          style={{ backgroundColor: 'var(--sidebar-orange)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Soporte de Emergencia"
        >
          <AlertCircle className="h-7 w-7" />
          {/* Badge de emergencia */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            !
          </span>
        </button>
      )}
    </div>
  )
}

