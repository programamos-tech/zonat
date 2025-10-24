'use client'

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react'
import { Product } from '@/types'
import { ProductsService } from '@/lib/products-service'
import { useAuth } from './auth-context'

interface ProductsContextType {
  products: Product[]
  loading: boolean
  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: string) => Promise<boolean>
  searchProducts: (searchTerm: string) => Promise<Product[]>
  refreshProducts: () => Promise<void>
  transferStock: (productId: string, from: 'warehouse' | 'store', to: 'warehouse' | 'store', quantity: number) => Promise<boolean>
  adjustStock: (productId: string, location: 'warehouse' | 'store', newQuantity: number, reason: string) => Promise<boolean>
  deductStockForSale: (productId: string, quantity: number) => Promise<boolean>
  returnStockFromSale: (productId: string, quantity: number) => Promise<boolean>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useAuth()

  const refreshProducts = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedProducts = await ProductsService.getAllProducts()
      setProducts(fetchedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProducts()
  }, [refreshProducts])

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
    setLoading(true)
    const results = await ProductsService.searchProducts(searchTerm)
    setProducts(results)
    setLoading(false)
    return results
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

  return (
    <ProductsContext.Provider value={{ 
      products, 
      loading, 
      createProduct, 
      updateProduct, 
      deleteProduct, 
      searchProducts, 
      refreshProducts,
      transferStock,
      adjustStock,
      deductStockForSale,
      returnStockFromSale
    }}>
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
