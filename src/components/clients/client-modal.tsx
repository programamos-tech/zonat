'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  User,
  Building2,
  Mail,
  MapPin,
  UserPen,
  ToggleLeft,
} from 'lucide-react'
import { Client } from '@/types'
import { cn } from '@/lib/utils'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: Omit<Client, 'id'>) => void
  client?: Client | null
}

const inputBase =
  'w-full rounded-lg border border-zinc-200/90 bg-white/95 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-[opacity,background-color,border-color] focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: typeof User
  iconClassName?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white/80 p-3.5 dark:border-zinc-700/80 dark:bg-zinc-900/80 md:p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon
          className={cn('h-4 w-4 shrink-0', iconClassName ?? 'text-zinc-500 dark:text-zinc-400')}
          strokeWidth={1.75}
          aria-hidden
        />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    document: client?.document || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    type: client?.type || 'consumidor_final',
    status: client?.status || 'active',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        document: client.document || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        type: client.type || 'consumidor_final',
        status: client.status || 'active',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        city: '',
        state: '',
        type: 'consumidor_final',
        status: 'active',
      })
    }
    setErrors({})
  }, [client])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mayorista':
      case 'minorista':
        return Building2
      default:
        return User
    }
  }

  const getTypeSelectedClass = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'bg-brand-coral text-white shadow-sm'
      case 'minorista':
        return 'bg-brand-gold text-white shadow-sm'
      case 'consumidor_final':
        return 'bg-brand-lime text-white shadow-sm'
      default:
        return 'bg-zinc-500 text-white shadow-sm'
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.document.trim()) {
      newErrors.document = 'La cédula/NIT es obligatoria'
    }

    const emailValue = formData.email.trim()
    if (emailValue && emailValue.toLowerCase() !== 'n/a' && !/\S+@\S+\.\S+/.test(emailValue)) {
      newErrors.email = 'El email no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      const emailValue = formData.email.trim()
      const processedEmail = emailValue && emailValue.toLowerCase() !== 'n/a' ? emailValue : ''

      const clientData: Omit<Client, 'id'> = {
        name: formData.name.trim(),
        email: processedEmail,
        phone: formData.phone.trim(),
        document: formData.document.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        type: formData.type as Client['type'],
        status: formData.status as Client['status'],
        creditLimit: 0,
        currentDebt: 0,
        createdAt: new Date().toISOString(),
      }

      onSave(clientData)
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      city: '',
      state: '',
      type: 'consumidor_final',
      status: 'active',
    })
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  const isEdit = !!client

  const typeOptions = [
    { value: 'mayorista' as const, label: 'Mayorista' },
    { value: 'minorista' as const, label: 'Minorista' },
    { value: 'consumidor_final' as const, label: 'Consumidor Final' },
  ]

  const modal = (
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(68rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-4 md:px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex min-w-0 items-start gap-3">
            <UserPen className="mt-0.5 h-5 w-5 shrink-0 text-brand-lime" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h2
                id="client-modal-title"
                className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
              >
                {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {isEdit ? 'Modifica la información del cliente' : 'Agrega un nuevo cliente al sistema'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50 px-4 py-4 md:px-6 dark:bg-zinc-950">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <SectionCard icon={User} iconClassName="text-brand-lime" title="Información Básica">
              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="client-name"
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Nombre del Cliente <span className="text-brand-coral">*</span>
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className={cn(inputBase, errors.name && 'border-red-400')}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Tipo de Cliente
                  </span>
                  <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                    {typeOptions.map((opt) => {
                      const Icon = getTypeIcon(opt.value)
                      const active = formData.type === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleInputChange('type', opt.value)}
                          className={cn(
                            'flex min-h-10 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-center text-[11px] font-medium transition-colors sm:flex-row sm:gap-1.5 sm:text-sm',
                            active
                              ? getTypeSelectedClass(opt.value)
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="leading-tight">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Mail} iconClassName="text-brand-gold" title="Información de Contacto">
              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="client-document"
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Cédula/NIT <span className="text-brand-coral">*</span>
                  </label>
                  <input
                    id="client-document"
                    type="text"
                    value={formData.document}
                    onChange={(e) => handleInputChange('document', e.target.value)}
                    placeholder="Ej. 1234567890"
                    className={cn(inputBase, errors.document && 'border-red-400')}
                  />
                  {errors.document && (
                    <p className="mt-1 text-xs text-red-500">{errors.document}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="client-phone"
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Teléfono
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ej. 3001234567"
                    className={inputBase}
                  />
                </div>

                <div>
                  <label
                    htmlFor="client-email"
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Email <span className="font-normal text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Ej. correo@ejemplo.com"
                    className={cn(inputBase, errors.email && 'border-red-400')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Si no tienes email, déjalo vacío o escribe &quot;N/A&quot;
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={MapPin} iconClassName="text-brand-coral" title="Información de Ubicación">
              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="client-address"
                    className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    Dirección
                  </label>
                  <input
                    id="client-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ej. Calle 10 #20-30"
                    className={inputBase}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="client-city"
                      className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Ciudad
                    </label>
                    <input
                      id="client-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Ej. Sincelejo"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="client-state"
                      className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Estado
                    </label>
                    <input
                      id="client-state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Ej. Sucre"
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={ToggleLeft} iconClassName="text-brand-lime" title="Estado del Cliente">
              <div className="flex max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => handleInputChange('status', 'active')}
                  className={cn(
                    'flex min-h-9 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors',
                    formData.status === 'active'
                      ? 'bg-brand-lime text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  )}
                >
                  Activo
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('status', 'inactive')}
                  className={cn(
                    'flex min-h-9 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors',
                    formData.status === 'inactive'
                      ? 'bg-brand-coral text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  )}
                >
                  Inactivo
                </button>
              </div>
            </SectionCard>
          </div>
        </div>

        <footer
          className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-zinc-200 bg-white px-4 py-4 md:px-6 dark:border-zinc-800 dark:bg-zinc-950"
          style={{ paddingBottom: `max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))` }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-transparent px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-500/80 dark:text-white dark:hover:bg-zinc-800/80"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-lime px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-lime-muted"
          >
            {isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
          </button>
        </footer>
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
