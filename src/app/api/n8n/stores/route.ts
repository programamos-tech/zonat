import { NextRequest, NextResponse } from 'next/server'
import { isAutomationAuthorized } from '@/lib/weekly-report/auth'
import { listActiveStores } from '@/lib/weekly-report/collect'
import { getWeeklyReportPeriod } from '@/lib/weekly-report/period'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const period = getWeeklyReportPeriod()
    const stores = await listActiveStores()
    return NextResponse.json({
      ok: true,
      cutoff: 'domingo 18:00 America/Bogota',
      period: {
        label: period.label,
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      stores,
    })
  } catch (error) {
    console.error('[n8n/stores]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error listando tiendas',
      },
      { status: 500 }
    )
  }
}
