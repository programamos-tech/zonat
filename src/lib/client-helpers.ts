import { Client } from '@/types'

/** Nombre canónico del cliente de mostrador / venta al público. */
export const DEFAULT_WALK_IN_CLIENT_NAME = 'Cliente Final'

/**
 * Cliente-ficha creado por el sistema para transferencias / facturación interna entre tiendas.
 * No confundir con un cliente de negocio que solo comparta nombre con una microtienda.
 */
export function isStoreClient(client: Client): boolean {
  const doc = (client.document || '').trim().toUpperCase()
  return doc.startsWith('STORE-')
}

/** Cliente genérico de venta al público (p. ej. "Cliente Final" / "CLIENTE FINAL"). */
export function isDefaultWalkInClient(client: Client): boolean {
  if (isStoreClient(client)) return false
  if (client.status !== 'active') return false
  return /^cliente\s*final$/i.test(client.name.trim())
}

export function findDefaultWalkInClient(clients: Client[]): Client | undefined {
  return clients.find(isDefaultWalkInClient)
}
