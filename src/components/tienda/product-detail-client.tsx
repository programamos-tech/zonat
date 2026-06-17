'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Heart, MapPin, Minus, Package, Plus, ShoppingBag } from 'lucide-react'
import type { PublicProductDetail, PublicCatalogStoreInfo } from '@/lib/public-catalog'
import { useTiendaCart } from '@/contexts/tienda-cart-context'
import { useTiendaFavorites } from '@/contexts/tienda-favorites-context'
import { TiendaPageShell } from '@/components/tienda/tienda-page-shell'
import { cn } from '@/lib/utils'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n)
}

function formatUnits(n: number) {
  return new Intl.NumberFormat('es-CO').format(n)
}

export function ProductDetailClient({
  product,
  store
}: {
  product: PublicProductDetail
  store?: PublicCatalogStoreInfo | null
}) {
  const { addLine } = useTiendaCart()
  const { isFavorite, toggleFavorite } = useTiendaFavorites()
  const [qty, setQty] = useState(1)
  const out = product.status === 'out_of_stock' || !product.inStock
  const hasImg = Boolean(product.imageUrl)
  const fav = isFavorite(product.id)

  const storeLabel = product.mainStoreName || store?.name || 'Telefonía ZONA T'
  const storeCity = product.mainStoreCity || store?.city

  return (
    <TiendaPageShell store={store}>
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/tienda"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:mb-6 sm:text-sm"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Volver al catálogo
        </Link>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 lg:gap-x-14">
          {/* Imagen — mismo lenguaje que las cards del catálogo */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100 lg:aspect-square lg:max-h-[min(520px,70vh)]">
            {hasImg ? (
              <Image
                src={product.imageUrl!}
                alt={product.name}
                fill
                className="object-contain p-6 sm:p-10"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-300">
                <Package className="h-20 w-20 sm:h-28 sm:w-28" strokeWidth={1} aria-hidden />
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition-colors',
                fav ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'
              )}
              aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart className={cn('h-4 w-4', fav && 'fill-current')} strokeWidth={1.75} />
            </button>

            {out && (
              <span className="absolute bottom-3 left-3 rounded-full bg-zinc-900/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Agotado
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col lg:py-2">
            {product.brand?.trim() && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {product.brand}
              </p>
            )}

            <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
              {product.name}
            </h1>

            <p className="mt-2 font-mono text-xs text-zinc-400">Ref. {product.reference}</p>

            <p className="mt-5 text-2xl font-bold tabular-nums text-zinc-900 sm:text-3xl">
              {formatCOP(product.price)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Precio referencial en COP</p>

            {!out && (
              <p className="mt-4 inline-flex w-fit items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {formatUnits(product.totalUnits)} disponible{product.totalUnits === 1 ? '' : 's'} en tienda
              </p>
            )}

            {/* Ubicación */}
            <div className="mt-5 flex items-start gap-2.5 border-t border-zinc-100 pt-5 text-sm text-zinc-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="font-medium text-zinc-900">{storeLabel}</p>
                {storeCity && <p className="mt-0.5 text-xs text-zinc-500">{storeCity}</p>}
                {store?.address && (
                  <p className="mt-0.5 text-xs text-zinc-400">{store.address}</p>
                )}
              </div>
            </div>

            {product.description?.trim() && (
              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Descripción
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{product.description}</p>
              </div>
            )}

            {/* Cantidad + carrito */}
            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center">
              <div className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-50"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Menos"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-50"
                  onClick={() => setQty((q) => Math.min(product.totalUnits || 99, q + 1))}
                  aria-label="Más"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={out}
                className={cn(
                  'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors',
                  'hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400',
                  'sm:max-w-xs'
                )}
                onClick={() => {
                  if (out) return
                  addLine({
                    productId: product.id,
                    name: product.name,
                    reference: product.reference,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    quantity: qty
                  })
                  setQty(1)
                }}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                Agregar al carrito
              </button>
            </div>

            <p className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-xs leading-relaxed text-zinc-500">
              Disponibilidad y pago se confirman en tienda o con tu asesor ZONA T. Envíos a toda Colombia.
            </p>
          </div>
        </div>
      </main>
    </TiendaPageShell>
  )
}
