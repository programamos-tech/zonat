/** Colombia no usa DST: UTC−5 todo el año. */
const BOGOTA_UTC_OFFSET_HOURS = 5

/** Domingo 17:00 America/Bogota: cierra la semana (lun 00:00 → este instante, fin exclusivo). */
export const WEEKLY_REPORT_CUTOFF_HOUR = 17
export const WEEKLY_REPORT_CUTOFF_MINUTE = 0

/** Último día del mes 21:00 America/Bogota. */
export const MONTHLY_REPORT_CUTOFF_HOUR = 21
export const MONTHLY_REPORT_CUTOFF_MINUTE = 0

export type ReportKind = 'weekly' | 'monthly'

export type WeeklyReportPeriod = {
  kind: ReportKind
  start: Date
  end: Date
  label: string
}

type BogotaYmd = {
  y: number
  m: number
  d: number
  weekday: number
}

function bogotaParts(date: Date): BogotaYmd {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

/** Reloj de pared America/Bogota → instante UTC. */
export function bogotaUtc(
  y: number,
  m: number,
  d: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date {
  return new Date(
    Date.UTC(y, m - 1, d, BOGOTA_UTC_OFFSET_HOURS + hour, minute, second, ms)
  )
}

function addDaysYmd(y: number, m: number, d: number, delta: number) {
  const base = new Date(Date.UTC(y, m - 1, d + delta))
  return {
    y: base.getUTCFullYear(),
    m: base.getUTCMonth() + 1,
    d: base.getUTCDate(),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function bogotaDayKey(date: Date | string): string {
  const parts = bogotaParts(typeof date === 'string' ? new Date(date) : date)
  return `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`
}

export function formatBogotaDayLabel(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(typeof date === 'string' ? new Date(date) : date)
}

/** Cada día calendario Bogotá que intersecta [start, end). */
export function listBogotaDays(
  start: Date,
  end: Date
): Array<{ key: string; label: string; start: Date }> {
  const days: Array<{ key: string; label: string; start: Date }> = []
  let { y, m, d } = bogotaParts(start)
  for (let i = 0; i < 40; i += 1) {
    const dayStart = bogotaUtc(y, m, d, 0, 0, 0, 0)
    if (dayStart.getTime() >= end.getTime()) break
    days.push({
      key: `${y}-${pad2(m)}-${pad2(d)}`,
      label: formatBogotaDayLabel(dayStart),
      start: dayStart,
    })
    const next = addDaysYmd(y, m, d, 1)
    y = next.y
    m = next.m
    d = next.d
  }
  return days
}

function formatRangeLabel(start: Date, end: Date, cutoffNote: string): string {
  const fmt = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${fmt.format(start)} – ${fmt.format(end)} (${cutoffNote})`
}

/**
 * Semana operativa: lunes 00:00 → domingo 17:00 America/Bogota (fin exclusivo).
 * Si aún no llegó el corte de este domingo, usa la semana que ya cerró.
 */
export function getWeeklyReportPeriod(now = new Date()): WeeklyReportPeriod {
  const { y, m, d, weekday } = bogotaParts(now)
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1
  const thisMonday = addDaysYmd(y, m, d, -daysSinceMonday)
  const thisSunday = addDaysYmd(thisMonday.y, thisMonday.m, thisMonday.d, 6)
  const thisCutoff = bogotaUtc(
    thisSunday.y,
    thisSunday.m,
    thisSunday.d,
    WEEKLY_REPORT_CUTOFF_HOUR,
    WEEKLY_REPORT_CUTOFF_MINUTE,
    0,
    0
  )

  let monday = thisMonday
  let sunday = thisSunday
  let end = thisCutoff

  if (now.getTime() < thisCutoff.getTime()) {
    monday = addDaysYmd(thisMonday.y, thisMonday.m, thisMonday.d, -7)
    sunday = addDaysYmd(thisSunday.y, thisSunday.m, thisSunday.d, -7)
    end = bogotaUtc(
      sunday.y,
      sunday.m,
      sunday.d,
      WEEKLY_REPORT_CUTOFF_HOUR,
      WEEKLY_REPORT_CUTOFF_MINUTE,
      0,
      0
    )
  }

  const start = bogotaUtc(monday.y, monday.m, monday.d, 0, 0, 0, 0)

  return {
    kind: 'weekly',
    start,
    end,
    label: formatRangeLabel(start, end, 'corte domingo 5:00 p.m.'),
  }
}

/**
 * Mes operativo: día 1 00:00 → último día 21:00 America/Bogota (fin exclusivo).
 * Si aún no llegó el corte de este mes, usa el mes que ya cerró.
 */
export function getMonthlyReportPeriod(now = new Date()): WeeklyReportPeriod {
  const { y, m } = bogotaParts(now)
  const thisStart = bogotaUtc(y, m, 1, 0, 0, 0, 0)
  const next =
    m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }
  const lastDay = addDaysYmd(next.y, next.m, 1, -1)
  const thisCutoff = bogotaUtc(
    lastDay.y,
    lastDay.m,
    lastDay.d,
    MONTHLY_REPORT_CUTOFF_HOUR,
    MONTHLY_REPORT_CUTOFF_MINUTE,
    0,
    0
  )

  let start = thisStart
  let end = thisCutoff

  if (now.getTime() < thisCutoff.getTime()) {
    const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
    start = bogotaUtc(prev.y, prev.m, 1, 0, 0, 0, 0)
    const thisMonthStartDay = addDaysYmd(y, m, 1, 0)
    const prevLast = addDaysYmd(thisMonthStartDay.y, thisMonthStartDay.m, thisMonthStartDay.d, -1)
    end = bogotaUtc(
      prevLast.y,
      prevLast.m,
      prevLast.d,
      MONTHLY_REPORT_CUTOFF_HOUR,
      MONTHLY_REPORT_CUTOFF_MINUTE,
      0,
      0
    )
  }

  return {
    kind: 'monthly',
    start,
    end,
    label: formatRangeLabel(start, end, 'corte último día 9:00 p.m.'),
  }
}

export function getReportPeriod(
  kind: ReportKind,
  now = new Date()
): WeeklyReportPeriod {
  return kind === 'monthly' ? getMonthlyReportPeriod(now) : getWeeklyReportPeriod(now)
}
