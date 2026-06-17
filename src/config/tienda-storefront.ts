/** Imagen del hero en /tienda (reemplazar en public/tienda/hero.jpg o vía env). */
export const TIENDA_HERO_IMAGE =
  process.env.NEXT_PUBLIC_TIENDA_HERO_IMAGE?.trim() ||
  '/iPhone-17-rumors-banner_184cc095-dddb-4ae7-9de6-bbeddc491887.webp'

export const TIENDA_ANNOUNCEMENT_ITEMS = [
  'Envíos a toda Colombia · 100% seguros',
  'Celulares y accesorios · 100% originales',
  'Asesoría personalizada · WhatsApp y tienda',
  'TELEFONÍA ZONA T · Sincelejo, Sucre',
] as const
