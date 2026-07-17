'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Tag, Plus, Trash2 } from 'lucide-react'
import { Category } from '@/types'
import { cn } from '@/lib/utils'

const inputBase =
  'w-full rounded-lg border border-zinc-200/90 bg-white/95 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-[border-color,box-shadow] focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'

function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/90 bg-white/80 p-3.5 dark:border-zinc-700/80 dark:bg-zinc-900/80',
        className
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {children}
    </div>
  )
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void
  onToggleStatus: (categoryId: string, newStatus: 'active' | 'inactive') => void
  onDelete: (categoryId: string) => void
  categories: Category[]
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  onToggleStatus,
  onDelete,
  categories,
}: CategoryModalProps) {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [isOpen])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'inactive':
        return 'Inactiva'
      default:
        return status
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSave = () => {
    if (!validateForm()) return
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
    })
    setFormData({ name: '', description: '', status: 'active' })
    setErrors({})
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', status: 'active' })
    setErrors({})
    onClose()
  }

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  const sortedCategories = [...categories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return createPortal(
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[min(68rem,calc(100vw-1.5rem))] touch-auto flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95 sm:max-h-[calc(100dvh-2.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tag className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h2
                id="category-modal-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white"
              >
                Gestión de categorías
              </h2>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Crea nuevas y administra las existentes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={e => {
            e.preventDefault()
            handleSave()
          }}
        >
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-3 md:px-5 md:py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SectionCard title="Nueva categoría">
                <div className="space-y-2.5">
                  <div>
                    <label
                      htmlFor="category-name"
                      className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Nombre <span className="text-zinc-400">*</span>
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={cn(inputBase, errors.name && 'border-red-400')}
                      placeholder="Nombre de la categoría"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="category-desc"
                      className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Descripción <span className="text-zinc-400">*</span>
                    </label>
                    <textarea
                      id="category-desc"
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      className={cn(inputBase, 'min-h-[4rem] resize-y', errors.description && 'border-red-400')}
                      placeholder="Descripción breve"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Estado
                    </span>
                    <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50">
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
                        Activa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('status', 'inactive')}
                        className={cn(
                          'flex min-h-9 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors',
                          formData.status === 'inactive'
                            ? 'bg-zinc-500 text-white shadow-sm dark:bg-zinc-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        )}
                      >
                        Inactiva
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Categorías existentes" className="flex min-h-0 flex-col">
                <div className="max-h-[min(22rem,50dvh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                  {sortedCategories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {cat.name}
                          </h4>
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                              cat.status === 'active'
                                ? 'bg-brand-lime-soft text-brand-lime dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            )}
                          >
                            {getStatusLabel(cat.status)}
                          </span>
                        </div>
                        {cat.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {cat.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleStatus(cat.id, cat.status === 'active' ? 'inactive' : 'active')
                          }
                          className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40',
                            cat.status === 'active' ? 'bg-brand-lime' : 'bg-zinc-300 dark:bg-zinc-600'
                          )}
                          title={cat.status === 'active' ? 'Desactivar' : 'Activar'}
                          aria-label={cat.status === 'active' ? 'Desactivar categoría' : 'Activar categoría'}
                        >
                          <span
                            className={cn(
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                              cat.status === 'active' ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(cat.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-coral transition-colors hover:bg-brand-coral-soft dark:hover:bg-orange-950/40"
                          title="Eliminar categoría"
                          aria-label="Eliminar categoría"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="py-8 text-center">
                      <Tag className="mx-auto mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay categorías creadas</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          <footer
            className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 md:px-5 dark:border-zinc-800 dark:bg-zinc-950/90"
            style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
          >
            <Button type="button" variant="outline" size="sm" onClick={handleClose} className="min-h-9">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="min-h-9 gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Crear categoría
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  )
}
