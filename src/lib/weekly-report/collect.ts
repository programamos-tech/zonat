import { supabaseAdmin } from '@/lib/supabase'
import { getReportPeriod, listBogotaDays, bogotaDayKey } from './period'
import type { ReportKind } from './period'
import type {
  PeriodDayMetrics,
  WeeklyClientDebt,
  WeeklyReportPayload,
  WeeklyStoreReport,
  WeeklyStoreUser,
  WeeklyTopProduct,
} from './types'

const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
const PAGE = 1000

function storeKey(storeId: string | null | undefined): string {
  if (!storeId || storeId === MAIN_STORE_ID) return MAIN_STORE_ID
  return storeId
}

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

function emptyDay(date: string, label: string): PeriodDayMetrics {
  return {
    date,
    label,
    salesCount: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    creditAbonosRevenue: 0,
    creditsIssuedCount: 0,
    creditsIssuedAmount: 0,
  }
}

function emptyStore(
  storeId: string,
  storeName: string,
  days: Array<{ key: string; label: string }>
): WeeklyStoreReport {
  return {
    storeId,
    storeName,
    salesCount: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    creditAbonosRevenue: 0,
    creditsIssuedCount: 0,
    creditsIssuedAmount: 0,
    days: days.map((d) => emptyDay(d.key, d.label)),
    activeUsers: [],
    topProducts: [],
    overdueClients: [],
    currentClients: [],
    overdueCount: 0,
    currentCount: 0,
    overdueTotal: 0,
    currentTotal: 0,
  }
}

function dayOf(
  report: WeeklyStoreReport,
  iso: string | null | undefined
): PeriodDayMetrics | null {
  if (!iso) return report.days[0] || null
  const key = bogotaDayKey(iso)
  return report.days.find((d) => d.date === key) || null
}

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso)
  const ms = to.getTime() - from.getTime()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

export type ActiveStore = { id: string; name: string }

export async function listActiveStores(): Promise<ActiveStore[]> {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id, name, is_active')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return (data || []).map((s) => ({ id: s.id, name: s.name }))
}

export async function collectWeeklyReport(
  now = new Date(),
  options?: { storeIds?: string[]; kind?: ReportKind }
): Promise<WeeklyReportPayload> {
  const kind = options?.kind || 'weekly'
  const period = getReportPeriod(kind, now)
  const startIso = period.start.toISOString()
  const endIso = period.end.toISOString()
  const requestedIds = options?.storeIds?.filter(Boolean)
  const filterIds =
    requestedIds && requestedIds.length > 0 ? new Set(requestedIds) : null
  const periodDays = listBogotaDays(period.start, period.end)

  const storesRaw = await listActiveStores()
  const stores = filterIds
    ? storesRaw.filter((s) => filterIds.has(s.id))
    : storesRaw

  const byStore = new Map<string, WeeklyStoreReport>()
  for (const s of stores) {
    byStore.set(s.id, emptyStore(s.id, s.name, periodDays))
  }
  if (!filterIds && !byStore.has(MAIN_STORE_ID)) {
    byStore.set(
      MAIN_STORE_ID,
      emptyStore(MAIN_STORE_ID, 'Tienda principal', periodDays)
    )
  }

  type SaleRow = {
    id: string
    store_id: string | null
    total: number | null
    payment_method: string | null
    status: string | null
    seller_id: string | null
    seller_name: string | null
    created_at: string
    sale_payments:
      | Array<{ payment_type?: string; amount?: number }>
      | null
  }

  const sales = await fetchAllPages<SaleRow>((from, to) =>
    supabaseAdmin
      .from('sales')
      .select(
        `
        id,
        store_id,
        total,
        payment_method,
        status,
        seller_id,
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

  const saleIds = sales.map((s) => s.id)
  const usersByStore = new Map<string, Map<string, WeeklyStoreUser>>()

  const bumpUser = (
    storeId: string,
    userId: string | null,
    name: string | null,
    kind: 'sale' | 'action'
  ) => {
    if (!userId) return
    if (!usersByStore.has(storeId)) usersByStore.set(storeId, new Map())
    const map = usersByStore.get(storeId)!
    const existing = map.get(userId) || {
      userId,
      name: name || 'Usuario',
      salesCount: 0,
      actionsCount: 0,
    }
    if (name) existing.name = name
    if (kind === 'sale') existing.salesCount += 1
    else existing.actionsCount += 1
    map.set(userId, existing)
  }

  for (const sale of sales) {
    const key = storeKey(sale.store_id)
    const report = byStore.get(key)
    if (!report) continue
    const day = dayOf(report, sale.created_at)

    report.salesCount += 1
    if (day) day.salesCount += 1
    bumpUser(key, sale.seller_id, sale.seller_name, 'sale')

    const addCash = (amount: number) => {
      report.cashRevenue += amount
      report.totalRevenue += amount
      if (day) {
        day.cashRevenue += amount
        day.totalRevenue += amount
      }
    }
    const addTransfer = (amount: number) => {
      report.transferRevenue += amount
      report.totalRevenue += amount
      if (day) {
        day.transferRevenue += amount
        day.totalRevenue += amount
      }
    }

    const payments = sale.sale_payments
    if (payments && payments.length > 0) {
      for (const p of payments) {
        const amount = Number(p.amount) || 0
        if (p.payment_type === 'cash') addCash(amount)
        else if (p.payment_type === 'transfer') addTransfer(amount)
      }
    } else if (sale.payment_method === 'cash') {
      addCash(Number(sale.total) || 0)
    } else if (sale.payment_method === 'transfer') {
      addTransfer(Number(sale.total) || 0)
    }
  }

  type PaymentRecordRow = {
    store_id: string | null
    amount: number | null
    payment_method: string | null
    status: string | null
    payment_date: string | null
  }

  const abonos = await fetchAllPages<PaymentRecordRow>((from, to) =>
    supabaseAdmin
      .from('payment_records')
      .select('store_id, amount, payment_method, status, payment_date')
      .gte('payment_date', startIso)
      .lt('payment_date', endIso)
      .order('payment_date', { ascending: true })
      .range(from, to)
  )

  for (const row of abonos) {
    if (row.status === 'cancelled') continue
    const method = String(row.payment_method || '').toLowerCase()
    if (method !== 'cash' && method !== 'efectivo' && method !== 'transfer') continue
    const key = storeKey(row.store_id)
    const report = byStore.get(key)
    if (!report) continue
    const amount = Number(row.amount) || 0
    const day = dayOf(report, row.payment_date)
    report.creditAbonosRevenue += amount
    report.totalRevenue += amount
    if (day) {
      day.creditAbonosRevenue += amount
      day.totalRevenue += amount
    }
    if (method === 'transfer') {
      report.transferRevenue += amount
      if (day) day.transferRevenue += amount
    } else {
      report.cashRevenue += amount
      if (day) day.cashRevenue += amount
    }
  }

  type CreditRow = {
    id: string
    store_id: string | null
    client_id: string | null
    client_name: string | null
    invoice_number: string | null
    total_amount: number | null
    pending_amount: number | null
    status: string | null
    due_date: string | null
    created_at: string
  }

  const creditsIssued = await fetchAllPages<CreditRow>((from, to) =>
    supabaseAdmin
      .from('credits')
      .select(
        'id, store_id, client_id, client_name, invoice_number, total_amount, pending_amount, status, due_date, created_at'
      )
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })
      .range(from, to)
  )

  for (const credit of creditsIssued) {
    const key = storeKey(credit.store_id)
    const report = byStore.get(key)
    if (!report) continue
    const amount = Number(credit.total_amount) || 0
    const day = dayOf(report, credit.created_at)
    report.creditsIssuedCount += 1
    report.creditsIssuedAmount += amount
    if (day) {
      day.creditsIssuedCount += 1
      day.creditsIssuedAmount += amount
    }
  }

  const openCredits = await fetchAllPages<CreditRow>((from, to) =>
    supabaseAdmin
      .from('credits')
      .select(
        'id, store_id, client_id, client_name, invoice_number, total_amount, pending_amount, status, due_date, created_at'
      )
      .in('status', ['pending', 'partial', 'overdue'])
      .gt('pending_amount', 0)
      .order('created_at', { ascending: true })
      .range(from, to)
  )

  const overdueByStore = new Map<string, Map<string, WeeklyClientDebt>>()
  const currentByStore = new Map<string, Map<string, WeeklyClientDebt>>()

  for (const credit of openCredits) {
    const key = storeKey(credit.store_id)
    if (!byStore.has(key)) continue
    const clientId = credit.client_id || credit.id
    const pending = Number(credit.pending_amount) || 0
    if (pending <= 0) continue

    const due = credit.due_date
    const isOverdue =
      credit.status === 'overdue' ||
      (Boolean(due) && new Date(due as string).getTime() < now.getTime())

    const entry: WeeklyClientDebt = {
      clientId,
      clientName: credit.client_name || 'Cliente',
      pendingAmount: pending,
      daysOverdue: due ? daysBetween(due, now) : 0,
      invoiceNumber: credit.invoice_number || undefined,
    }

    const bucket = isOverdue ? overdueByStore : currentByStore
    if (!bucket.has(key)) bucket.set(key, new Map())
    const map = bucket.get(key)!
    const prev = map.get(clientId)
    if (prev) {
      prev.pendingAmount += pending
      prev.daysOverdue = Math.max(prev.daysOverdue, entry.daysOverdue)
    } else {
      map.set(clientId, entry)
    }
  }

  // Productos más vendidos por tienda
  const productMaps = new Map<string, Map<string, WeeklyTopProduct>>()
  if (saleIds.length > 0) {
    const CHUNK = 200
    for (let i = 0; i < saleIds.length; i += CHUNK) {
      const chunk = saleIds.slice(i, i + CHUNK)
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('sale_items')
        .select('sale_id, product_id, product_name, quantity, total')
        .in('sale_id', chunk)

      if (itemsError) throw new Error(itemsError.message)

      const saleStore = new Map(sales.map((s) => [s.id, storeKey(s.store_id)]))
      for (const item of items || []) {
        const key = saleStore.get(item.sale_id)
        if (!key || !byStore.has(key)) continue
        if (!productMaps.has(key)) productMaps.set(key, new Map())
        const map = productMaps.get(key)!
        const pid = item.product_id as string
        const prev = map.get(pid) || {
          productId: pid,
          name: item.product_name || 'Producto',
          quantity: 0,
          revenue: 0,
        }
        prev.quantity += Number(item.quantity) || 0
        prev.revenue += Number(item.total) || 0
        map.set(pid, prev)
      }
    }
  }

  // Usuarios activos desde logs (además de vendedores)
  type LogRow = { user_id: string | null; store_id: string | null; details: unknown }
  try {
    const logs = await fetchAllPages<LogRow>((from, to) =>
      supabaseAdmin
        .from('logs')
        .select('user_id, store_id, details')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('created_at', { ascending: true })
        .range(from, to)
    )

    const userIds = Array.from(
      new Set(logs.map((l) => l.user_id).filter(Boolean) as string[])
    )
    const nameById = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', userIds)
      for (const u of users || []) nameById.set(u.id, u.name)
    }

    for (const log of logs) {
      if (!log.user_id) continue
      bumpUser(
        storeKey(log.store_id),
        log.user_id,
        nameById.get(log.user_id) || null,
        'action'
      )
    }
  } catch (e) {
    console.error('[weekly-report] logs:', e)
  }

  for (const [storeId, report] of byStore) {
    // Resumen corto: solo top vendedor / top producto + conteos de cartera.
    const users = Array.from(usersByStore.get(storeId)?.values() || []).sort(
      (a, b) => b.salesCount + b.actionsCount - (a.salesCount + a.actionsCount)
    )
    report.activeUsers = users.slice(0, 1)

    report.topProducts = Array.from(productMaps.get(storeId)?.values() || [])
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 1)

    const overdue = Array.from(overdueByStore.get(storeId)?.values() || [])
    const current = Array.from(currentByStore.get(storeId)?.values() || [])
    report.overdueClients = []
    report.currentClients = []
    report.overdueCount = overdue.length
    report.currentCount = current.length
    report.overdueTotal = overdue.reduce((s, c) => s + c.pendingAmount, 0)
    report.currentTotal = current.reduce((s, c) => s + c.pendingAmount, 0)
  }

  const storeList = Array.from(byStore.values()).sort((a, b) =>
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
      acc.overdueClients += s.overdueCount
      acc.currentClients += s.currentCount
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

  return {
    kind,
    periodLabel: period.label,
    periodStart: startIso,
    periodEnd: endIso,
    generatedAt: now.toISOString(),
    stores: storeList,
    totals,
  }
}
