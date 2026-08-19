import type { MainStoreWeeklyPayload } from './types'

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

export function buildMainStoreWeeklySubject(payload: MainStoreWeeklyPayload): string {
  return `Zona T · Ventas y créditos ${payload.periodLabel}`
}

const LOGO_URL = 'https://www.zonat.com.co/logo-zonat-gold.jpeg'

export function buildMainStoreWeeklyHtml(payload: MainStoreWeeklyPayload): string {
  const generatedLabel = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(payload.generatedAt))

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ventas y créditos Zona T</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:20px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:4px 2px 16px;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                <tr>
                  <td width="72" height="72" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#18181b;">
                    <!--[if mso]>
                    <v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:72px;height:72px;" stroked="false">
                      <v:fill type="frame" src="${LOGO_URL}" />
                    </v:oval>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <img
                      src="${LOGO_URL}"
                      alt="Zona T"
                      width="72"
                      height="72"
                      style="display:block;width:72px;height:72px;border:0;border-radius:50%;object-fit:cover;-ms-interpolation-mode:bicubic;"
                    />
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <h1 style="margin:14px 0 0;font-size:22px;line-height:1.25;color:#18181b;">Ventas y créditos</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#52525b;">
                ${esc(payload.storeName)} · ${esc(payload.periodLabel)} · ${esc(generatedLabel)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#18181b;border-radius:12px;padding:16px 18px;color:#fafafa;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;">Ingresos de la semana</div>
              <div style="margin-top:4px;font-size:28px;font-weight:700;letter-spacing:-0.02em;">${esc(formatCOP(payload.sales.total))}</div>
              <div style="margin-top:10px;font-size:12px;color:#d4d4d8;line-height:1.5;">
                ${payload.sales.count} ventas ·
                ${payload.sales.units} unidades ·
                Efectivo ${esc(formatCOP(payload.sales.cash))} ·
                Transferencia ${esc(formatCOP(payload.sales.transfer))}
              </div>
            </td>
          </tr>

          <tr><td style="height:16px;"></td></tr>

          <tr>
            <td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Créditos</div>
              <p style="margin:8px 0 0;font-size:14px;color:#18181b;line-height:1.5;">
                ${payload.credits.issuedCount} créditos nuevos (${esc(formatCOP(payload.credits.issuedAmount))})
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#3f3f46;line-height:1.5;">
                ${payload.credits.overdueCount} clientes en mora (${esc(formatCOP(payload.credits.overdueTotal))}) ·
                ${payload.credits.currentCount} al día (${esc(formatCOP(payload.credits.currentTotal))})
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 2px 0;font-size:11px;color:#a1a1aa;line-height:1.4;">
              Adjunto: Excel con ventas, productos, créditos de la semana, morosos y al día.
              Corte domingo 5:00 p.m. (Colombia).
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
