import type { AppNotification, AppNotificationKind } from './app-notifications-service'

const STORAGE_PREFIX = 'zonat:notifications-seen'

export type NotificationSeenEntry = {
  /** Conteo reconocido; si el pendiente actual es mayor, vuelve a mostrarse. */
  acknowledgedCount: number
  seenAt: string
}

export type NotificationSeenState = Partial<Record<AppNotificationKind, NotificationSeenEntry>>

function storageKey(userId: string, storeId: string | null | undefined): string {
  const store = storeId?.trim() || 'main'
  return `${STORAGE_PREFIX}:${userId}:${store}`
}

export function getNotificationSeenState(
  userId: string,
  storeId?: string | null
): NotificationSeenState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey(userId, storeId))
    if (!raw) return {}
    return JSON.parse(raw) as NotificationSeenState
  } catch {
    return {}
  }
}

export function markNotificationsSeen(
  userId: string,
  storeId: string | null | undefined,
  items: Pick<AppNotification, 'kind' | 'count'>[]
): void {
  if (typeof window === 'undefined' || items.length === 0) return
  const state = getNotificationSeenState(userId, storeId)
  const now = new Date().toISOString()
  for (const item of items) {
    state[item.kind] = {
      acknowledgedCount: item.count,
      seenAt: now,
    }
  }
  try {
    localStorage.setItem(storageKey(userId, storeId), JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function markNotificationKindSeen(
  userId: string,
  storeId: string | null | undefined,
  kind: AppNotificationKind,
  count: number
): void {
  markNotificationsSeen(userId, storeId, [{ kind, count }])
}

/** Oculta avisos ya vistos con el mismo conteo (o menor). */
export function filterUnseenNotifications(
  userId: string,
  storeId: string | null | undefined,
  notifications: AppNotification[]
): AppNotification[] {
  const seen = getNotificationSeenState(userId, storeId)
  return notifications.filter((n) => {
    const entry = seen[n.kind]
    if (!entry) return true
    return n.count > entry.acknowledgedCount
  })
}

export function isNotificationUnseen(
  userId: string,
  storeId: string | null | undefined,
  notification: Pick<AppNotification, 'kind' | 'count'>
): boolean {
  const seen = getNotificationSeenState(userId, storeId)
  const entry = seen[notification.kind]
  if (!entry) return true
  return notification.count > entry.acknowledgedCount
}
