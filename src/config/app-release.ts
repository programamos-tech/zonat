/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-04-21-1'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Cambios publicados hoy en ZONA T.',
  items: [
    'Micro Tiendas: ahora muestra solo el producido de hoy (se quitó el conteo de ventas) y la tarjeta quedó más compacta para evitar espacio vacío.',
    'Stock: al ajustar inventario se confirma primero en base de datos antes de mostrar éxito; si no se confirma, verás “No se guardaron los cambios” y el modal queda abierto para reintentar.',
    'Traslados: admin puede crear movimientos entre todas las tiendas (origen y destino configurables). En microtienda aparece Transferencias en el menú para usuarios con acceso global.',
    'Facturación de traslados: la factura queda en la tienda origen y la numeración se maneja por tienda.',
    'Recepciones: el sidebar muestra un contador de pendientes y el detalle ahora incluye por producto: esperado, recibido, faltante y estado (completa/parcial/no recibida).',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
