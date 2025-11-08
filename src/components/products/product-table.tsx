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
  X,
  RefreshCw
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
  onRefresh?: () => void
  onPageChange: (page: number) => void
  onSearch: (searchTerm: string) => Promise<Product[]>
  totalStock?: number
}

// Número de productos por página
const ITEMS_PER_PAGE = 15

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
  totalStock,
  onStockTransfer,
  onRefresh,
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
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 hover:bg-cyan-100 hover:text-cyan-800 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-400'
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-cyan-600 flex-shrink-0" />
                    <span className="flex-shrink-0">Gestión de Productos</span>
                  {isSearching && (
                      <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs flex-shrink-0">
                      Búsqueda activa
                    </Badge>
                  )}
                </CardTitle>
                  {totalStock !== undefined && (
                    <div className="text-xs md:text-base font-normal text-gray-600 dark:text-gray-400 mt-1">
                      <span className="hidden md:inline">Stock Total: </span>
                      <span className="font-semibold">{new Intl.NumberFormat('es-CO').format(totalStock)}</span>
                      <span className="hidden md:inline"> unidades</span>
                      <span className="md:hidden"> u.</span>
                    </div>
                  )}
                  <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  {isSearching 
                    ? `Mostrando resultados de búsqueda (${filteredProducts.length} productos)`
                    : 'Administra tu inventario de productos'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={onCreate} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 flex-1 sm:flex-none">
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
                <Button 
                  onClick={onManageCategories} 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                >
                    <Tag className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Categorías</span>
                </Button>
                {onRefresh && (
                  <Button 
                    onClick={onRefresh}
                    disabled={loading}
                    variant="outline"
                      className="text-cyan-600 border-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-900/20 disabled:opacity-50 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                  >
                      <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden md:inline ml-2">Actualizar</span>
                  </Button>
                )}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 md:hidden">
                {isSearching 
                  ? `${filteredProducts.length} resultados`
                  : 'Administra tu inventario'
                }
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
                  placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
                      e.preventDefault()
              handleSearch(searchTerm)
            }
          }}
                  className="w-full pl-9 md:pl-10 pr-16 md:pr-20 py-2 md:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setSearchTerm('')
                      handleSearch('')
                    }}
                    className="absolute right-10 md:right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleSearch(searchTerm)
                  }}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  title="Buscar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 relative overflow-hidden">
          {/* Overlay de carga para búsquedas/refresh sin perder el contenido */}
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          )}
          <CardContent className="p-0 m-0">
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
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Nuevo Producto
                </Button>
              </div>
            ) : (
              <>
                {/* Vista de Tarjetas para Mobile */}
                <div className="md:hidden space-y-3 p-3">
                  {filteredProducts.map((product, index) => {
                    const StatusIcon = getStatusIcon(product.status)
                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                              <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">{product.reference}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={product.name}>
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={getCategoryName(product.categoryId)}>
                              {getCategoryName(product.categoryId)}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(product.status)} text-xs shrink-0`}>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden sm:inline">{getStatusLabel(product.status)}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bodega</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{product.stock.warehouse}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Local</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{product.stock.store}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{product.stock.total}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Badge className={`${getStockStatusColor(product)} text-xs`} title={getStockStatusLabel(product)}>
                            {getStockStatusLabel(product)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEdit(product)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 active:scale-95"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {onStockAdjustment && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onStockAdjustment(product)}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100 active:scale-95"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                            {onStockTransfer && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onStockTransfer(product)}
                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-100 active:scale-95"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDelete(product)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100 active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Vista de Tabla para Desktop */}
                <div className="hidden md:block overflow-x-auto products-table-tablet-container lg:overflow-x-visible">
                <table className="w-full table-auto lg:table-auto products-table-tablet">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10 md:w-12">
                        #
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16 md:w-20">
                        <span className="hidden lg:inline">Referencia</span>
                        <span className="lg:hidden">Ref.</span>
                      </th>
                      <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12 md:w-16">
                        Bodega
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12 md:w-16">
                        Local
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12 md:w-16">
                        Total
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 md:w-32">
                        Estado Stock
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20 md:w-24 hidden lg:table-cell">
                        Estado
                      </th>
                      <th className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20 md:w-24">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map((product, index) => {
                      const StatusIcon = getStatusIcon(product.status)
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 md:py-4 whitespace-nowrap w-10 md:w-12">
                            <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 w-16 md:w-20">
                            <div className="text-xs md:text-sm font-mono text-gray-900 dark:text-white font-semibold" title={product.reference}>
                              {product.reference}
                            </div>
                          </td>
                          <td className="px-2 md:px-3 py-2 md:py-4">
                            <div className="text-xs md:text-sm">
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-[120px] md:max-w-[200px] lg:max-w-none" title={product.name}>
                                {product.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[120px] md:max-w-[200px] lg:max-w-none" title={getCategoryName(product.categoryId)}>
                                {getCategoryName(product.categoryId)}
                              </div>
                            </div>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 whitespace-nowrap w-12 md:w-16 text-center">
                            <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.warehouse}
                            </div>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 whitespace-nowrap w-12 md:w-16 text-center">
                            <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.store}
                            </div>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 whitespace-nowrap w-12 md:w-16 text-center">
                            <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                              {product.stock.total}
                            </div>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 w-24 md:w-32">
                            <Badge className={`${getStockStatusColor(product)} text-xs badge-no-truncate`} title={getStockStatusLabel(product)}>
                              <span className="block">{getStockStatusLabel(product)}</span>
                            </Badge>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 w-20 md:w-24 hidden lg:table-cell">
                            <Badge className={`${getStatusColor(product.status)} text-xs`}>
                              <div className="flex items-center space-x-1">
                                <StatusIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{getStatusLabel(product.status)}</span>
                              </div>
                            </Badge>
                          </td>
                          <td className="px-1 md:px-2 py-2 md:py-4 whitespace-nowrap text-center w-20 md:w-24">
                            <div className="flex items-center justify-end gap-2 md:gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEdit(product)}
                                    className="h-7 w-7 md:h-8 md:w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 active:scale-95 touch-manipulation"
                                  >
                                    <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="z-50 bg-cyan-600 text-white border-cyan-700 shadow-lg">
                                  <div className="text-center">
                                    <p className="font-medium text-white">Editar Producto</p>
                                    <p className="text-xs text-cyan-100">Modificar datos del producto</p>
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
                                      className="h-7 w-7 md:h-8 md:w-8 p-0 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100 active:scale-95 touch-manipulation"
                                    >
                                      <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 bg-cyan-600 text-white border-cyan-700 shadow-lg">
                                    <div className="text-center">
                                      <p className="font-medium text-white">Ajustar Stock</p>
                                      <p className="text-xs text-cyan-100">Modificar cantidad de inventario</p>
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
                                      className="h-7 w-7 md:h-8 md:w-8 p-0 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-100 active:scale-95 touch-manipulation"
                                    >
                                      <ArrowRightLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 bg-cyan-600 text-white border-cyan-700 shadow-lg">
                                    <div className="text-center">
                                      <p className="font-medium text-white">Transferir Stock</p>
                                      <p className="text-xs text-cyan-100">Mover entre Bodega y Local</p>
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
                                    className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100 active:scale-95 touch-manipulation"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="z-50 bg-cyan-600 text-white border-cyan-700 shadow-lg">
                                  <div className="text-center">
                                    <p className="font-medium text-white">Eliminar Producto</p>
                                    <p className="text-xs text-cyan-100">Borrar producto permanentemente</p>
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
              </>
            )}

            {/* Paginación - Solo mostrar cuando no está en modo búsqueda */}
            {!isSearching && totalProducts > ITEMS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  <span className="hidden sm:inline">Mostrando </span>
                  <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>
                  <span className="hidden sm:inline"> a </span>
                  <span className="sm:hidden">-</span>
                  <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}</span>
                  <span className="hidden sm:inline"> de </span>
                  <span className="sm:hidden">/</span>
                  <span className="font-semibold">{totalProducts}</span>
                  <span className="hidden md:inline"> productos</span>
                </div>
                
                <div className="flex items-center space-x-1 md:space-x-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-2 md:px-3 py-1.5 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    ‹
                  </button>
                  
                  {/* Números de página */}
                  <div className="flex items-center space-x-0.5 md:space-x-1">
                    {Array.from({ length: Math.ceil(totalProducts / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                      .filter(page => {
                        // Mostrar solo páginas cercanas a la actual
                        return page === 1 || 
                               page === Math.ceil(totalProducts / ITEMS_PER_PAGE) || 
                               Math.abs(page - currentPage) <= 2
                      })
                      .map((page, index, array) => {
                        // Agregar "..." si hay gap
                        const showEllipsis = index > 0 && page - array[index - 1] > 1
                        
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-1 md:px-2 text-gray-400 text-xs md:text-sm">...</span>
                            )}
                            <button
                              onClick={() => onPageChange(page)}
                              disabled={loading}
                              className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors min-w-[28px] md:min-w-[32px] active:scale-95 ${
                                page === currentPage 
                                  ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 font-medium" 
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
                    className="px-2 md:px-3 py-1.5 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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