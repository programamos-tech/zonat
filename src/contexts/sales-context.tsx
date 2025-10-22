'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Sale } from '@/types'
import { SalesService } from '@/lib/sales-service'
import { useAuth } from './auth-context'
import { useProducts } from './products-context'

interface SalesContextType {
  sales: Sale[]
  loading: boolean
  currentPage: number
  totalSales: number
  hasMore: boolean
  createSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>
  updateSale: (id: string, saleData: Partial<Sale>) => Promise<void>
  deleteSale: (id: string) => Promise<void>
  cancelSale: (id: string, reason: string) => Promise<{ success: boolean, totalRefund?: number }>
  searchSales: (searchTerm: string) => Promise<Sale[]>
  refreshSales: () => Promise<void>
  goToPage: (page: number) => Promise<void>
}

const SalesContext = createContext<SalesContextType | undefined>(undefined)

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalSales, setTotalSales] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const { user: currentUser } = useAuth()
  const { refreshProducts, returnStockFromSale } = useProducts()

  const fetchSales = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      const result = await SalesService.getAllSales(page, 10)
      
      if (append) {
        setSales(prev => [...prev, ...result.sales])
      } else {
        setSales(result.sales)
      }
      
      setCurrentPage(page)
      setTotalSales(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado')
    }

    console.log('🔍 DEBUG - Contexto recibiendo:', {
      discount: saleData.discount,
      discountType: saleData.discountType
    })

    try {
      const newSale = await SalesService.createSale(saleData, currentUser.id)
      console.log('🔍 DEBUG - Venta creada en contexto:', {
        sellerName: newSale.sellerName,
        sellerEmail: newSale.sellerEmail,
        itemsWithRef: newSale.items.map(item => ({
          productName: item.productName,
          productReferenceCode: item.productReferenceCode
        }))
      })
      
      // Añadir la venta completa al estado (ya viene con todos los datos del getSaleById)
      setSales(prev => [newSale, ...prev])
      
      // Refrescar productos para actualizar el stock
      await refreshProducts()
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  const updateSale = async (id: string, saleData: Partial<Sale>) => {
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      const updatedSale = await SalesService.updateSale(id, saleData, currentUser.id)
      setSales(prev => prev.map(sale => sale.id === id ? updatedSale : sale))
    } catch (error) {
      console.error('Error updating sale:', error)
      throw error
    }
  }

  const deleteSale = async (id: string) => {
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      await SalesService.deleteSale(id, currentUser.id)
      setSales(prev => prev.filter(sale => sale.id !== id))
    } catch (error) {
      console.error('Error deleting sale:', error)
      throw error
    }
  }

  const cancelSale = async (id: string, reason: string) => {
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      // Cancelar la venta (esto ya maneja el crédito y el stock)
      const result = await SalesService.cancelSale(id, reason, currentUser.id)

      // Actualizar el estado local
      setSales(prev => {
        const updated = prev.map(sale => 
          sale.id === id 
            ? { ...sale, status: 'cancelled' as const }
            : sale
        )
        console.log('Updated sales state:', updated.find(s => s.id === id))
        return updated
      })

      return result
    } catch (error) {
      console.error('Error cancelling sale:', error)
      
      // Proporcionar un mensaje de error más específico
      if (error instanceof Error) {
        if (error.message.includes('Product not found')) {
          throw new Error('Error: No se pudo encontrar uno de los productos para devolver al stock. La venta no fue anulada.')
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('Error: Problema con la base de datos. Por favor, contacta al administrador.')
        } else {
          throw new Error(`Error al anular la venta: ${error.message}`)
        }
      }
      
      throw new Error('Error inesperado al anular la venta. Por favor, inténtalo de nuevo.')
    }
  }

  const searchSales = async (searchTerm: string): Promise<Sale[]> => {
    try {
      return await SalesService.searchSales(searchTerm)
    } catch (error) {
      console.error('Error searching sales:', error)
      throw error
    }
  }

  const refreshSales = async () => {
    await fetchSales(1, false)
  }

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= Math.ceil(totalSales / 10) && !loading) {
      await fetchSales(page, false)
    }
  }

  return (
    <SalesContext.Provider value={{
      sales,
      loading,
      currentPage,
      totalSales,
      hasMore,
      createSale,
      updateSale,
      deleteSale,
      cancelSale,
      searchSales,
      refreshSales,
      goToPage
    }}>
      {children}
    </SalesContext.Provider>
  )
}

export function useSales() {
  const context = useContext(SalesContext)
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider')
  }
  return context
}
