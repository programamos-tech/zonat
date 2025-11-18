'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Clock,
  AlertTriangle,
  Shield,
  RefreshCcw
} from 'lucide-react'
import { Warranty } from '@/types'

interface WarrantyTableProps {
  warranties: Warranty[]
  loading: boolean
  onCreate: () => void
  onView: (warranty: Warranty) => void
  onEdit: (warranty: Warranty) => void
  onStatusChange: (warrantyId: string, newStatus: string, notes?: string) => void
  onSearch: (searchTerm: string) => void
  onRefresh?: () => void
  todayWarrantiesCount?: number
}

export function WarrantyTable({ 
  warranties, 
  loading, 
  onCreate, 
  onView, 
  onEdit, 
  onStatusChange,
  onSearch,
  onRefresh,
  todayWarrantiesCount
}: WarrantyTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300'
      case 'completed':
        return 'text-white dark:text-white'
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
      case 'discarded':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
    }
  }

  const getStatusStyle = (status: string) => {
    if (status === 'completed') {
      return {
        backgroundColor: 'rgba(92, 156, 124, 0.2)',
        color: 'var(--sidebar-orange)'
      }
    }
    return undefined
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'in_progress':
        return 'En Proceso'
      case 'completed':
        return 'Completado'
      case 'rejected':
        return 'Rechazado'
      case 'discarded':
        return 'Descartado'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'in_progress':
        return <AlertTriangle className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      case 'discarded':
        return <Trash2 className="h-3 w-3" />
      default:
        return <Shield className="h-3 w-3" />
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'pending', label: 'Pendiente', icon: <Clock className="h-4 w-4" /> },
      { value: 'in_progress', label: 'En Proceso', icon: <AlertTriangle className="h-4 w-4" /> },
      { value: 'completed', label: 'Completado', icon: <CheckCircle className="h-4 w-4" /> },
      { value: 'rejected', label: 'Rechazado', icon: <XCircle className="h-4 w-4" /> },
      { value: 'discarded', label: 'Descartado', icon: <Trash2 className="h-4 w-4" /> }
    ]

    return allStatuses.filter(status => status.value !== currentStatus)
  }

  return (
    <div className="space-y-4 md:space-y-6" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" style={{ color: 'var(--sidebar-orange)' }} />
                  <span className="flex-shrink-0">Gestión de Garantías</span>
                  {todayWarrantiesCount !== undefined && (
                    <span className="text-xs md:text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                      <span className="hidden md:inline">• Hoy: </span>
                      <span className="font-semibold">{todayWarrantiesCount}</span>
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Administra las garantías y productos devueltos
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                  Administra las garantías
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
                    <RefreshCcw className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
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
                  <span className="hidden sm:inline">Nueva Garantía</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-3 md:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar garantía..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--sidebar-orange)' }}></div>
            </div>
          ) : warranties.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay garantías registradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Comienza creando una nueva garantía
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para Mobile */}
              <div className="md:hidden space-y-3 p-3" style={{ fontFamily: 'var(--font-inter)' }}>
                {warranties.map((warranty, index) => {
                  const formatDate = (dateString: string) => {
                    return new Date(dateString).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })
                  }
                  return (
                    <div
                      key={warranty.id}
                      className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 space-y-2 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--sidebar-orange)' }}>#{warranty.id.slice(-6)}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={warranty.clientName}>
                            {warranty.clientName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={warranty.productReceivedName}>
                            {warranty.productReceivedName}
                          </p>
                          {warranty.productReceivedSerial && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={`S/N: ${warranty.productReceivedSerial}`}>
                              S/N: {warranty.productReceivedSerial}
                            </p>
                          )}
                        </div>
                        <Badge className={`${getStatusColor(warranty.status)} text-xs shrink-0`} style={getStatusStyle(warranty.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(warranty.status)}
                            <span className="hidden sm:inline">{getStatusLabel(warranty.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 text-center">Fecha</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white text-center">{formatDate(warranty.createdAt)}</div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={warranty.reason}>
                            {warranty.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(warranty)}
                            className="h-8 w-8 p-0 active:scale-95"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista de Tabla para Desktop */}
              <div className="hidden md:block overflow-x-auto warranty-table-tablet-container">
                <table className="w-full table-fixed md:table-auto lg:table-fixed warranty-table-tablet" style={{ fontFamily: 'var(--font-inter)' }}>
                <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
                  <tr>
                    <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Garantía
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Motivo
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Fecha
                    </th>
                    <th className="px-1 md:px-2 py-3 md:py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                  {warranties.map((warranty) => (
                    <tr key={warranty.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                          #{warranty.id.slice(-6)}
                        </div>
                      </td>
                      <td className="px-2 md:px-3 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-full" title={warranty.clientName}>
                          {warranty.clientName}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate" title={warranty.productReceivedName}>
                          {warranty.productReceivedName}
                        </div>
                        {warranty.productReceivedSerial && (
                          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate" title={`S/N: ${warranty.productReceivedSerial}`}>
                            S/N: {warranty.productReceivedSerial}
                          </div>
                        )}
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-gray-900 dark:text-white truncate" title={warranty.reason}>
                          {warranty.reason}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5">
                        <Badge className={`${getStatusColor(warranty.status)} flex items-center gap-1 w-fit text-xs`} style={getStatusStyle(warranty.status)}>
                          {getStatusIcon(warranty.status)}
                          <span className="hidden sm:inline">{getStatusLabel(warranty.status)}</span>
                        </Badge>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 hidden md:table-cell">
                        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          {new Date(warranty.createdAt).toLocaleDateString('es-CO')}
                        </div>
                      </td>
                      <td className="px-1 md:px-2 py-3 md:py-5 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button
                            onClick={() => onView(warranty)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 md:h-8 md:w-8 p-0 active:scale-95 touch-manipulation"
                            style={{ color: 'var(--sidebar-orange)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
