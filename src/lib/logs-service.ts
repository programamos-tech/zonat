import { supabase, supabaseAdmin } from './supabase'

export interface LogEntry {
  id: string
  user_id: string
  action: string
  module: string
  details: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user_name?: string
}

export class LogsService {
  // Obtener logs con paginación por páginas (similar a ventas)
  static async getLogsByPage(page: number = 1, limit: number = 20): Promise<{ logs: LogEntry[], total: number, hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit
      
      // Obtener total de logs (usar supabaseAdmin para evitar problemas de RLS)
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('logs')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('[LogsService] Error counting logs:', countError)
        return { logs: [], total: 0, hasMore: false }
      }

      // Obtener logs de la página (usar supabaseAdmin para evitar problemas de RLS)
      // Intentar primero con el JOIN, si falla se hará consulta separada
      // Especificar explícitamente la relación para evitar ambigüedad (PGRST201)
      const { data: logs, error } = await supabaseAdmin
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // Solo loguear si es un error crítico con información útil
        // Ignorar warnings de PostgREST y errores vacíos
        const hasUsefulInfo = (
          (error.message && typeof error.message === 'string' && error.message.trim().length > 0) ||
          (error.code && typeof error.code === 'string' && error.code !== 'PGRST116' && error.code.trim().length > 0) ||
          (error.details && typeof error.details === 'object' && Object.keys(error.details).length > 0)
        )
        
        if (!hasUsefulInfo) {
          // Error vacío o sin información útil, no loguear
        } else if (error.code !== 'PGRST116') {
          // Solo loguear si no es un warning de PostgREST
          console.error('[LogsService] Error fetching logs:', error)
        }
        // Si hay error con el join, intentar sin el join y luego obtener usuarios por separado
        const { data: logsWithoutJoin, error: errorWithoutJoin } = await supabaseAdmin
          .from('logs')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (errorWithoutJoin) {
          // Solo loguear si es un error crítico
          if (errorWithoutJoin.code && Object.keys(errorWithoutJoin).length > 0) {
            console.error('[LogsService] Error fetching logs without join:', errorWithoutJoin)
          }
          return { logs: [], total: 0, hasMore: false }
        }
        
        // Obtener user_ids únicos de los logs
        const userIds = [...new Set((logsWithoutJoin || [])
          .map(log => log.user_id)
          .filter(id => id))] as string[]
        
        // Obtener nombres de usuarios en una consulta separada
        const userNamesMap: Record<string, string> = {}
        if (userIds.length > 0) {
          try {
            const { data: usersData } = await supabaseAdmin
              .from('users')
              .select('id, name')
              .in('id', userIds)
            
            if (usersData) {
              usersData.forEach(user => {
                if (user.id && user.name) {
                  userNamesMap[user.id] = user.name
                }
              })
            }
          } catch (userError) {
            console.error('[LogsService] Error fetching user names:', userError)
          }
        }
        
        // Mapear logs con nombres de usuario
        const mappedLogs = (logsWithoutJoin || [])
          .filter(log => log && typeof log === 'object' && log.id)
          .map(log => ({
            id: log.id || '',
            user_id: log.user_id || null,
            action: log.action || 'unknown',
            module: log.module || 'unknown',
            details: log.details || {},
            ip_address: log.ip_address || null,
            user_agent: log.user_agent || null,
            created_at: log.created_at || new Date().toISOString(),
            user_name: log.user_id && userNamesMap[log.user_id] 
              ? userNamesMap[log.user_id] 
              : 'Usuario Desconocido'
          }))
        
        const total = totalCount || 0
        const hasMore = offset + limit < total
        return { logs: mappedLogs, total, hasMore }
      }
      
      // Validar y normalizar logs para evitar errores de renderizado
      // Obtener user_ids únicos para consulta separada si el JOIN no trajo datos
      const userIds = [...new Set((logs || [])
        .map(log => log.user_id)
        .filter(id => id))] as string[]
      
      // Obtener nombres de usuarios si el JOIN no funcionó correctamente
      const userNamesMap: Record<string, string> = {}
      if (userIds.length > 0) {
        try {
          const { data: usersData } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .in('id', userIds)
          
          if (usersData) {
            usersData.forEach(user => {
              if (user.id && user.name) {
                userNamesMap[user.id] = user.name
              }
            })
          }
        } catch (userError) {
          console.error('[LogsService] Error fetching user names:', userError)
        }
      }
      
      const mappedLogs = (logs || [])
        .filter(log => log && typeof log === 'object' && log.id)
        .map(log => {
          try {
            // Intentar obtener nombre del JOIN primero
            let userName = 'Usuario Desconocido'
            
            // Si users es un objeto (JOIN exitoso)
            if (log.users && typeof log.users === 'object' && !Array.isArray(log.users)) {
              if (log.users.name) {
                userName = String(log.users.name)
              }
            }
            // Si users es un array (múltiples relaciones)
            else if (Array.isArray(log.users) && log.users.length > 0 && log.users[0]?.name) {
              userName = String(log.users[0].name)
            }
            // Si el JOIN no funcionó, usar el mapa de usuarios
            else if (log.user_id && userNamesMap[log.user_id]) {
              userName = userNamesMap[log.user_id]
            }
            
            return {
              id: log.id || '',
              user_id: log.user_id || null,
              action: log.action || 'unknown',
              module: log.module || 'unknown',
              details: log.details || {},
              ip_address: log.ip_address || null,
              user_agent: log.user_agent || null,
              created_at: log.created_at || new Date().toISOString(),
              user_name: userName
            }
          } catch (mapError) {
            console.error('[LogsService] Error mapping log:', mapError, log)
            return null
          }
        })
        .filter(log => log !== null) as LogEntry[]

      const total = totalCount || 0
      const hasMore = offset + limit < total

      return { logs: mappedLogs, total, hasMore }
    } catch (error) {
      // Solo loguear errores críticos que tengan información útil
      if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        console.error('[LogsService] Exception in getLogsByPage:', error)
      }
      return { logs: [], total: 0, hasMore: false }
    }
  }

  // Obtener todos los logs (método legacy para compatibilidad)
  static async getAllLogs(): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LogsService] Error fetching all logs:', error)
        return []
      }

      // Validar y normalizar logs
      const mappedLogs = (logs || [])
        .filter(log => log && typeof log === 'object' && log.id)
        .map(log => {
          try {
            return {
              id: log.id || '',
              user_id: log.user_id || null,
              action: log.action || 'unknown',
              module: log.module || 'unknown',
              details: log.details || {},
              ip_address: log.ip_address || null,
              user_agent: log.user_agent || null,
              created_at: log.created_at || new Date().toISOString(),
              user_name: (log.users && typeof log.users === 'object' && log.users.name) 
                ? String(log.users.name) 
                : 'Usuario Desconocido'
            }
          } catch (mapError) {
            console.error('[LogsService] Error mapping log:', mapError, log)
            return null
          }
        })
        .filter(log => log !== null) as LogEntry[]

      return mappedLogs
    } catch (error) {
      console.error('[LogsService] Exception in getAllLogs:', error)
      return []
    }
  }

  // Obtener logs por módulo
  static async getLogsByModule(module: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .eq('module', module)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LogsService] Error fetching logs by module:', error)
        return []
      }

      // Validar y normalizar logs
      return (logs || [])
        .filter(log => log && typeof log === 'object' && log.id)
        .map(log => {
          try {
            return {
              id: log.id || '',
              user_id: log.user_id || null,
              action: log.action || 'unknown',
              module: log.module || 'unknown',
              details: log.details || {},
              ip_address: log.ip_address || null,
              user_agent: log.user_agent || null,
              created_at: log.created_at || new Date().toISOString(),
              user_name: (log.users && typeof log.users === 'object' && log.users.name) 
                ? String(log.users.name) 
                : 'Usuario Desconocido'
            }
          } catch (mapError) {
            console.error('[LogsService] Error mapping log:', mapError, log)
            return null
          }
        })
        .filter(log => log !== null) as LogEntry[]
    } catch (error) {
      console.error('[LogsService] Exception in getLogsByModule:', error)
      return []
    }
  }

  // Obtener logs por usuario
  static async getLogsByUser(userId: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LogsService] Error fetching logs by user:', error)
        return []
      }

      // Validar y normalizar logs
      return (logs || [])
        .filter(log => log && typeof log === 'object' && log.id)
        .map(log => {
          try {
            return {
              id: log.id || '',
              user_id: log.user_id || null,
              action: log.action || 'unknown',
              module: log.module || 'unknown',
              details: log.details || {},
              ip_address: log.ip_address || null,
              user_agent: log.user_agent || null,
              created_at: log.created_at || new Date().toISOString(),
              user_name: (log.users && typeof log.users === 'object' && log.users.name) 
                ? String(log.users.name) 
                : 'Usuario Desconocido'
            }
          } catch (mapError) {
            console.error('[LogsService] Error mapping log:', mapError, log)
            return null
          }
        })
        .filter(log => log !== null) as LogEntry[]
    } catch (error) {
      console.error('[LogsService] Exception in getLogsByUser:', error)
      return []
    }
  }

  // Buscar logs por término
  static async searchLogs(searchTerm: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .or(`action.ilike.%${searchTerm}%,module.ilike.%${searchTerm}%,details::text.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LogsService] Error searching logs:', error)
        return []
      }

      // Validar y normalizar logs
      return (logs || [])
        .filter(log => log && typeof log === 'object' && log.id)
        .map(log => {
          try {
            return {
              id: log.id || '',
              user_id: log.user_id || null,
              action: log.action || 'unknown',
              module: log.module || 'unknown',
              details: log.details || {},
              ip_address: log.ip_address || null,
              user_agent: log.user_agent || null,
              created_at: log.created_at || new Date().toISOString(),
              user_name: (log.users && typeof log.users === 'object' && log.users.name) 
                ? String(log.users.name) 
                : 'Usuario Desconocido'
            }
          } catch (mapError) {
            console.error('[LogsService] Error mapping log:', mapError, log)
            return null
          }
        })
        .filter(log => log !== null) as LogEntry[]
    } catch (error) {
      console.error('[LogsService] Exception in searchLogs:', error)
      return []
    }
  }
}
