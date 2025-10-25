import { supabase } from './supabase'

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
  // Obtener logs con paginación para scroll infinito
  static async getLogsPaginated(offset: number = 0, limit: number = 20): Promise<{ logs: LogEntry[], hasMore: boolean }> {
    try {
      console.log(`🔄 Obteniendo logs paginados (offset: ${offset}, limit: ${limit})...`)
      
      const { data: logs, error } = await supabase
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('❌ Error obteniendo logs:', error)
        return { logs: [], hasMore: false }
      }

      console.log('✅ Logs obtenidos de Supabase:', logs)
      
      const mappedLogs = logs.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.users?.name || 'Usuario Desconocido'
      }))

      console.log('✅ Logs mapeados:', mappedLogs)
      
      // Si obtenemos menos logs que el límite, no hay más páginas
      const hasMore = logs.length === limit
      
      return { logs: mappedLogs, hasMore }
    } catch (error) {
      console.error('❌ Error obteniendo logs:', error)
      return { logs: [], hasMore: false }
    }
  }

  // Obtener todos los logs (método legacy para compatibilidad)
  static async getAllLogs(): Promise<LogEntry[]> {
    try {
      console.log('🔄 Obteniendo todos los logs de Supabase...')
      
      const { data: logs, error } = await supabase
        .from('logs')
        .select(`
          *,
          users!logs_user_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error obteniendo logs:', error)
        return []
      }

      console.log('✅ Logs obtenidos de Supabase:', logs)
      
      const mappedLogs = logs.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.users?.name || 'Usuario Desconocido'
      }))

      console.log('✅ Logs mapeados:', mappedLogs)
      return mappedLogs
    } catch (error) {
      console.error('❌ Error obteniendo logs:', error)
      return []
    }
  }

  // Obtener logs por módulo
  static async getLogsByModule(module: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabase
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
        console.error('❌ Error obteniendo logs por módulo:', error)
        return []
      }

      return logs.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.users?.name || 'Usuario Desconocido'
      }))
    } catch (error) {
      console.error('❌ Error obteniendo logs por módulo:', error)
      return []
    }
  }

  // Obtener logs por usuario
  static async getLogsByUser(userId: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabase
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
        console.error('❌ Error obteniendo logs por usuario:', error)
        return []
      }

      return logs.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.users?.name || 'Usuario Desconocido'
      }))
    } catch (error) {
      console.error('❌ Error obteniendo logs por usuario:', error)
      return []
    }
  }

  // Buscar logs por término
  static async searchLogs(searchTerm: string): Promise<LogEntry[]> {
    try {
      const { data: logs, error } = await supabase
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
        console.error('❌ Error buscando logs:', error)
        return []
      }

      return logs.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        module: log.module,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.users?.name || 'Usuario Desconocido'
      }))
    } catch (error) {
      console.error('❌ Error buscando logs:', error)
      return []
    }
  }
}
