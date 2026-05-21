/**
 * Novedades del modal (manual; no lee Git). Tras cada deploy: sube `CURRENT_RELEASE_ID`
 * y edita `items`. Para un aviso “solo de hoy”, alinea el texto con los commits del día.
 */
export const CURRENT_RELEASE_ID = '2026-05-11-1'

export const releaseNotes = {
  title: 'Novedades',
  intro: 'Versión 2.8. Cambios recientes en ZONA T.',
  items: [
    'Transferencias entre tiendas: el stock sale por defecto desde Local (antes en tienda principal arrancaba en Bodega); en la búsqueda de productos el resumen muestra primero Local y luego Bodega.',
    'Facturas de proveedor: la nota de la factura se ve destacada en el detalle; en los abonos la nota aparece con etiqueta clara.',
    'Proveedores: puedes editar nombre y datos (contacto, teléfono, correo, documento y si está activo) desde la vista del proveedor o con el botón “Proveedor” en el detalle de una factura.',
    'Listado de facturas de proveedor (móvil): nota en la tarjeta con vista previa y Ver más / Ver menos sin entrar al detalle; en escritorio, columna Nota más ancha y folio compacto para dejar más sitio al texto (folio completo al mantener pulsado o al pasar el cursor).',
  ],
} as const

export const RELEASE_STORAGE_KEY = 'zonat:last-seen-release'
