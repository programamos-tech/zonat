'use client'

import { useMemo } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import type { PublicCatalogProduct, PublicCatalogStoreInfo } from '@/lib/public-catalog'
import { useTiendaFavorites } from '@/contexts/tienda-favorites-context'
import { TiendaAnnouncementBar } from '@/components/tienda/tienda-announcement-bar'
import { TiendaHeader } from '@/components/tienda/tienda-header'
import { TiendaProductCard } from '@/components/tienda/tienda-product-card'
import { TiendaFooter } from '@/components/tienda/tienda-footer'
import { Button } from '@/components/ui/button'

export function FavoritesPageClient({
  products,
  store
}: {
  products: PublicCatalogProduct[]
  store: PublicCatalogStoreInfo | null
}) {
  const { ids } = useTiendaFavorites()

  const favorites = useMemo(
    () => products.filter((p) => ids.has(p.id)),
    [products, ids]
  )

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TiendaAnnouncementBar />
      <TiendaHeader storeName={store?.name} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Favoritos</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {favorites.length === 0
            ? 'Guarda los celulares que te interesen tocando el corazón en el catálogo.'
            : `${favorites.length} producto${favorites.length === 1 ? '' : 's'} guardado${favorites.length === 1 ? '' : 's'}.`}
        </p>

        {favorites.length === 0 ? (
          <div className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/60 py-16 text-center">
            <Heart className="h-12 w-12 text-zinc-300" strokeWidth={1.25} />
            <p className="mt-4 text-sm font-medium text-zinc-700">Aún no tienes favoritos</p>
            <Button asChild className="mt-6 rounded-full bg-emerald-600 hover:bg-emerald-700">
              <Link href="/tienda">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((p) => (
              <TiendaProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <TiendaFooter store={store} />
    </div>
  )
}
