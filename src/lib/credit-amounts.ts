/** PostgREST suele devolver `numeric` como string. */
export function creditMoney(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/**
 * Saldo que aún debe el crédito. La fuente de verdad es factura − pagado,
 * no la columna `pending_amount` (puede desfasarse tras abonos).
 */
export function remainingCreditDebt(input: {
  totalAmount?: unknown
  paidAmount?: unknown
  pendingAmount?: unknown
  status?: unknown
}): number {
  if (input.status === 'cancelled') return 0
  const total = creditMoney(input.totalAmount)
  const paid = creditMoney(input.paidAmount)
  return Math.max(0, Math.round((total - paid) * 100) / 100)
}
