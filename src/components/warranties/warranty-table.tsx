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
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
      case 'discarded':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
    }
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                Gestión de Garantías
                {todayWarrantiesCount !== undefined && (
                  <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                    • Hoy: {todayWarrantiesCount}
                  </span>
                )}
              </CardTitle>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                Administra las garantías y productos devueltos
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onRefresh && (
                <Button 
                  onClick={onRefresh} 
                  variant="outline"
                    className="text-purple-600 border-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20 whitespace-nowrap min-w-[120px]"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              )}
              <Button 
                onClick={onCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap min-w-[120px]"
              >
                Nueva Garantía
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, producto o motivo..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
            <div className="overflow-x-auto warranty-table-tablet-container">
              <table className="w-full table-fixed md:table-auto lg:table-fixed warranty-table-tablet">
                <thead className="bg-gray-50 dark:bg-gray-700">
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
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {warranties.map((warranty) => (
                    <tr key={warranty.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-3 md:py-5">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                          #{warranty.id.slice(-6)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          Factura: {warranty.originalSale?.invoiceNumber || 'N/A'}
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
                        <Badge className={`${getStatusColor(warranty.status)} flex items-center gap-1 w-fit text-xs`}>
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
                            className="h-7 w-7 md:h-8 md:w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 active:scale-95 touch-manipulation"
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
          )}
        </CardContent>
      </Card>

    </div>
  )
}
