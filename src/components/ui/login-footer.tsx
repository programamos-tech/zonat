'use client'

import { Button } from '@/components/ui/button'
import { MapPin, MessageCircle, Mail } from 'lucide-react'

export function LoginFooter() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/573002061711?text=Hola,%20me%20interesa%20solicitar%20una%20demo%20gratis%20de%20Oviler', '_blank')
  }

  const handleContactClick = () => {
    window.open('mailto:contacto@programamos.st?subject=Solicitud de Demo Gratis - Oviler', '_blank')
  }

  return (
    <footer className="bg-white dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] py-8 md:py-12 w-full">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto">
          {/* Información de Oviler */}
          <div className="space-y-4">
            <div>
              <span className="text-2xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-inter)', color: 'var(--sidebar-orange)' }}>
                Oviler
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Gestión de tu Negocio
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hecho en Sincelejo con ❤️
            </p>
          </div>

          {/* Ubicación y Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ubicación</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--sidebar-orange)' }} />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Barrio El Socorro
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Calle 25 #15-30
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sincelejo, Sucre
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                <a
                  href="https://wa.me/573002061711"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--sidebar-orange)' }}
                >
                  +57 300 206 1711
                </a>
              </div>
            </div>
          </div>

          {/* CTA Demo Gratis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">¿Listo para comenzar?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Solicita tu demo gratis y descubre cómo Oviler puede transformar tu negocio.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleContactClick}
                className="w-full text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ backgroundColor: 'var(--sidebar-orange)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contáctanos para tu Demo Gratis
              </Button>
              <Button
                onClick={handleWhatsAppClick}
                variant="outline"
                className="w-full font-semibold py-2.5 rounded-xl border-2 transition-all duration-200"
                style={{ 
                  borderColor: 'var(--sidebar-orange)',
                  color: 'var(--sidebar-orange)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(92, 156, 124, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Oviler. Todos los derechos reservados. | Desarrollado por{' '}
            <a
              href="https://programamos.st"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--sidebar-orange)' }}
            >
              programamos.st
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

