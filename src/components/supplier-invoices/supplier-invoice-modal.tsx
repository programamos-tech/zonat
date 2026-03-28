'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { X, FileText, Upload, Plus } from 'lucide-react'
import { Supplier, SupplierInvoice } from '@/types'
import { SupplierInvoicesService } from '@/lib/supplier-invoices-service'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

/** Folio único tipo FV-20260328-A1B2C3D4 (sin depender de la red). */
function generateSupplierInvoiceFolio(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
  return `FV-${y}${m}${day}-${suffix}`
}

interface SupplierInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  invoice?: SupplierInvoice | null
}

export function SupplierInvoiceModal({
  isOpen,
  onClose,
  onSaved,
  invoice
}: SupplierInvoiceModalProps) {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [totalStr, setTotalStr] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [issueDate, setIssueDate] = useState<Date | null>(null)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const formatNumber = (value: string): string => {
    const numeric = value.replace(/[^\d]/g, '')
    if (!numeric) return ''
    return parseInt(numeric, 10).toLocaleString('es-CO')
  }

  const parseTotal = (value: string) =>
    parseFloat(value.replace(/[^\d]/g, '')) || 0

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        const list = await SupplierInvoicesService.getSuppliers(true)
        setSuppliers(list)
      } catch {
        setSuppliers([])
      }
    }
    load()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (invoice) {
      setSupplierId(invoice.supplierId)
      setInvoiceNumber(invoice.invoiceNumber)
      setTotalStr(
        invoice.totalAmount > 0
          ? Math.round(invoice.totalAmount).toLocaleString('es-CO')
          : ''
      )
      setNotes(invoice.notes || '')
      setImageUrl(invoice.imageUrl || null)
      setIssueDate(invoice.issueDate ? new Date(invoice.issueDate + 'T12:00:00') : null)
      setDueDate(invoice.dueDate ? new Date(invoice.dueDate + 'T12:00:00') : null)
      setShowNewSupplier(false)
      setNewSupplierName('')
      setUploadPreview(null)
    } else {
      setSupplierId('')
      setInvoiceNumber(generateSupplierInvoiceFolio())
      setTotalStr('')
      setNotes('')
      setImageUrl(null)
      setUploadPreview(null)
      setIssueDate(new Date())
      setDueDate(null)
      setShowNewSupplier(false)
      setNewSupplierName('')
    }
  }, [isOpen, invoice])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setUploadPreview(blobUrl)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-supplier-invoice', {
        method: 'POST',
        body: fd
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir')
      setImageUrl(json.url)
      toast.success('Imagen subida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      URL.revokeObjectURL(blobUrl)
      setUploadPreview(null)
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCreateSupplier = async () => {
    const name = newSupplierName.trim()
    if (!name) {
      toast.error('Escribe el nombre del proveedor')
      return
    }
    try {
      const s = await SupplierInvoicesService.createSupplier({
        name,
        storeId: user?.storeId || '00000000-0000-0000-0000-000000000001',
        isActive: true
      })
      setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))
      setSupplierId(s.id)
      setShowNewSupplier(false)
      setNewSupplierName('')
      toast.success('Proveedor creado')
    } catch {
      toast.error('No se pudo crear el proveedor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      toast.error('Selecciona un proveedor')
      return
    }
    if (!invoiceNumber.trim()) {
      toast.error('Folio no disponible; cierra y vuelve a abrir el formulario')
      return
    }
    if (!issueDate) {
      toast.error('Indica la fecha de emisión')
      return
    }
    const total = parseTotal(totalStr)
    if (total <= 0) {
      toast.error('El total debe ser mayor a 0')
      return
    }
    const y = issueDate.getFullYear()
    const m = String(issueDate.getMonth() + 1).padStart(2, '0')
    const d = String(issueDate.getDate()).padStart(2, '0')
    const issueIso = `${y}-${m}-${d}`
    let dueIso: string | undefined
    if (dueDate) {
      const y2 = dueDate.getFullYear()
      const m2 = String(dueDate.getMonth() + 1).padStart(2, '0')
      const d2 = String(dueDate.getDate()).padStart(2, '0')
      dueIso = `${y2}-${m2}-${d2}`
    }
    setSaving(true)
    try {
      if (invoice) {
        await SupplierInvoicesService.updateInvoice(invoice.id, {
          invoiceNumber: invoiceNumber.trim(),
          issueDate: issueIso,
          dueDate: dueIso ?? null,
          totalAmount: total,
          imageUrl: imageUrl,
          notes: notes.trim() || null
        })
        toast.success('Factura actualizada')
      } else {
        await SupplierInvoicesService.createInvoice({
          supplierId,
          invoiceNumber: invoiceNumber.trim(),
          issueDate: issueIso,
          dueDate: dueIso,
          totalAmount: total,
          imageUrl: imageUrl || undefined,
          notes: notes.trim() || undefined,
          createdBy: user?.id
        })
        toast.success('Factura registrada')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const isEdit = Boolean(invoice)
  const blocked =
    invoice?.status === 'cancelled' || invoice?.status === 'paid'

  /* Portal + z-[100]: el <main> tiene z-10; la bottom nav del body es z-40 y robaba los toques en iPad. */
  const modal = (
    <div
      className="fixed inset-0 xl:left-56 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-6 sm:py-10 lg:px-12"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full sm:max-w-2xl lg:max-w-3xl max-h-[min(88dvh,880px)] sm:max-h-[min(94vh,880px)] min-h-0 overflow-hidden flex flex-col border border-gray-200 dark:border-neutral-700">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:p-4 border-b border-gray-200 dark:border-neutral-600 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-orange-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              {isEdit ? 'Editar factura' : 'Nueva factura de proveedor'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0 touch-manipulation" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 min-h-0 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-1 sm:px-0">
          <Card className="border-0 shadow-none rounded-none">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-2 sm:pt-0">
              <CardTitle className="text-base text-gray-800 dark:text-gray-200">
                Datos de la factura
              </CardTitle>
              {isEdit && invoiceNumber.trim() && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Folio:{' '}
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {invoiceNumber}
                  </span>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-0 px-3 pb-4 sm:px-6">
              {blocked && (
                <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  Esta factura no se puede editar (pagada o anulada).
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Proveedor</Label>
                  <button
                    type="button"
                    className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1"
                    onClick={() => setShowNewSupplier((v) => !v)}
                  >
                    <Plus className="h-3 w-3" />
                    Nuevo proveedor
                  </button>
                </div>
                {showNewSupplier && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre del proveedor"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="text-base h-10"
                    />
                    <Button type="button" variant="secondary" onClick={handleCreateSupplier}>
                      Crear
                    </Button>
                  </div>
                )}
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={blocked || isEdit}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 px-3 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccionar…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Emisión</Label>
                  <DatePicker
                    selectedDate={issueDate}
                    onDateSelect={setIssueDate}
                    placeholder="Fecha"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento (opcional)</Label>
                  <DatePicker
                    selectedDate={dueDate}
                    onDateSelect={setDueDate}
                    placeholder="Opcional"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total a pagar</Label>
                <Input
                  value={totalStr}
                  onChange={(e) => setTotalStr(formatNumber(e.target.value))}
                  disabled={blocked}
                  placeholder="0"
                  className="text-base h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={blocked}
                  rows={2}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 px-4 py-2 text-sm text-gray-900 dark:text-white"
                  placeholder="Orden de compra, observaciones…"
                />
              </div>

              <div className="space-y-2">
                <Label>Comprobante (foto)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm text-orange-700 dark:text-orange-300">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Subiendo…' : 'Subir imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading || blocked} />
                  </label>
                  {imageUrl && (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 underline"
                    >
                      Abrir en pestaña nueva
                    </a>
                  )}
                </div>
                {(imageUrl || uploadPreview) && (
                  <div className="relative mt-2 rounded-xl border-2 border-gray-200 dark:border-neutral-600 overflow-hidden bg-gray-100 dark:bg-neutral-800/80">
                    {uploading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
                        Subiendo…
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadPreview || imageUrl || ''}
                      alt="Vista previa del comprobante"
                      className="w-full max-h-44 sm:max-h-72 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>

          <div
            className="shrink-0 flex gap-2 justify-end border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/95 px-3 py-3 sm:p-4"
            style={{
              paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0px))'
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-12 flex-1 sm:flex-none touch-manipulation"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || blocked}
              className="min-h-12 flex-1 sm:flex-none touch-manipulation bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
