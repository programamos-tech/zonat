'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

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

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  const Icon = type === 'info' ? Info : AlertTriangle
  const iconClass =
    type === 'danger'
      ? 'text-brand-coral'
      : type === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-zinc-400'

  return createPortal(
    <div className="zonat-modal-scrim fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 py-3 sm:py-5 xl:left-60">
      <div
        className="zonat-preserve-surface flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-950/95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-white/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon className={cn('h-5 w-5 shrink-0', iconClass)} strokeWidth={1.75} aria-hidden />
            <h2
              id="confirm-modal-title"
              className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="px-4 py-4 md:px-5">
          <p id="confirm-modal-desc" className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
        </div>

        <footer
          className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-white/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/90"
          style={{ paddingBottom: `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))` }}
        >
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="min-h-9">
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className={cn(
              'min-h-9',
              type === 'danger' &&
                'border-transparent bg-brand-coral text-white hover:border-transparent hover:bg-[#b85a4c] dark:bg-brand-coral dark:hover:bg-[#d4897c]',
              type === 'warning' &&
                'border-amber-600/90 bg-amber-600 text-white hover:border-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
            )}
            variant={type === 'info' ? 'default' : type === 'danger' ? 'destructive' : 'default'}
          >
            {confirmText}
          </Button>
        </footer>
      </div>
    </div>,
    document.body
  )
}
