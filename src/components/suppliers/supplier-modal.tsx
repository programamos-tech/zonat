'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Building2 } from 'lucide-react'
import { Supplier } from '@/types'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void
  supplier?: Supplier | null
}

export function SupplierModal({ isOpen, onClose, onSave, supplier }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contactPerson: '',
    contactPhone: '',
    paymentTerms: 'cash' as 'cash' | 'credit',
    creditDays: 0,
    rating: 0,
    status: 'active' as 'active' | 'inactive',
    notes: ''
  })

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        nit: supplier.nit || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        contactPerson: supplier.contactPerson || '',
        contactPhone: supplier.contactPhone || '',
        paymentTerms: supplier.paymentTerms || 'cash',
        creditDays: supplier.creditDays || 0,
        rating: supplier.rating || 0,
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      })
    } else {
      setFormData({
        name: '',
        nit: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        contactPerson: '',
        contactPhone: '',
        paymentTerms: 'cash',
        creditDays: 0,
        rating: 0,
        status: 'active',
        notes: ''
      })
    }
  }, [supplier])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) {
      return
    }
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 xl:left-64 bg-white/70 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-none xl:rounded-2xl shadow-2xl w-full h-full xl:h-[calc(98vh-4rem)] xl:w-[calc(100vw-18rem)] xl:max-h-[calc(98vh-4rem)] xl:max-w-[calc(100vw-18rem)] overflow-hidden flex flex-col border-0 xl:border border-gray-200 dark:border-[rgba(255,255,255,0.06)]" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ backgroundColor: 'rgba(92, 156, 124, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 md:h-8 md:w-8" style={{ color: 'var(--sidebar-orange)' }} />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {supplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                {supplier ? 'Modifica la información del proveedor' : 'Completa la información del nuevo proveedor'}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Proveedor *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* NIT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                NIT
              </label>
              <input
                type="text"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Persona de Contacto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Teléfono de Contacto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>

            {/* Términos de Pago */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Términos de Pago
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as 'cash' | 'credit' })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <option value="cash">Contado</option>
                <option value="credit">Crédito</option>
              </select>
            </div>

            {/* Días de Crédito */}
            {formData.paymentTerms === 'credit' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Días de Crédito
                </label>
                <input
                  type="number"
                  value={formData.creditDays}
                  onChange={(e) => setFormData({ ...formData, creditDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                  min="0"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.boxShadow = ''
                  }}
                />
              </div>
            )}

            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-sm text-white"
              style={{ backgroundColor: 'var(--sidebar-orange)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {supplier ? 'Actualizar' : 'Crear'} Proveedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

