import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Obtener variables de entorno - NO usar valores por defecto para evitar conexiones incorrectas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. Crea .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (copia .env.local.example).'
  )
}

// Cache del cliente anon con header x-user-id (para RLS: get_current_user_id())
let cachedAnonClient: SupabaseClient | null = null
let cachedAnonUserId: string | null = undefined as unknown as string | null

function getAnonClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl!, supabaseAnonKey!)
  }
  let userId: string | null = null
  try {
    const u = localStorage.getItem('zonat_user')
    if (u) userId = JSON.parse(u).id ?? null
  } catch {
    // ignore
  }
  if (cachedAnonClient && cachedAnonUserId === userId) return cachedAnonClient
  cachedAnonUserId = userId
  cachedAnonClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { ...(userId ? { 'x-user-id': userId } : {}) } }
  })
  return cachedAnonClient
}

/** Invalidar caché del cliente anon (llamar en login/logout para que RLS use el usuario correcto) */
export function invalidateSupabaseCache(): void {
  cachedAnonClient = null
  cachedAnonUserId = undefined as unknown as string | null
}

// Cliente para operaciones del cliente (anon) — envía x-user-id para que RLS get_current_user_id() funcione
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAnonClient() as Record<string, unknown>)[prop as string]
  }
})

// Cliente para operaciones del servidor (service role)
// Solo crear si la key está disponible
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
  : supabase // Fallback al cliente anon si no hay service key (solo para desarrollo local)

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          role: string
          permissions: any[]
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          role: string
          permissions?: any[]
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          role?: string
          permissions?: any[]
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string
          permissions: any[]
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          permissions?: any[]
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          permissions?: any[]
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          user_id: string
          action: string
          module: string
          details: any
          ip_address: string | null
          user_agent: string | null
          store_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          module: string
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          store_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          module?: string
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          store_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
