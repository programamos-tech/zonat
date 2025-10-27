import { supabase, supabaseAdmin } from './supabase'
import { User } from '@/types'

export class AuthService {
  // Login de usuario
  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Iniciando proceso de login para:', email)
      
      console.log('📡 Consultando usuario en base de datos...')
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      console.log('📡 Respuesta de consulta usuario:', { user: user ? 'encontrado' : 'no encontrado', error })

      if (error || !user) {
        console.log('❌ Usuario no encontrado o error:', error)
        return null
      }

      console.log('🔑 Verificando contraseña...')
      // En un entorno real, aquí verificarías el hash de la contraseña
      // Por ahora, comparamos directamente (solo para desarrollo)
      if (user.password !== password) {
        console.log('❌ Contraseña incorrecta')
        return null
      }

      console.log('✅ Credenciales válidas, actualizando último login...')
      // Actualizar último login
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.log('⚠️ Error actualizando último login:', updateError)
      } else {
        console.log('✅ Último login actualizado')
      }

      console.log('📝 Registrando log de actividad...')
      // Registrar log de login (no bloquear si falla)
      try {
        await this.logActivity(user.id, 'login', 'auth', {
          email: user.email,
          timestamp: new Date().toISOString()
        })
        console.log('✅ Log de actividad registrado')
      } catch (logError) {
        console.log('⚠️ Error registrando log (no crítico):', logError)
      }

      console.log('✅ Login completado exitosamente')
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    } catch (error) {
      console.error('❌ Error en login:', error)
      return null
    }
  }

  // Crear usuario (solo para Diego como superadmin)
  static async createUser(userData: {
    name: string
    email: string
    password: string
    role: string
    permissions: any[]
  }, currentUserId?: string): Promise<User | null> {
    try {
      console.log('🔄 Creando usuario en Supabase:', userData)
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          password: userData.password, // En producción, hashear la contraseña
          role: userData.role,
          permissions: userData.permissions,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creando usuario:', error)
        return null
      }

      console.log('✅ Usuario creado exitosamente:', user)
      
      // Registrar actividad
      await this.logActivity(
        currentUserId || '00000000-0000-0000-0000-000000000001', // Usuario actual o Diego Admin
        'Usuario Creado',
        'roles',
        {
          newUser: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions || []
          },
          createdBy: currentUserId ? 'Usuario Actual' : 'Diego Admin'
        }
      )
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    } catch (error) {
      console.error('❌ Error creando usuario:', error)
      return null
    }
  }

  // Obtener usuario por ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error)
      return null
    }
  }

  // Obtener todos los usuarios
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔄 Obteniendo usuarios de Supabase...')
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error obteniendo usuarios:', error)
        return []
      }

      console.log('✅ Usuarios obtenidos de Supabase:', users)
      const mappedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
      
      console.log('✅ Usuarios mapeados:', mappedUsers)
      return mappedUsers
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error)
      return []
    }
  }

  // Actualizar usuario
  static async updateUser(id: string, updates: Partial<User>, currentUserId?: string): Promise<boolean> {
    try {
      // Obtener datos del usuario antes de actualizar
      const currentUser = await this.getUserById(id)
      
      // Mapear nombres de columnas de camelCase a snake_case
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      }
      
      if (updates.name) dbUpdates.name = updates.name
      if (updates.email) dbUpdates.email = updates.email
      if (updates.password) dbUpdates.password = updates.password
      if (updates.role) dbUpdates.role = updates.role
      if (updates.permissions) dbUpdates.permissions = updates.permissions
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
      if (updates.lastLogin) dbUpdates.last_login = updates.lastLogin

      console.log('🔄 Actualizando usuario en Supabase:', {
        userId: id,
        updates: updates,
        dbUpdates: dbUpdates
      })

      const { error } = await supabaseAdmin
        .from('users')
        .update(dbUpdates)
        .eq('id', id)

      if (error) {
        console.error('❌ Error actualizando usuario en Supabase:', {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          dbUpdates,
          userId: id
        })
        return false
      }

      // Registrar actividad específica según el tipo de cambio
      let actionType = 'Usuario Editado'
      let description = `Actualización general de usuario: ${currentUser?.name || 'Usuario Desconocido'}`
      
      if (updates.permissions) {
        actionType = 'Permisos Asignados'
        
        // Comparar permisos anteriores con los nuevos para detectar cambios específicos
        const previousPermissions = currentUser?.permissions || []
        const newPermissions = updates.permissions || []
        
        // Detectar permisos agregados y removidos
        const addedPermissions = []
        const removedPermissions = []
        
        // Obtener todos los módulos únicos
        const allModules = [...new Set([
          ...previousPermissions.map((p: any) => p.module),
          ...newPermissions.map((p: any) => p.module)
        ])]
        
        for (const module of allModules) {
          const prevModule = previousPermissions.find((p: any) => p.module === module)
          const newModule = newPermissions.find((p: any) => p.module === module)
          
          const prevActions = prevModule?.actions || []
          const newActions = newModule?.actions || []
          
          const addedActions = newActions.filter((action: string) => !prevActions.includes(action))
          const removedActions = prevActions.filter((action: string) => !newActions.includes(action))
          
          if (addedActions.length > 0) {
            addedPermissions.push(`${module}: ${addedActions.join(', ')}`)
          }
          if (removedActions.length > 0) {
            removedPermissions.push(`${module}: ${removedActions.join(', ')}`)
          }
        }
        
        // Construir descripción detallada
        let changesDescription = []
        if (addedPermissions.length > 0) {
          changesDescription.push(`Agregados: ${addedPermissions.join('; ')}`)
        }
        if (removedPermissions.length > 0) {
          changesDescription.push(`Removidos: ${removedPermissions.join('; ')}`)
        }
        
        // Crear resumen de permisos actuales
        const permissionsSummary = newPermissions.map((p: any) => {
          const moduleName = p.module === 'dashboard' ? 'Dashboard' :
                            p.module === 'products' ? 'Productos' :
                            p.module === 'clients' ? 'Clientes' :
                            p.module === 'sales' ? 'Ventas' :
                            p.module === 'payments' ? 'Abonos' :
                            p.module === 'roles' ? 'Roles' :
                            p.module === 'logs' ? 'Logs' :
                            p.module
          
          const actionsText = p.actions.map((action: string) => {
            return action === 'view' ? 'Ver' :
                   action === 'create' ? 'Crear' :
                   action === 'edit' ? 'Editar' :
                   action === 'delete' ? 'Eliminar' :
                   action === 'cancel' ? 'Cancelar' :
                   action
          }).join(', ')
          
          return `${moduleName}: ${actionsText}`
        }).join(' | ')
        
        if (changesDescription.length > 0) {
          description = `${currentUser?.name || 'Usuario Desconocido'} - Módulos: ${changesDescription.join(' | ')}. Resumen: ${permissionsSummary}`
        } else {
          description = `${currentUser?.name || 'Usuario Desconocido'} - Resumen: ${permissionsSummary}`
        }
      } else if (updates.role) {
        actionType = 'Rol Cambiado'
        description = `Cambio de rol: ${currentUser?.name || 'Usuario Desconocido'} - De: ${currentUser?.role || 'Desconocido'} a: ${updates.role}`
      } else if (updates.isActive !== undefined) {
        actionType = updates.isActive ? 'Usuario Reactivado' : 'Usuario Desactivado'
        description = `${actionType}: ${currentUser?.name || 'Usuario Desconocido'}`
      }

      await this.logActivity(
        currentUserId || '00000000-0000-0000-0000-000000000001', // Usuario actual o Diego Admin
        actionType,
        'roles',
        {
          userId: id,
          userName: currentUser?.name || 'Usuario Desconocido',
          changes: updates,
          description: description,
          updatedBy: currentUserId ? 'Usuario Actual' : 'Diego Admin'
        }
      )

      return true
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      return false
    }
  }

  // Eliminar usuario
  static async deleteUser(id: string, currentUserId?: string): Promise<boolean> {
    try {
      // Obtener datos del usuario antes de eliminar
      const currentUser = await this.getUserById(id)
      
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando usuario:', error)
        return false
      }

      // Registrar actividad
      await this.logActivity(
        currentUserId || '00000000-0000-0000-0000-000000000001', // Usuario actual o Diego Admin
        'Usuario Eliminado',
        'roles',
        {
          deletedUser: {
            id: currentUser?.id || id,
            name: currentUser?.name || 'Usuario Desconocido',
            email: currentUser?.email || 'Email Desconocido',
            role: currentUser?.role || 'Rol Desconocido'
          },
          deletedBy: currentUserId ? 'Usuario Actual' : 'Diego Admin'
        }
      )

      return true
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      return false
    }
  }

  // Registrar actividad en logs
  static async logActivity(
    userId: string, 
    action: string, 
    module: string, 
    details: any
  ): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('logs')
        .insert({
          user_id: userId,
          action,
          module,
          details,
          ip_address: null, // Se puede obtener del request
          user_agent: null, // Se puede obtener del request
          created_at: new Date().toISOString()
        })
        .select()
        
      if (error) {
        console.error('Error insertando log en Supabase:', error)
      }
    } catch (error) {
      console.error('Error registrando actividad:', error)
    }
  }

  // Función específica para registrar cambios de permisos
  static async logPermissionChange(
    currentUserId: string,
    targetUserId: string,
    targetUserName: string,
    module: string,
    previousPermissions: string[],
    newPermissions: string[],
    action: 'granted' | 'revoked'
  ): Promise<void> {
    try {
      const actionType = action === 'granted' ? 'Permisos Asignados' : 'Permisos Revocados'
      const description = action === 'granted' 
        ? `Permisos asignados a ${targetUserName} en módulo ${module}: ${newPermissions.join(', ')}`
        : `Permisos revocados a ${targetUserName} en módulo ${module}: ${previousPermissions.join(', ')}`

      await this.logActivity(
        currentUserId,
        actionType,
        'roles',
        {
          targetUserId,
          targetUserName,
          module,
          previousPermissions,
          newPermissions,
          action,
          description
        }
      )
    } catch (error) {
      console.error('Error registrando cambio de permisos:', error)
    }
  }

  // Inicializar datos por defecto (solo para Diego)
  static async initializeDefaultData(): Promise<void> {
    try {
      // Verificar si Diego ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'diego@zonat.com')
        .single()

      if (existingUser) {
        console.log('Diego ya existe en la base de datos')
        return
      }

      // Crear Diego como superadmin
      await this.createUser({
        name: 'Diego Admin',
        email: 'diego@zonat.com',
        password: 'admin123',
        role: 'superadmin',
        permissions: [
          { module: 'dashboard', actions: ['view'] },
          { module: 'products', actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'cancel'] },
          { module: 'payments', actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'logs', actions: ['view'] }
        ]
      })

      console.log('Datos iniciales creados exitosamente')
    } catch (error) {
      console.error('Error inicializando datos:', error)
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (typeof window === 'undefined') {
        console.log('🔍 DEBUG getCurrentUser: window is undefined')
        return null
      }

      const userData = localStorage.getItem('zonat_user')
      
      if (!userData) {
        return null
      }

      const user = JSON.parse(userData)
      
      // Verificar que el usuario sigue activo en la base de datos
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single()

      if (error || !dbUser) {
        // Si el usuario no existe o no está activo, limpiar localStorage
        localStorage.removeItem('zonat_user')
        return null
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        permissions: dbUser.permissions || [],
        isActive: dbUser.is_active,
        lastLogin: dbUser.last_login,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}
