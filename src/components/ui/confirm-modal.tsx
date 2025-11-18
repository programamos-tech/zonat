'use client'

import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  X 
} from 'lucide-react'

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
  type = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'var(--sidebar-orange)',
          iconBg: 'rgba(92, 156, 124, 0.2)',
          confirmButton: 'var(--sidebar-orange)',
          borderColor: 'rgba(255,255,255,0.06)',
          headerBg: 'rgba(92, 156, 124, 0.1)'
        }
      case 'warning':
        return {
          iconColor: '#F97316',
          iconBg: 'rgba(249, 115, 22, 0.2)',
          confirmButton: '#F97316',
          borderColor: 'rgba(255,255,255,0.06)',
          headerBg: 'rgba(249, 115, 22, 0.1)'
        }
      case 'info':
        return {
          iconColor: 'var(--sidebar-orange)',
          iconBg: 'rgba(92, 156, 124, 0.2)',
          confirmButton: 'var(--sidebar-orange)',
          borderColor: 'rgba(255,255,255,0.06)',
          headerBg: 'rgba(92, 156, 124, 0.1)'
        }
      default:
        return {
          iconColor: 'var(--sidebar-orange)',
          iconBg: 'rgba(92, 156, 124, 0.2)',
          confirmButton: 'var(--sidebar-orange)',
          borderColor: 'rgba(255,255,255,0.06)',
          headerBg: 'rgba(92, 156, 124, 0.1)'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 xl:px-6" style={{ fontFamily: 'var(--font-inter)' }}>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex flex-col" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: styles.headerBg }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full" style={{ backgroundColor: styles.iconBg }}>
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" style={{ color: styles.iconColor }} />
            </div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 md:p-6 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-gray-50 dark:bg-[#1A1A1A] flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
              e.currentTarget.style.backgroundColor = 'rgba(92, 156, 124, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.backgroundColor = ''
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="text-white"
            style={{ backgroundColor: styles.confirmButton }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
