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
  // Obtener logs con paginación por páginas (similar a ventas)
  static async getLogsByPage(page: number = 1, limit: number = 20): Promise<{ logs: LogEntry[], total: number, hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit
      
      // Obtener total de logs
      const { count: totalCount, error: countError } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        return { logs: [], total: 0, hasMore: false }
      }

      // Obtener logs de la página
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
        return { logs: [], total: 0, hasMore: false }
      }
      
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

      const total = totalCount || 0
      const hasMore = offset + limit < total

      return { logs: mappedLogs, total, hasMore }
    } catch (error) {
      return { logs: [], total: 0, hasMore: false }
    }
  }

  // Obtener todos los logs (método legacy para compatibilidad)
  static async getAllLogs(): Promise<LogEntry[]> {
    try {
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
        return []
      }

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

      return mappedLogs
    } catch (error) {
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
      return []
    }
  }
}
