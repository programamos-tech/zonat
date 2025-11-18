'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Star
} from 'lucide-react'
import { Supplier } from '@/types'

interface SupplierTableProps {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onCreate: () => void
  onRefresh?: () => void
}

export function SupplierTable({ 
  suppliers, 
  onEdit, 
  onDelete, 
  onCreate,
  onRefresh
}: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300' 
      : 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
  }

  const getPaymentTermsLabel = (terms: string, days?: number) => {
    if (terms === 'cash') return 'Contado'
    if (terms === 'credit' && days) return `Crédito ${days} días`
    return 'Crédito'
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm) ||
                         supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                  <span className="flex-shrink-0">Gestión de Proveedores</span>
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Administra tus proveedores y sus datos de contacto
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Administra tus proveedores
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {onRefresh && (
                  <Button 
                    onClick={onRefresh} 
                    variant="outline"
                    className="text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-all duration-200 cursor-pointer"
                    style={{ color: 'var(--sidebar-orange)' }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Actualizar</span>
                  </Button>
                )}
                <Button 
                  onClick={onCreate}
                  className="text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none"
                  style={{ backgroundColor: 'var(--sidebar-orange)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline">Nuevo Proveedor</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ fontFamily: 'var(--font-inter)' }}
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-inter)' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron proveedores
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Comienza creando un nuevo proveedor
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {filteredSuppliers.map((supplier, index) => (
                  <div
                    key={supplier.id}
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                          {supplier.nit && (
                            <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">{supplier.nit}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={supplier.name}>
                          {supplier.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getPaymentTermsLabel(supplier.paymentTerms, supplier.creditDays)}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(supplier.status)} text-xs shrink-0`}>
                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Teléfono</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={supplier.phone}>
                          {supplier.phone}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ciudad</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={supplier.city || 'N/A'}>
                          {supplier.city || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {supplier.rating && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{supplier.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {supplier.totalOrders && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {supplier.totalOrders} órdenes
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(supplier)}
                          className="h-8 w-8 p-0 active:scale-95"
                          style={{ color: 'var(--sidebar-orange)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(supplier)}
                          className="h-8 w-8 p-0 active:scale-95"
                          style={{ color: '#EF4444' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista de Tabla para Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed" style={{ fontFamily: 'var(--font-inter)' }}>
                <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
                  <tr>
                    <th className="w-1/5 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="w-1/5 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="w-1/5 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Términos de Pago
                    </th>
                    <th className="w-1/5 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estadísticas
                    </th>
                    <th className="w-1/5 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                      <td className="px-3 py-3">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 mr-2">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div 
                              className="text-sm font-medium text-gray-900 dark:text-white truncate" 
                              title={supplier.name}
                            >
                              {supplier.name}
                            </div>
                            {supplier.nit && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {supplier.nit}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm min-w-0">
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="truncate" title={supplier.phone}>{supplier.phone}</span>
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate text-xs" title={supplier.email}>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.city && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate text-xs">{supplier.city}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getPaymentTermsLabel(supplier.paymentTerms, supplier.creditDays)}
                        </div>
                        <Badge className={`${getStatusColor(supplier.status)} text-xs mt-1`}>
                          {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm space-y-1">
                          {supplier.rating && (
                            <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{supplier.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {supplier.totalOrders !== undefined && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {supplier.totalOrders} órdenes
                            </div>
                          )}
                          {supplier.totalPurchased !== undefined && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ${supplier.totalPurchased.toLocaleString('es-CO')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(supplier)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(supplier)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: '#EF4444' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

