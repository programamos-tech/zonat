'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Building2, X } from 'lucide-react'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const inputClass =
  'w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

interface SupplierEditModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId: string | null
  onSaved: () => void | Promise<void>
}

export function SupplierEditModal({ isOpen, onClose, supplierId, onSaved }: SupplierEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isOpen || !supplierId?.trim()) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const s = await SupplierInvoicesService.getSupplierById(supplierId)
        if (cancelled) return
        if (!s) {
          setLoadError('No se encontró el proveedor o no tienes acceso.')
          return
        }
        setName(s.name || '')
        setContact(s.contact || '')
        setPhone(s.phone || '')
        setEmail(s.email || '')
        setDocument(s.document || '')
        setIsActive(s.isActive !== false)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Error al cargar el proveedor')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, supplierId])

  if (!isOpen || !supplierId?.trim()) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      await SupplierInvoicesService.updateSupplier(supplierId, {
        name: trimmedName,
        contact: contact.trim(),
        phone: phone.trim(),
        email: email.trim(),
        document: document.trim(),
        isActive,
      })
      toast.success('Proveedor actualizado')
      await Promise.resolve(onSaved())
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-[min(28rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-edit-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-700">
          <div className="flex min-w-0 items-center gap-2.5">
            <Building2 className="h-5 w-5 shrink-0 text-brand-lime" strokeWidth={1.5} />
            <div className="min-w-0">
              <h2
                id="supplier-edit-title"
                className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Editar proveedor
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Actualiza los datos del proveedor
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-lime dark:border-zinc-700 dark:border-t-brand-lime" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
          </div>
        ) : loadError ? (
          <div className="space-y-4 p-6">
            <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
            <Button type="button" variant="outline" className="w-full" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Nombre <span className="text-brand-coral">*</span>
                </Label>
                <Input
                  id="supplier-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(inputClass, 'h-11')}
                  placeholder="Ej. Distribuidora ABC S.A.S."
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-contact" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Contacto
                </Label>
                <Input
                  id="supplier-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={cn(inputClass, 'h-11')}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier-phone" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Teléfono
                  </Label>
                  <Input
                    id="supplier-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(inputClass, 'h-11')}
                    placeholder="Ej. 3001234567"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-email" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Correo
                  </Label>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(inputClass, 'h-11')}
                    placeholder="Ej. correo@ejemplo.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-document" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  NIT / documento
                </Label>
                <Input
                  id="supplier-document"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className={cn(inputClass, 'h-11')}
                  placeholder="Ej. 900123456-1"
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-700">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Proveedor activo</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Si lo desactivas, no aparecerá al crear facturas nuevas.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <div
              className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:flex-row sm:justify-end"
              style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))' }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full border-0 bg-brand-lime text-white hover:bg-brand-lime-muted sm:w-auto"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
