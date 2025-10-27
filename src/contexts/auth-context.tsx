'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { AuthService } from '@/lib/auth-service'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  createUser: (userData: any) => Promise<boolean>
  getAllUsers: () => Promise<User[]>
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('zonat_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          // Verificar que el usuario aún existe en la base de datos
          const currentUser = await AuthService.getUserById(userData.id)
          if (currentUser) {
            setUser(currentUser)
          } else {
            localStorage.removeItem('zonat_user')
          }
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🚀 AuthContext: Iniciando login...')
    setIsLoading(true)
    
    try {
      console.log('📞 AuthContext: Llamando a AuthService.login...')
      const userData = await AuthService.login(email, password)
      
      console.log('📞 AuthContext: Respuesta de AuthService:', userData ? 'usuario obtenido' : 'null')
      
      if (userData) {
        console.log('✅ AuthContext: Usuario válido, configurando estado...')
        setUser(userData)
        if (typeof window !== 'undefined') {
          localStorage.setItem('zonat_user', JSON.stringify(userData))
          document.cookie = `zonat_user=${JSON.stringify(userData)}; path=/; max-age=86400`
          console.log('💾 AuthContext: Usuario guardado en localStorage y cookie')
        }
        setIsLoading(false)
        console.log('✅ AuthContext: Login exitoso')
        return true
      }
      
      console.log('❌ AuthContext: Usuario inválido')
      setIsLoading(false)
      return false
    } catch (error) {
      console.error('❌ AuthContext: Error en login:', error)
      setIsLoading(false)
      return false
    }
  }

  const createUser = async (userData: any): Promise<boolean> => {
    try {
      const newUser = await AuthService.createUser(userData, user?.id)
      return newUser !== null
    } catch (error) {
      console.error('Error creando usuario:', error)
      return false
    }
  }

  const getAllUsers = async (): Promise<User[]> => {
    try {
      return await AuthService.getAllUsers()
    } catch (error) {
      console.error('Error obteniendo usuarios:', error)
      return []
    }
  }

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      console.log('🔄 AuthContext: Actualizando usuario:', { id, updates, currentUserId: user?.id })
      const success = await AuthService.updateUser(id, updates, user?.id)
      console.log('✅ AuthContext: Resultado de actualización:', success)
      
      if (success && user?.id === id) {
        // Actualizar usuario actual si es el mismo
        const updatedUser = await AuthService.getUserById(id)
        if (updatedUser) {
          setUser(updatedUser)
          if (typeof window !== 'undefined') {
            localStorage.setItem('zonat_user', JSON.stringify(updatedUser))
          }
        }
      }
      return success
    } catch (error) {
      console.error('❌ AuthContext: Error actualizando usuario:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorStack: error instanceof Error ? error.stack : undefined,
        id,
        updates
      })
      return false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      return await AuthService.deleteUser(id, user?.id)
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zonat_user')
      document.cookie = 'zonat_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      createUser, 
      getAllUsers, 
      updateUser, 
      deleteUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
