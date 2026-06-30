import type { Metadata } from 'next'
import { TiendaProviders } from '@/components/tienda/tienda-providers'
import { tiendaDisplay, tiendaSans } from '@/app/tienda/tienda-fonts'
import { getPublicCatalogStoreInfo } from '@/lib/public-catalog'
import { cn } from '@/lib/utils'

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

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const store = await getPublicCatalogStoreInfo()

  return (
    <div
      className={cn(
        'tienda-storefront min-h-dvh text-[#f5f0e6] [color-scheme:dark]',
        tiendaDisplay.variable,
        tiendaSans.variable
      )}
      data-theme="dark"
    >
      <TiendaProviders store={store}>{children}</TiendaProviders>
    </div>
  )
}
