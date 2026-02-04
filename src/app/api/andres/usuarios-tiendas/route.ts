import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API para andres.st / backstage: listar usuarios y "tienda" (Zonat es single-tenant:
 * una sola empresa, sin tabla stores). Devolvemos una tienda virtual con datos de company_config.
 *
 * Protegida por header x-andres-api-key (ANDRES_API_KEY en Zonat).
 */

const API_KEY_HEADER = 'x-andres-api-key'
const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get(API_KEY_HEADER)
    const expectedKey = process.env.ANDRES_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [usersRes, companyRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, name, email, role')
        .eq('is_active', true)
        .order('email'),
      supabaseAdmin
        .from('company_config')
        .select('id, name, value')
        .limit(1)
        .maybeSingle()
    ])

    if (usersRes.error) {
      console.error('[andres/usuarios-tiendas] users:', usersRes.error)
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }

    const companyRow = companyRes.data as { id?: string; name?: string; value?: string } | null
    const companyName = companyRow?.name ?? 'Zonat'
    let app_logo_url: string | null = null
    try {
      const val = companyRow?.value
      if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
        app_logo_url = val
      }
    } catch {
      // ignore
    }
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const baseClean = base.replace(/\/$/, '')
    if (app_logo_url?.startsWith('/')) {
      app_logo_url = `${baseClean}${app_logo_url}`
    } else if (!app_logo_url || !app_logo_url.startsWith('http')) {
      app_logo_url = `${baseClean}/zonat-logo.png`
    }

    const stores = [
      {
        id: MAIN_STORE_ID,
        name: companyName,
        logo_url: app_logo_url
      }
    ]

    const users = (usersRes.data ?? []).map(
      (u: { id: string; name: string; email: string; role: string }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        store_id: MAIN_STORE_ID,
        es_dueño:
          u.role === 'superadmin' ||
          u.role === 'Super Admin' ||
          u.role === 'Super Administrador' ||
          u.role?.toLowerCase() === 'admin'
      })
    )

    return NextResponse.json(
      { stores, users, app_logo_url, main_store_id: MAIN_STORE_ID },
      { status: 200 }
    )
  } catch (error) {
    console.error('[andres/usuarios-tiendas]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
