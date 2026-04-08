/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-04-08-1'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Cambios publicados hoy en ZONA T.',
  items: [
    'Micro Tiendas: tarjetas cuadradas con borde bien definido; en cada tienda ves ventas completadas e ingresos totales en pesos; mejor contraste en modo claro; se quitó el interruptor de activar o desactivar en la tarjeta.',
    'Apariencia: puedes usar el tema del dispositivo (la app sigue el modo claro u oscuro del sistema) o fijar claro u oscuro; el selector en sidebar y perfil muestra solo iconos.',
    'Modo claro: los botones con fondo oscuro vuelven a verse bien (ya no quedaban “en blanco” sobre el fondo).',
    'Al entrar al panel puedes ver este resumen de novedades; al cerrarlo no volverá a mostrarse hasta la próxima actualización que publiquemos.',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
