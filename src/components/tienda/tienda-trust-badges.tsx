import { Headphones, ShieldCheck, Truck } from 'lucide-react'

const BADGES = [
  {
    icon: ShieldCheck,
    title: 'Originales',
    text: 'Garantía y respaldo ZONA T en cada compra'
  },
  {
    icon: Truck,
    title: 'Envíos',
    text: 'A toda Colombia con logística 100% segura'
  },
  {
    icon: Headphones,
    title: 'Asesoría',
    text: 'Te orientamos por WhatsApp y en tienda física'
  }
] as const

export function TiendaTrustBadges() {
  return (
    <section className="border-b border-zinc-100/80 bg-white">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Móvil: 3 columnas compactas */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 sm:grid-cols-3 sm:gap-10 sm:divide-x-0">
          {BADGES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex flex-col items-center px-2 py-1 text-center sm:flex-row sm:items-start sm:gap-4 sm:px-0 sm:py-0 sm:text-left"
            >
              <Icon
                className="h-7 w-7 shrink-0 text-zinc-800 sm:h-9 sm:w-9 sm:text-emerald-700"
                strokeWidth={1.35}
                aria-hidden
              />
              <div className="mt-2 sm:mt-0">
                <p className="text-[11px] font-semibold leading-tight text-zinc-900 sm:text-sm">
                  {title}
                </p>
                <p className="mt-1 hidden text-xs leading-relaxed text-zinc-500 sm:block">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
