'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const POPOVER_W = 280
const POPOVER_H_EST = 360

interface DatePickerProps {
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  placeholder?: string
  className?: string
  minDate?: Date
}

export function DatePicker({ selectedDate, onDateSelect, placeholder = "Seleccionar fecha", className = "", minDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePopoverPosition = useCallback(() => {
    const el = dropdownRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 8
    const w = Math.min(POPOVER_W, vw - margin * 2)

    let left = rect.right - w
    if (left < margin) left = margin
    if (left + w > vw - margin) left = vw - w - margin

    let top = rect.bottom + 4
    if (top + POPOVER_H_EST > vh - margin) {
      top = rect.top - POPOVER_H_EST - 4
    }
    if (top < margin) top = margin

    setPopoverPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopoverPos(null)
      return
    }
    updatePopoverPosition()
    const onScrollOrResize = () => updatePopoverPosition()
    window.addEventListener('resize', onScrollOrResize)
    document.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      document.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [isOpen, updatePopoverPosition])

  useEffect(() => {
    if (!isOpen) return
    const close = (e: PointerEvent) => {
      const t = e.target as Node
      if (dropdownRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', close, true)
    return () => document.removeEventListener('pointerdown', close, true)
  }, [isOpen])

  // Generar días del mes
  const generateDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días del mes anterior (para completar la semana)
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i)
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      })
    }

    // Días del mes siguiente (para completar la semana)
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      })
    }

    return days
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return
    onDateSelect(date)
    setIsOpen(false)
  }

  const handleClearDate = () => {
    onDateSelect(null)
    setIsOpen(false)
  }

  const handleOpenCalendar = () => {
    setIsOpen((o) => {
      const opening = !o
      if (opening && selectedDate) {
        setCurrentMonth(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        )
      }
      return opening
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false
    return date < minDate
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return placeholder
    return selectedDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const calendarPanel = isOpen && popoverPos && mounted && typeof document !== 'undefined' && (
    <div
      ref={popoverRef}
      className="fixed bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl z-[200] p-4 w-[min(280px,calc(100vw-16px))] max-h-[min(70dvh,420px)] overflow-y-auto overscroll-contain"
      style={{ top: popoverPos.top, left: popoverPos.left }}
      role="dialog"
      aria-label="Calendario"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center px-1">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-manipulation"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-xs text-gray-500 dark:text-gray-400 text-center py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 max-w-full">
        {generateDays().map((dayData, index) => {
          const { day, isCurrentMonth, date } = dayData
          const isCurrentDay = isToday(date)
          const isSelectedDay = isSelected(date)
          const isDisabled = isDateDisabled(date)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                    w-8 h-8 text-xs rounded transition-colors touch-manipulation
                    ${isDisabled
                      ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-100 dark:bg-neutral-900'
                      : isCurrentMonth
                        ? 'text-gray-900 dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                        : 'text-gray-400 dark:text-gray-600'
                    }
                    ${isCurrentDay && !isDisabled
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 font-semibold'
                      : ''
                    }
                    ${isSelectedDay && !isDisabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : ''
                    }
                  `}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const today = new Date()
              if (!isDateDisabled(today)) {
                handleDateClick(today)
              }
            }}
            disabled={isDateDisabled(new Date())}
            className={`flex-1 px-3 py-2 text-xs rounded touch-manipulation ${
              isDateDisabled(new Date())
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-100 dark:bg-neutral-900'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleClearDate}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 touch-manipulation"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input trigger */}
      <div 
        onClick={handleOpenCalendar}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className={selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
            {formatSelectedDate()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedDate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearDate()
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleOpenCalendar()
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {calendarPanel && createPortal(calendarPanel, document.body)}
    </div>
  )
}
