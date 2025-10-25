import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbkihtgpuzyywhmkwtgc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjgwMzIsImV4cCI6MjA3NjkwNDAzMn0.IkllhPygyMvL1Wha1g803_0iTBzgc2RKLj8KLLGLiNg'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyODAzMiwiZXhwIjoyMDc2OTA0MDMyfQ.IVwGBykWyy2UH724J1TKUnaq47ccIXVUOoPxI2E-ghw'

// Validar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  console.error('Asegúrate de tener un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Cliente para operaciones del cliente (anon)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para operaciones del servidor (service role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
          created_at?: string
        }
      }
    }
  }
}
