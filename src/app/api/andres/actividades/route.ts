import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API para andres.st / backstage: listar actividades (logs).
 * GET /api/andres/actividades?store_id=uuid&limit=50
 * Zonat no tiene store_id en logs; se ignora el filtro por tienda.
 * Protegida por header x-andres-api-key.
 */

const API_KEY_HEADER = 'x-andres-api-key'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get(API_KEY_HEADER)
    const expectedKey = process.env.ANDRES_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)

    const { data: logs, error: logsError } = await supabaseAdmin
      .from('logs')
      .select('id, user_id, action, module, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (logsError) {
      console.error('[andres/actividades]', logsError)
      return NextResponse.json({ error: 'Error fetching activities' }, { status: 500 })
    }

    const rows = logs ?? []
    const userIds = [...new Set(rows.map((l) => l.user_id).filter(Boolean))] as string[]
    let userNamesMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', userIds)
      if (usersData) {
        userNamesMap = Object.fromEntries(usersData.map((u) => [u.id, u.name ?? '']))
      }
    }

    const activities = rows.map(
      (l: { id: string; user_id: string | null; action: string; module: string; details: unknown; created_at: string }) => ({
        id: l.id,
        user_id: l.user_id,
        user_name: (l.user_id && userNamesMap[l.user_id]) || null,
        action: l.action,
        module: l.module,
        details: (l.details as Record<string, unknown>) ?? {},
        store_id: null,
        created_at: l.created_at
      })
    )

    return NextResponse.json({ activities }, { status: 200 })
  } catch (error) {
    console.error('[andres/actividades]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
