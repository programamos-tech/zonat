'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Tag,
  Upload,
  X
} from 'lucide-react'
import { Product, Category } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ProductTableProps {
  products: Product[]
  categories: Category[]
  loading: boolean
  currentPage: number
  totalProducts: number
  hasMore: boolean
  isSearching: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onCreate: () => void
  onManageCategories: () => void
  onStockAdjustment?: (product: Product) => void
  onStockTransfer?: (product: Product) => void
  onCSVImport?: () => void
  onPageChange: (page: number) => void
  onSearch: (searchTerm: string) => Promise<Product[]>
}

export function ProductTable({
  products,
  categories,
  loading,
  currentPage,
  totalProducts,
  hasMore,
  isSearching,
  onEdit,
  onDelete,
  onCreate,
  onManageCategories,
  onStockAdjustment,
  onStockTransfer,
  onCSVImport,
  onPageChange,
  onSearch
}: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Función simple para manejar búsqueda
  const handleSearch = (term: string) => {
    onSearch(term)
  }

  // Debounce para búsqueda automática - solo cuando hay texto
  useEffect(() => {
    if (!searchTerm.trim()) {
      return
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Para búsqueda, usar todos los productos (ya vienen filtrados del contexto)
  // Para filtros de categoría y estado, aplicar localmente
  const filteredProducts = products.filter(product => {
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    return matchesCategory && matchesStatus
  })

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Sin categoría'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300'
      case 'discontinued':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
      case 'out_of_stock':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'discontinued':
        return 'Descontinuado'
      case 'out_of_stock':
        return 'Sin Stock'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle
      case 'inactive':
        return Pause
      case 'discontinued':
        return XCircle
      case 'out_of_stock':
        return AlertTriangle
      default:
        return CheckCircle
    }
  }

  // Nueva lógica para estados de stock más precisos
  const getStockStatusLabel = (product: Product) => {
    const { warehouse, store, total } = product.stock
    
    if (total === 0) {
      return 'Sin Stock'
    }
    
    if (store > 0) {
      if (store >= 10) {
        return 'Disponible Local'
      } else if (store >= 5) {
        return 'Stock Local Bajo'
      } else {
        return 'Stock Local Muy Bajo'
      }
    }
    
    if (warehouse > 0) {
      if (warehouse >= 20) {
        return 'Solo Bodega'
      } else if (warehouse >= 10) {
        return 'Solo Bodega (Bajo)'
      } else {
        return 'Solo Bodega (Muy Bajo)'
      }
    }
    
    return 'Sin Stock'
  }

  const getStockStatusColor = (product: Product) => {
    const { warehouse, store, total } = product.stock
    
    if (total === 0) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
    }
    
    if (store > 0) {
      if (store >= 10) {
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-400'
      } else if (store >= 5) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
      } else {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
      }
    }
    
    if (warehouse > 0) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
    }
    
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }


  const categoryOptions = ['all', ...categories.map(c => c.id)]
  const statuses = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'discontinued', label: 'Descontinuado' },
    { value: 'out_of_stock', label: 'Sin Stock' }
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-6 w-6 text-emerald-600" />
                  Gestión de Productos
                  {isSearching && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Búsqueda activa
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {isSearching 
                    ? `Mostrando resultados de búsqueda (${filteredProducts.length} productos)`
                    : 'Administra tu inventario de productos'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
                <Button 
                  onClick={onCSVImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button 
                  onClick={onManageCategories} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Categorías
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
          placeholder="Buscar por nombre, referencia o marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Enter busca inmediatamente, sin esperar debounce
              e.preventDefault() // Prevenir recarga de página
              handleSearch(searchTerm)
            }
          }}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.preventDefault() // Prevenir recarga de página
                      setSearchTerm('')
                      handleSearch('') // Limpiar búsqueda y volver a todos los productos
                    }}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Limpiar búsqueda y volver a todos los productos"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault() // Prevenir recarga de página
                    // Botón de búsqueda busca inmediatamente
                    handleSearch(searchTerm)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="Buscar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Comienza creando un nuevo producto
                </p>
                <Button 
                  onClick={onCreate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="pl-4 pr-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                        Referencia
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                        Producto
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                        Bodega
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                        Local
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                        Total
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                        Estado Stock
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        Estado Producto
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map((product, index) => {
                      const StatusIcon = getStatusIcon(product.status)
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="pl-4 pr-2 py-4 whitespace-nowrap w-12">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-20">
                            <div className="text-sm font-mono text-gray-900 dark:text-white font-semibold">
                              {product.reference}
                            </div>
                          </td>
                          <td className="px-3 py-4 w-48 max-w-48">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-white truncate" title={product.name}>
                                {product.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                {getCategoryName(product.categoryId)}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-16 text-center">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.warehouse}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-16 text-center">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.store}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-16 text-center">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.total}
                            </div>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-32">
                            <Badge className={getStockStatusColor(product)}>
                              {getStockStatusLabel(product)}
                            </Badge>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap w-24">
                            <Badge className={getStatusColor(product.status)}>
                              <div className="flex items-center space-x-1">
                                <StatusIcon className="h-3 w-3" />
                                <span>{getStatusLabel(product.status)}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium w-24">
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEdit(product)}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="z-50 bg-emerald-600 text-white border-emerald-700 shadow-lg">
                                  <div className="text-center">
                                    <p className="font-medium text-white">Editar Producto</p>
                                    <p className="text-xs text-emerald-100">Modificar datos del producto</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>

                              {onStockAdjustment && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onStockAdjustment(product)}
                                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100"
                                    >
                                      <Package className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 bg-emerald-600 text-white border-emerald-700 shadow-lg">
                                    <div className="text-center">
                                      <p className="font-medium text-white">Ajustar Stock</p>
                                      <p className="text-xs text-emerald-100">Modificar cantidad de inventario</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {onStockTransfer && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onStockTransfer(product)}
                                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-100"
                                    >
                                      <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 bg-emerald-600 text-white border-emerald-700 shadow-lg">
                                    <div className="text-center">
                                      <p className="font-medium text-white">Transferir Stock</p>
                                      <p className="text-xs text-emerald-100">Mover entre Bodega y Local</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDelete(product)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="z-50 bg-emerald-600 text-white border-emerald-700 shadow-lg">
                                  <div className="text-center">
                                    <p className="font-medium text-white">Eliminar Producto</p>
                                    <p className="text-xs text-emerald-100">Borrar producto permanentemente</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación - Solo mostrar cuando no está en modo búsqueda */}
            {!isSearching && totalProducts > 10 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, totalProducts)} de {totalProducts} productos
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {/* Números de página */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.ceil(totalProducts / 10) }, (_, i) => i + 1)
                      .filter(page => {
                        // Mostrar solo páginas cercanas a la actual
                        return page === 1 || 
                               page === Math.ceil(totalProducts / 10) || 
                               Math.abs(page - currentPage) <= 2
                      })
                      .map((page, index, array) => {
                        // Agregar "..." si hay gap
                        const showEllipsis = index > 0 && page - array[index - 1] > 1
                        
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400 text-sm">...</span>
                            )}
                            <button
                              onClick={() => onPageChange(page)}
                              disabled={loading}
                              className={`px-3 py-1.5 text-sm rounded-md transition-colors min-w-[32px] ${
                                page === currentPage 
                                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium" 
                                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        )
                      })}
                  </div>
                  
                  {/* Botón Siguiente */}
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasMore || loading}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}