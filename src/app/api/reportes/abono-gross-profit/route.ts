import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestUser, userHasPermission } from '@/lib/api-auth'

type SaleItemRow = {
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number | null
  discount_type: string | null
}

function saleMarginFromItems(
  items: SaleItemRow[],
  costByProductId: Map<string, number>
): number {
  return items.reduce((sum, item) => {
    const cost = costByProductId.get(item.product_id) || 0
    const qty = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price) || 0
    const baseTotal = qty * unitPrice
    const discount = Number(item.discount) || 0
    const discountAmount =
      item.discount_type === 'percentage' ? (baseTotal * discount) / 100 : discount
    const afterDiscount = Math.max(0, baseTotal - discountAmount)
    const realUnit = qty > 0 ? afterDiscount / qty : 0
    return sum + (realUnit - cost) * qty
  }, 0)
}

/**
 * POST /api/reportes/abono-gross-profit
 * Calcula ganancia bruta de abonos del período en servidor (service role),
 * sin depender de la ventana de ~15 días ni del join payments en el browser.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (!userHasPermission(user, 'dashboard', 'view')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await request.json()
    const storeId = typeof body.storeId === 'string' ? body.storeId : null
    const startDate = typeof body.startDate === 'string' ? body.startDate : null
    const endDate = typeof body.endDate === 'string' ? body.endDate : null

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan startDate y endDate' },
        { status: 400 }
      )
    }

    const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

    let paymentsQuery = supabaseAdmin
      .from('payment_records')
      .select('id, amount, payment_id, status, payment_date, store_id')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .limit(10000)

    if (!storeId || storeId === MAIN_STORE_ID) {
      paymentsQuery = paymentsQuery.or(
        `store_id.is.null,store_id.eq.${MAIN_STORE_ID}`
      )
    } else {
      paymentsQuery = paymentsQuery.eq('store_id', storeId)
    }

    const { data: paymentRows, error: paymentsError } = await paymentsQuery
    if (paymentsError) {
      console.error('[abono-gross-profit] payments', paymentsError)
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }

    const activePayments = (paymentRows || []).filter(
      (p) => p.status !== 'cancelled' && Number(p.amount) > 0
    )
    if (activePayments.length === 0) {
      return NextResponse.json({
        grossProfit: 0,
        paymentsCount: 0,
        resolvedSales: 0,
      })
    }

    const paymentIds = Array.from(
      new Set(activePayments.map((p) => p.payment_id).filter(Boolean))
    )

    const saleIdByPaymentId = new Map<string, string>()
    for (let i = 0; i < paymentIds.length; i += 100) {
      const chunk = paymentIds.slice(i, i + 100)
      const { data: pays } = await supabaseAdmin
        .from('payments')
        .select('id, sale_id')
        .in('id', chunk)
      for (const p of pays || []) {
        if (p.sale_id) saleIdByPaymentId.set(p.id, p.sale_id)
      }
    }

    const paymentsWithSale = activePayments
      .map((p) => ({
        amount: Number(p.amount) || 0,
        saleId: saleIdByPaymentId.get(p.payment_id),
      }))
      .filter((p): p is { amount: number; saleId: string } => Boolean(p.saleId))

    const saleIds = Array.from(new Set(paymentsWithSale.map((p) => p.saleId)))
    if (saleIds.length === 0) {
      return NextResponse.json({
        grossProfit: 0,
        paymentsCount: activePayments.length,
        resolvedSales: 0,
        unresolvedPayments: activePayments.length,
      })
    }

    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('id, total, status')
      .in('id', saleIds)

    if (salesError) {
      console.error('[abono-gross-profit] sales', salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    const saleById = new Map(
      (sales || []).map((s) => [
        s.id as string,
        { total: Number(s.total) || 0, status: s.status as string },
      ])
    )

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('sale_items')
      .select('sale_id, product_id, quantity, unit_price, discount, discount_type')
      .in('sale_id', saleIds)

    if (itemsError) {
      console.error('[abono-gross-profit] items', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const itemsBySale = new Map<string, SaleItemRow[]>()
    for (const item of (items || []) as SaleItemRow[]) {
      const list = itemsBySale.get(item.sale_id) || []
      list.push(item)
      itemsBySale.set(item.sale_id, list)
    }

    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('sale_id, total_amount, status')
      .in('sale_id', saleIds)

    const creditBySaleId = new Map(
      (credits || [])
        .filter((c) => c.sale_id)
        .map((c) => [
          c.sale_id as string,
          {
            totalAmount: Number(c.total_amount) || 0,
            status: c.status as string,
          },
        ])
    )

    const productIds = Array.from(
      new Set((items || []).map((i: SaleItemRow) => i.product_id).filter(Boolean))
    )

    const costByProductId = new Map<string, number>()

    if (productIds.length > 0) {
      for (let i = 0; i < productIds.length; i += 100) {
        const chunk = productIds.slice(i, i + 100)
        const { data: products } = await supabaseAdmin
          .from('products')
          .select('id, cost')
          .in('id', chunk)
        for (const p of products || []) {
          const c = Number(p.cost)
          if (c > 0) costByProductId.set(p.id, c)
        }
      }

      if (storeId && storeId !== MAIN_STORE_ID) {
        for (let i = 0; i < productIds.length; i += 100) {
          const chunk = productIds.slice(i, i + 100)
          const { data: stock } = await supabaseAdmin
            .from('store_stock')
            .select('product_id, cost')
            .eq('store_id', storeId)
            .in('product_id', chunk)
          for (const row of stock || []) {
            const c = Number(row.cost)
            if (c > 0) costByProductId.set(row.product_id, c)
          }
        }
      }
    }

    const marginBySaleId = new Map<string, number>()
    for (const saleId of saleIds) {
      const sale = saleById.get(saleId)
      if (!sale || sale.status === 'cancelled' || sale.status === 'draft') {
        marginBySaleId.set(saleId, 0)
        continue
      }
      const credit = creditBySaleId.get(saleId)
      if (credit?.status === 'cancelled') {
        marginBySaleId.set(saleId, 0)
        continue
      }
      marginBySaleId.set(
        saleId,
        saleMarginFromItems(itemsBySale.get(saleId) || [], costByProductId)
      )
    }

    let grossProfit = 0
    let resolved = 0
    for (const payment of paymentsWithSale) {
      const sale = saleById.get(payment.saleId)
      if (!sale || sale.status === 'cancelled' || sale.status === 'draft') continue

      const credit = creditBySaleId.get(payment.saleId)
      if (credit?.status === 'cancelled') continue

      const saleMargin = marginBySaleId.get(payment.saleId) || 0
      const creditBase =
        credit && credit.totalAmount > 0 ? credit.totalAmount : sale.total
      if (creditBase <= 0 || payment.amount <= 0) continue

      grossProfit += saleMargin * (payment.amount / creditBase)
      resolved += 1
    }

    return NextResponse.json({
      grossProfit: Math.round(grossProfit * 100) / 100,
      paymentsCount: activePayments.length,
      resolvedSales: saleIds.length,
      resolvedPayments: resolved,
    })
  } catch (error) {
    console.error('[abono-gross-profit]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
