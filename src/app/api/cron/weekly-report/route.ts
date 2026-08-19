import { NextRequest, NextResponse } from 'next/server'
import { isAutomationAuthorized } from '@/lib/weekly-report/auth'
import { sendWeeklyReportEmail } from '@/lib/weekly-report/send'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const preview =
    request.nextUrl.searchParams.get('preview') === '1' ||
    request.nextUrl.searchParams.get('preview') === 'true' ||
    request.nextUrl.searchParams.get('dryRun') === '1'

  try {
    const result = await sendWeeklyReportEmail({
      kind: 'weekly',
      previewOnly: preview,
    })
    return NextResponse.json({
      ok: true,
      preview: preview || undefined,
      to: result.to,
      emailId: result.emailId,
      periodLabel: result.payload.periodLabel,
      totals: result.payload.totals,
      storeCount: result.payload.stores.length,
    })
  } catch (error) {
    console.error('[cron/weekly-report]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error enviando reporte',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
