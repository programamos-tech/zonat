import { supabaseAdmin } from '@/lib/supabase'
import { MAIN_STORE_FALLBACK_NAME, MAIN_STORE_ID, isMainStoreId } from './constants'
import { getWeeklyReportPeriod } from './period'
import type {
  MainStoreWeeklyCreditRow,
  MainStoreWeeklyPayload,
  MainStoreWeeklySaleItemRow,
  MainStoreWeeklySaleRow,
} from './types'

const PAGE = 1000

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return rows
}

function bogotaLabel(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

function paymentLabel(method: string | null | undefined): string {
  const key = String(method || '').toLowerCase()
  if (key === 'cash' || key === 'efectivo') return 'Efectivo'
  if (key === 'transfer') return 'Transferencia'
  if (key === 'credit') return 'Crédito'
  if (key === 'mixed') return 'Mixto'
  if (key === 'warranty') return 'Garantía'
  return method || '—'
}

function creditStatusLabel(status: string | null | undefined): string {
  const key = String(status || '').toLowerCase()
  if (key === 'pending') return 'Pendiente'
  if (key === 'partial') return 'Parcial'
  if (key === 'overdue') return 'En mora'
  if (key === 'completed') return 'Pagado'
  if (key === 'cancelled') return 'Anulado'
  return status || '—'
}

function daysOverdue(dueIso: string | null | undefined, now: Date): number {
  if (!dueIso) return 0
  const due = new Date(dueIso)
  const ms = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

async function mainStoreName(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('stores')
    .select('name')
    .eq('id', MAIN_STORE_ID)
    .maybeSingle()
  return data?.name || MAIN_STORE_FALLBACK_NAME
}

export async function collectMainStoreWeeklyReport(
  now = new Date()
): Promise<MainStoreWeeklyPayload> {
  const period = getWeeklyReportPeriod(now)
  const startIso = period.start.toISOString()
  const endIso = period.end.toISOString()
  const storeName = await mainStoreName()

  type SaleRow = {
    id: string
    store_id: string | null
    invoice_number: string | null
    client_name: string | null
    total: number | null
    payment_method: string | null
    status: string | null
    seller_name: string | null
    created_at: string
    sale_payments: Array<{ payment_type?: string; amount?: number }> | null
  }

  const salesRaw = await fetchAllPages<SaleRow>((from, to) =>
    supabaseAdmin
      .from('sales')
      .select(
        `
        id,
        store_id,
        invoice_number,
        client_name,
        total,
        payment_method,
        status,
        seller_name,
        created_at,
        sale_payments ( payment_type, amount )
      `
      )
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'draft')
      .order('created_at', { ascending: true })
      .range(from, to)
  )

  const sales = salesRaw.filter((s) => isMainStoreId(s.store_id))
  const saleIds = sales.map((s) => s.id)

  type ItemRow = {
    sale_id: string
    product_name: string | null
    quantity: number | null
    unit_price: number | null
    total: number | null
  }

  const itemsRaw: ItemRow[] = []
  for (let i = 0; i < saleIds.length; i += 200) {
    const chunk = saleIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data, error } = await supabaseAdmin
      .from('sale_items')
      .select('sale_id, product_name, quantity, unit_price, total')
      .in('sale_id', chunk)
    if (error) throw new Error(error.message)
    itemsRaw.push(...(data || []))
  }

  const itemsBySale = new Map<string, ItemRow[]>()
  for (const item of itemsRaw) {
    const list = itemsBySale.get(item.sale_id) || []
    list.push(item)
    itemsBySale.set(item.sale_id, list)
  }

  const saleRows: MainStoreWeeklySaleRow[] = []
  const itemRows: MainStoreWeeklySaleItemRow[] = []
  let cash = 0
  let transfer = 0
  let creditSales = 0
  let units = 0

  for (const sale of sales) {
    const items = itemsBySale.get(sale.id) || []
    const saleUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    units += saleUnits

    let saleCash = 0
    let saleTransfer = 0
    const payments = sale.sale_payments
    if (payments && payments.length > 0) {
      for (const p of payments) {
        const amount = Number(p.amount) || 0
        if (p.payment_type === 'cash') saleCash += amount
        else if (p.payment_type === 'transfer') saleTransfer += amount
      }
    } else if (sale.payment_method === 'cash') {
      saleCash = Number(sale.total) || 0
    } else if (sale.payment_method === 'transfer') {
      saleTransfer = Number(sale.total) || 0
    }

    if (sale.payment_method === 'credit') {
      creditSales += Number(sale.total) || 0
    }

    cash += saleCash
    transfer += saleTransfer

    saleRows.push({
      invoiceNumber: sale.invoice_number || sale.id.slice(0, 8),
      date: bogotaLabel(sale.created_at),
      clientName: sale.client_name || 'Cliente',
      sellerName: sale.seller_name || '—',
      paymentMethod: paymentLabel(sale.payment_method),
      itemsCount: items.length,
      units: saleUnits,
      total: Number(sale.total) || 0,
      cash: saleCash,
      transfer: saleTransfer,
    })

    for (const item of items) {
      itemRows.push({
        invoiceNumber: sale.invoice_number || sale.id.slice(0, 8),
        date: bogotaLabel(sale.created_at),
        productName: item.product_name || 'Producto',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unit_price) || 0,
        total: Number(item.total) || 0,
        sellerName: sale.seller_name || '—',
      })
    }
  }

  type PaymentRecordRow = {
    store_id: string | null
    amount: number | null
    payment_method: string | null
    status: string | null
  }

  const abonosRaw = await fetchAllPages<PaymentRecordRow>((from, to) =>
    supabaseAdmin
      .from('payment_records')
      .select('store_id, amount, payment_method, status')
      .gte('payment_date', startIso)
      .lt('payment_date', endIso)
      .order('payment_date', { ascending: true })
      .range(from, to)
  )

  let abonos = 0
  for (const row of abonosRaw) {
    if (!isMainStoreId(row.store_id)) continue
    if (row.status === 'cancelled') continue
    const method = String(row.payment_method || '').toLowerCase()
    if (method !== 'cash' && method !== 'efectivo' && method !== 'transfer') continue
    const amount = Number(row.amount) || 0
    abonos += amount
    if (method === 'transfer') transfer += amount
    else cash += amount
  }

  type CreditRow = {
    id: string
    store_id: string | null
    client_name: string | null
    invoice_number: string | null
    total_amount: number | null
    paid_amount: number | null
    pending_amount: number | null
    status: string | null
    due_date: string | null
    created_at: string
  }

  const creditsIssuedRaw = await fetchAllPages<CreditRow>((from, to) =>
    supabaseAdmin
      .from('credits')
      .select(
        'id, store_id, client_name, invoice_number, total_amount, paid_amount, pending_amount, status, due_date, created_at'
      )
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })
      .range(from, to)
  )

  const toCreditRow = (credit: CreditRow, nowDate: Date): MainStoreWeeklyCreditRow => {
    const pending = Number(credit.pending_amount) || 0
    const total = Number(credit.total_amount) || 0
    const paid =
      credit.paid_amount != null ? Number(credit.paid_amount) : Math.max(0, total - pending)
    return {
      invoiceNumber: credit.invoice_number || credit.id.slice(0, 8),
      date: bogotaLabel(credit.created_at),
      clientName: credit.client_name || 'Cliente',
      totalAmount: total,
      paidAmount: paid,
      pendingAmount: pending,
      status: creditStatusLabel(credit.status),
      dueDate: credit.due_date ? bogotaLabel(credit.due_date) : '',
      daysOverdue: daysOverdue(credit.due_date, nowDate),
    }
  }

  const issued = creditsIssuedRaw
    .filter((c) => isMainStoreId(c.store_id))
    .map((c) => toCreditRow(c, now))

  const openRaw = await fetchAllPages<CreditRow>((from, to) =>
    supabaseAdmin
      .from('credits')
      .select(
        'id, store_id, client_name, invoice_number, total_amount, paid_amount, pending_amount, status, due_date, created_at'
      )
      .in('status', ['pending', 'partial', 'overdue'])
      .gt('pending_amount', 0)
      .order('created_at', { ascending: true })
      .range(from, to)
  )

  const overdue: MainStoreWeeklyCreditRow[] = []
  const current: MainStoreWeeklyCreditRow[] = []

  for (const credit of openRaw) {
    if (!isMainStoreId(credit.store_id)) continue
    const row = toCreditRow(credit, now)
    const isOverdue =
      credit.status === 'overdue' ||
      (Boolean(credit.due_date) && new Date(credit.due_date as string).getTime() < now.getTime())
    if (isOverdue) overdue.push(row)
    else current.push(row)
  }

  overdue.sort((a, b) => b.pendingAmount - a.pendingAmount || b.daysOverdue - a.daysOverdue)
  current.sort((a, b) => b.pendingAmount - a.pendingAmount)

  return {
    storeId: MAIN_STORE_ID,
    storeName,
    periodLabel: period.label,
    periodStart: startIso,
    periodEnd: endIso,
    generatedAt: now.toISOString(),
    sales: {
      count: saleRows.length,
      units,
      total: cash + transfer,
      cash,
      transfer,
      credit: creditSales,
      abonos,
      rows: saleRows,
      items: itemRows,
    },
    credits: {
      issuedCount: issued.length,
      issuedAmount: issued.reduce((sum, c) => sum + c.totalAmount, 0),
      issued,
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, c) => sum + c.pendingAmount, 0),
      overdue,
      currentCount: current.length,
      currentTotal: current.reduce((sum, c) => sum + c.pendingAmount, 0),
      current,
    },
  }
}

export function mainStoreExcelFilename(payload: MainStoreWeeklyPayload): string {
  const start = payload.periodStart.slice(0, 10)
  const end = payload.periodEnd.slice(0, 10)
  return `ZonaT-ventas-creditos-${start}_a_${end}.xlsx`
}
