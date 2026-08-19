import { Resend } from 'resend'
import { buildMainStoreWeeklyWorkbook, excelMeta } from './excel'
import { buildMainStoreWeeklyHtml, buildMainStoreWeeklySubject } from './email-main-store'
import { collectMainStoreWeeklyReport, mainStoreExcelFilename } from './main-store'
import type { MainStoreWeeklyPayload } from './types'

export type MainStoreWeeklyBuilt = {
  payload: MainStoreWeeklyPayload
  html: string
  subject: string
  to: string[]
  from: string
  excel: Buffer
  filename: string
}

function getRecipients(): string[] {
  const raw =
    process.env.WEEKLY_REPORT_TO ||
    process.env.WEEKLY_REPORT_EMAIL ||
    'programamos.st@gmail.com'
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    'Zona T Reportes <onboarding@resend.dev>'
  )
}

export function summarizeMainStorePayload(payload: MainStoreWeeklyPayload) {
  return {
    storeId: payload.storeId,
    storeName: payload.storeName,
    periodLabel: payload.periodLabel,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
    generatedAt: payload.generatedAt,
    sales: {
      count: payload.sales.count,
      units: payload.sales.units,
      total: payload.sales.total,
      cash: payload.sales.cash,
      transfer: payload.sales.transfer,
      credit: payload.sales.credit,
      abonos: payload.sales.abonos,
    },
    credits: {
      issuedCount: payload.credits.issuedCount,
      issuedAmount: payload.credits.issuedAmount,
      overdueCount: payload.credits.overdueCount,
      overdueTotal: payload.credits.overdueTotal,
      currentCount: payload.credits.currentCount,
      currentTotal: payload.credits.currentTotal,
    },
  }
}

export async function buildMainStoreWeeklyPackage(now = new Date()): Promise<MainStoreWeeklyBuilt> {
  const payload = await collectMainStoreWeeklyReport(now)
  const excel = buildMainStoreWeeklyWorkbook(payload)
  return {
    payload,
    html: buildMainStoreWeeklyHtml(payload),
    subject: buildMainStoreWeeklySubject(payload),
    to: getRecipients(),
    from: getFromAddress(),
    excel,
    filename: mainStoreExcelFilename(payload),
  }
}

export async function sendMainStoreWeeklyEmail(now = new Date()) {
  const built = await buildMainStoreWeeklyPackage(now)
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY no configurada. Instala la integración Resend en Vercel o define la variable.'
    )
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: built.from,
    to: built.to,
    subject: built.subject,
    html: built.html,
    attachments: [
      {
        filename: built.filename,
        content: built.excel,
      },
    ],
  })

  if (error) {
    throw new Error(error.message || 'Error enviando correo con Resend')
  }

  return {
    to: built.to,
    emailId: data?.id,
    excel: excelMeta(built.payload, built.excel),
    summary: summarizeMainStorePayload(built.payload),
  }
}
