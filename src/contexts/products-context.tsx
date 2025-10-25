'use client'

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react'
import { Product } from '@/types'
import { ProductsService } from '@/lib/products-service'
import { useAuth } from './auth-context'

interface ProductsContextType {
  products: Product[]
  loading: boolean
  currentPage: number
  totalProducts: number
  hasMore: boolean
  isSearching: boolean
  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  searchProducts: (searchTerm: string) => Promise<Product[]>
  clearSearch: () => Promise<void>
  refreshProducts: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  transferStock: (productId: string, from: 'warehouse' | 'store', to: 'warehouse' | 'store', quantity: number) => Promise<boolean>
  adjustStock: (productId: string, location: 'warehouse' | 'store', newQuantity: number, reason: string) => Promise<boolean>
  deductStockForSale: (productId: string, quantity: number) => Promise<boolean>
  returnStockFromSale: (productId: string, quantity: number) => Promise<boolean>
  importProductsFromCSV: (products: any[]) => Promise<boolean>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { user: currentUser } = useAuth()

  const refreshProducts = async () => {
    setLoading(true)
    try {
      const result = await ProductsService.getAllProducts(1, 10)
      setProducts(result.products)
      setCurrentPage(1)
      setTotalProducts(result.total)
      setHasMore(result.hasMore)
      setIsSearching(false)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProducts()
  }, []) // Empty dependency array to run only once on mount

  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const newProduct = await ProductsService.createProduct(productData, currentUser?.id)
    if (newProduct) {
      setProducts(prev => [newProduct, ...prev])
      return true
    }
    return false
  }

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    const success = await ProductsService.updateProduct(id, updates, currentUser?.id)
    if (success) {
      setProducts(prev => prev.map(product => 
        product.id === id ? { ...product, ...updates } as Product : product
      ))
      return true
    }
    return false
  }

  const deleteProduct = async (id: string): Promise<boolean> => {
    const success = await ProductsService.deleteProduct(id, currentUser?.id)
    if (success) {
      setProducts(prev => prev.filter(product => product.id !== id))
      return true
    }
    return false
  }

  const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    if (!searchTerm.trim()) {
      await clearSearch()
      return []
    }
    
    setLoading(true)
    setIsSearching(true)
    
    try {
      const results = await ProductsService.searchProducts(searchTerm)
      setProducts(results)
      setCurrentPage(1) // Resetear a página 1 en búsquedas
      setLoading(false)
      return results
    } catch (error) {
      console.error('Search error:', error)
      setLoading(false)
      return []
    }
  }

  const clearSearch = async (): Promise<void> => {
    setIsSearching(false)
    try {
      setLoading(true)
      const result = await ProductsService.getAllProducts(1, 10)
      setProducts(result.products)
      setCurrentPage(1)
      setTotalProducts(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= Math.ceil(totalProducts / 10) && !loading) {
      try {
        setLoading(true)
        const result = await ProductsService.getAllProducts(page, 10)
        setProducts(result.products)
        setCurrentPage(page)
        setTotalProducts(result.total)
        setHasMore(result.hasMore)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const transferStock = async (productId: string, from: 'warehouse' | 'store', to: 'warehouse' | 'store', quantity: number): Promise<boolean> => {
    const success = await ProductsService.transferStock(productId, from, to, quantity, currentUser?.id)
    if (success) {
      // Actualizar el estado local
      setProducts(prev => prev.map(product => {
        if (product.id === productId) {
          const newWarehouseStock = from === 'warehouse' ? product.stock.warehouse - quantity : product.stock.warehouse + (to === 'warehouse' ? quantity : 0)
          const newStoreStock = from === 'store' ? product.stock.store - quantity : product.stock.store + (to === 'store' ? quantity : 0)
          return {
            ...product,
            stock: {
              warehouse: newWarehouseStock,
              store: newStoreStock,
              total: newWarehouseStock + newStoreStock
            }
          }
        }
        return product
      }))
    }
    return success
  }

  const adjustStock = async (productId: string, location: 'warehouse' | 'store', newQuantity: number, reason: string): Promise<boolean> => {
    const success = await ProductsService.adjustStock(productId, location, newQuantity, reason, currentUser?.id)
    if (success) {
      // Actualizar el estado local
      setProducts(prev => prev.map(product => {
        if (product.id === productId) {
          const newWarehouseStock = location === 'warehouse' ? newQuantity : product.stock.warehouse
          const newStoreStock = location === 'store' ? newQuantity : product.stock.store
          return {
            ...product,
            stock: {
              warehouse: newWarehouseStock,
              store: newStoreStock,
              total: newWarehouseStock + newStoreStock
            }
          }
        }
        return product
      }))
    }
    return success
  }

  const deductStockForSale = async (productId: string, quantity: number): Promise<boolean> => {
    const success = await ProductsService.deductStockForSale(productId, quantity, currentUser?.id)
    if (success) {
      // Actualizar el estado local - necesitamos refrescar para obtener los valores exactos
      await refreshProducts()
    }
    return success
  }

  const returnStockFromSale = async (productId: string, quantity: number): Promise<boolean> => {
    const success = await ProductsService.returnStockFromSale(productId, quantity)
    if (success) {
      // Actualizar el estado local - necesitamos refrescar para obtener los valores exactos
      await refreshProducts()
    }
    return success
  }

  const importProductsFromCSV = async (products: any[]): Promise<boolean> => {
    const success = await ProductsService.importProductsFromCSV(products)
    if (success) {
      await refreshProducts()
    }
    return success
  }

  const contextValue = {
    products, 
    loading, 
    currentPage: currentPage || 1,
    totalProducts,
    hasMore,
    isSearching,
    createProduct, 
    updateProduct, 
    deleteProduct, 
    searchProducts, 
    clearSearch,
    refreshProducts,
    goToPage,
    transferStock,
    adjustStock,
    deductStockForSale,
    returnStockFromSale,
    importProductsFromCSV
  }

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  )
}

export const useProducts = () => {
  const context = useContext(ProductsContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}
