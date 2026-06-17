import type { Metadata } from 'next'
import { TiendaProviders } from '@/components/tienda/tienda-providers'

const siteUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CATALOG_SITE_URL || 'https://zonat.com.co')
  } catch {
    return new URL('https://zonat.com.co')
  }
})()

export const metadata: Metadata = {
  title: 'Telefonía | ZONA T Sincelejo',
  description:
    'Catálogo de celulares y accesorios en TELEFONÍA ZONA T, Sincelejo. Consulta disponibilidad y precios referenciales.',
  metadataBase: siteUrl,
  openGraph: {
    title: 'Telefonía ZONA T',
    description: 'Celulares, tablets y accesorios en Sincelejo.',
    locale: 'es_CO',
    type: 'website',
    siteName: 'ZONA T'
  }
}

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="tienda-storefront min-h-dvh bg-white text-zinc-900 [color-scheme:light]"
      data-theme="light"
    >
      <TiendaProviders>{children}</TiendaProviders>
    </div>
  )
}
