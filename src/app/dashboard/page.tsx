'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()])
  
  // Verificar si el usuario es Super Admin (Diego)
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin' || user?.role === 'Super Administrador'
  
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

  const goToCredits = useCallback(() => {
    router.push('/payments')
  }, [router])

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
  const loadDashboardData = async (showLoading = false, overrideFilter?: DateFilter, overrideSpecificDate?: Date | null, overrideYear?: number) => {
    try {
      // Prevenir ejecuciones duplicadas
      if (isRefreshing || isFiltering) {
        console.log('⚠️ [DASHBOARD] loadDashboardData ya está ejecutándose, saltando...')
        return
      }
      
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
      
      // Determinar si necesitamos filtrar por fecha
      // IMPORTANTE: Usar los valores pasados como override, o los del estado si no se pasan
      // Si no hay override, usar el estado actual, pero asegurar que si dateFilter es 'specific', también necesitamos specificDate
      let currentFilter = overrideFilter !== undefined ? overrideFilter : (isSuperAdmin ? dateFilter : 'today')
      
      // Si el filtro es 'specific' pero no hay fecha (ni override ni en estado), cambiar a 'today'
      if (currentFilter === 'specific' && !overrideSpecificDate && !specificDate) {
        console.warn('⚠️ [DASHBOARD] Filtro "specific" pero no hay fecha, cambiando a "today"')
        currentFilter = 'today'
      }
      const dateToUse = overrideSpecificDate !== undefined ? overrideSpecificDate : specificDate
      const yearToUse = overrideYear !== undefined ? overrideYear : selectedYear
      const shouldFilterByDate = currentFilter !== 'all'
      // Pasar specificDate explícitamente para asegurar que se use la fecha correcta
      const { startDate, endDate } = shouldFilterByDate ? getDateRange(currentFilter, yearToUse, dateToUse) : { startDate: null, endDate: null }
      
      console.log('🔍 [DASHBOARD DEBUG]', {
        dateFilter, // Estado original
        currentFilter, // Filtro que vamos a usar (puede ser override)
        dateToUse: dateToUse?.toISOString(), // Fecha que vamos a usar (puede ser override)
        yearToUse, // Año que vamos a usar (puede ser override)
        isSuperAdmin,
        shouldFilterByDate,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      })
      
      // Si hay filtro de fecha (today o specific), usar métodos optimizados con filtrado en backend
      if (shouldFilterByDate && startDate && endDate) {
        console.log('🔍 [DASHBOARD] Cargando datos con filtro de fecha:', {
          filtro: currentFilter,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        const [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult] = await Promise.allSettled([
          withTimeout(SalesService.getDashboardSales(startDate, endDate), 20000),
          withTimeout(WarrantyService.getWarrantiesByDateRange(startDate, endDate), 15000),
          withTimeout(CreditsService.getCreditsByDateRange(startDate, endDate), 15000),
          withTimeout(ClientsService.getAllClients(), 15000), // Clientes siempre todos
          withTimeout(ProductsService.getAllProductsLegacy(), 15000), // Productos siempre todos
          withTimeout(CreditsService.getPaymentRecordsByDateRange(startDate, endDate), 15000)
        ])
        
        // Procesar resultados
        const sales = salesResult.status === 'fulfilled' ? salesResult.value : []
        const warranties = warrantiesResult.status === 'fulfilled' ? warrantiesResult.value : []
        const credits = creditsResult.status === 'fulfilled' ? creditsResult.value : []
        const clients = clientsResult.status === 'fulfilled' ? clientsResult.value : []
        const products = productsResult.status === 'fulfilled' ? productsResult.value : []
        const payments = paymentRecordsResult.status === 'fulfilled' ? paymentRecordsResult.value : []
        
        console.log('✅ [DASHBOARD] Datos cargados con filtro:', {
          ventas: sales.length,
          garantias: warranties.length,
          creditos: credits.length,
          abonos: payments.length
        })
        
        setAllSales(sales)
        setAllWarranties(warranties)
        setAllCredits(credits)
        setAllClients(clients)
        setAllProducts(products)
        setAllPaymentRecords(payments)
        setLastUpdated(new Date())
        
        // Log de errores si los hay
        const errors = [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult]
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason)
        
        if (errors.length > 0) {
          console.error('⚠️ [DASHBOARD] Errores al cargar datos:', errors)
        }
        
        // IMPORTANTE: Salir aquí para no ejecutar el bloque de "Todo el Tiempo"
        return
      } else {
        // Para "Todo el Tiempo", cargar año seleccionado completo
        // Desde 1 enero del año seleccionado hasta hoy (si es año actual) o 31 dic (si es año anterior)
        const { startDate, endDate } = getDateRange('all', yearToUse)
        
        if (!startDate || !endDate) {
          console.error('⚠️ [DASHBOARD] No se pudieron calcular las fechas para el año seleccionado')
          return
        }
        
        console.log('📊 [DASHBOARD] Cargando datos del año', yearToUse, {
          desde: startDate.toLocaleDateString('es-CO'),
          hasta: endDate.toLocaleDateString('es-CO'),
          desdeISO: startDate.toISOString(),
          hastaISO: endDate.toISOString()
        })
        
        const [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult] = await Promise.allSettled([
          withTimeout(SalesService.getDashboardSales(startDate, endDate), 30000), // Más tiempo para años completos
          withTimeout(WarrantyService.getWarrantiesByDateRange(startDate, endDate), 20000),
          withTimeout(CreditsService.getCreditsByDateRange(startDate, endDate), 20000),
          withTimeout(ClientsService.getAllClients(), 15000),
          withTimeout(ProductsService.getAllProductsLegacy(), 15000),
          withTimeout(CreditsService.getPaymentRecordsByDateRange(startDate, endDate), 20000)
        ])
        
        // Procesar resultados
        const sales = salesResult.status === 'fulfilled' ? salesResult.value : []
        const warranties = warrantiesResult.status === 'fulfilled' ? warrantiesResult.value : []
        const credits = creditsResult.status === 'fulfilled' ? creditsResult.value : []
        const clients = clientsResult.status === 'fulfilled' ? clientsResult.value : []
        const products = productsResult.status === 'fulfilled' ? productsResult.value : []
        const payments = paymentRecordsResult.status === 'fulfilled' ? paymentRecordsResult.value : []
        
        console.log('✅ [DASHBOARD] Datos cargados (año', yearToUse, '):', {
          ventas: sales.length,
          garantias: warranties.length,
          creditos: credits.length,
          abonos: payments.length
        })
        
        setAllSales(sales)
        setAllWarranties(warranties)
        setAllCredits(credits)
        setAllClients(clients)
        setAllProducts(products)
        setAllPaymentRecords(payments)
        setLastUpdated(new Date())
        
        // Log de errores si los hay
        const errors = [salesResult, warrantiesResult, creditsResult, clientsResult, productsResult, paymentRecordsResult]
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason)
        
        if (errors.length > 0) {
          console.error('⚠️ [DASHBOARD] Errores al cargar datos:', errors)
        }
      }
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
    // IMPORTANTE: Preservar el filtro actual (today, specific, all) y la fecha específica si existe
    setAllProducts([]) // Limpiar productos existentes para forzar recarga
    console.log('🔄 [DASHBOARD] Actualizando datos con filtro actual:', {
      dateFilter,
      specificDate: specificDate?.toISOString(),
      selectedYear
    })
    // Pasar los parámetros explícitamente para evitar problemas de timing con el estado
    loadDashboardData(true, dateFilter, specificDate, selectedYear)
  }

  // Cargar años disponibles al montar
  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        // Obtener la primera venta para saber desde qué año empezar
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('sales')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)
        
        if (error || !data || data.length === 0) {
          // Si no hay ventas, retornar solo el año actual
          setAvailableYears([new Date().getFullYear()])
          setSelectedYear(new Date().getFullYear())
          return
        }
        
        const firstSaleDate = new Date(data[0].created_at)
        const firstYear = firstSaleDate.getFullYear()
        const currentYear = new Date().getFullYear()
        
        // Generar array de años desde la primera venta hasta el año actual
        const years: number[] = []
        for (let year = firstYear; year <= currentYear; year++) {
          years.push(year)
        }
        
        setAvailableYears(years.reverse()) // Más reciente primero
        setSelectedYear(currentYear) // Año actual por defecto
      } catch (error) {
        // En caso de error, retornar solo el año actual
        setAvailableYears([new Date().getFullYear()])
        setSelectedYear(new Date().getFullYear())
      }
    }
    
    loadAvailableYears()
  }, [])

  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    // Solo cargar si no hay datos aún (evitar doble carga)
    // El filtro inicial es 'today', así que cargará datos de hoy
    if (allSales.length === 0 && allProducts.length === 0) {
      console.log('🚀 [DASHBOARD] Carga inicial - filtro:', effectiveDateFilter)
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  // Función para obtener fechas de filtro
  const getDateRange = (filter: DateFilter, year?: number, overrideSpecificDate?: Date | null) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const targetYear = year || selectedYear
    // Usar la fecha específica pasada como parámetro, o la del estado si no se pasa
    const dateToUse = overrideSpecificDate !== undefined ? overrideSpecificDate : specificDate
    
    let startDate: Date
    let endDate: Date

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        break
      case 'specific':
        if (!dateToUse) {
          console.warn('⚠️ [DASHBOARD] Filtro "specific" pero no hay fecha seleccionada')
          return { startDate: null, endDate: null }
        }
        startDate = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), 0, 0, 0, 0)
        endDate = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate(), 23, 59, 59, 999)
        break
      case 'all':
        // "Todo el Tiempo" = Año seleccionado completo
        // Siempre desde 1 enero hasta 31 diciembre del año seleccionado
        // Sin importar si es el año actual o no
        startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0) // 1 enero del año
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999) // 31 diciembre del año
        break
      default:
        return { startDate: null, endDate: null }
    }

    return { startDate, endDate }
  }

  // Filtrar datos por período
  // NOTA: Ahora los datos ya vienen filtrados del backend cuando hay un filtro de fecha
  // NO aplicar filtrado adicional para evitar problemas de zona horaria
  const filteredData = useMemo(() => {
    // Si es "Todo el Tiempo", devolver todos los datos cargados (últimos 90 días)
    if (effectiveDateFilter === 'all') {
      return {
        sales: allSales,
        warranties: allWarranties,
        credits: allCredits,
        paymentRecords: allPaymentRecords
      }
    }

    // Para filtros específicos (today, specific), los datos YA vienen filtrados del backend
    // NO aplicar filtrado adicional para evitar problemas de zona horaria que eliminen datos válidos
    // El backend ya hizo el filtrado correctamente usando las fechas en UTC
    if (effectiveDateFilter === 'specific' && !specificDate) {
      // Si es 'specific' pero no hay fecha seleccionada, devolver vacío
      return {
        sales: [],
        warranties: [],
        credits: [],
        paymentRecords: []
      }
    }

    // Para 'today' o 'specific' con fecha, los datos ya vienen filtrados del backend
    // Devolverlos directamente sin filtrado adicional
    return {
      sales: allSales,
      warranties: allWarranties,
      credits: allCredits,
      paymentRecords: allPaymentRecords
    }
  }, [allSales, allWarranties, allCredits, allPaymentRecords, effectiveDateFilter, specificDate])

  // Calcular métricas del dashboard
  const metrics = useMemo(() => {
    const { sales, warranties, credits, paymentRecords } = filteredData
    
    // Ingresos por ventas (nuevas ventas) - excluir canceladas y borradores
    const activeSalesForRevenue = sales.filter(sale => sale.status !== 'cancelled' && sale.status !== 'draft')
    const salesRevenue = activeSalesForRevenue.reduce((sum, sale) => sum + sale.total, 0)
    
    // Filtrar abonos cancelados (los abonos de facturas canceladas se marcan como 'cancelled' en payment_records)
    const validPaymentRecords = paymentRecords.filter(payment => {
      // Excluir abonos que estén marcados como cancelados
      return payment.status !== 'cancelled'
    })
    
    // Ingresos por abonos de créditos (solo de facturas/créditos activos)
    const creditPaymentsRevenue = validPaymentRecords.reduce((sum, payment) => sum + payment.amount, 0)
    
    // Ingresos por método de pago (ventas + abonos válidos)
    // Excluir ventas canceladas y borradores del cálculo de ingresos
    const activeSales = sales.filter(sale => sale.status !== 'cancelled' && sale.status !== 'draft')
    
    let cashRevenue = 0
    let transferRevenue = 0
    
    // Procesar solo ventas activas (no canceladas)
    activeSales.forEach(sale => {
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
    
    // Productos más vendidos - Excluir ventas canceladas
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    activeSales.forEach(sale => {
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

    // Productos más vendidos recientemente con facturas asociadas
    const recentProductSales: { [key: string]: { productId: string; productName: string; saleId: string; invoiceNumber: string | null; createdAt: string; quantity: number } } = {}
    activeSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const key = item.productId
          if (!recentProductSales[key] || new Date(sale.createdAt) > new Date(recentProductSales[key].createdAt)) {
            recentProductSales[key] = {
              productId: item.productId,
              productName: item.productName,
              saleId: sale.id,
              invoiceNumber: sale.invoiceNumber || null,
              createdAt: sale.createdAt,
              quantity: item.quantity
            }
          }
        })
      }
    })

    const recentTopProducts = Object.values(recentProductSales)
      .sort((a, b) => {
        // Ordenar por fecha más reciente primero
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })
      .slice(0, 3)
      .map((item) => {
        const saleDate = new Date(item.createdAt)
        const dateLabel = saleDate.toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short'
        }).replace('.', '')
        const timeLabel = saleDate.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        return {
          id: item.productId,
          productName: item.productName,
          invoiceNumber: item.invoiceNumber,
          dateLabel,
          timeLabel,
          quantity: item.quantity
        }
      })

    // Garantías
    const completedWarranties = warranties.filter(w => w.status === 'completed').length
    const pendingWarranties = warranties.filter(w => w.status === 'pending').length
    
    // Métricas adicionales para garantías - Excluir ventas canceladas
    const warrantyRate = activeSales.length > 0 ? ((completedWarranties / activeSales.length) * 100).toFixed(1) : '0.0'
    
    // Calcular valor total de productos reemplazados en garantías
    const completedWarrantyDetails = warranties
      .filter(w => w.status === 'completed')
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })

    const totalWarrantyValue = completedWarrantyDetails.reduce((sum, warranty) => {
      const replacementProduct = allProducts.find(p => p.id === warranty.productDeliveredId)
      return sum + (replacementProduct?.price || 0)
    }, 0)

    const recentWarrantyReplacements = completedWarrantyDetails
      .slice(0, 5)
      .map(warranty => {
        const replacementProduct = allProducts.find(p => p.id === warranty.productDeliveredId)
        const deliveredName = warranty.productDeliveredName || replacementProduct?.name || 'Producto entregado'
        const reference = replacementProduct?.reference
        const value = replacementProduct?.price || 0
        const quantityDelivered = warranty.quantityDelivered || 1
        const warrantyDate = new Date(warranty.updatedAt || warranty.createdAt)
        const dateLabel = warrantyDate.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short'
        }).replace('.', '')
        const timeLabel = warrantyDate.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        })

        return {
          id: warranty.id,
          deliveredName,
          reference,
          value,
          quantityDelivered,
          dateLabel,
          timeLabel
        }
      })
    
    // Calcular días desde la última garantía completada (usar todas las garantías, no solo las filtradas)
    const lastWarranty = allWarranties
      .filter(w => w.status === 'completed')
      .sort((a, b) => {
        // Usar updatedAt si está disponible (fecha de completado), sino createdAt
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })[0]
    
    const daysSinceLastWarranty = lastWarranty 
      ? Math.floor((new Date().getTime() - new Date(lastWarranty.updatedAt || lastWarranty.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Créditos pendientes y parciales (dinero afuera) - TODOS los créditos, no filtrados por fecha
    // Excluir créditos cancelados (que tienen totalAmount y pendingAmount en 0)
    const pendingCredits = allCredits.filter(c => 
      (c.status === 'pending' || c.status === 'partial') && 
      !(c.totalAmount === 0 && c.pendingAmount === 0)
    )
    const totalDebt = pendingCredits.reduce((sum, credit) => sum + (credit.pendingAmount || credit.totalAmount || 0), 0)
    const recentPendingCredits = pendingCredits
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || '').getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || '').getTime()
        return dateB - dateA
      })
      .slice(0, 4)
      .map((credit) => {
        const creditDate = new Date(credit.updatedAt || credit.createdAt || '')
        const dateLabel = creditDate.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short'
        }).replace('.', '')
        const timeLabel = creditDate.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        })
        return {
          id: credit.id,
          clientName: credit.clientName || 'Cliente',
          reference: credit.invoiceNumber,
          status: credit.status,
          pendingAmount: credit.pendingAmount || credit.totalAmount || 0,
          dateLabel,
          timeLabel
        }
      })
    
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

    // Clientes únicos que han comprado en el período seleccionado - Excluir ventas canceladas
    const uniqueClients = new Set(activeSales.map(sale => sale.clientId)).size

    // Calcular ganancia bruta (ventas - costo de productos vendidos)
    // Excluir ventas canceladas del cálculo de ganancia bruta
    // Para ventas a crédito: solo contar la ganancia cuando el crédito esté completado
    const grossProfit = activeSales.reduce((totalProfit, sale) => {
      // Si es una venta a crédito, verificar si el crédito está completado
      if (sale.paymentMethod === 'credit') {
        // Buscar el crédito asociado a esta venta
        const associatedCredit = allCredits.find(c => c.saleId === sale.id)
        
        // Solo contar la ganancia si el crédito está completado
        // Si no hay crédito asociado o no está completado, no contar la ganancia
        if (!associatedCredit || associatedCredit.status !== 'completed') {
          return totalProfit
        }
      }
      
      if (!sale.items) return totalProfit
      
      const saleProfit = sale.items.reduce((itemProfit, item) => {
        // Buscar el producto para obtener su costo
        const product = allProducts.find(p => p.id === item.productId)
        const cost = product?.cost || 0
        
        // Calcular el precio real de venta después de descuentos
        const baseTotal = item.quantity * item.unitPrice
        const discountAmount = item.discountType === 'percentage' 
          ? (baseTotal * (item.discount || 0)) / 100 
          : (item.discount || 0)
        const salePriceAfterDiscount = Math.max(0, baseTotal - discountAmount)
        
        // El precio unitario real después de descuentos
        const realUnitPrice = item.quantity > 0 ? salePriceAfterDiscount / item.quantity : 0
        
        // Ganancia bruta = (precio de venta real - costo) * cantidad
        const itemGrossProfit = (realUnitPrice - cost) * item.quantity
        
        return itemProfit + itemGrossProfit
      }, 0)
      
      return totalProfit + saleProfit
    }, 0)

    // Calcular las ventas más rentables para mostrar en la lista
    // Excluir ventas canceladas
    // Para ventas a crédito: solo contar la ganancia cuando el crédito esté completado
    const topProfitableSales = activeSales.map(sale => {
      // Si es una venta a crédito, verificar si el crédito está completado
      if (sale.paymentMethod === 'credit') {
        // Buscar el crédito asociado a esta venta
        const associatedCredit = allCredits.find(c => c.saleId === sale.id)
        
        // Solo contar la ganancia si el crédito está completado
        // Si no hay crédito asociado o no está completado, retornar ganancia 0
        if (!associatedCredit || associatedCredit.status !== 'completed') {
          return { ...sale, profit: 0 }
        }
      }
      
      if (!sale.items) return { ...sale, profit: 0 }
      
      const saleProfit = sale.items.reduce((itemProfit, item) => {
        const product = allProducts.find(p => p.id === item.productId)
        const cost = product?.cost || 0
        
        // Calcular el precio real de venta después de descuentos
        const baseTotal = item.quantity * item.unitPrice
        const discountAmount = item.discountType === 'percentage' 
          ? (baseTotal * (item.discount || 0)) / 100 
          : (item.discount || 0)
        const salePriceAfterDiscount = Math.max(0, baseTotal - discountAmount)
        
        // El precio unitario real después de descuentos
        const realUnitPrice = item.quantity > 0 ? salePriceAfterDiscount / item.quantity : 0
        
        // Ganancia bruta = (precio de venta real - costo) * cantidad
        const itemGrossProfit = (realUnitPrice - cost) * item.quantity
        
        return itemProfit + itemGrossProfit
      }, 0)
      
      return { ...sale, profit: saleProfit }
    })
    .filter(sale => sale.profit > 0) // Solo ventas con ganancia positiva
    .sort((a, b) => {
      // Ordenar por ganancia descendente primero, luego por fecha más reciente
      if (b.profit !== a.profit) {
        return b.profit - a.profit // Mayor ganancia primero
      }
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Si misma ganancia, más reciente primero
    })
    .slice(0, 5) // Tomar las 5 con mayor ganancia

    // Facturas anuladas en el período seleccionado
    const cancelledSales = sales.filter(sale => sale.status === 'cancelled').length
    
    // Valor perdido por facturas anuladas en el período seleccionado
    const lostValue = sales
      .filter(sale => sale.status === 'cancelled')
      .reduce((sum, sale) => sum + sale.total, 0)

    // Contar TODOS los productos para stock e inversión (activos e inactivos)
    // Solo excluir productos discontinuados explícitamente
    const productsForCalculation = allProducts.filter(p => {
      const status = p.status?.toLowerCase()
      // Excluir solo productos explícitamente discontinuados
      return status !== 'discontinued'
    })
    
    // Total de unidades en stock (local + bodega) - todos los productos excepto discontinuados
    const totalStockUnits = productsForCalculation.reduce((sum, p) => {
      const storeStock = Number(p.stock?.store) || 0;
      const warehouseStock = Number(p.stock?.warehouse) || 0;
      const productTotal = storeStock + warehouseStock;
      return sum + productTotal;
    }, 0)
    
    // Productos con stock bajo - todos los productos excepto discontinuados
    // Stock bajo = total <= 5 unidades y > 0
    const lowStockProducts = productsForCalculation.filter(p => {
      const storeStock = Number(p.stock?.store) || 0;
      const warehouseStock = Number(p.stock?.warehouse) || 0;
      const totalStock = storeStock + warehouseStock;
      return totalStock > 0 && totalStock <= 5;
    }).length

    // Calcular inversión total en stock (precio de compra * stock actual) - todos los productos excepto discontinuados
    const totalStockInvestment = productsForCalculation.reduce((sum, product) => {
      const localStock = product.stock?.store || 0;
      const warehouseStock = product.stock?.warehouse || 0;
      const totalStock = localStock + warehouseStock;
      const costPrice = product.cost || 0; // Precio de compra/costo
      return sum + (costPrice * totalStock);
    }, 0)
    
    // Calcular inversión potencial (costo total de todos los productos, asumiendo 1 unidad de cada uno)
    const potentialInvestment = productsForCalculation.reduce((sum, product) => {
      const costPrice = product.cost || 0;
      return sum + costPrice;
    }, 0)

    // Calcular valor estimado de ventas (precio de venta * stock actual) - todos los productos excepto discontinuados
    const estimatedSalesValue = productsForCalculation.reduce((sum, product) => {
      const localStock = product.stock?.store || 0;
      const warehouseStock = product.stock?.warehouse || 0;
      const totalStock = localStock + warehouseStock;
      const sellingPrice = product.price || 0; // Precio de venta
      return sum + (sellingPrice * totalStock);
    }, 0)

    // Datos para gráficos - Debe coincidir exactamente con totalRevenue (efectivo + transferencia + abonos)
    // Excluir ventas canceladas y borradores del gráfico
    // IMPORTANTE: Usar la misma lógica que totalRevenue para que los números coincidan

    // Función helper para normalizar fecha y obtener formato consistente
    const getDateKey = (dateInput: Date | string): string => {
      const date = new Date(dateInput)
      // Normalizar a medianoche en hora local para evitar problemas de zona horaria
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return normalizedDate.toLocaleDateString('es-CO', { 
        weekday: 'short',
        day: '2-digit', 
        month: '2-digit' 
      })
    }

    // IMPORTANTE: Calcular salesByDay usando EXACTAMENTE la misma lógica que cashRevenue + transferRevenue
    // Primero, calcular ventas por día (igual que arriba)
    const salesByDay = activeSales.reduce((acc: { [key: string]: { amount: number, count: number } }, sale) => {
      const date = getDateKey(sale.createdAt)
      if (!acc[date]) {
        acc[date] = { amount: 0, count: 0 }
      }
      
      // Usar EXACTAMENTE la misma lógica que cashRevenue y transferRevenue arriba (líneas 425-440)
      if (sale.paymentMethod === 'cash') {
        acc[date].amount += sale.total
        acc[date].count += 1
      } else if (sale.paymentMethod === 'transfer') {
        acc[date].amount += sale.total
        acc[date].count += 1
      } else if (sale.paymentMethod === 'mixed' && sale.payments) {
        // Para pagos mixtos, desglosar igual que arriba (líneas 430-438)
        sale.payments.forEach(payment => {
          if (payment.paymentType === 'cash') {
            acc[date].amount += payment.amount || 0
          } else if (payment.paymentType === 'transfer') {
            acc[date].amount += payment.amount || 0
          }
        })
        // Solo incrementar count si hay al menos un pago en efectivo/transferencia
        const hasRealPayment = sale.payments.some(p => 
          p.paymentType === 'cash' || p.paymentType === 'transfer'
        )
        if (hasRealPayment) {
          acc[date].count += 1
        }
      }
      // No contar ventas a crédito (paymentMethod === 'credit') en el gráfico
      
      return acc
    }, {})

    // Agregar abonos de créditos al gráfico (EXACTAMENTE igual que se suma arriba en líneas 442-449)
    // IMPORTANTE: Usar los mismos validPaymentRecords que se usan para calcular totalRevenue
    // Esto asegura que el gráfico muestre exactamente lo mismo que totalRevenue
    validPaymentRecords.forEach(payment => {
      const date = getDateKey(payment.paymentDate)
      if (!salesByDay[date]) {
        salesByDay[date] = { amount: 0, count: 0 }
      }
      // Sumar abonos en efectivo y transferencia (EXACTAMENTE igual que líneas 443-449)
      if (payment.paymentMethod === 'cash') {
        salesByDay[date].amount += payment.amount
      } else if (payment.paymentMethod === 'transfer') {
        salesByDay[date].amount += payment.amount
      }
      // No incrementar count para abonos, solo para ventas nuevas
    })

    // Debug detallado para fecha específica
    if (effectiveDateFilter === 'specific' && specificDate) {
      const targetDate = getDateKey(specificDate)
      const chartDataForDate = salesByDay[targetDate]
      const abonosForDate = validPaymentRecords.filter(p => {
        const paymentDate = getDateKey(p.paymentDate)
        return paymentDate === targetDate
      })
      console.log('🔍 [DASHBOARD CHART DEBUG] Para fecha específica:', {
        targetDate,
        specificDate: specificDate.toISOString(),
        chartDataForDate,
        abonosForDate: abonosForDate.map(p => ({
          paymentDate: p.paymentDate,
          normalizedDate: getDateKey(p.paymentDate),
          amount: p.amount,
          method: p.paymentMethod
        })),
        totalAbonosForDate: abonosForDate.reduce((sum, p) => {
          if (p.paymentMethod === 'cash' || p.paymentMethod === 'transfer') {
            return sum + p.amount
          }
          return sum
        }, 0),
        totalRevenue,
        cashRevenue,
        transferRevenue
      })
    }

    // Debug: Verificar que los totales coincidan
    const totalFromChart = Object.values(salesByDay).reduce((sum, day) => sum + day.amount, 0)
    if (Math.abs(totalFromChart - totalRevenue) > 1) {
      console.error('❌ [DASHBOARD] Discrepancia entre gráfico y totalRevenue:', {
        totalFromChart,
        totalRevenue,
        difference: totalFromChart - totalRevenue,
        salesByDayKeys: Object.keys(salesByDay),
        validPaymentRecordsCount: validPaymentRecords.length,
        validPaymentRecordsTotal: validPaymentRecords.reduce((sum, p) => sum + p.amount, 0),
        cashRevenue,
        transferRevenue,
        activeSalesCount: activeSales.length,
        salesByDayDetails: Object.entries(salesByDay).map(([date, data]) => ({
          date,
          amount: data.amount,
          count: data.count
        }))
      })
    } else {
      console.log('✅ [DASHBOARD] Gráfico y totalRevenue coinciden:', {
        totalFromChart,
        totalRevenue
      })
    }

    // Generar todos los días del período seleccionado
    // IMPORTANTE: Usar getDateKey() para asegurar que las fechas coincidan con salesByDay
    const generateAllDays = () => {
      const days = []
      const today = new Date()
      
      if (effectiveDateFilter === 'specific' && specificDate) {
        // Para fecha específica, mostrar solo ese día
        const dateStr = getDateKey(specificDate)
        days.push(dateStr)
      } else if (effectiveDateFilter === 'today') {
        // Para hoy, mostrar solo el día actual
        const dateStr = getDateKey(today)
        days.push(dateStr)
      } else {
        // Para "Todo el Tiempo", mostrar los últimos 30 días
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 29)
        
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = getDateKey(d)
          days.push(dateStr)
        }
      }
      
      return days
    }

    const allDays = generateAllDays()
    const salesChartData = allDays
      .map(date => {
        const data = salesByDay[date] || { amount: 0, count: 0 }
        // Debug para fecha específica
        if (effectiveDateFilter === 'specific' && specificDate) {
          const expectedDate = getDateKey(specificDate)
          if (date === expectedDate) {
            console.log('📊 [DASHBOARD CHART] Datos para fecha específica:', {
              date,
              expectedDate,
              amount: data.amount,
              totalRevenue,
              salesByDayKeys: Object.keys(salesByDay),
              validPaymentRecordsForDate: validPaymentRecords.filter(p => {
                const paymentDate = getDateKey(p.paymentDate)
                return paymentDate === date
              }).map(p => ({
                date: p.paymentDate,
                normalizedDate: getDateKey(p.paymentDate),
                amount: p.amount,
                method: p.paymentMethod
              }))
            })
          }
        }
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
      totalSales: activeSales.length, // Solo contar ventas activas (no canceladas ni borradores)
      topProducts,
      completedWarranties,
      pendingWarranties,
      warrantyRate,
      totalWarrantyValue,
      recentWarrantyReplacements,
      recentPendingCredits,
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
      recentTopProducts,
      cancelledSales,
      lostValue,
      lowStockProducts,
      totalProducts: totalStockUnits,
      totalProductsCount: productsForCalculation.length, // Número total de productos
      totalStockInvestment,
      potentialInvestment, // Inversión potencial (costo de todos los productos)
      estimatedSalesValue,
      totalClients: allClients.length,
      salesChartData,
      paymentMethodData,
      topProductsChart
    }
  }, [filteredData, allProducts, allClients, allWarranties, allCredits])

  // Obtener etiqueta del filtro de fecha
  const getDateFilterLabel = (filter: DateFilter) => {
    const labels: { [key: string]: string } = {
      today: 'Hoy',
      all: 'Seleccionar Año', // Label genérico para modo año
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
    
    // Siempre recargar datos cuando cambia el filtro (ahora usa filtrado en backend)
    setIsFiltering(true)
    setDateFilter(newFilter)
    
    let dateToUse = specificDate
    let yearToUse = selectedYear
    
    if (newFilter !== 'specific') {
      setSpecificDate(null)
      dateToUse = null
    }
    
    // Si cambia a "Todo el Tiempo", asegurar que el año seleccionado sea el actual
    if (newFilter === 'all') {
      const currentYear = new Date().getFullYear()
      setSelectedYear(currentYear)
      yearToUse = currentYear
    }
    
    // Recargar datos con el nuevo filtro, pasando los valores directamente para evitar problemas de timing
    loadDashboardData(true, newFilter, dateToUse, yearToUse).then(() => {
      setIsFiltering(false)
    })
  }

  // Función para manejar cambio de año
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    setIsFiltering(true)
    // Recargar datos con el nuevo año, pasando el año directamente para evitar problemas de timing
    loadDashboardData(true, dateFilter, specificDate, year).then(() => {
      setIsFiltering(false)
    })
  }

  // Función para manejar selección de fecha específica
  const handleDateSelect = (date: Date | null) => {
    setSpecificDate(date)
    if (date) {
      setIsFiltering(true)
      setDateFilter('specific')
      // IMPORTANTE: Pasar la fecha directamente para evitar problemas de timing con el estado
      // Recargar datos del dashboard para la fecha específica usando la fecha que acabamos de seleccionar
      loadDashboardData(true, 'specific', date).then(() => {
        setIsFiltering(false)
      })
    } else {
      setIsFiltering(false)
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
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
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
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-4 md:mb-6">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 flex-shrink-0" />
                  <span className="flex-shrink-0">Dashboard</span>
                  {(isRefreshing || isFiltering) && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs flex-shrink-0">
                      Actualizando...
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-xs md:text-base font-normal text-gray-600 dark:text-gray-400 mt-1">
                  <span className="hidden md:inline">Total Ingresos: </span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-CO', { 
                      style: 'currency', 
                      currency: 'COP',
                      minimumFractionDigits: 0 
                    }).format(metrics.totalRevenue)}
                  </span>
                  <span className="md:hidden"> hoy</span>
                </div>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-1 hidden md:block">
                  Resumen ejecutivo y métricas de rendimiento
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdmin ? (
                  <>
                    {/* Selector de período simplificado */}
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={dateFilter}
                        onChange={(e) => handleFilterChange(e.target.value as DateFilter)}
                        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 pr-7 md:pr-8 text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {(['today', 'specific', 'all'] as DateFilter[]).map((filter) => (
                          <option key={filter} value={filter}>
                            {getDateFilterLabel(filter)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Selector de año cuando "Todo el Tiempo" está seleccionado */}
                    {dateFilter === 'all' && isSuperAdmin && (
                      <div className="relative ml-2">
                        <select
                          value={selectedYear}
                          onChange={(e) => handleYearChange(Number(e.target.value))}
                          className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 pr-7 md:pr-8 text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Calendario para fecha específica */}
                    {dateFilter === 'specific' && (
                      <DatePicker
                        selectedDate={specificDate}
                        onDateSelect={handleDateSelect}
                        placeholder="Seleccionar fecha"
                        className="w-full sm:w-40 text-xs md:text-sm"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
                    <span className="text-xs md:text-sm font-medium text-emerald-700 dark:text-emerald-300 hidden sm:inline">
                      Vista del día actual
                    </span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:hidden">
                      Hoy
                    </span>
                  </div>
                )}
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="w-full sm:w-auto justify-center sm:justify-center gap-2 text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-50 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                >
                  <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Actualizar</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 md:hidden">
              Resumen ejecutivo y métricas
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principales - 3 o 4 cards según el rol */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${user && user.role !== 'vendedor' && user.role !== 'Vendedor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-6 mb-6 md:mb-8`}>
        {/* Total Ingresos */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-right">
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Ingresos</span>
              <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
            }).format(metrics.totalRevenue)}
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {metrics.totalSales} ventas realizadas
                </p>
              </div>

        {/* Efectivo */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Efectivo</span>
              <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
            {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(metrics.cashRevenue)}
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.cashRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
                </p>
              </div>

        {/* Transferencia */}
        <div 
          onClick={() => router.push('/sales')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Transferencia</span>
              <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                {effectiveDateFilter === 'today' ? 'Hoy' : 
                 effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                 'Todos los Períodos'}
              </p>
            </div>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
            }).format(metrics.transferRevenue)}
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.transferRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
                </p>
              </div>

        {/* Crédito o Facturas Anuladas - Depende del rol */}
        {user && user.role !== 'vendedor' && user.role !== 'Vendedor' ? (
          isSuperAdmin ? (
            // Facturas Anuladas para Super Admin
            <div 
              onClick={() => setShowCancelledModal(true)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
                  <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                    {effectiveDateFilter === 'today' ? 'Hoy' : 
                     effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                     'Todos los Períodos'}
                  </p>
                </div>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                {metrics.cancelledSales}
              </p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                de {metrics.totalSales} ventas totales
              </p>
            </div>
          ) : (
            // Crédito para Admin (no Super Admin)
            <div 
              onClick={() => router.push('/payments')}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Crédito</span>
                  <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                    {effectiveDateFilter === 'today' ? 'Hoy' : 
                     effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                     'Todos los Períodos'}
                  </p>
                </div>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                {new Intl.NumberFormat('es-CO', { 
                  style: 'currency', 
                  currency: 'COP',
                  minimumFractionDigits: 0 
                }).format(metrics.creditRevenue)}
              </p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {filteredData.credits.filter((c: any) => (c.status === 'pending' || c.status === 'partial') && (c.pendingAmount || 0) > 0).length} créditos pendientes
              </p>
            </div>
          )
        ) : null}

      </div>

      {/* Segunda fila de métricas - 4 cards abajo */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${user && user.role !== 'vendedor' && user.role !== 'Vendedor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-6 mb-6 md:mb-10 items-stretch`}>
        {/* Dinero Afuera - Para usuarios con permisos de créditos, pero NO para Super Admin */}
        {canViewCredits && !isSuperAdmin && (
          <div
            role="button"
            tabIndex={0}
            onClick={goToCredits}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                goToCredits()
              }
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg transition-all duración-200 cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-right">
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Dinero Afuera</span>
                <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                  {isSuperAdmin ? 'Total' : 'Hoy'}
                </p>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP',
                minimumFractionDigits: 0 
              }).format(isSuperAdmin ? metrics.totalDebt : metrics.dailyCreditsDebt || 0)}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              {isSuperAdmin 
                ? `${metrics.pendingCreditsCount} créditos pendientes/parciales`
                : `${metrics.dailyCreditsCount || 0} créditos del día`
              }
            </p>

            {!isSuperAdmin && metrics.recentPendingCredits.length > 0 ? (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Últimos créditos pendientes
                </div>
                {metrics.recentPendingCredits.map((credit) => (
                  <div key={credit.id} className="flex items-start justify-between gap-2 text-xs md:text-sm">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        • {credit.clientName}
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        {credit.dateLabel} · {credit.timeLabel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right flex-shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        ${(credit.pendingAmount || 0).toLocaleString('es-CO')}
                      </span>
                      {credit.reference && (
                        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          Factura {credit.reference}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 mt-auto">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {metrics.recentPendingCredits.length === 0
                    ? 'Sin créditos pendientes en el período seleccionado.'
                    : 'Datos disponibles solo para créditos pendientes.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Garantías Completadas */}
        <div 
          onClick={() => router.push('/warranties')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg transition-all duración-200 cursor-pointer flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Garantías Completadas</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
            {metrics.completedWarranties}
          </p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
            Garantías completadas
          </p>

          {metrics.recentWarrantyReplacements.length > 0 ? (
            <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                Últimas garantías entregadas
              </div>
              {metrics.recentWarrantyReplacements.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 text-xs md:text-sm">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      • {item.deliveredName}{item.reference ? ` (${item.reference})` : ''}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                      {item.dateLabel} · {item.timeLabel}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      -{item.quantityDelivered} und
                    </span>
                    {item.value > 0 && (
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        ${item.value.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 mt-auto">
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Sin garantías completadas en el período seleccionado.
              </span>
            </div>
          )}
        </div>

        {/* Ganancia Bruta */}
        {isSuperAdmin && (
          <div 
            onClick={() => router.push('/sales')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg transition-all duración-200 cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ganancia Bruta</span>
                <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                  {effectiveDateFilter === 'today' ? 'Hoy' : 
                   effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                   'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP',
                minimumFractionDigits: 0 
              }).format(metrics.grossProfit)}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              Beneficio por ventas realizadas
            </p>
            
            {/* Lista de ventas más rentables */}
            {metrics.topProfitableSales.length > 0 && (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Top ventas más rentables
                </div>
                {metrics.topProfitableSales.map((sale, index) => {
                  const saleDate = new Date(sale.createdAt)
                  const dateLabel = saleDate.toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short'
                  })
                  const timeLabel = saleDate.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                  const clientName = sale.clientName || 'Cliente'
                  const invoiceNumber = sale.invoiceNumber || null
                  
                  return (
                    <div key={sale.id} className="flex items-start justify-between gap-2 text-xs md:text-sm">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          • {clientName}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          {dateLabel} · {timeLabel}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          +${sale.profit.toLocaleString('es-CO')}
                        </span>
                        {invoiceNumber && (
                          <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                            Factura {invoiceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Productos en Stock - Solo para Super Admin */}
        {isSuperAdmin && (
          <div 
            onClick={() => router.push('/products')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg transition-all duración-200 cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-right">
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Productos en Stock</span>
                <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">Stock Total</p>
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {metrics.totalProductsCount}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              {metrics.totalProducts.toLocaleString('es-CO')} unidades en stock • {metrics.lowStockProducts} con stock bajo
            </p>
            
            {/* Lista de productos más vendidos recientemente */}
            {metrics.recentTopProducts && metrics.recentTopProducts.length > 0 && (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Productos más vendidos recientemente
                </div>
                {metrics.recentTopProducts.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-xs md:text-sm">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        • {item.productName}
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        {item.dateLabel} · {item.timeLabel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right flex-shrink-0">
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                        {item.quantity} und
                      </span>
                      {item.invoiceNumber && (
                        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          Factura {item.invoiceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-1 border-t border-dashed border-gray-200 dark:border-gray-600 mt-2">
                  <div>
                    <p className="text-base md:text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                      ${metrics.totalStockInvestment > 0 ? metrics.totalStockInvestment.toLocaleString('es-CO') : metrics.potentialInvestment.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                      {metrics.totalStockInvestment > 0 ? 'Inversión Total en Stock' : 'Inversión Potencial (Costo Total)'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Créditos o Facturas Anuladas - Depende del rol */}
        {isSuperAdmin ? (
          // Créditos para Super Admin
          <div 
            role="button"
            tabIndex={0}
            onClick={goToCredits}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                goToCredits()
              }
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Créditos</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {metrics.pendingCreditsCount || 0}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              créditos pendientes/parciales
            </p>
            
            {metrics.recentPendingCredits.length > 0 ? (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Créditos más recientes
                </div>
                {metrics.recentPendingCredits.map((credit) => (
                  <div key={credit.id} className="flex items-start justify-between gap-2 text-xs md:text-sm">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        • {credit.clientName}
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        {credit.dateLabel} · {credit.timeLabel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right flex-shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        ${(credit.pendingAmount || 0).toLocaleString('es-CO')}
                      </span>
                      {credit.reference && (
                        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          Factura {credit.reference}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-200 dark:border-gray-600">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total a hoy:</span>
                  <span className="text-base md:text-lg font-bold text-orange-600 dark:text-orange-400">
                    ${(metrics.totalDebt || 0).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 mt-auto">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Sin créditos pendientes en el período seleccionado.
                </span>
              </div>
            )}
          </div>
        ) : (
          // Facturas Anuladas para otros usuarios
          <div 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            onClick={() => setShowCancelledModal(true)}
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
              {metrics.cancelledSales}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              de {metrics.totalSales} ventas totales
            </p>
            
            {/* Resumen adicional */}
            <div className="pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-600 space-y-1.5 md:space-y-2 mt-auto">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasa:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics.totalSales > 0 ? ((metrics.cancelledSales / metrics.totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Valor perdido:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  ${metrics.lostValue.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="text-center pt-1 md:pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelledModal(true)}
                  className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-1 hover:underline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  <BarChart3 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  <span className="hidden sm:inline">Haz clic para ver análisis detallado</span>
                  <span className="sm:hidden">Ver detalles</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-8">
        {/* Gráfico de ventas por día */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ventas por Día</span>
                <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:mt-1">
                  {effectiveDateFilter === 'today' ? 'Hoy' : 
                   effectiveDateFilter === 'specific' ? 'Fecha Específica' : 
                   'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {metrics.salesChartData.length > 0 
                ? `${metrics.salesChartData.length} días con ventas en el período seleccionado`
                : 'No hay ventas en el período seleccionado'
              }
            </p>
          </div>
          <div className="p-3 md:p-6">
            {metrics.salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
                <BarChart data={metrics.salesChartData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
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
                    fontSize={9}
                    tick={{ fontSize: 9 }}
                    className="md:text-xs"
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={9}
                    tick={{ fontSize: 9 }}
                    className="md:text-xs"
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
          <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Métodos de Pago</h2>
            </div>
          </div>
          <div className="p-3 md:p-6">
            <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
              <PieChart>
                <Pie
                  data={metrics.paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  className="md:!innerRadius-[60px] md:!outerRadius-[100px]"
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
              {metrics.paymentMethodData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div 
                      className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-600 dark:text-white">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-xs md:text-sm">
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
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Productos Más Vendidos</h2>
          </div>
        </div>
        <div className="p-3 md:p-6">
          {metrics.topProductsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
              <BarChart data={metrics.topProductsChart} margin={{ top: 10, right: 10, left: 5, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={9}
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  className="md:text-xs"
                />
                <YAxis 
                  stroke="#666"
                  fontSize={9}
                  tick={{ fontSize: 9 }}
                  className="md:text-xs"
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
      
      {/* Modal de Facturas Anuladas - Disponible para todos */}
        <CancelledInvoicesModal
          isOpen={showCancelledModal}
          onClose={() => setShowCancelledModal(false)}
          sales={filteredData.sales}
          allSales={allSales}
        />
    </div>
    </RoleProtectedRoute>
  )
}
