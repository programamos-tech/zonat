#!/usr/bin/env node
/**
 * Genera y/o envía el reporte semanal usando env de producción.
 *
 * Uso:
 *   node scripts/send-weekly-report-preview.mjs            # guarda HTML preview
 *   node scripts/send-weekly-report-preview.mjs --send      # envía el correo
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.vercel.production' })
dotenv.config({ path: '.env.local' })

const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
const PAGE = 1000
const shouldSend = process.argv.includes('--send')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(supabaseUrl, serviceKey)

function storeKey(storeId) {
  if (!storeId || storeId === MAIN_STORE_ID) return MAIN_STORE_ID
  return storeId
}

function bogotaYmd(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const get = (t) => parts.find((p) => p.type === t)?.value || ''
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

function addDaysYmd(y, m, d, delta) {
  const base = new Date(Date.UTC(y, m - 1, d + delta))
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() }
}

function getPeriod(now = new Date()) {
  const { y, m, d, weekday } = bogotaYmd(now)
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1
  let monday = addDaysYmd(y, m, d, -daysSinceMonday)
  let sunday = addDaysYmd(monday.y, monday.m, monday.d, 6)
  let end = new Date(Date.UTC(sunday.y, sunday.m - 1, sunday.d, 5 + 18, 0, 0, 0))
  if (now.getTime() < end.getTime()) {
    monday = addDaysYmd(monday.y, monday.m, monday.d, -7)
    sunday = addDaysYmd(sunday.y, sunday.m, sunday.d, -7)
    end = new Date(Date.UTC(sunday.y, sunday.m - 1, sunday.d, 5 + 18, 0, 0, 0))
  }
  const start = new Date(Date.UTC(monday.y, monday.m - 1, monday.d, 5, 0, 0, 0))
  const fmt = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return {
    start,
    end,
    label: `${fmt.format(start)} – ${fmt.format(end)} (corte 6:00 p.m.)`,
  }
}

async function fetchAll(table, select, apply) {
  const rows = []
  let from = 0
  for (;;) {
    let q = sb.from(table).select(select).range(from, from + PAGE - 1)
    q = apply(q)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return rows
}

function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function emptyStore(id, name) {
  return {
    storeId: id,
    storeName: name,
    salesCount: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    creditAbonosRevenue: 0,
    creditsIssuedCount: 0,
    creditsIssuedAmount: 0,
    activeUsers: new Map(),
    topProducts: new Map(),
    overdue: new Map(),
    current: new Map(),
  }
}

function metricCard(label, value, sub) {
  return `<td style="width:33%;padding:6px;"><div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:10px;padding:12px 14px;"><div style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">${esc(label)}</div><div style="margin-top:4px;font-size:18px;font-weight:700;color:#18181b;">${esc(value)}</div>${sub ? `<div style="margin-top:4px;font-size:11px;color:#71717a;">${esc(sub)}</div>` : ''}</div></td>`
}

function listBlock(title, empty, rows) {
  if (!rows.length) {
    return `<div style="margin-top:16px;"><div style="font-size:12px;font-weight:700;color:#3f3f46;margin-bottom:8px;">${esc(title)}</div><div style="font-size:13px;color:#a1a1aa;">${esc(empty)}</div></div>`
  }
  const items = rows
    .map(
      (r) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;"><div style="font-size:13px;font-weight:600;color:#18181b;">${esc(r.left)}</div>${r.sub ? `<div style="font-size:11px;color:#71717a;margin-top:2px;">${esc(r.sub)}</div>` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;white-space:nowrap;font-size:13px;font-weight:600;">${esc(r.right)}</td></tr>`
    )
    .join('')
  return `<div style="margin-top:16px;"><div style="font-size:12px;font-weight:700;color:#3f3f46;margin-bottom:4px;">${esc(title)}</div><table width="100%" cellpadding="0" cellspacing="0">${items}</table></div>`
}

const period = getPeriod()
console.log('Periodo:', period.label)

const { data: stores, error: storesError } = await sb
  .from('stores')
  .select('id, name')
  .is('deleted_at', null)
  .eq('is_active', true)
  .order('name')
if (storesError) throw storesError

const byStore = new Map()
for (const s of stores) byStore.set(s.id, emptyStore(s.id, s.name))
if (!byStore.has(MAIN_STORE_ID)) byStore.set(MAIN_STORE_ID, emptyStore(MAIN_STORE_ID, 'Tienda principal'))

const sales = await fetchAll(
  'sales',
  'id, store_id, total, payment_method, status, seller_id, seller_name, sale_payments ( payment_type, amount )',
  (q) =>
    q
      .gte('created_at', period.start.toISOString())
      .lt('created_at', period.end.toISOString())
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'draft')
      .order('created_at', { ascending: true })
)

for (const sale of sales) {
  const report = byStore.get(storeKey(sale.store_id))
  if (!report) continue
  report.salesCount += 1
  if (sale.seller_id) {
    const u = report.activeUsers.get(sale.seller_id) || {
      name: sale.seller_name || 'Usuario',
      salesCount: 0,
      actionsCount: 0,
    }
    u.salesCount += 1
    if (sale.seller_name) u.name = sale.seller_name
    report.activeUsers.set(sale.seller_id, u)
  }
  const payments = sale.sale_payments
  if (payments?.length) {
    for (const p of payments) {
      const amount = Number(p.amount) || 0
      if (p.payment_type === 'cash') {
        report.cashRevenue += amount
        report.totalRevenue += amount
      } else if (p.payment_type === 'transfer') {
        report.transferRevenue += amount
        report.totalRevenue += amount
      }
    }
  } else if (sale.payment_method === 'cash' || sale.payment_method === 'transfer') {
    const amount = Number(sale.total) || 0
    report.totalRevenue += amount
    if (sale.payment_method === 'cash') report.cashRevenue += amount
    else report.transferRevenue += amount
  }
}

const abonos = await fetchAll(
  'payment_records',
  'store_id, amount, payment_method, status',
  (q) =>
    q
      .gte('payment_date', period.start.toISOString())
      .lt('payment_date', period.end.toISOString())
      .order('payment_date', { ascending: true })
)
for (const row of abonos) {
  if (row.status === 'cancelled') continue
  const method = String(row.payment_method || '').toLowerCase()
  if (!['cash', 'efectivo', 'transfer'].includes(method)) continue
  const report = byStore.get(storeKey(row.store_id))
  if (!report) continue
  const amount = Number(row.amount) || 0
  report.creditAbonosRevenue += amount
  report.totalRevenue += amount
  if (method === 'transfer') report.transferRevenue += amount
  else report.cashRevenue += amount
}

const creditsIssued = await fetchAll(
  'credits',
  'store_id, total_amount, status',
  (q) =>
    q
      .gte('created_at', period.start.toISOString())
      .lt('created_at', period.end.toISOString())
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })
)
for (const c of creditsIssued) {
  const report = byStore.get(storeKey(c.store_id))
  if (!report) continue
  report.creditsIssuedCount += 1
  report.creditsIssuedAmount += Number(c.total_amount) || 0
}

const openCredits = await fetchAll(
  'credits',
  'id, store_id, client_id, client_name, invoice_number, pending_amount, status, due_date',
  (q) =>
    q
      .in('status', ['pending', 'partial', 'overdue'])
      .gt('pending_amount', 0)
      .order('created_at', { ascending: true })
)
const now = new Date()
for (const credit of openCredits) {
  const report = byStore.get(storeKey(credit.store_id))
  if (!report) continue
  const clientId = credit.client_id || credit.id
  const pending = Number(credit.pending_amount) || 0
  const due = credit.due_date
  const isOverdue =
    credit.status === 'overdue' || (due && new Date(due).getTime() < now.getTime())
  const daysOverdue = due
    ? Math.max(0, Math.floor((now.getTime() - new Date(due).getTime()) / 86400000))
    : 0
  const bucket = isOverdue ? report.overdue : report.current
  const prev = bucket.get(clientId) || {
    clientName: credit.client_name || 'Cliente',
    pendingAmount: 0,
    daysOverdue: 0,
    invoiceNumber: credit.invoice_number,
  }
  prev.pendingAmount += pending
  prev.daysOverdue = Math.max(prev.daysOverdue, daysOverdue)
  bucket.set(clientId, prev)
}

const saleStore = new Map(sales.map((s) => [s.id, storeKey(s.store_id)]))
for (let i = 0; i < sales.length; i += 200) {
  const chunk = sales.slice(i, i + 200).map((s) => s.id)
  if (!chunk.length) break
  const { data: items, error } = await sb
    .from('sale_items')
    .select('sale_id, product_id, product_name, quantity, total')
    .in('sale_id', chunk)
  if (error) throw error
  for (const item of items || []) {
    const report = byStore.get(saleStore.get(item.sale_id))
    if (!report) continue
    const prev = report.topProducts.get(item.product_id) || {
      name: item.product_name || 'Producto',
      quantity: 0,
      revenue: 0,
    }
    prev.quantity += Number(item.quantity) || 0
    prev.revenue += Number(item.total) || 0
    report.topProducts.set(item.product_id, prev)
  }
}

try {
  const logs = await fetchAll('logs', 'user_id, store_id', (q) =>
    q
      .gte('created_at', period.start.toISOString())
      .lt('created_at', period.end.toISOString())
      .order('created_at', { ascending: true })
  )
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))]
  const nameById = new Map()
  if (userIds.length) {
    const { data: users } = await sb.from('users').select('id, name').in('id', userIds)
    for (const u of users || []) nameById.set(u.id, u.name)
  }
  for (const log of logs) {
    if (!log.user_id) continue
    const report = byStore.get(storeKey(log.store_id))
    if (!report) continue
    const u = report.activeUsers.get(log.user_id) || {
      name: nameById.get(log.user_id) || 'Usuario',
      salesCount: 0,
      actionsCount: 0,
    }
    u.actionsCount += 1
    if (nameById.get(log.user_id)) u.name = nameById.get(log.user_id)
    report.activeUsers.set(log.user_id, u)
  }
} catch (e) {
  console.warn('logs omitidos:', e.message)
}

const storeList = [...byStore.values()].sort((a, b) =>
  a.storeName.localeCompare(b.storeName, 'es')
)
const totals = storeList.reduce(
  (acc, s) => {
    acc.salesCount += s.salesCount
    acc.totalRevenue += s.totalRevenue
    acc.cashRevenue += s.cashRevenue
    acc.transferRevenue += s.transferRevenue
    acc.creditAbonosRevenue += s.creditAbonosRevenue
    acc.creditsIssuedCount += s.creditsIssuedCount
    acc.creditsIssuedAmount += s.creditsIssuedAmount
    acc.overdueClients += s.overdue.size
    acc.currentClients += s.current.size
    return acc
  },
  {
    salesCount: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    creditAbonosRevenue: 0,
    creditsIssuedCount: 0,
    creditsIssuedAmount: 0,
    overdueClients: 0,
    currentClients: 0,
  }
)

const generatedAt = new Date()
const generatedLabel = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(generatedAt)

const storeRows = storeList
  .map((store, i) => {
    const bg = i % 2 === 1 ? '#fafafa' : '#ffffff'
    const topUser = [...store.activeUsers.values()].sort(
      (a, b) => b.salesCount + b.actionsCount - (a.salesCount + a.actionsCount)
    )[0]
    const topProduct = [...store.topProducts.values()].sort(
      (a, b) => b.quantity - a.quantity
    )[0]
    const userLabel = topUser ? `${topUser.name} (${topUser.salesCount})` : '—'
    const productLabel = topProduct
      ? `${topProduct.name} · ${topProduct.quantity} uds`
      : '—'
    return `<tr style="background:${bg};"><td style="padding:12px 10px;border-bottom:1px solid #e4e4e7;font-size:13px;font-weight:700;vertical-align:top;">${esc(store.storeName)}</td><td style="padding:12px 10px;border-bottom:1px solid #e4e4e7;font-size:13px;text-align:right;white-space:nowrap;vertical-align:top;">${esc(formatCOP(store.totalRevenue))}<div style="font-size:11px;color:#71717a;margin-top:2px;">${store.salesCount} ventas</div></td><td style="padding:12px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;text-align:right;white-space:nowrap;vertical-align:top;">${store.creditsIssuedCount}<div style="font-size:11px;color:#71717a;margin-top:2px;">${esc(formatCOP(store.creditsIssuedAmount))}</div></td><td style="padding:12px 10px;border-bottom:1px solid #e4e4e7;font-size:12px;text-align:right;white-space:nowrap;vertical-align:top;">${store.overdue.size} / ${store.current.size}</td></tr><tr style="background:${bg};"><td colspan="4" style="padding:0 10px 12px;border-bottom:1px solid #e4e4e7;font-size:11px;color:#71717a;">Top vendedor: ${esc(userLabel)} · Top producto: ${esc(productLabel)}</td></tr>`
  })
  .join('')

const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Reporte semanal Zona T</title></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px 12px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;"><tr><td style="padding:4px 2px 16px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#65a30d;">Zona T</div><h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;">Resumen semanal</h1><p style="margin:6px 0 0;font-size:13px;color:#52525b;">${esc(period.label)} · ${esc(generatedLabel)}</p></td></tr><tr><td style="background:#18181b;border-radius:12px;padding:16px 18px;color:#fafafa;"><div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;">Ingresos totales</div><div style="margin-top:4px;font-size:28px;font-weight:700;">${esc(formatCOP(totals.totalRevenue))}</div><div style="margin-top:10px;font-size:12px;color:#d4d4d8;line-height:1.5;">${totals.salesCount} ventas · Efectivo ${esc(formatCOP(totals.cashRevenue))} · Transferencia ${esc(formatCOP(totals.transferRevenue))} · Abonos ${esc(formatCOP(totals.creditAbonosRevenue))}</div><div style="margin-top:6px;font-size:12px;color:#d4d4d8;">${totals.creditsIssuedCount} créditos nuevos (${esc(formatCOP(totals.creditsIssuedAmount))}) · ${totals.overdueClients} en mora · ${totals.currentClients} al día</div></td></tr><tr><td style="height:16px;"></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;"><table width="100%" cellpadding="0" cellspacing="0"><tr style="background:#f4f4f5;"><th align="left" style="padding:10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Tienda</th><th align="right" style="padding:10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Ingresos</th><th align="right" style="padding:10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Créditos</th><th align="right" style="padding:10px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Mora / Al día</th></tr>${storeRows}</table></td></tr><tr><td style="padding:14px 2px 0;font-size:11px;color:#a1a1aa;">Corte cada domingo a las 6:00 p.m. (Colombia).</td></tr></table></td></tr></table></body></html>`

const out = resolve('tmp-weekly-report-preview.html')
writeFileSync(out, html, 'utf8')
console.log('Preview HTML:', out)
console.log('Totales:', {
  sales: totals.salesCount,
  ingresos: formatCOP(totals.totalRevenue),
  creditos: totals.creditsIssuedCount,
  mora: totals.overdueClients,
  alDia: totals.currentClients,
  tiendas: storeList.length,
})

if (!shouldSend) {
  console.log('Sin envío. Usa --send para mandar el correo.')
  process.exit(0)
}

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error('RESEND_API_KEY no está definida. Acepta términos de Resend e instala la integración.')
  process.exit(1)
}

const to = (process.env.WEEKLY_REPORT_TO || 'programamos.st@gmail.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const from =
  process.env.RESEND_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  'Zona T Reportes <onboarding@resend.dev>'

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to,
    subject: `Zona T · Reporte semanal ${period.label}`,
    html,
  }),
})
const body = await res.json()
if (!res.ok) {
  console.error('Error Resend:', body)
  process.exit(1)
}
console.log('Correo enviado a', to.join(', '), 'id=', body.id)
