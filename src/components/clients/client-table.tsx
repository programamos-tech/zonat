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
  Users,
  Building2,
  User,
  RefreshCcw
} from 'lucide-react'
import { Client } from '@/types'

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
  onCreate: () => void
  onRefresh?: () => void
}

export function ClientTable({ 
  clients, 
  onEdit, 
  onDelete, 
  onCreate,
  onRefresh
}: ClientTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300' 
      : 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300'
      case 'minorista':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300'
      case 'consumidor_final':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mayorista':
        return 'Mayorista'
      case 'minorista':
        return 'Minorista'
      case 'consumidor_final':
        return 'C. Final'
      default:
        return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mayorista':
        return Building2
      case 'minorista':
        return Building2
      case 'consumidor_final':
        return User
      default:
        return User
    }
  }

  const types = ['all', 'mayorista', 'minorista', 'consumidor_final']

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.document.includes(searchTerm) ||
                         client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.state.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || client.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" />
              Gestión de Clientes
            </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Administra tus clientes minoristas, mayoristas y consumidores finales
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
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Todos los tipos' : getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron clientes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comienza creando un nuevo cliente
              </p>
              <Button 
                onClick={onCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Nuevo Cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cédula/NIT
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.map((client) => {
                    const TypeIcon = getTypeIcon(client.type)
                    return (
                      <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-3">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 mr-2">
                              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <TypeIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div 
                                className="text-sm font-medium text-gray-900 dark:text-white truncate" 
                                title={client.name}
                              >
                                {client.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div 
                            className="text-sm font-mono text-gray-900 dark:text-white truncate cursor-help" 
                            title={`Cédula/NIT: ${client.document}`}
                          >
                            {client.document}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge className={`${getTypeColor(client.type)} text-sm px-2 py-1`}>
                            {getTypeLabel(client.type)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm min-w-0">
                            <div 
                              className="text-gray-900 dark:text-white truncate" 
                              title={client.email || 'Sin email'}
                            >
                              {client.email || 'Sin email'}
                            </div>
                            <div 
                              className="text-gray-500 dark:text-gray-400 truncate" 
                              title={client.phone || 'Sin teléfono'}
                            >
                              {client.phone || 'Sin teléfono'}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge className={`${getStatusColor(client.status)} text-sm px-2 py-1`}>
                            {client.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEdit(client)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                              title="Editar cliente"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDelete(client)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
