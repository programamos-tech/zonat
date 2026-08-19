import { Resend } from 'resend'
import { collectWeeklyReport } from './collect'
import { buildWeeklyReportHtml, buildWeeklyReportSubject } from './email-html'
import type { ReportKind } from './period'
import type { WeeklyReportPayload } from './types'

export type SendWeeklyReportResult = {
  payload: WeeklyReportPayload
  to: string[]
  emailId?: string
  previewOnly?: boolean
}

function getRecipients(): string[] {
  const raw = process.env.DIEGO_REPORT_TO || 'Diegotoro648@gmail.com'
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

export async function buildWeeklyReportEmail(
  now = new Date(),
  options?: { storeIds?: string[]; kind?: ReportKind }
) {
  const payload = await collectWeeklyReport(now, options)
  const html = buildWeeklyReportHtml(payload)
  const subject = buildWeeklyReportSubject(payload)
  return { payload, html, subject, to: getRecipients(), from: getFromAddress() }
}

export async function sendWeeklyReportEmail(options?: {
  now?: Date
  previewOnly?: boolean
  storeIds?: string[]
  kind?: ReportKind
}): Promise<SendWeeklyReportResult> {
  const built = await buildWeeklyReportEmail(options?.now, {
    storeIds: options?.storeIds,
    kind: options?.kind,
  })

  if (options?.previewOnly) {
    return { payload: built.payload, to: built.to, previewOnly: true }
  }

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
  })

  if (error) {
    throw new Error(error.message || 'Error enviando correo con Resend')
  }

  return {
    payload: built.payload,
    to: built.to,
    emailId: data?.id,
  }
}
