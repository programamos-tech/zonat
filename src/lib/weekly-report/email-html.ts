import type { PeriodDayMetrics, WeeklyReportPayload, WeeklyStoreReport } from './types'

const LOGO_URL = 'https://www.zonat.com.co/logo-zonat-gold.jpeg'

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function esc(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function logoBlock(): string {
  return `
              <table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                <tr>
                  <td width="72" height="72" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#18181b;">
                    <img
                      src="${LOGO_URL}"
                      alt="Zona T"
                      width="72"
                      height="72"
                      style="display:block;width:72px;height:72px;border:0;border-radius:50%;object-fit:cover;-ms-interpolation-mode:bicubic;"
                    />
                  </td>
                </tr>
              </table>`
}

function dayRow(day: PeriodDayMetrics, odd: boolean): string {
  const bg = odd ? '#fafafa' : '#ffffff'
  return `
    <tr style="background:${bg};">
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#18181b;text-transform:capitalize;">${esc(day.label)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#18181b;text-align:right;">${day.salesCount}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#18181b;text-align:right;white-space:nowrap;">${esc(formatCOP(day.totalRevenue))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#3f3f46;text-align:right;white-space:nowrap;">${esc(formatCOP(day.creditAbonosRevenue))}</td>
    </tr>`
}

function storeCard(store: WeeklyStoreReport): string {
  const dayRows = store.days.map((d, i) => dayRow(d, i % 2 === 1)).join('')
  return `
          <tr><td style="height:16px;"></td></tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td colspan="4" style="padding:14px 16px 8px;">
                    <div style="font-size:15px;font-weight:700;color:#18181b;">${esc(store.storeName)}</div>
                    <div style="margin-top:4px;font-size:12px;color:#52525b;line-height:1.5;">
                      ${store.salesCount} ventas ·
                      Ingresos ${esc(formatCOP(store.totalRevenue))} ·
                      Abonos ${esc(formatCOP(store.creditAbonosRevenue))}
                    </div>
                    <div style="margin-top:2px;font-size:11px;color:#71717a;">
                      Efectivo ${esc(formatCOP(store.cashRevenue))} ·
                      Transferencia ${esc(formatCOP(store.transferRevenue))} ·
                      Créditos nuevos ${store.creditsIssuedCount} (${esc(formatCOP(store.creditsIssuedAmount))})
                    </div>
                  </td>
                </tr>
                <tr style="background:#f4f4f5;">
                  <th align="left" style="padding:8px 10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Día</th>
                  <th align="right" style="padding:8px 10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Ventas</th>
                  <th align="right" style="padding:8px 10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Ingresos</th>
                  <th align="right" style="padding:8px 10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Abonos</th>
                </tr>
                ${dayRows}
              </table>
            </td>
          </tr>`
}

export function buildWeeklyReportHtml(payload: WeeklyReportPayload): string {
  const { totals, stores, periodLabel, generatedAt, kind } = payload
  const generatedLabel = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(generatedAt))
  const title = kind === 'monthly' ? 'Resumen mensual' : 'Resumen semanal'
  const footer =
    kind === 'monthly'
      ? 'Corte el último día del mes a las 9:00 p.m. (Colombia). Sin Excel: solo este correo.'
      : 'Corte cada domingo a las 5:00 p.m. (Colombia). Sin Excel: solo este correo.'

  const storeCards = stores.map((s) => storeCard(s)).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} Zona T</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:20px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:4px 2px 16px;">
              ${logoBlock()}
              <h1 style="margin:14px 0 0;font-size:22px;line-height:1.25;color:#18181b;">${esc(title)}</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#52525b;">
                ${esc(periodLabel)} · ${esc(generatedLabel)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#18181b;border-radius:12px;padding:16px 18px;color:#fafafa;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;">Ingresos totales</div>
              <div style="margin-top:4px;font-size:28px;font-weight:700;letter-spacing:-0.02em;">${esc(formatCOP(totals.totalRevenue))}</div>
              <div style="margin-top:10px;font-size:12px;color:#d4d4d8;line-height:1.5;">
                ${totals.salesCount} ventas ·
                ${stores.length} tiendas ·
                Efectivo ${esc(formatCOP(totals.cashRevenue))} ·
                Transferencia ${esc(formatCOP(totals.transferRevenue))}
              </div>
            </td>
          </tr>

          <tr><td style="height:16px;"></td></tr>

          <tr>
            <td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Dinero recogido por abonos</div>
              <div style="margin-top:6px;font-size:24px;font-weight:700;color:#18181b;">${esc(formatCOP(totals.creditAbonosRevenue))}</div>
              <p style="margin:8px 0 0;font-size:13px;color:#3f3f46;line-height:1.5;">
                ${totals.creditsIssuedCount} créditos nuevos (${esc(formatCOP(totals.creditsIssuedAmount))}) ·
                ${totals.overdueClients} clientes en mora ·
                ${totals.currentClients} al día
              </p>
            </td>
          </tr>

          ${storeCards}

          <tr>
            <td style="padding:14px 2px 0;font-size:11px;color:#a1a1aa;line-height:1.4;">
              ${esc(footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildWeeklyReportSubject(payload: WeeklyReportPayload): string {
  const kind = payload.kind === 'monthly' ? 'Resumen mensual' : 'Resumen semanal'
  return `Zona T · ${kind} ${payload.periodLabel}`
}
