/** Colombia no usa DST: UTC−5 todo el año. */
export const BOGOTA_TIMEZONE = 'America/Bogota'
const BOGOTA_UTC_OFFSET_HOURS = 5

export type BogotaYmd = { y: number; m: number; d: number }

export function bogotaYmd(date: Date = new Date()): BogotaYmd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { y: n('year'), m: n('month'), d: n('day') }
}

export function bogotaDayStartUtc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, BOGOTA_UTC_OFFSET_HOURS, 0, 0, 0))
}

export function bogotaDayRangeUtc(
  y: number,
  m: number,
  d: number
): { start: Date; endExclusive: Date } {
  const start = bogotaDayStartUtc(y, m, d)
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, endExclusive }
}

export function bogotaDayRangeForInstant(date: Date = new Date()) {
  const { y, m, d } = bogotaYmd(date)
  return bogotaDayRangeUtc(y, m, d)
}

/** Inicio inclusive y fin exclusivo en ISO, para filtros `created_at`. */
export function bogotaDayQueryBounds(date: Date = new Date()): {
  startIso: string
  endIsoExclusive: string
} {
  const { start, endExclusive } = bogotaDayRangeForInstant(date)
  return { startIso: start.toISOString(), endIsoExclusive: endExclusive.toISOString() }
}

export function isSameBogotaDay(a: Date | string, b: Date | string = new Date()): boolean {
  const da = bogotaYmd(new Date(a))
  const db = bogotaYmd(new Date(b))
  return da.y === db.y && da.m === db.m && da.d === db.d
}

export function bogotaDateLabel(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: BOGOTA_TIMEZONE,
    ...options,
  }).format(new Date(date))
}
