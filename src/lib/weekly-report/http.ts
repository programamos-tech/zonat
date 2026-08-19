import { NextRequest, NextResponse } from 'next/server'
import { isAutomationAuthorized } from './auth'
import {
  buildWeeklyReportEmail,
  sendWeeklyReportEmail,
} from './send'
import type { ReportKind } from './period'

async function parseStoreIds(request: NextRequest): Promise<string[] | undefined> {
  const fromQuery = request.nextUrl.searchParams.get('storeId')
  if (fromQuery) return [fromQuery]

  if (request.method !== 'POST') return undefined

  try {
    const body = await request.json()
    if (Array.isArray(body?.storeIds)) {
      return body.storeIds.filter((id: unknown) => typeof id === 'string' && id)
    }
    if (typeof body?.storeId === 'string' && body.storeId) {
      return [body.storeId]
    }
  } catch {
    // body vacío o no JSON: todas las tiendas
  }
  return undefined
}

export async function handleWeeklyReportRequest(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const preview =
    request.nextUrl.searchParams.get('preview') === '1' ||
    request.nextUrl.searchParams.get('preview') === 'true'
  const dryRun =
    request.nextUrl.searchParams.get('dryRun') === '1' ||
    request.nextUrl.searchParams.get('dryRun') === 'true'

  const storeIds = await parseStoreIds(request)
  const kindParam = (request.nextUrl.searchParams.get('kind') || '').toLowerCase()
  const kind: ReportKind = kindParam === 'monthly' ? 'monthly' : 'weekly'

  try {
    if (preview || dryRun) {
      const built = await buildWeeklyReportEmail(new Date(), { storeIds, kind })
      return NextResponse.json({
        ok: true,
        preview: true,
        to: built.to,
        subject: built.subject,
        periodLabel: built.payload.periodLabel,
        periodStart: built.payload.periodStart,
        periodEnd: built.payload.periodEnd,
        totals: built.payload.totals,
        stores: built.payload.stores.map((s) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          salesCount: s.salesCount,
          totalRevenue: s.totalRevenue,
          creditsIssuedCount: s.creditsIssuedCount,
          overdueCount: s.overdueCount,
          currentCount: s.currentCount,
        })),
        html: preview ? built.html : undefined,
      })
    }

    const result = await sendWeeklyReportEmail({ storeIds, kind })
    console.log('[weekly-report] enviado', {
      to: result.to,
      emailId: result.emailId,
      periodLabel: result.payload.periodLabel,
      storeCount: result.payload.stores.length,
    })
    return NextResponse.json({
      ok: true,
      to: result.to,
      emailId: result.emailId,
      periodLabel: result.payload.periodLabel,
      periodStart: result.payload.periodStart,
      periodEnd: result.payload.periodEnd,
      totals: result.payload.totals,
      storeCount: result.payload.stores.length,
    })
  } catch (error) {
    console.error('[weekly-report]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error generando reporte',
      },
      { status: 500 }
    )
  }
}
