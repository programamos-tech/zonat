/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-05-19-2'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Versión 2.9. Búsqueda, notificaciones y reportes en ZONA T.',
  items: [
    'Búsqueda global en la barra superior: clientes, productos (nombre y referencia), ventas, créditos, facturas, transferencias y garantías.',
    'Notificaciones: recepciones pendientes, productos sin stock, créditos vencidos y facturas de proveedor vencidas; permanecen en la lista 24 h después de revisarlas.',
    'Reportes (antes Dashboard) en /reportes; sidebar con logo Berea y versión zonat V.2.9.',
    'Desde notificaciones: ir a recepciones, inventario filtrado sin stock o créditos vencidos.',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
