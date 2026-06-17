'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Search, ShoppingBag, User } from 'lucide-react'
import { useTiendaCart } from '@/contexts/tienda-cart-context'
import { useTiendaFavorites } from '@/contexts/tienda-favorites-context'
import { cn } from '@/lib/utils'

type TiendaHeaderProps = {
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  storeName?: string | null
}

const iconBtn =
  'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:h-10 sm:w-10'

export function TiendaHeader({
  showSearch,
  searchValue = '',
  onSearchChange,
  storeName
}: TiendaHeaderProps) {
  const { itemCount, openDrawer } = useTiendaCart()
  const { count: favCount } = useTiendaFavorites()

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:gap-6 lg:px-8">
        <Link
          href="/tienda"
          className="flex shrink-0 items-center gap-2.5 sm:gap-3"
          aria-label="ZONA T inicio"
        >
          <Image
            src="/zonat-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-9 w-9 object-contain sm:h-11 sm:w-11"
            priority
            unoptimized
          />
          <div className="hidden min-w-0 sm:block">
            <p className="text-lg font-bold leading-none tracking-tight text-zinc-900">ZONA T</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {storeName?.trim() || 'Telefonía'}
            </p>
          </div>
        </Link>

        {showSearch && onSearchChange && (
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 sm:left-4 sm:h-4 sm:w-4"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar…"
              className="h-9 w-full min-w-0 rounded-full border border-zinc-200 bg-zinc-50/90 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15 sm:h-10 sm:pl-11 lg:h-11 lg:placeholder:text-zinc-400"
              aria-label="Buscar en catálogo"
            />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-0 sm:gap-0.5">
          <Link href="/login" className={iconBtn} aria-label="Mi cuenta">
            <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} />
          </Link>

          <Link href="/tienda/favoritos" className={iconBtn} aria-label="Favoritos">
            <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} />
            {favCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white sm:h-4 sm:min-w-4 sm:text-[10px]">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            className={iconBtn}
            aria-label={itemCount > 0 ? `Carrito, ${itemCount} artículos` : 'Abrir carrito'}
          >
            <ShoppingBag className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[9px] font-bold text-white sm:h-4 sm:min-w-4 sm:text-[10px]">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
