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
  RefreshCw,
  Store as StoreIcon,
  Home,
  Crown,
  Eye,
  EyeOff
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
import { getCurrentUserStoreId, isMainStoreUser } from '@/lib/store-helper'
import { StoresService } from '@/lib/stores-service'
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
  const [allProducts, setAllProducts] = useState<any[]>([]) // Solo para productos específicos cargados bajo demanda
  const [allPaymentRecords, setAllPaymentRecords] = useState<any[]>([])
  const [specificProductsCache, setSpecificProductsCache] = useState<Map<string, any>>(new Map())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showCancelledModal, setShowCancelledModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hideNumbers, setHideNumbers] = useState(false)
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null)
  const [currentStoreCity, setCurrentStoreCity] = useState<string | null>(null)

  // Nuevos estados para métricas optimizadas
  const [optimizedMetrics, setOptimizedMetrics] = useState<{
    salesSummary?: any,
    inventorySummary?: any,
    creditsSummary?: any
  }>({})

  // Cargar información de la tienda actual y recargar datos cuando cambie el storeId
  useEffect(() => {
    const loadStoreInfo = async () => {
      const storeId = getCurrentUserStoreId()

      if (storeId && !isMainStoreUser(user)) {
        try {
          const store = await StoresService.getStoreById(storeId)
          if (store) {
            setCurrentStoreName(store.name)
            setCurrentStoreCity(store.city || null)
          }
        } catch (error) {
          console.error('[DASHBOARD] Error loading store info:', error)
        }
      } else {
        setCurrentStoreName(null)
        setCurrentStoreCity(null)
      }

      loadDashboardData()
    }
    if (user) {
      loadStoreInfo()
    }
  }, [user, user?.storeId])

  // Detectar modo oscuro directamente desde el DOM
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    // Verificar inicialmente
    checkDarkMode()

    // Observar cambios en la clase del documento
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // También escuchar cambios en el media query del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      // Solo actualizar si no hay una clase explícita
      if (!document.documentElement.classList.contains('dark') &&
        !document.documentElement.classList.contains('light')) {
        checkDarkMode()
      }
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

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
      let currentFilter = overrideFilter !== undefined ? overrideFilter : (isSuperAdmin ? dateFilter : 'today')

      if (currentFilter === 'specific' && !overrideSpecificDate && !specificDate) {
        console.warn('⚠️ [DASHBOARD] Filtro "specific" pero no hay fecha, cambiando a "today"')
        currentFilter = 'today'
      }
      const dateToUse = overrideSpecificDate !== undefined ? overrideSpecificDate : specificDate
      const yearToUse = overrideYear !== undefined ? overrideYear : selectedYear

      // Corregir lógica: 'all' (año) TAMBIÉN requiere un rango de fechas
      const { startDate, endDate } = getDateRange(currentFilter, yearToUse, dateToUse)

      // 1. CARGA RÁPIDA: Métricas agregadas (Dashboard Summary)
      // Esto devuelve los números grandes casi instantáneamente
      if (startDate && endDate) {
        const [fastSales, fastInventory, fastCredits] = await Promise.all([
          withTimeout(SalesService.getDashboardSummary(startDate, endDate), 30000),
          withTimeout(ProductsService.getInventoryMetrics(), 30000),
          withTimeout(CreditsService.getCreditsSummary(), 30000)
        ])

        setOptimizedMetrics({
          salesSummary: fastSales,
          inventorySummary: fastInventory,
          creditsSummary: fastCredits
        })
      }

      // 2. CARGA DE LISTAS Y GRÁFICOS (Segundo plano)
      // Para la gráfica de tendencia, necesitamos 15 días hacia atrás
      let chartStartDate = startDate || new Date()
      if (currentFilter === 'specific' && dateToUse) {
        const extendedStart = new Date(dateToUse)
        extendedStart.setDate(extendedStart.getDate() - 14)
        extendedStart.setHours(0, 0, 0, 0)
        chartStartDate = extendedStart
      } else if (currentFilter === 'today' || !startDate) {
        const extendedStart = new Date()
        extendedStart.setDate(extendedStart.getDate() - 14)
        extendedStart.setHours(0, 0, 0, 0)
        chartStartDate = extendedStart
      }

      // Si es "Todo el Tiempo", cargar solo el año seleccionado
      const finalEndDate = endDate || new Date()

      const [salesResult, warrantiesResult, creditsResult, clientsResult, paymentRecordsResult] = await Promise.allSettled([
        // Limitar la cantidad de ventas recuperadas si es "Todo el Tiempo" para evitar lentitud
        withTimeout(SalesService.getDashboardSales(chartStartDate, finalEndDate), currentFilter === 'all' ? 30000 : 20000),
        withTimeout(WarrantyService.getWarrantiesByDateRange(startDate || chartStartDate, finalEndDate), 15000),
        withTimeout(CreditsService.getAllCredits(), 15000),
        withTimeout(ClientsService.getAllClients(), 10000),
        // OPTIMIZADO: Ya no cargamos todos los productos, usamos getInventoryMetrics() que ya se cargó arriba
        withTimeout(CreditsService.getPaymentRecordsByDateRange(chartStartDate, finalEndDate), 15000)
      ])

      // Procesar resultados
      const sales = salesResult.status === 'fulfilled' ? salesResult.value : []
      const warranties = warrantiesResult.status === 'fulfilled' ? warrantiesResult.value : []
      const credits = creditsResult.status === 'fulfilled' ? creditsResult.value : []
      const clients = clientsResult.status === 'fulfilled' ? clientsResult.value : []
      const payments = paymentRecordsResult.status === 'fulfilled' ? paymentRecordsResult.value : []

      setAllSales(sales)
      setAllWarranties(warranties)
      setAllCredits(credits)
      setAllClients(clients)
      // OPTIMIZADO: No cargamos todos los productos aquí, solo se cargan bajo demanda cuando se necesitan
      setAllProducts([])
      setAllPaymentRecords(payments)
      setLastUpdated(new Date())

      const errors = [salesResult, warrantiesResult, creditsResult, clientsResult, paymentRecordsResult]
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason)

      if (errors.length > 0) {
        console.error('⚠️ [DASHBOARD] Algunos datos no cargaron:', errors)
      }

    } catch (error) {
      console.error('❌ [DASHBOARD] Error crítico en loadDashboardData:', error)
    } finally {
      setIsInitialLoading(false)
      setIsRefreshing(false)
    }
  }

  // Función para cargar productos específicos por IDs bajo demanda
  const loadSpecificProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return
    
    // Filtrar IDs únicos
    const uniqueIds = Array.from(new Set(productIds))
    
    setSpecificProductsCache(prevCache => {
      // Filtrar IDs que ya están en el cache
      const idsToLoad = uniqueIds.filter(id => !prevCache.has(id))
      if (idsToLoad.length === 0) return prevCache
      
      // Cargar productos en segundo plano
      Promise.all(
        idsToLoad.map(async (id) => {
          try {
            const { ProductsService } = await import('@/lib/products-service')
            return await ProductsService.getProductById(id)
          } catch (error) {
            console.error(`Error loading product ${id}:`, error)
            return null
          }
        })
      ).then(products => {
        setSpecificProductsCache(currentCache => {
          const updatedCache = new Map(currentCache)
          products.forEach((product, index) => {
            if (product) {
              updatedCache.set(idsToLoad[index], product)
            }
          })
          // Actualizar allProducts con los nuevos productos cargados
          setAllProducts(Array.from(updatedCache.values()))
          return updatedCache
        })
      })
      
      return prevCache
    })
  }, [])

  // Función para actualización manual del dashboard
  const handleRefresh = () => {
    setSpecificProductsCache(new Map())
    setAllProducts([])
    loadDashboardData(true, dateFilter, specificDate, selectedYear)
  }

  // Cargar años disponibles al montar
  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const currentYear = new Date().getFullYear()

        // Obtener la venta más antigua para saber desde qué año empezar
        const { data, error } = await supabase
          .from('sales')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)

        if (error || !data || data.length === 0) {
          // Si no hay ventas, asegurar que al menos el año actual esté disponible
          setAvailableYears([currentYear])
          return
        }

        const firstYear = new Date(data[0].created_at).getFullYear()

        // Generar array de años desde la primera venta hasta el año actual
        const years: number[] = []
        for (let year = firstYear; year <= currentYear; year++) {
          years.push(year)
        }

        const uniqueYears = Array.from(new Set([...years, currentYear])).sort((a, b) => b - a)
        setAvailableYears(uniqueYears)
      } catch (error) {
        console.error('Error cargando años:', error)
        setAvailableYears([new Date().getFullYear()])
      }
    }

    loadAvailableYears()
  }, [])

  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    // Solo cargar si no hay datos aún (evitar doble carga)
    // El filtro inicial es 'today', así que cargará datos de hoy
    if (allSales.length === 0) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  // Escuchar cambios en el storeId del usuario y recargar datos
  useEffect(() => {
    if (!user) return

    const currentStoreId = getCurrentUserStoreId()

    if (currentStoreId !== user.storeId) {
      setAllSales([])
      setAllWarranties([])
      setAllCredits([])
      setAllClients([])
      setAllProducts([])
      setAllPaymentRecords([])
      setSpecificProductsCache(new Map())
      // Recargar datos
      loadDashboardData()
    }
  }, [user?.storeId])

  // Escuchar cambios en las ventas del contexto para actualizar el dashboard
  useEffect(() => {
    if (sales.length === 0) return

    const newSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const saleDay = new Date(saleDate)
      saleDay.setHours(0, 0, 0, 0)
      const isToday = saleDay.getTime() === today.getTime()
      const notInDashboard = !allSales.find(existingSale => existingSale.id === sale.id)
      return isToday && notInDashboard
    })

    if (newSales.length > 0) {
      const timeoutId = setTimeout(() => {
        loadDashboardData(false, effectiveDateFilter, specificDate, selectedYear)
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales.length, allSales.length, sales])

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
    // PERO ahora cargamos 15 días para la gráfica, así que necesitamos filtrar solo el día seleccionado para las métricas
    if (effectiveDateFilter === 'specific' && !specificDate) {
      // Si es 'specific' pero no hay fecha seleccionada, devolver vacío
      return {
        sales: [],
        warranties: [],
        credits: [],
        paymentRecords: []
      }
    }

    // Para 'today' o 'specific' con fecha, necesitamos filtrar solo el día seleccionado para las métricas
    // (aunque allSales tiene 15 días para la gráfica)
    if (effectiveDateFilter === 'today' || (effectiveDateFilter === 'specific' && specificDate)) {
      const targetDate = effectiveDateFilter === 'today' ? new Date() : new Date(specificDate!)
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      // Filtrar ventas solo del día seleccionado
      // Usar comparación más flexible para evitar problemas de zona horaria
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        // Normalizar ambas fechas a medianoche en hora local
        const saleDateNormalized = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate())
        const targetDateNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        return saleDateNormalized.getTime() === targetDateNormalized.getTime()
      })

      // Filtrar pagos solo del día seleccionado
      const filteredPayments = allPaymentRecords.filter(payment => {
        const paymentDate = new Date(payment.paymentDate)
        paymentDate.setHours(0, 0, 0, 0)
        return paymentDate.getTime() === targetDate.getTime()
      })

      // Warranties y credits ya vienen filtrados del backend (solo del día)
      return {
        sales: filteredSales,
        warranties: allWarranties,
        credits: allCredits,
        paymentRecords: filteredPayments
      }
    }

    // Para 'all', devolver todos los datos sin filtrar
    return {
      sales: allSales,
      warranties: allWarranties,
      credits: allCredits,
      paymentRecords: allPaymentRecords
    }
  }, [allSales, allWarranties, allCredits, allPaymentRecords, effectiveDateFilter, specificDate])

  // Cargar productos específicos bajo demanda cuando cambien las ventas o garantías
  useEffect(() => {
    // Cargar productos de garantías completadas
    const warrantyProductIds = allWarranties
      .filter(w => w.status === 'completed')
      .slice(0, 5)
      .map(w => w.productDeliveredId)
      .filter(Boolean) as string[]
    
    // Cargar productos de ventas activas para cálculo de ganancias
    const saleProductIds = allSales
      .filter(sale => sale.status !== 'cancelled' && sale.status !== 'draft')
      .flatMap(sale => sale.items?.map(item => item.productId) || [])
      .filter(Boolean) as string[]
    
    // Combinar y cargar productos únicos
    const allProductIds = Array.from(new Set([...warrantyProductIds, ...saleProductIds]))
    
    if (allProductIds.length > 0) {
      loadSpecificProducts(allProductIds)
    }
  }, [allSales, allWarranties, loadSpecificProducts])

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
      // Priorizar usar sale.payments si están disponibles (más preciso)
      if (sale.payments && sale.payments.length > 0) {
        // Usar los registros de pagos (más preciso, especialmente para transferencias)
        sale.payments.forEach(payment => {
          if (payment.paymentType === 'cash') {
            cashRevenue += payment.amount || 0
          } else if (payment.paymentType === 'transfer') {
            transferRevenue += payment.amount || 0
          }
        })
      } else {
        // Fallback: usar paymentMethod si no hay registros de payments
        if (sale.paymentMethod === 'cash') {
          cashRevenue += sale.total
        } else if (sale.paymentMethod === 'transfer') {
          transferRevenue += sale.total
        } else if (sale.paymentMethod === 'mixed') {
          // Si es mixed pero no tiene payments, loguear para debugging
          console.warn('[DASHBOARD] Sale with mixed payment method but no payments:', {
            saleId: sale.id,
            invoiceNumber: sale.invoiceNumber,
            total: sale.total,
            payments: sale.payments
          })
        }
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
      const replacementProduct = specificProductsCache.get(warranty.productDeliveredId) || allProducts.find(p => p.id === warranty.productDeliveredId)
      return sum + (replacementProduct?.price || 0)
    }, 0)

    const recentWarrantyReplacements = completedWarrantyDetails
      .slice(0, 5)
      .map(warranty => {
        const replacementProduct = specificProductsCache.get(warranty.productDeliveredId) || allProducts.find(p => p.id === warranty.productDeliveredId)
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
        // Buscar el producto para obtener su costo (primero en cache, luego en allProducts)
        const product = specificProductsCache.get(item.productId) || allProducts.find(p => p.id === item.productId)
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
        const product = specificProductsCache.get(item.productId) || allProducts.find(p => p.id === item.productId)
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

    // OPTIMIZADO: Usar métricas optimizadas de inventario en lugar de calcular desde allProducts
    // Estas métricas ya vienen de getInventoryMetrics() que es mucho más rápido
    const totalStockUnits = optimizedMetrics.inventorySummary?.totalStockUnits ?? 0
    const lowStockProducts = optimizedMetrics.inventorySummary?.lowStockCount ?? 0
    const totalStockInvestment = optimizedMetrics.inventorySummary?.totalStockInvestment ?? 0
    
    // Para métricas que no están en getInventoryMetrics, usar valores por defecto o calcular desde productos cargados
    // Nota: potentialInvestment y estimatedSalesValue requieren todos los productos, 
    // pero como no los cargamos, usamos valores aproximados o 0
    const potentialInvestment = 0 // No calculamos esto sin todos los productos
    const estimatedSalesValue = 0 // No calculamos esto sin todos los productos
    const productsForCalculation = allProducts // Solo productos cargados bajo demanda

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
    // Verificar que los totales coincidan
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
      totalRevenue: optimizedMetrics.salesSummary?.totalRevenue ?? totalRevenue,
      salesRevenue: optimizedMetrics.salesSummary?.totalRevenue ?? salesRevenue, // Fallback to totalRevenue if summary is available
      creditPaymentsRevenue,
      cashRevenue: optimizedMetrics.salesSummary?.cashRevenue ?? cashRevenue,
      transferRevenue: optimizedMetrics.salesSummary?.transferRevenue ?? transferRevenue,
      creditRevenue,
      knownPaymentMethodsTotal,
      totalSales: optimizedMetrics.salesSummary?.salesCount ?? activeSales.length,
      topProducts,
      completedWarranties,
      pendingWarranties,
      warrantyRate,
      totalWarrantyValue,
      recentWarrantyReplacements,
      recentPendingCredits,
      daysSinceLastWarranty,
      totalDebt: optimizedMetrics.creditsSummary?.totalDebt ?? totalDebt,
      pendingCreditsCount: optimizedMetrics.creditsSummary?.pendingCreditsCount ?? pendingCredits.length,
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
      lowStockProducts: optimizedMetrics.inventorySummary?.lowStockCount ?? lowStockProducts,
      totalProducts: optimizedMetrics.inventorySummary?.totalStockUnits ?? totalStockUnits,
      totalProductsCount: optimizedMetrics.inventorySummary?.totalProductsCount ?? 0, // Usar métrica optimizada si está disponible
      totalStockInvestment: optimizedMetrics.inventorySummary?.totalStockInvestment ?? totalStockInvestment,
      potentialInvestment, // No disponible sin cargar todos los productos
      estimatedSalesValue, // No disponible sin cargar todos los productos
      totalClients: allClients.length,
      salesChartData,
      paymentMethodData,
      topProductsChart
    }
  }, [filteredData, allProducts, allClients, allWarranties, allCredits, optimizedMetrics, specificProductsCache])

  // Función helper para formatear moneda con opción de ocultar
  const formatCurrency = (amount: number): string => {
    if (hideNumbers) {
      return '$ ••••••'
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Función helper para formatear números sin símbolo de moneda
  const formatNumber = (num: number): string => {
    if (hideNumbers) {
      return '••••'
    }
    return num.toLocaleString('es-CO')
  }

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
  if (isInitialLoading && allSales.length === 0) {
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
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-3 md:mb-6">
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 flex-shrink-0" />
                    <span className="flex-shrink-0">Dashboard</span>
                    {currentStoreName && !isMainStoreUser(user) && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm md:text-base px-3 py-1.5 flex-shrink-0 border border-green-300 dark:border-green-700">
                        <StoreIcon className="h-4 w-4 md:h-5 md:w-5 mr-1.5" />
                        {currentStoreName}
                      </Badge>
                    )}
                    {isMainStoreUser(user) && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm md:text-base px-3 py-1.5 flex-shrink-0 border border-emerald-300 dark:border-emerald-700">
                        <Crown className="h-4 w-4 md:h-5 md:w-5 mr-1.5" />
                        Tienda Principal
                      </Badge>
                    )}
                    {(isRefreshing || isFiltering) && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs flex-shrink-0">
                        Actualizando...
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-0.5 md:mt-1">
                    {currentStoreName && !isMainStoreUser(user)
                      ? 'Estás viendo el dashboard de esta micro tienda. Los datos mostrados corresponden únicamente a esta ubicación.'
                      : isMainStoreUser(user)
                        ? 'Resumen ejecutivo y métricas de rendimiento de la tienda principal'
                        : 'Resumen ejecutivo y métricas de rendimiento'}
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
                          className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 md:px-3 md:py-2 pr-9 md:pr-8 text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          {(['today', 'specific', 'all'] as DateFilter[]).map((filter) => (
                            <option key={filter} value={filter}>
                              {getDateFilterLabel(filter)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 md:pr-2 pointer-events-none">
                          <svg className="w-4 h-4 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Selector de año cuando "Todo el Tiempo" está seleccionado */}
                      {dateFilter === 'all' && isSuperAdmin && (
                        <div className="relative w-full sm:w-auto sm:ml-2">
                          <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(Number(e.target.value))}
                            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 md:px-3 md:py-2 pr-9 md:pr-8 text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            {availableYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 md:pr-2 pointer-events-none">
                            <svg className="w-4 h-4 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {/* Botones de acción agrupados */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setHideNumbers(!hideNumbers)}
                      variant="outline"
                      className="justify-center text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 text-xs md:text-sm px-2.5 md:px-3 py-2"
                      title={hideNumbers ? 'Mostrar números' : 'Ocultar números'}
                    >
                      {hideNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      variant="outline"
                      className="justify-center gap-2 text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-50 text-xs md:text-sm px-2.5 md:px-4 py-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden md:inline">Actualizar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Métricas principales - 3 o 4 cards según el rol */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${user && user.role !== 'vendedor' && user.role !== 'Vendedor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-6 mb-6 md:mb-8`}>
          {/* Total Ingresos */}
          <div
            onClick={() => router.push('/sales')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Ingresos</span>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {effectiveDateFilter === 'today' ? 'Hoy' :
                    effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                      'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metrics.totalSales} ventas realizadas
            </p>
          </div>

          {/* Efectivo */}
          <div
            onClick={() => router.push('/sales')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Efectivo</span>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {effectiveDateFilter === 'today' ? 'Hoy' :
                    effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                      'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(metrics.cashRevenue)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.cashRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          {/* Transferencia */}
          <div
            onClick={() => router.push('/sales')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Transferencia</span>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {effectiveDateFilter === 'today' ? 'Hoy' :
                    effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                      'Todos los Períodos'}
                </p>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(metrics.transferRevenue)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {(metrics.cashRevenue + metrics.transferRevenue) > 0 ? ((metrics.transferRevenue / (metrics.cashRevenue + metrics.transferRevenue)) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          {/* Crédito o Facturas Anuladas - Depende del rol */}
          {user && user.role !== 'vendedor' && user.role !== 'Vendedor' ? (
            isSuperAdmin ? (
              // Facturas Anuladas para Super Admin
              <div
                onClick={() => setShowCancelledModal(true)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
                    <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {effectiveDateFilter === 'today' ? 'Hoy' :
                        effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                          'Todos los Períodos'}
                    </p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {metrics.cancelledSales}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  de {metrics.totalSales} ventas totales
                </p>
              </div>
            ) : (
              // Crédito para Admin (no Super Admin)
              <div
                onClick={() => router.push('/payments')}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <CreditCard className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Crédito</span>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {effectiveDateFilter === 'today' ? 'Hoy' :
                        effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                          'Todos los Períodos'}
                    </p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatCurrency(metrics.creditRevenue)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <CreditCard className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Dinero Afuera</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(isSuperAdmin ? metrics.totalDebt : metrics.dailyCreditsDebt || 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isSuperAdmin
                  ? `${metrics.pendingCreditsCount} créditos pendientes`
                  : `${metrics.dailyCreditsCount || 0} créditos del día`
                }
              </p>
            </div>
          )}

          {/* Garantías Completadas */}
          <div
            onClick={() => router.push('/warranties')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Garantías Completadas</span>
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.completedWarranties}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Garantías completadas
            </p>
          </div>

          {/* Ganancia Bruta */}
          {isSuperAdmin && (
            <div
              onClick={() => router.push('/sales')}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ganancia Bruta</span>
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {effectiveDateFilter === 'today' ? 'Hoy' :
                      effectiveDateFilter === 'specific' ? 'Fecha Específica' :
                        'Todos los Períodos'}
                  </p>
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(metrics.grossProfit)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Beneficio por ventas realizadas
              </p>
            </div>
          )}

          {/* Productos en Stock - Solo para Super Admin */}
          {isSuperAdmin && (
            <div
              onClick={() => router.push('/inventory/products')}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Package className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Productos en Stock</span>
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stock Total</p>
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                {formatCurrency(metrics.totalStockInvestment > 0 ? metrics.totalStockInvestment : metrics.potentialInvestment)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {metrics.totalStockInvestment > 0 ? 'Inversión Total en Stock' : 'Inversión Potencial (Costo Total)'}
              </p>
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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <CreditCard className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Créditos</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metrics.pendingCreditsCount || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                créditos pendientes/parciales
              </p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(metrics.totalDebt || 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total a hoy
              </p>
            </div>
          ) : (
            // Facturas Anuladas para otros usuarios
            <div
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setShowCancelledModal(true)}
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Facturas Anuladas</span>
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
                    {formatCurrency(metrics.lostValue)}
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

        {/* Gráficos y estadísticas mejoradas */}
        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          {/* Tendencia de Ingresos - Dinámica según filtros */}
          {isSuperAdmin && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Tendencia de Ingresos</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {effectiveDateFilter === 'all' ? 'Por mes' : 'Últimos 15 días'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-[250px] md:h-[300px]">
                {(() => {
                  // Si es anual, mostrar por mes
                  if (effectiveDateFilter === 'all') {
                    // Agrupar datos por mes
                    const monthlyData: { [key: string]: number } = {}

                    filteredData.sales.forEach((sale: Sale) => {
                      if (sale.status !== 'cancelled') {
                        const saleDate = new Date(sale.createdAt)
                        const monthKey = saleDate.toLocaleDateString('es-CO', {
                          month: 'short',
                          year: 'numeric'
                        })

                        if (!monthlyData[monthKey]) {
                          monthlyData[monthKey] = 0
                        }

                        // Sumar efectivo y transferencia
                        if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
                          monthlyData[monthKey] += sale.total || 0
                        } else if (sale.paymentMethod === 'mixed' && sale.payments) {
                          sale.payments.forEach(payment => {
                            if (payment.paymentType === 'cash' || payment.paymentType === 'transfer') {
                              monthlyData[monthKey] += payment.amount || 0
                            }
                          })
                        }
                      }
                    })

                    // Agregar abonos de créditos
                    filteredData.paymentRecords.forEach((payment: any) => {
                      if (payment.status !== 'cancelled' && (payment.paymentMethod === 'cash' || payment.paymentMethod === 'transfer')) {
                        const paymentDate = new Date(payment.paymentDate)
                        const monthKey = paymentDate.toLocaleDateString('es-CO', {
                          month: 'short',
                          year: 'numeric'
                        })

                        if (!monthlyData[monthKey]) {
                          monthlyData[monthKey] = 0
                        }
                        monthlyData[monthKey] += payment.amount || 0
                      }
                    })

                    // Convertir a array y ordenar por fecha
                    const monthlyArray = Object.entries(monthlyData)
                      .map(([month, amount]) => ({
                        date: month,
                        amount,
                        count: 0,
                        average: 0
                      }))
                      .sort((a, b) => {
                        const dateA = new Date(a.date)
                        const dateB = new Date(b.date)
                        return dateA.getTime() - dateB.getTime()
                      })

                    // Colores adaptativos para modo oscuro
                    const gridColor = isDarkMode ? '#111827' : '#f0f0f0' // Grid casi invisible en modo oscuro
                    const axisColor = isDarkMode ? '#6b7280' : '#666'
                    const lineColor = isDarkMode ? '#34d399' : '#10B981' // Verde más claro en modo oscuro
                    const dotStrokeColor = isDarkMode ? '#111827' : '#fff'
                    const tooltipBg = isDarkMode ? '#1f2937' : 'white'
                    const tooltipBorder = isDarkMode ? '#374151' : '#e5e7eb'
                    const tooltipText = isDarkMode ? '#f3f4f6' : '#111827'

                    return monthlyArray.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyArray}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            strokeOpacity={isDarkMode ? 0.3 : 1}
                          />
                          <XAxis
                            dataKey="date"
                            stroke={axisColor}
                            fontSize={12}
                            tick={{ fontSize: 12, fill: axisColor }}
                          />
                          <YAxis
                            stroke={axisColor}
                            fontSize={12}
                            tick={{ fontSize: 12, fill: axisColor }}
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                              return `$${value}`
                            }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(value),
                              'Ingresos'
                            ]}
                            contentStyle={{
                              backgroundColor: tooltipBg,
                              border: `1px solid ${tooltipBorder}`,
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              color: tooltipText
                            }}
                            labelStyle={{ color: tooltipText }}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke={lineColor}
                            strokeWidth={3}
                            dot={{ fill: lineColor, r: 5, strokeWidth: 2, stroke: dotStrokeColor }}
                            activeDot={{ r: 7, fill: lineColor }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
                      </div>
                    )
                  }

                  // Para fecha específica o hoy: últimos 15 días
                  const getDateKey = (dateInput: Date | string): string => {
                    const date = new Date(dateInput)
                    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                    return normalizedDate.toLocaleDateString('es-CO', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })
                  }

                  // Determinar la fecha de referencia
                  let referenceDate: Date
                  if (effectiveDateFilter === 'specific' && specificDate) {
                    referenceDate = new Date(specificDate)
                  } else {
                    // Para 'today' o si no hay fecha específica, usar hoy
                    referenceDate = new Date()
                  }
                  referenceDate.setHours(0, 0, 0, 0)

                  // Generar las 15 fechas desde la fecha de referencia hacia atrás (incluyendo la fecha de referencia)
                  const last15Days: Date[] = []
                  for (let i = 0; i < 15; i++) {
                    const date = new Date(referenceDate)
                    date.setDate(date.getDate() - i)
                    last15Days.push(date)
                  }

                  // Invertir para que el más antiguo esté primero
                  last15Days.reverse()

                  // Calcular ingresos por día desde TODOS los datos (no filteredData)
                  // porque filteredData solo tiene el día seleccionado, pero necesitamos los 15 días
                  const dailyData: { [key: string]: number } = {}

                  // Inicializar todos los días con 0
                  last15Days.forEach(date => {
                    const dateKey = getDateKey(date)
                    dailyData[dateKey] = 0
                  })

                  // Crear un Set de timestamps para verificación rápida
                  const dayTimestamps = new Set<number>()
                  last15Days.forEach(day => {
                    const dayStart = new Date(day)
                    dayStart.setHours(0, 0, 0, 0)
                    dayTimestamps.add(dayStart.getTime())
                  })

                  // Obtener el storeId actual para filtrar ventas
                  const currentStoreId = getCurrentUserStoreId()
                  const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'

                  // Sumar ventas desde allSales (todos los datos)
                  // IMPORTANTE: Filtrar por store_id para micro tiendas
                  allSales.forEach((sale: Sale) => {
                    // Filtrar por store_id si es una micro tienda
                    if (currentStoreId && currentStoreId !== MAIN_STORE_ID) {
                      if (sale.storeId !== currentStoreId) {
                        return // Saltar ventas de otras tiendas
                      }
                    }

                    if (sale.status !== 'cancelled') {
                      const saleDate = new Date(sale.createdAt)
                      saleDate.setHours(0, 0, 0, 0)

                      // Verificar si la venta está en el rango de los últimos 15 días
                      if (dayTimestamps.has(saleDate.getTime())) {
                        const dateKey = getDateKey(saleDate)

                        // Sumar efectivo y transferencia
                        if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
                          dailyData[dateKey] = (dailyData[dateKey] || 0) + (sale.total || 0)
                        } else if (sale.paymentMethod === 'mixed' && sale.payments) {
                          sale.payments.forEach(payment => {
                            if (payment.paymentType === 'cash' || payment.paymentType === 'transfer') {
                              dailyData[dateKey] = (dailyData[dateKey] || 0) + (payment.amount || 0)
                            }
                          })
                        }
                      }
                    }
                  })

                  // Obtener el storeId actual para filtrar pagos
                  // (ya está definido arriba, pero lo reutilizamos)

                  // Sumar abonos de créditos desde allPaymentRecords
                  // IMPORTANTE: Filtrar por store_id para micro tiendas
                  allPaymentRecords.forEach((payment: any) => {
                    // Filtrar por store_id si es una micro tienda
                    if (currentStoreId && currentStoreId !== MAIN_STORE_ID) {
                      // Los pagos pueden tener storeId en el crédito asociado
                      // Por ahora, si el pago no tiene storeId, asumimos que es de la tienda principal
                      // y lo excluimos para micro tiendas
                      if (payment.storeId && payment.storeId !== currentStoreId) {
                        return // Saltar pagos de otras tiendas
                      }
                      // Si no tiene storeId, probablemente es de la tienda principal, saltarlo
                      if (!payment.storeId) {
                        return
                      }
                    }

                    if (payment.status !== 'cancelled' && (payment.paymentMethod === 'cash' || payment.paymentMethod === 'transfer')) {
                      const paymentDate = new Date(payment.paymentDate)
                      paymentDate.setHours(0, 0, 0, 0)

                      // Verificar si el pago está en el rango
                      if (dayTimestamps.has(paymentDate.getTime())) {
                        const dateKey = getDateKey(paymentDate)
                        dailyData[dateKey] = (dailyData[dateKey] || 0) + (payment.amount || 0)
                      }
                    }
                  })

                  // Convertir a array ordenado
                  const chartData = last15Days.map(date => {
                    const dateKey = getDateKey(date)
                    return {
                      date: dateKey,
                      amount: dailyData[dateKey] || 0,
                      count: 0,
                      average: 0
                    }
                  })

                  // Colores adaptativos para modo oscuro
                  const gridColor = isDarkMode ? '#374151' : '#e5e7eb' // Grid más visible
                  const axisColor = isDarkMode ? '#9ca3af' : '#666'
                  const lineColor = isDarkMode ? '#34d399' : '#10B981' // Verde más claro en modo oscuro
                  const dotStrokeColor = isDarkMode ? '#111827' : '#fff'
                  const tooltipBg = isDarkMode ? '#1f2937' : 'white'
                  const tooltipBorder = isDarkMode ? '#374151' : '#e5e7eb'
                  const tooltipText = isDarkMode ? '#f3f4f6' : '#111827'

                  return chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={gridColor}
                          strokeOpacity={isDarkMode ? 0.5 : 0.8}
                        />
                        <XAxis
                          dataKey="date"
                          stroke={axisColor}
                          fontSize={10}
                          tick={{ fontSize: 10, fill: axisColor }}
                        />
                        <YAxis
                          stroke={axisColor}
                          fontSize={10}
                          tick={{ fontSize: 10, fill: axisColor }}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                            return `$${value}`
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(value),
                            'Ingresos'
                          ]}
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: tooltipText
                          }}
                          labelStyle={{ color: tooltipText }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke={lineColor}
                          strokeWidth={3}
                          dot={{ fill: lineColor, r: 5, strokeWidth: 2, stroke: dotStrokeColor }}
                          activeDot={{ r: 7, fill: lineColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Gráficas lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Top Productos Más Rentables */}
            {isSuperAdmin && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Productos Más Rentables</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Por ganancia generada</p>
                    </div>
                  </div>
                </div>
                <div className="h-[250px] md:h-[300px]">
                  {(() => {
                    // Calcular ganancia por producto
                    const productProfits: { [key: string]: { name: string; profit: number; sales: number } } = {}

                    // Usar productos del cache y allProducts combinados
                    const allProductsCombined = Array.from(specificProductsCache.values()).concat(allProducts)
                    const productsMap = new Map(allProductsCombined.map(p => [p.id, p]))

                    filteredData.sales.forEach((sale: Sale) => {
                      if (sale.status !== 'cancelled' && sale.items) {
                        sale.items.forEach((item) => {
                          const productName = item.productName || 'Producto desconocido'
                          const product = productsMap.get(item.productId)
                          const cost = product?.cost || 0
                          const unitPrice = item.unitPrice || 0
                          const quantity = item.quantity || 0

                          // Calcular precio real después de descuentos (igual que en el cálculo de grossProfit)
                          const baseTotal = quantity * unitPrice
                          const discountAmount = item.discountType === 'percentage'
                            ? (baseTotal * (item.discount || 0)) / 100
                            : (item.discount || 0)
                          const salePriceAfterDiscount = Math.max(0, baseTotal - discountAmount)
                          const realUnitPrice = quantity > 0 ? salePriceAfterDiscount / quantity : 0

                          const profit = (realUnitPrice - cost) * quantity

                          if (!productProfits[productName]) {
                            productProfits[productName] = { name: productName, profit: 0, sales: 0 }
                          }
                          productProfits[productName].profit += profit
                          productProfits[productName].sales += 1
                        })
                      }
                    })

                    const topProducts = Object.values(productProfits)
                      .filter(p => p.profit > 0) // Solo productos con ganancia positiva
                      .sort((a, b) => b.profit - a.profit)
                      .slice(0, 5)

                    return topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topProducts.map(p => ({ name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name, profit: p.profit }))}
                          margin={{ top: 10, right: 10, left: 5, bottom: 40 }}
                        >
                          <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#047857" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={11}
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            stroke="#666"
                            fontSize={11}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                              return `$${value}`
                            }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(value),
                              'Ganancia'
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar
                            dataKey="profit"
                            fill="url(#colorProfit)"
                            radius={[4, 4, 0, 0]}
                            stroke="#047857"
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500">No hay datos disponibles</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Ingresos por Método de Pago */}
            {isSuperAdmin && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Ingresos por Método de Pago</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Efectivo, Transferencia y Mixto</p>
                    </div>
                  </div>
                </div>
                <div className="h-[250px] md:h-[300px]">
                  {(() => {
                    // Calcular ingresos por método de pago
                    let efectivoTotal = 0
                    let transferenciaTotal = 0
                    let mixtoTotal = 0

                    filteredData.sales.forEach((sale: Sale) => {
                      if (sale.status !== 'cancelled') {
                        if (sale.paymentMethod === 'cash') {
                          efectivoTotal += sale.total || 0
                        } else if (sale.paymentMethod === 'transfer') {
                          transferenciaTotal += sale.total || 0
                        } else if (sale.paymentMethod === 'mixed' && sale.payments) {
                          sale.payments.forEach(payment => {
                            if (payment.paymentType === 'cash') {
                              efectivoTotal += payment.amount || 0
                            } else if (payment.paymentType === 'transfer') {
                              transferenciaTotal += payment.amount || 0
                            }
                          })
                          mixtoTotal += sale.total || 0
                        }
                      }
                    })

                    // Agregar abonos de créditos
                    filteredData.paymentRecords.forEach((payment: any) => {
                      if (payment.status !== 'cancelled') {
                        if (payment.paymentMethod === 'cash') {
                          efectivoTotal += payment.amount || 0
                        } else if (payment.paymentMethod === 'transfer') {
                          transferenciaTotal += payment.amount || 0
                        }
                      }
                    })

                    const paymentData = [
                      { name: 'Efectivo', value: efectivoTotal, color: '#10B981' },
                      { name: 'Transferencia', value: transferenciaTotal, color: '#3B82F6' },
                      { name: 'Mixto', value: mixtoTotal, color: '#F59E0B' }
                    ].filter(item => item.value > 0)

                    return paymentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={paymentData}
                          margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorEfectivo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="colorTransferencia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="colorMixto" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#D97706" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={11}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            stroke="#666"
                            fontSize={11}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                              return `$${value}`
                            }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(value),
                              'Ingresos'
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            strokeWidth={1}
                          >
                            {paymentData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.name === 'Efectivo' ? 'url(#colorEfectivo)' :
                                  entry.name === 'Transferencia' ? 'url(#colorTransferencia)' :
                                    'url(#colorMixto)'}
                                stroke={entry.color}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500">No hay datos disponibles</p>
                      </div>
                    )
                  })()}
                </div>
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
