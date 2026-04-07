/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-04-06-1'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Cambios publicados hoy en ZONA T.',
  items: [
    'Inicio de sesión y panel: aspecto renovado en el login, gráfico de ingresos de los últimos 15 días y badges más claros para tienda y créditos.',
    'Dashboard: la tendencia de ingresos respeta el filtro activo (rango de fechas, año o vista de 15 días).',
    'Facturas de proveedor: vista por proveedor, varios adjuntos por factura y abonos con comprobante en imagen; bordes más marcados en modo claro.',
    'Créditos y pagos: los créditos vencidos se muestran bien según fecha y saldo pendiente; puedes seleccionar varios créditos del mismo cliente y pagar en una sola acción; ajustes en modales relacionados.',
    'Al entrar al panel puedes ver este resumen de novedades; al cerrarlo no volverá a mostrarse hasta la próxima actualización que publiquemos.',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
