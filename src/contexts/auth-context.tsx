'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { AuthService } from '@/lib/auth-service'
import { invalidateSupabaseCache } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  createUser: (userData: any) => Promise<boolean>
  getAllUsers: () => Promise<User[]>
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
  switchStore: (storeId: string | undefined) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar sesión al cargar (con timeout para no quedarse colgado si Supabase no responde)
  const AUTH_CHECK_TIMEOUT_MS = 8000

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        const savedUser = localStorage.getItem('zonat_user')
        if (!savedUser) {
          setIsLoading(false)
          return
        }

        const userData = JSON.parse(savedUser)
        const savedStoreId = userData.storeId

        const currentUser = await Promise.race([
          AuthService.getCurrentUser(),
          new Promise<User | null>((resolve) =>
            setTimeout(() => resolve(null), AUTH_CHECK_TIMEOUT_MS)
          )
        ])

        if (cancelled) return

        if (currentUser) {
          if (savedStoreId !== undefined) {
            currentUser.storeId = savedStoreId === null ? undefined : savedStoreId
          }
          setUser(currentUser)
          const userToSave = {
            ...currentUser,
            storeId: currentUser.storeId === undefined ? null : currentUser.storeId
          }
          localStorage.setItem('zonat_user', JSON.stringify(userToSave))
          invalidateSupabaseCache()
        } else {
          // Timeout o error: usar usuario de localStorage para no bloquear la app
          if (userData?.id) {
            setUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              permissions: userData.permissions || [],
              isActive: userData.isActive,
              storeId: userData.storeId,
              lastLogin: userData.lastLogin,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt
            })
            invalidateSupabaseCache()
          } else {
            localStorage.removeItem('zonat_user')
          }
        }
      } catch {
        // Si falla el parse o algo, no bloquear
        if (!cancelled) localStorage.removeItem('zonat_user')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {

    setIsLoading(true)
    
    try {

      const userData = await AuthService.login(email, password)

      if (userData) {

        setUser(userData)
        if (typeof window !== 'undefined') {
          localStorage.setItem('zonat_user', JSON.stringify(userData))
          document.cookie = `zonat_user=${JSON.stringify(userData)}; path=/; max-age=86400`
          invalidateSupabaseCache()
        }
        setIsLoading(false)

        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      // Error silencioso en producción
      setIsLoading(false)
      return false
    }
  }

  const createUser = async (userData: any): Promise<boolean> => {
    try {
      const newUser = await AuthService.createUser(userData, user?.id)
      return newUser !== null
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  const getAllUsers = async (): Promise<User[]> => {
    try {
      return await AuthService.getAllUsers()
    } catch (error) {
      // Error silencioso en producción
      return []
    }
  }

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {

      const success = await AuthService.updateUser(id, updates, user?.id)

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
      // Error silencioso en producción
      return false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      return await AuthService.deleteUser(id, user?.id)
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zonat_user')
      document.cookie = 'zonat_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      invalidateSupabaseCache()
    }
  }

  const switchStore = (storeId: string | undefined) => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      storeId: storeId
    }
    
    setUser(updatedUser)
    if (typeof window !== 'undefined') {
      // Guardar con storeId explícito (incluso si es undefined) para que se preserve
      const userToSave = {
        ...updatedUser,
        storeId: storeId === undefined ? null : storeId // Convertir undefined a null para que se guarde en JSON
      }
      localStorage.setItem('zonat_user', JSON.stringify(userToSave))
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
      deleteUser,
      switchStore
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
