'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { TIENDA_HERO_IMAGE } from '@/config/tienda-storefront'
import { cn } from '@/lib/utils'

type TiendaHeroProps = {
  storeName?: string | null
  storeCity?: string | null
}

export function TiendaHero({ storeName, storeCity }: TiendaHeroProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = !imgError

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950">
      <div className="relative aspect-[2/1] w-full min-h-[200px] max-h-[min(72vh,720px)] sm:min-h-[260px]">
        {showImage ? (
          // Asset estático en /public: sin optimizador de Next para evitar doble compresión y blur.
          <img
            src={TIENDA_HERO_IMAGE}
            alt={storeName ? `Promociones ${storeName}` : 'Telefonía ZONA T'}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(52,211,153,0.25),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(250,204,21,0.12),transparent_45%)]" />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">
                Tecnología que conecta
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Los mejores celulares en {storeCity?.split(',')[0] ?? 'Sincelejo'}
              </h2>
              <p className="mt-3 max-w-md text-sm text-zinc-300 sm:text-base">
                Próximamente tu banner promocional aquí.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-8 lg:p-10">
          <div className="max-w-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-xs sm:text-emerald-300">
              {storeName ?? 'Telefonía ZONA T'}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
              Celulares, tablets y accesorios
            </h1>
            {storeCity && (
              <p className="mt-1 hidden text-sm text-zinc-200/90 sm:block">{storeCity}</p>
            )}
          </div>
          <a
            href="#catalogo"
            className={cn(
              'pointer-events-auto inline-flex w-fit shrink-0 items-center gap-1 rounded-full',
              'h-9 px-4 text-xs font-medium sm:h-11 sm:gap-1.5 sm:px-7 sm:text-sm sm:font-semibold',
              'border border-white/25 bg-white/10 text-white/95 backdrop-blur-md',
              'shadow-none sm:border-white/35 sm:bg-white/95 sm:text-zinc-900 sm:shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
              'transition-all duration-200 hover:border-white/40 hover:bg-white/20 sm:hover:scale-[1.02] sm:hover:bg-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20'
            )}
          >
            Ver catálogo
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  )
}
