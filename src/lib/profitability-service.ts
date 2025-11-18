import { SalesService } from './sales-service'
import { CreditsService } from './credits-service'
import { WarrantyService } from './warranty-service'
import { ProductsService } from './products-service'
import { Sale, Credit, Warranty, Product } from '@/types'

export interface ProductProfitability {
  productId: string
  productName: string
  productReference?: string
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  unitsSold: number
  averagePrice: number
  averageCost: number
}

export interface MonthlyProfitability {
  month: string
  monthNumber: number
  year: number
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  creditsPaid: number
  warrantiesCompleted: number
  warrantiesCost: number
}

export interface ProfitabilitySummary {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  totalCreditsPaid: number
  totalWarrantiesCost: number
  netProfit: number
  period: {
    start: string
    end: string
  }
}

export interface Insight {
  id: string
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  description: string
  action: string
  productId?: string
  productName?: string
  priority: 'high' | 'medium' | 'low'
}

export class ProfitabilityService {
  // Obtener rentabilidad por producto
  static async getProductProfitability(
    startDate?: string,
    endDate?: string
  ): Promise<ProductProfitability[]> {
    try {
      // Obtener todas las ventas (usar un número grande para obtener todos)
      const { sales } = await SalesService.getAllSales(1, 10000)
      
      // Filtrar por fecha si se proporciona
      let filteredSales = sales
      if (startDate || endDate) {
        filteredSales = sales.filter(sale => {
          const saleDate = new Date(sale.createdAt)
          if (startDate && saleDate < new Date(startDate)) return false
          if (endDate && saleDate > new Date(endDate)) return false
          return true
        })
      }

      // Obtener todos los productos para tener costos (usar método legacy que obtiene todos)
      const allProducts = await ProductsService.getAllProductsLegacy()
      const productsMap = new Map<string, Product>()
      allProducts.forEach(p => productsMap.set(p.id, p))

      // Calcular rentabilidad por producto
      const profitabilityMap = new Map<string, ProductProfitability>()

      filteredSales.forEach(sale => {
        if (sale.status === 'cancelled' || sale.status === 'draft') return
        if (!sale.items || sale.items.length === 0) return

        sale.items.forEach(item => {
          const product = productsMap.get(item.productId)
          if (!product) return

          const cost = product.cost || 0
          // Usar item.total si existe, sino calcular: unitPrice * quantity
          const revenue = item.total || (item.unitPrice * item.quantity)
          const profit = revenue - (cost * item.quantity)

          const existing = profitabilityMap.get(item.productId)
          if (existing) {
            existing.totalSales += 1
            existing.totalRevenue += revenue
            existing.totalCost += cost * item.quantity
            existing.totalProfit += profit
            existing.unitsSold += item.quantity
            // Recalcular promedio
            existing.averagePrice = existing.totalRevenue / existing.unitsSold
          } else {
            profitabilityMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              productReference: item.productReferenceCode,
              totalSales: 1,
              totalRevenue: revenue,
              totalCost: cost * item.quantity,
              totalProfit: profit,
              profitMargin: 0,
              unitsSold: item.quantity,
              averagePrice: item.unitPrice,
              averageCost: cost
            })
          }
        })
      })

      // Calcular márgenes de ganancia
      const profitability: ProductProfitability[] = Array.from(profitabilityMap.values()).map(p => ({
        ...p,
        profitMargin: p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue) * 100 : 0
      }))

      // Ordenar por rentabilidad (mayor ganancia primero)
      return profitability.sort((a, b) => b.totalProfit - a.totalProfit)
    } catch (error) {
      console.error('Error calculando rentabilidad por producto:', error)
      return []
    }
  }

  // Obtener rentabilidad mensual
  static async getMonthlyProfitability(
    months: number = 12,
    startDate?: string,
    endDate?: string
  ): Promise<MonthlyProfitability[]> {
    try {
      // Obtener todas las ventas (usar un número grande para obtener todos)
      const { sales } = await SalesService.getAllSales(1, 10000)
      const credits = await CreditsService.getAllCredits()
      const { warranties } = await WarrantyService.getAllWarranties(1, 1000)

      // Obtener productos para costos (usar método legacy que obtiene todos)
      const allProducts = await ProductsService.getAllProductsLegacy()
      const productsMap = new Map<string, Product>()
      allProducts.forEach(p => productsMap.set(p.id, p))

      // Crear mapa de meses
      const monthlyData = new Map<string, MonthlyProfitability>()
      
      // Determinar el rango de fechas
      let start: Date
      let end: Date
      
      if (startDate && endDate) {
        // Usar las fechas proporcionadas
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        // Usar los últimos N meses desde hoy
        end = new Date()
        start = new Date()
        start.setMonth(start.getMonth() - months)
      }
      
      // Normalizar fechas al inicio del mes
      start = new Date(start.getFullYear(), start.getMonth(), 1)
      end = new Date(end.getFullYear(), end.getMonth() + 1, 0) // Último día del mes
      
      // Generar todos los meses en el rango
      const current = new Date(start)
      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        const monthName = current.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
        
        monthlyData.set(monthKey, {
          month: monthName,
          monthNumber: current.getMonth() + 1,
          year: current.getFullYear(),
          totalSales: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
          creditsPaid: 0,
          warrantiesCompleted: 0,
          warrantiesCost: 0
        })
        
        // Avanzar al siguiente mes
        current.setMonth(current.getMonth() + 1)
      }

      // Procesar ventas
      sales.forEach(sale => {
        if (sale.status === 'cancelled' || sale.status === 'draft') return
        if (!sale.items || sale.items.length === 0) return
        
        const saleDate = new Date(sale.createdAt)
        
        // Filtrar por fechas si se proporcionaron
        if (startDate && saleDate < new Date(startDate)) return
        if (endDate && saleDate > new Date(endDate)) return
        
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyData.get(monthKey)
        
        if (monthData) {
          monthData.totalSales += 1
          // Usar sale.total si existe, sino sumar items
          const saleTotal = sale.total || sale.items.reduce((sum, item) => sum + (item.total || item.unitPrice * item.quantity), 0)
          monthData.totalRevenue += saleTotal
          
          // Calcular costos de productos vendidos
          sale.items.forEach(item => {
            const product = productsMap.get(item.productId)
            if (product) {
              const cost = product.cost || 0
              monthData.totalCost += cost * item.quantity
            }
          })
        }
      })

      // Procesar créditos pagados
      // Obtener todos los registros de pago
      const paymentRecords = await CreditsService.getAllPaymentRecords()
      
      paymentRecords.forEach(payment => {
        if (payment.status === 'cancelled') return
        
        const paymentDate = new Date(payment.paymentDate)
        
        // Filtrar por fechas si se proporcionaron
        if (startDate && paymentDate < new Date(startDate)) return
        if (endDate && paymentDate > new Date(endDate)) return
        
        const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyData.get(monthKey)
        
        if (monthData) {
          monthData.creditsPaid += payment.amount
        }
      })

      // Procesar garantías completadas
      warranties.forEach(warranty => {
        if (warranty.status !== 'completed') return
        
        const completedDate = warranty.completedAt ? new Date(warranty.completedAt) : new Date(warranty.createdAt)
        
        // Filtrar por fechas si se proporcionaron
        if (startDate && completedDate < new Date(startDate)) return
        if (endDate && completedDate > new Date(endDate)) return
        
        const monthKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyData.get(monthKey)
        
        if (monthData) {
          monthData.warrantiesCompleted += 1
          // Calcular costo de garantía (producto entregado)
          if (warranty.productDeliveredId) {
            const product = productsMap.get(warranty.productDeliveredId)
            if (product) {
              monthData.warrantiesCost += (product.cost || 0) * (warranty.quantityDelivered || 1)
            }
          }
        }
      })

      // Calcular ganancias y márgenes
      const result = Array.from(monthlyData.values()).map(month => {
        month.totalProfit = month.totalRevenue - month.totalCost
        month.profitMargin = month.totalRevenue > 0 
          ? (month.totalProfit / month.totalRevenue) * 100 
          : 0
        return month
      })

      return result.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.monthNumber - b.monthNumber
      })
    } catch (error) {
      console.error('Error calculando rentabilidad mensual:', error)
      return []
    }
  }

  // Obtener resumen de rentabilidad
  static async getProfitabilitySummary(
    startDate?: string,
    endDate?: string
  ): Promise<ProfitabilitySummary> {
    try {
      // Obtener todas las ventas (usar un número grande para obtener todos)
      const { sales } = await SalesService.getAllSales(1, 10000)
      const credits = await CreditsService.getAllCredits()
      const { warranties } = await WarrantyService.getAllWarranties(1, 1000)

      // Filtrar por fecha
      let filteredSales = sales
      if (startDate || endDate) {
        filteredSales = sales.filter(sale => {
          const saleDate = new Date(sale.createdAt)
          if (startDate && saleDate < new Date(startDate)) return false
          if (endDate && saleDate > new Date(endDate)) return false
          return true
        })
      }

      // Obtener productos (usar método legacy que obtiene todos)
      const allProducts = await ProductsService.getAllProductsLegacy()
      const productsMap = new Map<string, Product>()
      allProducts.forEach(p => productsMap.set(p.id, p))

      // Calcular ingresos y costos de ventas
      let totalRevenue = 0
      let totalCost = 0

      filteredSales.forEach(sale => {
        if (sale.status === 'cancelled' || sale.status === 'draft') return
        if (!sale.items || sale.items.length === 0) return
        
        // Usar sale.total si existe, sino sumar items
        const saleTotal = sale.total || sale.items.reduce((sum, item) => sum + (item.total || item.unitPrice * item.quantity), 0)
        totalRevenue += saleTotal
        
        sale.items.forEach(item => {
          const product = productsMap.get(item.productId)
          if (product) {
            totalCost += (product.cost || 0) * item.quantity
          }
        })
      })

      // Calcular créditos pagados
      const paymentRecords = await CreditsService.getAllPaymentRecords()
      
      let totalCreditsPaid = 0
      paymentRecords.forEach(payment => {
        if (payment.status === 'cancelled') return
        
        if (startDate || endDate) {
          const paymentDate = new Date(payment.paymentDate)
          if (startDate && paymentDate < new Date(startDate)) return
          if (endDate && paymentDate > new Date(endDate)) return
        }
        totalCreditsPaid += payment.amount
      })

      // Calcular costos de garantías
      let totalWarrantiesCost = 0
      warranties.forEach(warranty => {
        if (warranty.status === 'completed' && warranty.productDeliveredId) {
          const product = productsMap.get(warranty.productDeliveredId)
          if (product) {
            totalWarrantiesCost += (product.cost || 0) * (warranty.quantityDelivered || 1)
          }
        }
      })

      const totalProfit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      const netProfit = totalProfit + totalCreditsPaid - totalWarrantiesCost

      return {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        totalCreditsPaid,
        totalWarrantiesCost,
        netProfit,
        period: {
          start: startDate || '',
          end: endDate || ''
        }
      }
    } catch (error) {
      console.error('Error calculando resumen de rentabilidad:', error)
      return {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalCreditsPaid: 0,
        totalWarrantiesCost: 0,
        netProfit: 0,
        period: {
          start: startDate || '',
          end: endDate || ''
        }
      }
    }
  }

  // Generar insights accionables
  static async generateInsights(
    startDate?: string,
    endDate?: string
  ): Promise<Insight[]> {
    try {
      const insights: Insight[] = []
      
      // Obtener datos necesarios
      const productProfitability = await this.getProductProfitability(startDate, endDate)
      const allProducts = await ProductsService.getAllProductsLegacy()
      const productsMap = new Map(allProducts.map(p => [p.id, p]))
      
      // Calcular promedios para comparación
      const totalUnitsSold = productProfitability.reduce((sum, p) => sum + p.unitsSold, 0)
      const avgUnitsSold = totalUnitsSold / productProfitability.length || 1
      const avgProfitMargin = productProfitability.reduce((sum, p) => sum + p.profitMargin, 0) / productProfitability.length || 0
      
      // Analizar cada producto - solo agregar insights relevantes
      productProfitability.forEach(product => {
        const productData = productsMap.get(product.productId)
        if (!productData) return

        const stockTotal = productData.stock.total
        const isLowStock = stockTotal < 10 // Considerar bajo stock si tiene menos de 10 unidades
        const isVeryLowStock = stockTotal < 5
        const hasLowSales = product.unitsSold < avgUnitsSold * 0.5 && product.unitsSold > 0 // Menos del 50% del promedio pero con ventas
        const hasHighSales = product.unitsSold > avgUnitsSold * 1.5 // Más del 150% del promedio
        const hasGoodMargin = product.profitMargin > avgProfitMargin * 1.2 && product.profitMargin > 30 // 20% más que el promedio y mínimo 30%
        const hasLowMargin = product.profitMargin < avgProfitMargin * 0.5 && product.profitMargin > 0 // Menos del 50% del promedio pero positivo
        const hasNegativeMargin = product.profitMargin < 0
        const hasExcellentMargin = product.profitMargin > 50 // Margen excelente

        // Insight 1: Stock crítico con alta demanda - PRIORIDAD MÁXIMA
        if (isVeryLowStock && hasHighSales && product.unitsSold >= 5) {
          insights.push({
            id: `urgent-${product.productId}`,
            type: 'danger',
            title: `⚠️ Stock crítico: ${product.productName}`,
            description: `Solo quedan ${stockTotal} unidades pero tiene alta demanda (${product.unitsSold} vendidas).`,
            action: `Reordenar URGENTEMENTE. Riesgo de quedarte sin stock.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'high'
          })
          return // No agregar más insights para este producto
        }

        // Insight 2: Producto con buen margen y buena salida pero stock bajo - REORDENAR
        if (hasGoodMargin && hasHighSales && isLowStock && !isVeryLowStock) {
          insights.push({
            id: `reorder-${product.productId}`,
            type: 'warning',
            title: `Reordenar: ${product.productName}`,
            description: `Excelente margen (${product.profitMargin.toFixed(1)}%) y buena salida (${product.unitsSold} unidades), pero stock bajo (${stockTotal} unidades).`,
            action: `Solicitar más unidades para no perder ventas.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'high'
          })
          return
        }

        // Insight 3: Producto con margen negativo - REVISAR PRECIO/COSTO
        if (hasNegativeMargin) {
          insights.push({
            id: `review-${product.productId}`,
            type: 'danger',
            title: `Revisar: ${product.productName}`,
            description: `Margen negativo (${product.profitMargin.toFixed(1)}%). Estás perdiendo dinero con cada venta.`,
            action: `Revisa el precio de venta o busca un proveedor con mejor costo.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'high'
          })
          return
        }

        // Insight 4: Producto con buen margen pero baja salida - PROMOCIÓN (solo si tiene buen margen)
        if (hasExcellentMargin && hasLowSales && product.unitsSold > 0) {
          insights.push({
            id: `promote-${product.productId}`,
            type: 'info',
            title: `Promoción sugerida: ${product.productName}`,
            description: `Excelente margen (${product.profitMargin.toFixed(1)}%) pero baja salida (${product.unitsSold} unidades).`,
            action: `Crea una promoción para aumentar las ventas de este producto rentable.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'medium'
          })
          return
        }

        // Insight 5: Producto estrella - MANTENER STOCK (solo los mejores)
        if (hasGoodMargin && hasHighSales && !isLowStock && product.unitsSold > 20 && product.totalProfit > 1000000) {
          insights.push({
            id: `star-${product.productId}`,
            type: 'success',
            title: `⭐ Producto estrella: ${product.productName}`,
            description: `Excelente rendimiento: ${product.profitMargin.toFixed(1)}% de margen y ${product.unitsSold} unidades vendidas.`,
            action: `Mantén este producto siempre en stock. Genera $${product.totalProfit.toLocaleString('es-CO')} de ganancia.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'low'
          })
          return
        }

        // Insight 6: Producto con bajo margen pero alta salida - OPTIMIZAR
        if (hasLowMargin && hasHighSales && product.unitsSold > 10) {
          insights.push({
            id: `optimize-${product.productId}`,
            type: 'warning',
            title: `Optimizar: ${product.productName}`,
            description: `Alta salida (${product.unitsSold} unidades) pero margen bajo (${product.profitMargin.toFixed(1)}%).`,
            action: `Considera aumentar el precio o buscar un proveedor con mejor costo para mejorar la rentabilidad.`,
            productId: product.productId,
            productName: product.productName,
            priority: 'medium'
          })
          return
        }
      })

      // Ordenar por prioridad (high, medium, low) y luego por tipo
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      insights.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        const typeOrder = { danger: 0, warning: 1, info: 2, success: 3 }
        return typeOrder[a.type] - typeOrder[b.type]
      })

      return insights.slice(0, 10) // Limitar a 10 insights más relevantes
    } catch (error) {
      console.error('Error generando insights:', error)
      return []
    }
  }
}

