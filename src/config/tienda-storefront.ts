/** Imagen del hero en /tienda (public/hero-zonat-gold.png o vía env). */
export const TIENDA_HERO_IMAGE =
  process.env.NEXT_PUBLIC_TIENDA_HERO_IMAGE?.trim() || '/hero-zonat-gold.png'

export const TIENDA_ANNOUNCEMENT_ITEMS = [
  'Envíos a toda Colombia · 100% seguros',
  'Celulares y accesorios · 100% originales',
  'Asesoría personalizada · WhatsApp y tienda',
  'TELEFONÍA ZONA T · Sincelejo, Sucre',
] as const

export const TIENDA_WHATSAPP_MESSAGE =
  'Hola, me interesa un producto de ZONA T. ¿Me pueden asesorar?'

/** Número opcional por env si la tienda no tiene teléfono en BD. */
export function buildTiendaWhatsAppUrl(phone?: string | null): string | null {
  const raw = phone?.trim() || process.env.NEXT_PUBLIC_TIENDA_WHATSAPP?.trim()
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')
  if (digits.length === 10) digits = `57${digits}`
  if (digits.length < 11) return null

  const text = encodeURIComponent(TIENDA_WHATSAPP_MESSAGE)
  return `https://wa.me/${digits}?text=${text}`
}
