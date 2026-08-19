import type { NextRequest } from 'next/server'

function collectSecrets(): string[] {
  return [process.env.CRON_SECRET, process.env.N8N_WEBHOOK_SECRET].filter(
    (value): value is string => Boolean(value)
  )
}

export function isAutomationAuthorized(request: NextRequest): boolean {
  const secrets = collectSecrets()
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const headerSecret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('x-n8n-secret') ||
    ''
  const querySecret = request.nextUrl.searchParams.get('secret') || ''

  for (const secret of secrets) {
    if (bearer === secret || headerSecret === secret || querySecret === secret) {
      return true
    }
  }

  // Vercel Cron envía Authorization: Bearer <CRON_SECRET>
  if (secrets.length === 0 && process.env.NODE_ENV !== 'production') {
    return true
  }

  return false
}
