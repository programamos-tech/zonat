import { NextRequest, NextResponse } from 'next/server'
import { isAutomationAuthorized } from '@/lib/weekly-report/auth'
import { excelMeta } from '@/lib/weekly-report/excel'
import {
  buildMainStoreWeeklyPackage,
  sendMainStoreWeeklyEmail,
  summarizeMainStorePayload,
} from '@/lib/weekly-report/send-main-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const format = (request.nextUrl.searchParams.get('format') || '').toLowerCase()

  try {
    const built = await buildMainStoreWeeklyPackage()
    const excel = excelMeta(built.payload, built.excel)

    if (format === 'xlsx' || format === 'excel') {
      return new NextResponse(new Uint8Array(built.excel), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${excel.filename}"`,
          'X-Excel-Bytes': String(excel.bytes),
          'X-Period-Label': encodeURIComponent(built.payload.periodLabel),
        },
      })
    }

    const summary = summarizeMainStorePayload(built.payload)
    return NextResponse.json({
      ok: true,
      to: built.to,
      subject: built.subject,
      html: built.html,
      excel,
      ...summary,
      salesRows: built.payload.sales.rows,
      productRows: built.payload.sales.items,
      creditRows: built.payload.credits.issued,
      overdueRows: built.payload.credits.overdue,
      currentRows: built.payload.credits.current,
    })
  } catch (error) {
    console.error('[n8n/main-store/weekly]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error generando reporte',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await sendMainStoreWeeklyEmail()
    console.log('[n8n/main-store/weekly] enviado', result)
    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error('[n8n/main-store/weekly] send', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error enviando reporte',
      },
      { status: 500 }
    )
  }
}
