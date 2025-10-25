'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  XCircle
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
import { useAuth } from '@/contexts/auth-context'
import { Sale } from '@/types'

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'

export default function DashboardPage() {
  const { sales } = useSales()
  const { user } = useAuth()
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  
  // Verificar si el usuario es Super Admin (Diego)
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin'
  
  // Para usuarios no-Super Admin, forzar el filtro a 'today' y mostrar dashboard completo
  const effectiveDateFilter = isSuperAdmin ? dateFilter : 'today'
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [allWarranties, setAllWarranties] = useState<any[]>([])
  const [allCredits, setAllCredits] = useState<any[]>([])
  const [allClients, setAllClients] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [allPaymentRecords, setAllPaymentRecords] = useState<any[]>([])

  // Cargar todos los datos para el dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { SalesService } = await import('@/lib/sales-service')
        const { WarrantyService } = await import('@/lib/warranty-service')
        const { CreditsService } = await import('@/lib/credits-service')
        const { ClientsService } = await import('@/lib/clients-service')
        const { ProductsService } = await import('@/lib/products-service')
        
        // Cargar ventas completas (todas las páginas)
        let salesData: Sale[] = []
        let page = 1
        let hasMore = true
        while (hasMore) {
          const result = await SalesService.getAllSales(page, 50)
          salesData = [...salesData, ...result.sales]
          hasMore = result.hasMore
          page++
        }
        
        // Cargar otros datos
        const [warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult] = await Promise.all([
          WarrantyService.getAllWarranties(),
          CreditsService.getAllCredits(),
          ClientsService.getAllClients(),
          ProductsService.getAllProducts(),
          CreditsService.getAllPaymentRecords()
        ])
        
        setAllSales(salesData)
        setAllWarranties(warrantiesResult.warranties || [])
        setAllCredits(creditsResult || [])
        setAllClients(clientsResult.clients || [])
        setAllProducts(productsResult || [])
        setAllPaymentRecords(paymentRecordsResult || [])
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error)
        setAllSales(sales)
      }
    }
    
    loadDashboardData()
  }, [sales]) // Re-ejecutar cuando sales del contexto cambie
  
  // Log cuando sales del contexto cambie
  useEffect(() => {
    console.log('Dashboard: sales del contexto cambiaron:', {
      salesCount: sales.length,
      sales: sales.map(s => ({ id: s.id, total: s.total, paymentMethod: s.paymentMethod }))
    })
  }, [sales])

  // Función para obtener fechas de filtro
  const getDateRange = (filter: DateFilter) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
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
    
    console.log('Dashboard metrics calculation:', {
      salesCount: sales.length,
      sales: sales.map(s => ({ id: s.id, total: s.total, paymentMethod: s.paymentMethod, createdAt: s.createdAt })),
      paymentRecordsCount: paymentRecords.length,
      paymentRecords: paymentRecords.map(p => ({ amount: p.amount, paymentMethod: p.paymentMethod, paymentDate: p.paymentDate })),
      dateFilter: effectiveDateFilter,
      allSalesCount: allSales.length,
      allPaymentRecordsCount: allPaymentRecords.length
    })
    
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
    
    console.log('Revenue calculations:', {
      salesRevenue,
      creditPaymentsRevenue,
      cashRevenue,
      transferRevenue,
      totalRevenue,
      validPaymentRecordsCount: validPaymentRecords.length,
      mixedSales: sales.filter(s => s.paymentMethod === 'mixed').map(s => ({
        id: s.id,
        total: s.total,
        payments: s.payments?.map(p => ({ type: p.paymentType, amount: p.amount }))
      }))
    })

    const creditRevenue = sales
      .filter(s => s.paymentMethod === 'credit')
      .reduce((sum, sale) => sum + sale.total, 0)

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

    // Créditos pendientes y parciales (dinero afuera) - solo del período seleccionado
    const pendingCredits = credits.filter(c => c.status === 'pending' || c.status === 'partial')
    const totalDebt = pendingCredits.reduce((sum, credit) => sum + (credit.pendingAmount || credit.totalAmount || 0), 0)
    
    console.log('Credits calculation:', {
      allCreditsCount: credits.length,
      pendingCreditsCount: pendingCredits.length,
      totalDebt,
      credits: credits.map(c => ({ id: c.id, status: c.status, pendingAmount: c.pendingAmount, totalAmount: c.totalAmount }))
    })

    // Clientes únicos que han comprado en el período seleccionado
    const uniqueClients = new Set(sales.map(sale => sale.clientId)).size

    // Facturas anuladas en el período seleccionado
    const cancelledSales = sales.filter(sale => sale.status === 'cancelled').length

    // Total de unidades en stock (local + bodega)
    const totalStockUnits = allProducts.reduce((sum, p) => {
      const localStock = p.stock?.store || 0;  // Corregido: usar 'store' en lugar de 'local'
      const warehouseStock = p.stock?.warehouse || 0;
      return sum + localStock + warehouseStock;
    }, 0)
    
    // Productos con stock bajo
    const lowStockProducts = allProducts.filter(p => {
      const localStock = p.stock?.store || 0;  // Corregido: usar 'store' en lugar de 'local'
      const warehouseStock = p.stock?.warehouse || 0;
      return (localStock + warehouseStock) <= 5 && (localStock + warehouseStock) > 0;
    }).length

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
      acc[date].amount += sale.total
      acc[date].count += 1
      return acc
    }, {})


    // Generar todos los días del período seleccionado
    const generateAllDays = () => {
      const days = []
      const today = new Date()
      const startDate = new Date(today)
      
      // Ajustar la fecha de inicio según el filtro
      switch (dateFilter) {
        case 'today':
          startDate.setDate(today.getDate())
          break
        case 'week':
          startDate.setDate(today.getDate() - 6)
          break
        case 'month':
          startDate.setDate(today.getDate() - 29)
          break
        case 'quarter':
          startDate.setDate(today.getDate() - 89)
          break
        case 'year':
          startDate.setDate(today.getDate() - 364)
          break
        default:
          startDate.setDate(today.getDate() - 6) // Por defecto, última semana
      }
      
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString('es-CO', { 
          weekday: 'short',
          day: '2-digit', 
          month: '2-digit' 
        })
        days.push(dateStr)
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
      totalDebt,
      pendingCreditsCount: pendingCredits.length,
      uniqueClients,
      cancelledSales,
      lowStockProducts,
      totalProducts: totalStockUnits,
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
      week: 'Esta Semana',
      month: 'Este Mes',
      quarter: 'Últimos 3 Meses',
      year: 'Este Año',
      all: 'Todo el Tiempo'
    }
    return labels[filter] || filter
  }


  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header con estilo de las otras páginas */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">
              Resumen ejecutivo y métricas de rendimiento
          </p>
        </div>
          
          {/* Filtros con estilo de dropdown */}
          <div className="flex items-center gap-3">
            {isSuperAdmin ? (
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                {(['today', 'week', 'month', 'quarter', 'year', 'all'] as DateFilter[]).map((filter) => (
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


      {/* Métricas principales con estilo de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Ingresos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Efectivo</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Transferencia</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
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

        {/* Dinero Afuera */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Dinero Afuera</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(metrics.totalDebt)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
            {metrics.pendingCreditsCount} créditos pendientes/parciales
          </p>
        </div>
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Garantías Completadas */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Garantías Completadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.completedWarranties}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
            {metrics.pendingWarranties} pendientes
          </p>
        </div>

        {/* Clientes Únicos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Clientes que Compraron</span>
                    </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.uniqueClients}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
            en el período seleccionado
                      </p>
                    </div>

        {/* Productos en Stock */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Productos en Stock</span>
                  </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.totalProducts}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
            {metrics.lowStockProducts} con stock bajo
          </p>
                </div>
                
        {/* Facturas Anuladas */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.cancelledSales}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
            de {metrics.totalSales} ventas totales
          </p>
        </div>
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de ventas por día */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ventas por Día</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">
              {metrics.salesChartData.length > 0 
                ? `${metrics.salesChartData.length} días con ventas en el período seleccionado`
                : 'No hay ventas en el período seleccionado'
              }
            </p>
          </div>
          <div className="p-6">
            {metrics.salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Métodos de Pago</h2>
            </div>
          </div>
          <div className="p-6">
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
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Productos Más Vendidos</h2>
          </div>
        </div>
        <div className="p-6">
          {metrics.topProductsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
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
    </div>
  )
}
