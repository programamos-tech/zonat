'use client'

import { useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import type { PublicCatalogProduct, PublicCatalogStoreInfo } from '@/lib/public-catalog'
import { TiendaAnnouncementBar } from '@/components/tienda/tienda-announcement-bar'
import { TiendaHeader } from '@/components/tienda/tienda-header'
import { TiendaHero } from '@/components/tienda/tienda-hero'
import { TiendaTrustBadges } from '@/components/tienda/tienda-trust-badges'
import { TiendaProductCard } from '@/components/tienda/tienda-product-card'
import { TiendaFooter } from '@/components/tienda/tienda-footer'

export function CatalogStorefront({
  products,
  store
}: {
  products: PublicCatalogProduct[]
  store: PublicCatalogStoreInfo | null
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.reference.toLowerCase().includes(t) ||
        p.brand.toLowerCase().includes(t) ||
        (p.categoryName?.toLowerCase().includes(t) ?? false) ||
        p.description.toLowerCase().includes(t)
    )
  }, [products, q])

  const inStockCount = filtered.filter((p) => p.inStock).length

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TiendaAnnouncementBar />
      <TiendaHeader
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        storeName={store?.name}
      />

      <TiendaHero storeName={store?.name} storeCity={store?.city} />
      <TiendaTrustBadges />

      <main id="catalogo" className="w-full flex-1 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">
              Catálogo telefonía
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              Celulares y accesorios
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500">
              {store?.name ?? 'Telefonía ZONA T'}
              {store?.city ? ` · ${store.city}` : ''}. Consulta disponibilidad y precios referenciales.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-20 text-center">
              <Package className="mx-auto h-14 w-14 text-zinc-300" strokeWidth={1} />
              <p className="mt-4 text-sm font-medium text-zinc-700">Catálogo no disponible por ahora</p>
              <p className="mt-1 text-xs text-zinc-500">
                Visítanos en {store?.address ?? 'nuestra tienda'} o vuelve más tarde.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
                <p>
                  <span className="font-semibold text-zinc-800">{filtered.length}</span>
                  {filtered.length === 1 ? ' producto' : ' productos'}
                  {q.trim() ? ' encontrados' : ' en catálogo'}
                </p>
                {inStockCount > 0 && (
                  <p>
                    <span className="font-semibold text-emerald-700">{inStockCount}</span> con stock
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
                {filtered.map((p) => (
                  <TiendaProductCard key={p.id} product={p} />
                ))}
              </div>

              {filtered.length === 0 && q.trim() && (
                <p className="mt-16 text-center text-sm text-zinc-500">
                  No hay resultados para «{q.trim()}».
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <TiendaFooter store={store} />
    </div>
  )
}
