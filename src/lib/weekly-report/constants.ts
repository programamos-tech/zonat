export const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
export const MAIN_STORE_FALLBACK_NAME = 'Zona T'

export function isMainStoreId(storeId: string | null | undefined): boolean {
  return !storeId || storeId === MAIN_STORE_ID
}
