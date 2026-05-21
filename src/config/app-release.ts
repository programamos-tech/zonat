/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-05-19-1'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Versión 2.9. Barra superior, reportes y avisos en ZONA T.',
  items: [
    'Barra superior: búsqueda global (clientes, productos, ventas, créditos, facturas, transferencias y garantías), botón rápido +, tema, notificaciones y menú de usuario.',
    'Notificaciones: avisos de recepciones pendientes, créditos vencidos y facturas de proveedor vencidas; al revisarlos o entrar a la pantalla dejan de mostrarse hasta que haya algo nuevo.',
    'Dashboard renombrado a Reportes (ruta /reportes); /dashboard redirige automáticamente.',
    'Sidebar más limpio: sin selector de tema ni bloque de usuario (todo en la barra superior); logo Berea y versión zonat V.2.9 al pie.',
    'Créditos: desde notificaciones puedes ir al listado filtrado por vencidos (?status=overdue).',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
