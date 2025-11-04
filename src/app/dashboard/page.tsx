'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  DollarSign, 
  TrendingUp,
  Users,
  Package,
  Shield,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { useSales } from '@/contexts/sales-context'
import { useProducts } from '@/contexts/products-context'
import { useAuth } from '@/contexts/auth-context'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { Sale } from '@/types'
import { CancelledInvoicesModal } from '@/components/dashboard/cancelled-invoices-modal'

type DateFilter = 'today' | 'specific' | 'all'

export default function DashboardPage() {
  const router = useRouter()
  const { sales } = useSales()
  const { totalProducts: totalProductsFromContext, products: productsFromContext, productsLastUpdated } = useProducts()
  const { user } = useAuth()
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [specificDate, setSpecificDate] = useState<Date | null>(null)
  const [isFiltering, setIsFiltering] = useState(false)
  
  // Verificar si el usuario es Super Admin (Diego)
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin'
  
  // Verificar si el usuario puede ver información de créditos (superadmin, admin, vendedor)
  const canViewCredits = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'vendedor'
  
  // Para usuarios no-Super Admin, forzar el filtro a 'today' y mostrar dashboard completo
  const effectiveDateFilter = isSuperAdmin ? dateFilter : 'today'
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [allWarranties, setAllWarranties] = useState<any[]>([])
  const [allCredits, setAllCredits] = useState<any[]>([])
  const [allClients, setAllClients] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [allPaymentRecords, setAllPaymentRecords] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showCancelledModal, setShowCancelledModal] = useState(false)

  // Función helper para agregar timeout a las promesas
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout después de ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  // Función para cargar datos del dashboard
  const loadDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsRefreshing(true)
      }
      
      // Si es la carga inicial, mostrar loading
      if (isInitialLoading) {
        setIsInitialLoading(true)
      }
      
      // Importar servicios
      const { SalesService } = await import('@/lib/sales-service')
      const { WarrantyService } = await import('@/lib/warranty-service')
      const { CreditsService } = await import('@/lib/credits-service')
      const { ClientsService } = await import('@/lib/clients-service')
      const { ProductsService } = await import('@/lib/products-service')
      
      // Cargar TODOS los datos para poder filtrar por cualquier fecha
      // Usar un número muy grande para obtener todos los registros
      const [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult] = await Promise.allSettled([
        withTimeout(SalesService.getAllSales(1, 10000), 20000), // Aumentado para obtener más datos
        withTimeout(WarrantyService.getAllWarranties(), 15000),
        withTimeout(CreditsService.getAllCredits(), 15000),
        withTimeout(ClientsService.getAllClients(), 15000),
        withTimeout(ProductsService.getAllProductsLegacy(), 15000),
        withTimeout(CreditsService.getAllPaymentRecords(), 15000)
      ])
      
      // Procesar resultados, usando datos por defecto si fallan
      const sales = salesResult.status === 'fulfilled' ? salesResult.value.sales : []
      const warranties = warrantiesResult.status === 'fulfilled' ? (warrantiesResult.value.warranties || []) : []
      const credits = creditsResult.status === 'fulfilled' ? (creditsResult.value || []) : []
      const clients = clientsResult.status === 'fulfilled' ? (clientsResult.value.clients || []) : []
      const products = productsResult.status === 'fulfilled' ? (productsResult.value || []) : []
      const payments = paymentRecordsResult.status === 'fulfilled' ? (paymentRecordsResult.value || []) : []
      
      // Log de errores si los hay
      const errors = [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult]
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason)
      
      // Debug: Log información sobre productos obtenidos
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Dashboard] Productos obtenidos: ${products.length}`)
        const totalStockDebug = products.reduce((sum, p) => {
          const localStock = p.stock?.store || 0
          const warehouseStock = p.stock?.warehouse || 0
          return sum + localStock + warehouseStock
        }, 0)
        console.log(`[Dashboard] Stock total calculado (sin filtros): ${totalStockDebug}`)
      }
      
      setAllSales(sales)
      setAllWarranties(warranties)
      setAllCredits(credits)
      setAllClients(clients)
      setAllProducts(products)
      setAllPaymentRecords(payments)
      setLastUpdated(new Date())
    } catch (error) {
      // Error silencioso para no exponer detalles en producción
      // No cambiar los datos en caso de error, mantener los existentes
    } finally {
      // Siempre desactivar el indicador de carga
      setIsInitialLoading(false)
      if (showLoading) {
        setIsRefreshing(false)
      }
    }
  }

  // Función para actualización manual del dashboard
  const handleRefresh = () => {
    // Forzar recarga completa de todos los datos, especialmente productos
    setAllProducts([]) // Limpiar productos existentes para forzar recarga
    loadDashboardData(true) // Mostrar loading
  }

  // Cargar todos los datos para el dashboard cuando cambian las ventas
  useEffect(() => {
    loadDashboardData()
  }, [sales]) // Re-ejecutar cuando sales del contexto cambie
  
  // Cargar datos del dashboard cuando cambian los productos (para actualizar stock total)
  // Usamos una referencia previa para detectar cambios reales
  const prevTotalProductsRef = useRef(totalProductsFromContext)
  const prevProductsLastUpdatedRef = useRef(productsLastUpdated)
  
  useEffect(() => {
    // Detectar cambios en el total de productos (creación/eliminación)
    if (prevTotalProductsRef.current !== totalProductsFromContext && totalProductsFromContext > 0) {
      prevTotalProductsRef.current = totalProductsFromContext
      const timeoutId = setTimeout(() => {
        loadDashboardData()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    
    // Detectar cambios cuando se actualiza stock/costo/precio de productos (productsLastUpdated)
    if (prevProductsLastUpdatedRef.current !== productsLastUpdated && prevProductsLastUpdatedRef.current !== 0) {
      prevProductsLastUpdatedRef.current = productsLastUpdated
      const timeoutId = setTimeout(() => {
        loadDashboardData()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    
    // Inicializar las referencias en el primer render
    if (prevProductsLastUpdatedRef.current === 0) {
      prevProductsLastUpdatedRef.current = productsLastUpdated
    }
  }, [totalProductsFromContext, productsLastUpdated]) // Re-ejecutar cuando cambian productos o cuando se actualiza stock

  // Actualización automática cuando el usuario regresa a la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData(true) // Mostrar loading
      }
    }

    const handleFocus = () => {
      loadDashboardData(true) // Mostrar loading
    }

    // Escuchar cambios de visibilidad de la página
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Función para obtener fechas de filtro
  const getDateRange = (filter: DateFilter) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        break
      case 'specific':
        if (!specificDate) {
          return { startDate: null, endDate: null }
        }
        startDate = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate(), 0, 0, 0, 0)
        endDate = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate(), 23, 59, 59, 999)
        break
      default:
        return { startDate: null, endDate: null }
    }

    return { startDate, endDate }
  }

  // Filtrar datos por período
  const filteredData = useMemo(() => {
    if (effectiveDateFilter === 'all') {
      return {
        sales: allSales,
        warranties: allWarranties,
        credits: allCredits,
        paymentRecords: allPaymentRecords
      }
    }

    const { startDate, endDate } = getDateRange(effectiveDateFilter)
    if (!startDate || !endDate) {
      // Si es 'specific' pero no hay fecha seleccionada, devolver datos vacíos
      if (effectiveDateFilter === 'specific') {
        return {
          sales: [],
          warranties: [],
          credits: [],
          paymentRecords: []
        }
      }
      // Para otros casos, devolver todos los datos
      return {
        sales: allSales,
        warranties: allWarranties,
        credits: allCredits,
        paymentRecords: allPaymentRecords
      }
    }

    const filterByDate = (item: any) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= startDate && itemDate <= endDate
    }

    const filterPaymentRecordsByDate = (payment: any) => {
      const paymentDate = new Date(payment.paymentDate)
      return paymentDate >= startDate && paymentDate <= endDate
    }

    return {
      sales: allSales.filter(filterByDate),
      warranties: allWarranties.filter(filterByDate),
      credits: allCredits.filter(filterByDate),
      paymentRecords: allPaymentRecords.filter(filterPaymentRecordsByDate)
    }
  }, [allSales, allWarranties, allCredits, allPaymentRecords, effectiveDateFilter])

  // Calcular métricas del dashboard
  const metrics = useMemo(() => {
    const { sales, warranties, credits, paymentRecords } = filteredData
    
    // Ingresos por ventas (nuevas ventas)
    const salesRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
    
    // Filtrar abonos cancelados (los abonos de facturas canceladas se marcan como 'cancelled' en payment_records)
    const validPaymentRecords = paymentRecords.filter(payment => {
      // Excluir abonos que estén marcados como cancelados
      return payment.status !== 'cancelled'
    })
    
    // Ingresos por abonos de créditos (solo de facturas/créditos activos)
    const creditPaymentsRevenue = validPaymentRecords.reduce((sum, payment) => sum + payment.amount, 0)
    
    // Ingresos por método de pago (ventas + abonos válidos)
    let cashRevenue = 0
    let transferRevenue = 0
    
    // Procesar ventas
    sales.forEach(sale => {
      if (sale.paymentMethod === 'cash') {
        cashRevenue += sale.total
      } else if (sale.paymentMethod === 'transfer') {
        transferRevenue += sale.total
      } else if (sale.paymentMethod === 'mixed' && sale.payments) {
        // Desglosar pagos mixtos
        sale.payments.forEach(payment => {
          if (payment.paymentType === 'cash') {
            cashRevenue += payment.amount || 0
          } else if (payment.paymentType === 'transfer') {
            transferRevenue += payment.amount || 0
          }
        })
      }
    })
    
    // Agregar abonos de créditos
    cashRevenue += validPaymentRecords
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0)
    
    transferRevenue += validPaymentRecords
      .filter(p => p.paymentMethod === 'transfer')
      .reduce((sum, payment) => sum + payment.amount, 0)

    // Ingresos totales (solo efectivo + transferencia - dinero que realmente ha ingresado)
    const totalRevenue = cashRevenue + transferRevenue

    // Calcular el saldo pendiente de créditos (no el total de ventas a crédito)
    // Solo contar créditos que están pendientes o parciales (no completados)
    const creditRevenue = credits
      .filter(c => c.status === 'pending' || c.status === 'partial')
      .reduce((sum, credit) => sum + (credit.pendingAmount || 0), 0)

    // Calcular el total real de métodos de pago conocidos
    const knownPaymentMethodsTotal = cashRevenue + transferRevenue + creditRevenue
    
    // Productos más vendidos
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0
            }
          }
          productSales[item.productId].quantity += item.quantity
          productSales[item.productId].revenue += item.price * item.quantity
        })
      }
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Garantías
    const completedWarranties = warranties.filter(w => w.status === 'completed').length
    const pendingWarranties = warranties.filter(w => w.status === 'pending').length
    
    // Métricas adicionales para garantías
    const warrantyRate = sales.length > 0 ? ((completedWarranties / sales.length) * 100).toFixed(1) : '0.0'
    
    // Calcular valor total de productos reemplazados en garantías
    const totalWarrantyValue = warranties
      .filter(w => w.status === 'completed')
      .reduce((sum, warranty) => {
        // Buscar el producto de reemplazo para obtener su precio
        const replacementProduct = allProducts.find(p => p.id === warranty.productDeliveredId)
        return sum + (replacementProduct?.price || 0)
      }, 0)
    
    // Calcular días desde la última garantía
    const lastWarranty = warranties
      .filter(w => w.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    
    const daysSinceLastWarranty = lastWarranty 
      ? Math.floor((new Date().getTime() - new Date(lastWarranty.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Créditos pendientes y parciales (dinero afuera) - TODOS los créditos, no filtrados por fecha
    // Excluir créditos cancelados (que tienen totalAmount y pendingAmount en 0)
    const pendingCredits = allCredits.filter(c => 
      (c.status === 'pending' || c.status === 'partial') && 
      !(c.totalAmount === 0 && c.pendingAmount === 0)
    )
    const totalDebt = pendingCredits.reduce((sum, credit) => sum + (credit.pendingAmount || credit.totalAmount || 0), 0)
    
    // Créditos del día actual (para usuarios no-superadmin)
    const dailyCredits = credits.filter(c => 
      (c.status === 'pending' || c.status === 'partial') && 
      !(c.totalAmount === 0 && c.pendingAmount === 0)
    )
    const dailyCreditsDebt = dailyCredits.reduce((sum, credit) => sum + (credit.pendingAmount || credit.totalAmount || 0), 0)
    const dailyCreditsCount = dailyCredits.length
    
    // Créditos vencidos (para información adicional de vendedores)
    const overdueCredits = allCredits.filter(c => {
      if (c.status !== 'pending' && c.status !== 'partial') return false
      if (c.totalAmount === 0 && c.pendingAmount === 0) return false
      if (!c.dueDate) return false
      
      const dueDate = new Date(c.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return dueDate < today
    })
    const overdueCreditsCount = overdueCredits.length
    const overdueCreditsDebt = overdueCredits.reduce((sum, credit) => sum + (credit.pendingAmount || credit.totalAmount || 0), 0)

    // Clientes únicos que han comprado en el período seleccionado
    const uniqueClients = new Set(sales.map(sale => sale.clientId)).size

    // Calcular ganancia bruta (ventas - costo de productos vendidos)
    const grossProfit = sales.reduce((totalProfit, sale) => {
      if (!sale.items) return totalProfit
      
      const saleProfit = sale.items.reduce((itemProfit, item) => {
        // Buscar el producto para obtener su costo
        const product = allProducts.find(p => p.id === item.productId)
        const cost = product?.cost || 0
        const salePrice = item.unitPrice
        const quantity = item.quantity
        const itemGrossProfit = (salePrice - cost) * quantity
        
        return itemProfit + itemGrossProfit
      }, 0)
      
      return totalProfit + saleProfit
    }, 0)

    // Calcular las ventas más rentables para mostrar en la lista
    const topProfitableSales = sales.map(sale => {
      if (!sale.items) return { ...sale, profit: 0 }
      
      const saleProfit = sale.items.reduce((itemProfit, item) => {
        const product = allProducts.find(p => p.id === item.productId)
        const cost = product?.cost || 0
        const salePrice = item.unitPrice
        const quantity = item.quantity
        const itemGrossProfit = (salePrice - cost) * quantity
        
        return itemProfit + itemGrossProfit
      }, 0)
      
      return { ...sale, profit: saleProfit }
    })
    .filter(sale => sale.profit > 0) // Solo ventas con ganancia positiva
    .sort((a, b) => b.profit - a.profit) // Ordenar por ganancia descendente
    .slice(0, 5) // Tomar las 5 más rentables

    // Facturas anuladas en el período seleccionado
    const cancelledSales = sales.filter(sale => sale.status === 'cancelled').length

    // Contar TODOS los productos para stock e inversión (activos e inactivos)
    // Solo excluir productos discontinuados explícitamente
    const productsForCalculation = allProducts.filter(p => {
      const status = p.status?.toLowerCase()
      // Excluir solo productos explícitamente discontinuados
      return status !== 'discontinued'
    })
    
    // Total de unidades en stock (local + bodega) - todos los productos excepto discontinuados
    const totalStockUnits = productsForCalculation.reduce((sum, p) => {
      const localStock = p.stock?.store || 0;  // Corregido: usar 'store' en lugar de 'local'
      const warehouseStock = p.stock?.warehouse || 0;
      return sum + localStock + warehouseStock;
    }, 0)
    
    // Productos con stock bajo - todos los productos excepto discontinuados
    const lowStockProducts = productsForCalculation.filter(p => {
      const localStock = p.stock?.store || 0;  // Corregido: usar 'store' en lugar de 'local'
      const warehouseStock = p.stock?.warehouse || 0;
      return (localStock + warehouseStock) <= 5 && (localStock + warehouseStock) > 0;
    }).length

    // Calcular inversión total en stock (precio de compra * stock actual) - todos los productos excepto discontinuados
    const totalStockInvestment = productsForCalculation.reduce((sum, product) => {
      const localStock = product.stock?.store || 0;
      const warehouseStock = product.stock?.warehouse || 0;
      const totalStock = localStock + warehouseStock;
      const costPrice = product.cost || 0; // Precio de compra/costo
      return sum + (costPrice * totalStock);
    }, 0)

    // Calcular valor estimado de ventas (precio de venta * stock actual) - todos los productos excepto discontinuados
    const estimatedSalesValue = productsForCalculation.reduce((sum, product) => {
      const localStock = product.stock?.store || 0;
      const warehouseStock = product.stock?.warehouse || 0;
      const totalStock = localStock + warehouseStock;
      const sellingPrice = product.price || 0; // Precio de venta
      return sum + (sellingPrice * totalStock);
    }, 0)

    // Datos para gráficos - Mejorado para mostrar todos los días del período

    const salesByDay = sales.reduce((acc: { [key: string]: { amount: number, count: number } }, sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString('es-CO', { 
        weekday: 'short',
        day: '2-digit', 
        month: '2-digit' 
      })
      if (!acc[date]) {
        acc[date] = { amount: 0, count: 0 }
      }
      
      // Solo contar ingresos reales (efectivo + transferencia), no créditos
      if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
        acc[date].amount += sale.total
        acc[date].count += 1
      } else if (sale.paymentMethod === 'mixed' && sale.payments) {
        // Para pagos mixtos, solo contar la parte en efectivo/transferencia
        const realPaymentAmount = sale.payments.reduce((sum, payment) => {
          if (payment.paymentType === 'cash' || payment.paymentType === 'transfer') {
            return sum + (payment.amount || 0)
          }
          return sum
        }, 0)
        if (realPaymentAmount > 0) {
          acc[date].amount += realPaymentAmount
          acc[date].count += 1
        }
      }
      // No contar ventas a crédito (paymentMethod === 'credit') en el gráfico
      
      return acc
    }, {})

    // Agregar abonos de créditos al gráfico (dinero real ingresado)
    validPaymentRecords.forEach(payment => {
      const date = new Date(payment.paymentDate).toLocaleDateString('es-CO', { 
        weekday: 'short',
        day: '2-digit', 
        month: '2-digit' 
      })
      if (!salesByDay[date]) {
        salesByDay[date] = { amount: 0, count: 0 }
      }
      salesByDay[date].amount += payment.amount
      // No incrementar count para abonos, solo para ventas nuevas
    })

    // Generar todos los días del período seleccionado
    const generateAllDays = () => {
      const days = []
      const today = new Date()
      
      if (effectiveDateFilter === 'specific' && specificDate) {
        // Para fecha específica, mostrar solo ese día
        const dateStr = specificDate.toLocaleDateString('es-CO', { 
          weekday: 'short',
          day: '2-digit', 
          month: '2-digit' 
        })
        days.push(dateStr)
      } else if (effectiveDateFilter === 'today') {
        // Para hoy, mostrar solo el día actual
        const dateStr = today.toLocaleDateString('es-CO', { 
          weekday: 'short',
          day: '2-digit', 
          month: '2-digit' 
        })
        days.push(dateStr)
      } else {
        // Para "Todo el Tiempo", mostrar los últimos 30 días
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 29)
        
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toLocaleDateString('es-CO', { 
            weekday: 'short',
            day: '2-digit', 
            month: '2-digit' 
          })
          days.push(dateStr)
        }
      }
      
      return days
    }

    const allDays = generateAllDays()
    const salesChartData = allDays
      .map(date => {
        const data = salesByDay[date] || { amount: 0, count: 0 }
        return { 
          date, 
          amount: data.amount,
          count: data.count,
          average: data.count > 0 ? data.amount / data.count : 0
        }
      })
      .filter(day => day.amount > 0) // Solo mostrar días con ventas

    const paymentMethodData = [
      { name: 'Efectivo', value: cashRevenue, color: '#10B981' },
      { name: 'Transferencia', value: transferRevenue, color: '#3B82F6' },
      { name: 'Crédito', value: creditRevenue, color: '#F59E0B' }
    ].filter(item => item.value > 0)

    const topProductsChart = topProducts.slice(0, 5).map(product => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      cantidad: product.quantity,
      ingresos: product.revenue
    }))

    return {
      totalRevenue,
      salesRevenue,
      creditPaymentsRevenue,
      cashRevenue,
      transferRevenue,
      creditRevenue,
      knownPaymentMethodsTotal,
      totalSales: sales.length,
      topProducts,
      completedWarranties,
      pendingWarranties,
      warrantyRate,
      totalWarrantyValue,
      daysSinceLastWarranty,
      totalDebt,
      pendingCreditsCount: pendingCredits.length,
      dailyCreditsDebt,
      dailyCreditsCount,
      overdueCreditsCount,
      overdueCreditsDebt,
      uniqueClients,
      grossProfit,
      topProfitableSales,
      cancelledSales,
      lowStockProducts,
      totalProducts: totalStockUnits,
      totalStockInvestment,
      estimatedSalesValue,
      totalClients: allClients.length,
      salesChartData,
      paymentMethodData,
      topProductsChart
    }
  }, [filteredData, allProducts, allClients])

  // Obtener etiqueta del filtro de fecha
  const getDateFilterLabel = (filter: DateFilter) => {
    const labels: { [key: string]: string } = {
      today: 'Hoy',
      all: 'Todo el Tiempo',
      specific: specificDate ? specificDate.toLocaleDateString('es-CO') : 'Fecha Específica'
    }
    return labels[filter] || filter
  }

  // Función para manejar cambio de filtro con indicador de carga
  const handleFilterChange = async (newFilter: DateFilter) => {
    if (newFilter === 'specific' && !specificDate) {
      setDateFilter(newFilter)
      return
    }
    
    if (newFilter === 'specific' && specificDate) {
      setIsFiltering(true)
      setDateFilter(newFilter)
      // Recargar datos para la fecha específica
      loadDashboardData().then(() => {
        setIsFiltering(false)
      })
    } else {
      setDateFilter(newFilter)
      setSpecificDate(null)
      setIsFiltering(false) // Asegurar que se desactive
      // Si cambias a 'today' o 'all', también actualizar para asegurar datos frescos
      if (newFilter !== 'specific') {
        loadDashboardData()
      }
    }
  }

  // Función para manejar selección de fecha específica
  const handleDateSelect = (date: Date | null) => {
    setSpecificDate(date)
    if (date) {
      setIsFiltering(true)
      setDateFilter('specific')
      // Recargar datos del dashboard para la fecha específica
      loadDashboardData().then(() => {
        setIsFiltering(false)
      })
    }
  }

  // Mostrar skeleton loader durante la carga inicial
  if (isInitialLoading && allSales.length === 0 && allProducts.length === 0) {
    return (
      <RoleProtectedRoute module="dashboard" requiredAction="view">
        <div className="p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen">
          {/* Header Skeleton */}
          <div className="mb-4 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              {/* Spinner minimalista */}
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-full h-full border-2 border-green-200 dark:border-green-900/30 rounded-full border-t-green-600 dark:border-t-green-400 animate-spin"></div>
              </div>
              <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                Cargando datos del dashboard...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esto puede tomar unos segundos
              </p>
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  // Si no es superadmin, mostrar mensaje de acceso denegado
  if (!isSuperAdmin) {
    return (
      <RoleProtectedRoute module="dashboard" requiredAction="view">
        <div className="p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acceso Restringido
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              El dashboard está temporalmente deshabilitado. Solo usuarios con permisos de Super Admin pueden acceder.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Ir a Productos
            </button>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute module="dashboard" requiredAction="view">
      <div className="p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen relative">
      {/* Overlay de carga para actualizaciones */}
      {(isRefreshing || isFiltering) && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center -mt-[200px]">
            {/* Spinner minimalista */}
            <div className="w-12 h-12 mb-4">
              <div className="w-full h-full border-2 border-green-200 dark:border-green-900/30 rounded-full border-t-green-600 dark:border-t-green-400 animate-spin"></div>
            </div>
            <p className="text-base font-medium text-green-600 dark:text-green-400">
              {isFiltering ? 'Cargando datos del día...' : 'Actualizando dashboard...'}
            </p>
          </div>
        </div>
      )}

      {/* Header con estilo de las otras páginas */}
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">
              Resumen ejecutivo y métricas de rendimiento
            </p>
            
            {/* Indicador de última actualización */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
        </div>
          
          {/* Filtros simplificados */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            {isSuperAdmin ? (
              <div className="flex items-center gap-3">
                {/* Selector de período simplificado */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={dateFilter}
                    onChange={(e) => handleFilterChange(e.target.value as DateFilter)}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {(['today', 'specific', 'all'] as DateFilter[]).map((filter) => (
                      <option key={filter} value={filter}>
                        {getDateFilterLabel(filter)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Botón de actualizar */}
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="w-full sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>

                {/* Calendario para fecha específica */}
                {dateFilter === 'specific' && (
                  <DatePicker
                    selectedDate={specificDate}
                    onDateSelect={handleDateSelect}
                    placeholder="Seleccionar fecha específica"
                    className="w-full sm:w-48"
                  />
                )}

                {/* Indicador de carga para filtro específico */}
                {isFiltering && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Cargando datos del día...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Vista del día actual
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas principales - 4 cards arriba */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Ingresos */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Ingresos</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
            }).format(metrics.totalRevenue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
            {metrics.totalSales} ventas realizadas
                </p>
              </div>

        {/* Efectivo */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Efectivo</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(metrics.cashRevenue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
            {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.cashRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
                </p>
              </div>

        {/* Transferencia */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Transferencia</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
            }).format(metrics.transferRevenue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
            {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.transferRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
                </p>
              </div>

        {/* Crédito */}
        <div 
          onClick={() => router.push('/payments')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Crédito</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(metrics.creditRevenue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredData.credits.filter((c: any) => (c.status === 'pending' || c.status === 'partial') && (c.pendingAmount || 0) > 0).length} créditos pendientes
          </p>
        </div>

      </div>

      {/* Segunda fila de métricas - 4 cards abajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Dinero Afuera - Para usuarios con permisos de créditos */}
        {canViewCredits && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Dinero Afuera</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {isSuperAdmin ? 'Total' : 'Hoy'}
                </p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP',
                minimumFractionDigits: 0 
              }).format(isSuperAdmin ? metrics.totalDebt : metrics.dailyCreditsDebt || 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {isSuperAdmin 
                ? `${metrics.pendingCreditsCount} créditos pendientes/parciales`
                : `${metrics.dailyCreditsCount || 0} créditos del día`
              }
            </p>

            {/* Información adicional para vendedores */}
            {!isSuperAdmin && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Créditos vencidos:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {metrics.overdueCreditsCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Deuda vencida:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${(metrics.overdueCreditsDebt || 0).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Créditos pendientes:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {metrics.pendingCreditsCount || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Garantías Completadas */}
        <div 
          onClick={() => router.push('/warranties')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Garantías Completadas</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.completedWarranties}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {metrics.pendingWarranties} pendientes
          </p>

          {/* Resumen adicional */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tasa:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {metrics.warrantyRate}% de ventas
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Valor:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                ${metrics.totalWarrantyValue.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Última:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {metrics.daysSinceLastWarranty !== null 
                  ? `hace ${metrics.daysSinceLastWarranty} días`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Ganancia Bruta */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
                <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ganancia Bruta</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
                    </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(metrics.grossProfit)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Beneficio por ventas realizadas
          </p>
          
          {/* Lista de ventas más rentables */}
          {metrics.topProfitableSales.length > 0 && (
            <div className="space-y-1">
              {metrics.topProfitableSales.map((sale, index) => {
                const saleTime = new Date(sale.createdAt).toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
                const clientName = sale.clientName || 'Cliente'
                
                return (
                  <div key={sale.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      • {clientName} ({saleTime})
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +${sale.profit.toLocaleString('es-CO')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Productos en Stock - Solo para Super Admin */}
        {isSuperAdmin && (
          <div 
            onClick={() => router.push('/products')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Productos en Stock</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Stock Total</p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.totalProducts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {metrics.lowStockProducts} con stock bajo
            </p>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  ${metrics.totalStockInvestment.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Inversión Total en Stock
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  ${metrics.estimatedSalesValue.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Valor Estimado de Ventas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Facturas Anuladas - Solo para Super Admin */}
        {isSuperAdmin && (
          <div 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            onClick={() => setShowCancelledModal(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.cancelledSales}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              de {metrics.totalSales} ventas totales
            </p>
            
            {/* Resumen adicional */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasa:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics.totalSales > 0 ? ((metrics.cancelledSales / metrics.totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Valor perdido:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  ${sales.filter(sale => sale.status === 'cancelled').reduce((sum, sale) => sum + sale.total, 0).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="text-center pt-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Haz clic para ver análisis detallado
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Gráfico de ventas por día */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ventas por Día</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {effectiveDateFilter === 'today' ? 'Hoy' : 
                   effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                   'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {metrics.salesChartData.length > 0 
                ? `${metrics.salesChartData.length} días con ventas en el período seleccionado`
                : 'No hay ventas en el período seleccionado'
              }
            </p>
          </div>
          <div className="p-4 md:p-6">
            {metrics.salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} className="md:!h-[300px]">
                <BarChart data={metrics.salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={11}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                      return `$${value}`
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'amount') {
                        return [
                          new Intl.NumberFormat('es-CO', { 
                            style: 'currency', 
                            currency: 'COP',
                            minimumFractionDigits: 0 
                          }).format(value),
                          'Total Ventas'
                        ]
                      }
                      if (name === 'count') {
                        return [value, 'Número de Ventas']
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Día: ${label}`}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#colorAmount)" 
                    radius={[4, 4, 0, 0]}
                    stroke="#3B82F6"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay ventas en este período</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de métodos de pago */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Métodos de Pago</h2>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('es-CO', { 
                      style: 'currency', 
                      currency: 'COP',
                      minimumFractionDigits: 0 
                    }).format(value),
                    'Monto'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {metrics.paymentMethodData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-600 dark:text-white">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-CO', { 
                      style: 'currency', 
                      currency: 'COP',
                      minimumFractionDigits: 0 
                    }).format(item.value)}
                  </span>
                </div>
          ))}
            </div>
          </div>
        </div>
      </div>

      {/* Productos más vendidos con gráfico de barras */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Productos Más Vendidos</h2>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {metrics.topProductsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} className="md:!h-[300px]">
              <BarChart data={metrics.topProductsChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'cantidad' ? 'Unidades' : 'Ingresos'
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="cantidad" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay productos vendidos en este período</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Facturas Anuladas - Solo para Super Admin */}
      {isSuperAdmin && (
        <CancelledInvoicesModal
          isOpen={showCancelledModal}
          onClose={() => setShowCancelledModal(false)}
          sales={filteredData.sales}
          allSales={allSales}
        />
      )}
    </div>
    </RoleProtectedRoute>
  )
}
