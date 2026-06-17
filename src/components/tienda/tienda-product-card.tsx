'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Package } from 'lucide-react'
import type { PublicCatalogProduct } from '@/lib/public-catalog'
import { useTiendaCart } from '@/contexts/tienda-cart-context'
import { useTiendaFavorites } from '@/contexts/tienda-favorites-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n)
}

export function TiendaProductCard({ product }: { product: PublicCatalogProduct }) {
  const { addLine } = useTiendaCart()
  const { isFavorite, toggleFavorite } = useTiendaFavorites()
  const out = product.status === 'out_of_stock' || !product.inStock
  const hasImg = Boolean(product.imageUrl)
  const fav = isFavorite(product.id)

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/tienda/p/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100"
      >
        {hasImg ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-300">
            <Package className="h-14 w-14" strokeWidth={1} aria-hidden />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(product.id)
          }}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors',
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
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        {product.brand?.trim() && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            {product.brand}
          </p>
        )}
        <Link href={`/tienda/p/${product.id}`}>
          <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-emerald-800">
            {product.name}
          </h2>
        </Link>
        <p className="mt-2 text-base font-bold tabular-nums text-zinc-900">{formatCOP(product.price)}</p>

        <Button
          type="button"
          size="sm"
          disabled={out}
          variant="outline"
          className="mt-3 h-9 w-full rounded-full border-zinc-300 text-xs font-semibold hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-40"
          onClick={() => {
            if (out) return
            addLine({
              productId: product.id,
              name: product.name,
              reference: product.reference,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity: 1
            })
          }}
        >
          Agregar al carrito
        </Button>
      </div>
    </article>
  )
}
