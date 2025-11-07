'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login, isLoading } = useAuth()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:min-h-[680px] rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800">
          {/* Panel Izquierdo con Logo */}
          <div className="hidden md:flex md:w-1/2 bg-gray-900 dark:bg-gray-800 items-center justify-center p-10 md:p-16">
            <div className="relative w-[200px] h-[200px] flex items-center justify-center">
              <img
                src="/zonat-logo.png"
                alt="ZONA T Logo"
                className="max-w-full max-h-full object-contain rounded-xl"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Panel Derecho con Formulario */}
          <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 flex items-center justify-center p-6 md:p-16">
            <div className="w-full max-w-md">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Bienvenido</h2>
                <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                {/* Email */}
                <div className="space-y-3">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="diego@zonat.com"
                      className="pl-12 h-12 md:h-14 text-base md:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-3">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-12 md:h-14 text-base md:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white"
                      {...register('password')}
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
                  className="w-full h-12 md:h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-base md:text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

              {/* Footer */}
              <div className="text-center mt-8 md:mt-12">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  © 2025 ZONA T. Todos los derechos reservados.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  Desarrollado por{' '}
                  <a 
                    href="https://programamos.st" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
                  >
                    programamos.st
                  </a>
                  {' '}• Descubre más aquí
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}