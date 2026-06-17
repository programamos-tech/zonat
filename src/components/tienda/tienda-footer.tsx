import Image from 'next/image'
import Link from 'next/link'
import { Instagram, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { PublicCatalogStoreInfo } from '@/lib/public-catalog'

type TiendaFooterProps = {
  store?: PublicCatalogStoreInfo | null
}

export function TiendaFooter({ store }: TiendaFooterProps) {
  const year = new Date().getFullYear()
  const city = store?.city?.trim() || 'Sincelejo, Sucre'
  const address = store?.address?.trim() || 'Carrera 20 #22-02'
  const phone = store?.phone?.trim()

  return (
    <footer className="mt-auto bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/tienda" className="inline-flex items-center gap-3">
              <Image
                src="/zonat-logo.png"
                alt="ZONA T"
                width={56}
                height={56}
                className="h-14 w-14 object-contain brightness-110"
                unoptimized
              />
              <div>
                <p className="text-xl font-bold tracking-tight text-white">ZONA T</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                  Tecnología que conecta
                </p>
              </div>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-400">
              {store?.name ?? 'Telefonía ZONA T'} — celulares, tablets y accesorios con respaldo y asesoría en
              tienda.
            </p>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Tienda</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/tienda" className="transition-colors hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <a href="#catalogo" className="transition-colors hover:text-white">
                  Catálogo
                </a>
              </li>
              <li>
                <Link href="/tienda/favoritos" className="transition-colors hover:text-white">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Acceso empresas
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Contacto</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={1.75} />
                <span>
                  {address}
                  <br />
                  {city}
                </span>
              </li>
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={1.75} />
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white">
                    {phone}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={1.75} />
                <span>Asesoría por WhatsApp en tienda</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Síguenos</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.75} />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-zinc-800 pt-8 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ZONA T · Zonat. Todos los derechos reservados.</p>
          <p className="max-w-md text-zinc-600">
            Precios y disponibilidad referenciales. Compra y entrega se confirman en tienda o con tu asesor.
          </p>
        </div>
      </div>
    </footer>
  )
}
