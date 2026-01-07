'use client'

import { AlertCircle } from 'lucide-react'

export function BetaBanner() {
  return (
    <div className="w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Versión Beta 2.0 / Microtiendas
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              •
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Pendientes porque el sistema está teniendo cambios, revisen hasta que se estabilice la versión.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
