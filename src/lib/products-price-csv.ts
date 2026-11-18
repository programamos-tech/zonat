export type ProductExportStore = {
  id: string
  label: string
}

export type ProductPriceRow = {
  name: string
  reference: string | null
  cost: number
  price: number
  stock: Record<string, number>
}

function csvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** CSV con separador ; y BOM para que Excel en español abra las columnas bien. */
export function buildProductsPriceCsv(rows: ProductPriceRow[], stores: ProductExportStore[]): string {
  const header = [
    'Producto',
    'Referencia',
    'Precio de compra',
    'Precio de venta',
    ...stores.map((store) => store.label),
  ]
    .map(csvCell)
    .join(';')
  const lines = [header]
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  for (const row of sorted) {
    lines.push(
      [
        csvCell(row.name),
        csvCell(row.reference ?? ''),
        String(Math.round(row.cost)),
        String(Math.round(row.price)),
        ...stores.map((store) => String(Math.round(row.stock[store.id] ?? 0))),
      ].join(';')
    )
  }

  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadProductsPriceCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `productos-precios-${date}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
