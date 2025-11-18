'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, Mail, Lock, Package, ShoppingCart, Users, CreditCard, BarChart3, CheckCircle, Store, BookOpen, Laptop, ArrowRight, X, Monitor, Receipt, RefreshCw, ShieldCheck, Activity, Lightbulb, Wrench, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoginFooter } from '@/components/ui/login-footer'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()
  const { login, isLoading } = useAuth()

  const heroImages = [
    '/pexels-kampus-7289710.jpg',
    '/pexels-minan1398-1087727.jpg',
    '/tom-official-h0nYotrMIPU-unsplash.jpg'
  ]

  // Auto-rotar imágenes cada 5 segundos
  useState(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    
    const success = await login(data.email, data.password)
    
    if (success) {
      router.push('/')
    } else {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    }
  }

  const flowSteps = [
    {
      icon: ShoppingCart,
      title: 'Órdenes de compra',
      description: 'Planificas la reposición con proveedores y dejas trazabilidad de cada pedido.'
    },
    {
      icon: Package,
      title: 'Recepción de mercancía',
      description: 'Recibes los productos, verificas cantidades y actualizas su estado.'
    },
    {
      icon: Receipt,
      title: 'Generas ventas',
      description: 'Creas facturas, controlas precios y defines métodos de pago en segundos.'
    },
    {
      icon: RefreshCw,
      title: 'Actualizas stock',
      description: 'Cada venta o entrada ajusta automáticamente los inventarios.'
    },
    {
      icon: CreditCard,
      title: 'Cartera y créditos',
      description: 'Monitoreas saldos pendientes, cobros y recordatorios para mayoristas.'
    },
    {
      icon: Users,
      title: 'Roles y equipo',
      description: 'Asignas permisos por área y haces que cada usuario sepa qué debe hacer.'
    },
    {
      icon: BarChart3,
      title: 'Rentabilidad e insights',
      description: 'Visualizas ganancias brutas, productos más rentables y recomendaciones accionables.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--swatch--gray-950)]" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div>
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-[#2D2D2D] dark:text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                Oviler
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-semibold text-sm md:text-sm transition-all duration-200 text-white"
                style={{ 
                  backgroundColor: '#5CA9F5',
                  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 5px 12px rgba(0, 0, 0, 0.12)'
                  e.currentTarget.style.backgroundColor = '#3C7DC2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.backgroundColor = '#5CA9F5'
                }}
              >
                <span className="relative z-10">Iniciar Sesión</span>
              </button>
              <button
                onClick={() => window.open('mailto:contacto@programamos.st?subject=Solicitud de Demo Gratis - Oviler', '_blank')}
                className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-semibold text-sm md:text-sm transition-all duration-200 text-[#3C7DC2]"
                style={{ 
                  backgroundColor: 'rgba(92, 169, 245, 0.15)',
                  boxShadow: '0 3px 8px rgba(60, 125, 194, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 5px 12px rgba(60, 125, 194, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(60, 125, 194, 0.15)'
                }}
              >
                Solicitar Demo Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen px-4 md:px-8 lg:px-12 py-12 md:py-20 flex items-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 50%, #E1EEFF 100%)'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div className="text-gray-900 space-y-6">
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-[#5CA9F5] font-semibold">Operación interna + rentabilidad real</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight" style={{ fontFamily: 'var(--font-inter)' }}>
            Organiza tu equipo y visualiza la rentabilidad real de tu negocio
          </h1>
          <div className="space-y-4 text-base md:text-lg text-gray-700">
            <p>
              Oviler está centrado en el día a día operativo: recibir mercancía, controlar inventario, crear facturas, gestionar garantías, créditos, roles y registrar cada actividad de tu equipo.
            </p>
            <p>
              Con esa operatividad construimos tus datos financieros: analizamos ventas, stock, productos rentables, márgenes y ganancias brutas en un tablero claro que te muestra dónde estás ganando y dónde puedes mejorar.
            </p>
          </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              onClick={() => setShowLoginModal(true)}
              className="text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duración-200"
              style={{ backgroundColor: '#5CA9F5' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3C7DC2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5CA9F5')}
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => window.open('mailto:contacto@programamos.st?subject=Solicitud de Demo Gratis - Oviler', '_blank')}
              variant="outline"
              className="font-semibold px-8 py-4 text-lg rounded-full border-2 transition-all duration-200"
              style={{ 
                borderColor: '#5CA9F5',
                color: '#5CA9F5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(92, 169, 245, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Habla con nuestro equipo
            </Button>
            </div>
          </div>
          <div className="w-full h-full">
            <div className="relative w-full min-h-[520px] rounded-[32px] overflow-hidden shadow-2xl border border-white/70 bg-white flex items-center justify-center p-4">
              <Image
                src="/screenshots/oviler-dashboard.png"
                alt="Dashboard Oviler en escritorio"
                width={1400}
                height={900}
                className="max-h-full w-auto rounded-[24px] shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Flujo Operativo */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Gráfico a la izquierda */}
            <div className="hidden lg:block order-2 lg:order-1">
              <div className="relative w-full aspect-square max-w-[640px]">
            <div className="absolute inset-12 rounded-full border-2 border-dashed border-[#DDEAFD]"></div>
            {flowSteps.map((step, index) => {
              const angle = (index / flowSteps.length) * Math.PI * 2 - Math.PI / 2
              const radius = 230
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="absolute w-[190px] bg-white border border-[#E3ECFB] rounded-2xl shadow-[0_15px_40px_-25px_rgba(92,169,245,0.8)] p-4 text-center flex flex-col gap-2"
                  style={{
                    top: `calc(50% + ${y}px - 95px)`,
                    left: `calc(50% + ${x}px - 95px)`
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#F3F8FF] mx-auto flex items-center justify-center">
                    {Icon && <Icon className="h-5 w-5 text-[#5CA9F5]" />}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Paso {index + 1}</p>
                  <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
            <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-[#5CA9F5] via-[#4D90DC] to-[#3C7DC2] text-white flex flex-col items-center justify-center shadow-[0_20px_50px_-30px_rgba(48,101,166,0.7)] p-6">
              <span className="text-3xl md:text-4xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-inter)' }}>
                Oviler
              </span>
            </div>
              </div>
            </div>
            
            {/* Título y descripción a la derecha */}
            <div className="order-1 lg:order-2 space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#5CA9F5] font-semibold">Cómo funciona Oviler</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Del abastecimiento a los insights financieros</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Sigue el flujo operativo: abasteces, vendes, controlas tu equipo y terminas con indicadores reales para tomar decisiones.
              </p>
            </div>
          </div>
        </div>
        
        {/* Versión móvil */}
        <div className="max-w-4xl mx-auto mt-10 space-y-6 lg:hidden">
          <div className="text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#5CA9F5] font-semibold">Cómo funciona Oviler</p>
            <h2 className="text-3xl font-bold text-gray-900">Del abastecimiento a los insights financieros</h2>
            <p className="text-lg text-gray-600">
              Sigue el flujo operativo: abasteces, vendes, controlas tu equipo y terminas con indicadores reales para tomar decisiones.
            </p>
          </div>
          <div className="space-y-4">
          {flowSteps.map((step, index) => (
            <div key={step.title} className="bg-[#F7F9FC] rounded-2xl p-5 border border-[#E6ECF5] shadow-[0_10px_30px_-15px_rgba(92,169,245,0.4)] flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-[#E2E9F5] shadow-inner">
                <step.icon className="h-5 w-5 text-[#5CA9F5]" />
              </div>
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Paso {index + 1}</p>
                <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* Tipos de Negocio */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#5CA9F5] font-semibold">Sectores que usan Oviler</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Diseñado para los negocios que mueven inventario todos los días
              </h2>
              <p className="text-lg text-gray-600">
                Cada módulo se adapta a lo que necesita tu operación. Desde una librería con miles de referencias, hasta una ferretería, una tienda de tecnología o un comercio que vende al detal y al por mayor.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Librerías',
                    description: 'Catálogos extensos, referencias y préstamos internos.'
                  },
                  {
                    title: 'Farmacias',
                    description: 'Control de lotes, vencimientos y créditos a mayoristas.'
                  },
                  {
                    title: 'Tiendas de tecnología',
                    description: 'Garantías, números de serie y servicios técnicos.'
                  },
                  {
                    title: 'Ferreterías',
                    description: 'Inventario pesado, pedidos especiales y múltiples bodegas.'
                  },
                  {
                    title: 'Tiendas generales',
                    description: 'Entradas y salidas rápidas, ventas mixtas y promociones.'
                  },
                  {
                    title: 'Distribuidoras y mini cadenas',
                    description: 'Stock en varios puntos, roles por equipo y reportes diarios.'
                  }
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-2xl border border-gray-200 bg-white shadow-[0_10px_25px_-20px_rgba(92,169,245,0.7)]">
                    <p className="text-base font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[500px] lg:h-[600px]">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#E8F2FF] to-white shadow-2xl" />
              <div className="absolute -bottom-6 left-0 w-[60%] rounded-3xl overflow-hidden shadow-2xl border border-white/70 bg-white">
                <Image
                  src="/pexels-minan1398-1087727.jpg"
                  alt="Farmacia"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 right-0 w-[55%] rounded-3xl overflow-hidden shadow-2xl border border-white/70 bg-white">
                <Image
                  src="/pexels-kampus-7289710.jpg"
                  alt="Librería"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] rounded-3xl overflow-hidden shadow-2xl border border-white/70 bg-white z-10">
                <Image
                  src="/tom-official-h0nYotrMIPU-unsplash.jpg"
                  alt="Negocio"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-16">
        <LoginFooter />
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            
            <div className="p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Iniciar Sesión</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Ingresa tus credenciales para acceder
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@oviler.com"
                      className="pl-12 h-12 border-2 border-gray-200 dark:border-[rgba(255,255,255,0.06)] focus:border-[var(--sidebar-orange)] focus:ring-[var(--sidebar-orange)] rounded-xl bg-gray-50 dark:bg-[#1A1A1A] dark:text-white"
                      style={{ fontFamily: 'var(--font-inter)' }}
                      {...register('email')}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = ''
                        e.currentTarget.style.boxShadow = ''
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-12 border-2 border-gray-200 dark:border-[rgba(255,255,255,0.06)] focus:border-[var(--sidebar-orange)] focus:ring-[var(--sidebar-orange)] rounded-xl bg-gray-50 dark:bg-[#1A1A1A] dark:text-white"
                      style={{ fontFamily: 'var(--font-inter)' }}
                      {...register('password')}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = ''
                        e.currentTarget.style.boxShadow = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 rounded-xl">
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botón de Login */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: 'var(--sidebar-orange)' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
