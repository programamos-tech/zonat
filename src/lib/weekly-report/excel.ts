import * as XLSX from 'xlsx'
import { mainStoreExcelFilename } from './main-store'
import type { MainStoreWeeklyPayload } from './types'

function money(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function buildMainStoreWeeklyWorkbook(payload: MainStoreWeeklyPayload): Buffer {
  const wb = XLSX.utils.book_new()

  const resumen = [
    { Campo: 'Tienda', Valor: payload.storeName },
    { Campo: 'Periodo', Valor: payload.periodLabel },
    { Campo: 'Corte', Valor: 'Domingo 5:00 p.m. Colombia' },
    { Campo: 'Generado', Valor: payload.generatedAt },
    { Campo: '', Valor: '' },
    { Campo: 'Ventas (facturas)', Valor: payload.sales.count },
    { Campo: 'Unidades vendidas', Valor: payload.sales.units },
    { Campo: 'Ingresos (efectivo + transferencia + abonos)', Valor: money(payload.sales.total) },
    { Campo: 'Efectivo', Valor: money(payload.sales.cash) },
    { Campo: 'Transferencia', Valor: money(payload.sales.transfer) },
    { Campo: 'Abonos a créditos', Valor: money(payload.sales.abonos) },
    { Campo: 'Ventas a crédito (esta semana)', Valor: money(payload.sales.credit) },
    { Campo: '', Valor: '' },
    { Campo: 'Créditos nuevos', Valor: payload.credits.issuedCount },
    { Campo: 'Monto créditos nuevos', Valor: money(payload.credits.issuedAmount) },
    { Campo: 'Clientes en mora', Valor: payload.credits.overdueCount },
    { Campo: 'Saldo en mora', Valor: money(payload.credits.overdueTotal) },
    { Campo: 'Clientes al día (con saldo)', Valor: payload.credits.currentCount },
    { Campo: 'Saldo al día', Valor: money(payload.credits.currentTotal) },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')

  const ventas = payload.sales.rows.map((row) => ({
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Cliente: row.clientName,
    Vendedor: row.sellerName,
    Pago: row.paymentMethod,
    Productos: row.itemsCount,
    Unidades: row.units,
    Total: money(row.total),
    Efectivo: money(row.cash),
    Transferencia: money(row.transfer),
  }))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ventas.length ? ventas : [{ Factura: 'Sin ventas en el periodo' }]),
    'Ventas'
  )

  const productos = payload.sales.items.map((row) => ({
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Producto: row.productName,
    Cantidad: row.quantity,
    'Precio unitario': money(row.unitPrice),
    Total: money(row.total),
    Vendedor: row.sellerName,
  }))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      productos.length ? productos : [{ Producto: 'Sin productos vendidos en el periodo' }]
    ),
    'Productos vendidos'
  )

  const creditos = payload.credits.issued.map((row) => ({
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Cliente: row.clientName,
    Total: money(row.totalAmount),
    Pagado: money(row.paidAmount),
    Pendiente: money(row.pendingAmount),
    Estado: row.status,
    Vence: row.dueDate,
    'Días mora': row.daysOverdue,
  }))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      creditos.length ? creditos : [{ Factura: 'Sin créditos nuevos esta semana' }]
    ),
    'Créditos de la semana'
  )

  const morosos = payload.credits.overdue.map((row) => ({
    Factura: row.invoiceNumber,
    Cliente: row.clientName,
    Total: money(row.totalAmount),
    Pagado: money(row.paidAmount),
    Pendiente: money(row.pendingAmount),
    Estado: row.status,
    Vence: row.dueDate,
    'Días mora': row.daysOverdue,
  }))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(morosos.length ? morosos : [{ Cliente: 'No hay clientes en mora' }]),
    'Clientes morosos'
  )

  const alDia = payload.credits.current.map((row) => ({
    Factura: row.invoiceNumber,
    Cliente: row.clientName,
    Total: money(row.totalAmount),
    Pagado: money(row.paidAmount),
    Pendiente: money(row.pendingAmount),
    Estado: row.status,
    Vence: row.dueDate,
  }))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(alDia.length ? alDia : [{ Cliente: 'No hay créditos al día con saldo' }]),
    'Clientes al día'
  )

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.isBuffer(out) ? out : Buffer.from(out)
}

export function excelMeta(payload: MainStoreWeeklyPayload, buffer: Buffer) {
  return {
    filename: mainStoreExcelFilename(payload),
    bytes: buffer.length,
    sheets: [
      'Resumen',
      'Ventas',
      'Productos vendidos',
      'Créditos de la semana',
      'Clientes morosos',
      'Clientes al día',
    ],
  }
}
