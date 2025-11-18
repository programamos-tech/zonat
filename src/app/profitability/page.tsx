'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3,
  RefreshCw,
  Calendar,
  TrendingDown,
  Percent,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  ShoppingCart,
  ArrowRight,
  X
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { RoleProtectedRoute } from '@/components/auth/role-protected-route'
import { 
  ProfitabilityService, 
  ProductProfitability, 
  MonthlyProfitability,
  ProfitabilitySummary,
  Insight
} from '@/lib/profitability-service'
import { toast } from 'sonner'

const COLORS = ['#5C9C7C', '#7FB3A3', '#A3C9B8', '#C6DECD', '#E9F4F0']

export default function ProfitabilityPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([])
  const [monthlyProfitability, setMonthlyProfitability] = useState<MonthlyProfitability[]>([])
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [readInsights, setReadInsights] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [quickPeriod, setQuickPeriod] = useState<string>('all')

  // Cargar insights leídos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('readInsights')
    if (saved) {
      try {
        setReadInsights(new Set(JSON.parse(saved)))
      } catch (e) {
        // Si hay error, empezar con set vacío
      }
    }
  }, [])

  // Guardar insights leídos en localStorage
  const markInsightAsRead = (insightId: string) => {
    const newReadInsights = new Set(readInsights)
    newReadInsights.add(insightId)
    setReadInsights(newReadInsights)
    localStorage.setItem('readInsights', JSON.stringify(Array.from(newReadInsights)))
  }

  const loadData = async () => {
    try {
      setRefreshing(true)
      
      const start = startDate?.toISOString().split('T')[0]
      const end = endDate?.toISOString().split('T')[0]

      // Cargar datos en paralelo - las gráficas se adaptarán automáticamente a las fechas
      const [products, monthly, summaryData, insightsData] = await Promise.all([
        ProfitabilityService.getProductProfitability(start, end),
        ProfitabilityService.getMonthlyProfitability(12, start, end), // 12 es solo un fallback, se usa el rango de fechas
        ProfitabilityService.getProfitabilitySummary(start, end),
        ProfitabilityService.generateInsights(start, end)
      ])

      setProductProfitability(products)
      setMonthlyProfitability(monthly)
      setSummary(summaryData)
      setInsights(insightsData)
    } catch (error) {
      console.error('Error cargando datos de rentabilidad:', error)
      toast.error('Error al cargar los datos de rentabilidad')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Función para establecer fechas según el período rápido seleccionado
  const handleQuickPeriodChange = (period: string) => {
    setQuickPeriod(period)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Fin del día
    
    let start: Date | null = null
    let end: Date | null = null

    switch (period) {
      case '1month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        start.setHours(0, 0, 0, 0)
        end = today
        break
      case '3months':
        start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
        start.setHours(0, 0, 0, 0)
        end = today
        break
      case '6months':
        start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        start.setHours(0, 0, 0, 0)
        end = today
        break
      case '1year':
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        start.setHours(0, 0, 0, 0)
        end = today
        break
      case 'all':
      default:
        start = null
        end = null
        break
    }

    setStartDate(start)
    setEndDate(end)
  }

  // Cuando se selecciona una fecha manualmente, cambiar a modo personalizado
  const handleDateSelect = (date: Date | null, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date)
    } else {
      setEndDate(date)
    }
    setQuickPeriod('custom')
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  // Preparar datos para gráficas
  const topProductsData = productProfitability.slice(0, 10).map(p => ({
    name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
    fullName: p.productName,
    ganancia: p.totalProfit,
    ingresos: p.totalRevenue,
    costos: p.totalCost,
    margen: p.profitMargin
  }))

  const monthlyData = monthlyProfitability.map(m => ({
    mes: m.month.split(' ')[0], // Solo el nombre del mes
    fullMonth: m.month,
    ingresos: m.totalRevenue,
    costos: m.totalCost,
    ganancia: m.totalProfit,
    margen: m.profitMargin,
    creditos: m.creditsPaid,
    garantias: m.warrantiesCompleted,
    costosGarantias: m.warrantiesCost
  }))

  const profitabilityByMargin = productProfitability.slice(0, 5).map(p => ({
    name: p.productName.length > 20 ? p.productName.substring(0, 20) + '...' : p.productName,
    margen: p.profitMargin
  }))

  if (loading) {
    return (
      <RoleProtectedRoute module="profitability" requiredAction="view">
        <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[var(--swatch--gray-950)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sidebar-orange)] mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Cargando análisis de rentabilidad...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute module="profitability" requiredAction="view">
      <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-[var(--swatch--gray-950)] min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6" style={{ color: 'var(--sidebar-orange)' }} />
                  Análisis de Rentabilidad
                </CardTitle>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                  Visualiza la rentabilidad de tu negocio basada en ventas, créditos y garantías
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={loadData}
                  disabled={refreshing}
                  variant="outline"
                  className="text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-all duration-200 cursor-pointer"
                  style={{ color: 'var(--sidebar-orange)' }}
                >
                  <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Actualizar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Insights Accionables */}
        {insights.length > 0 && (
          <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
                Insights Accionables
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Recomendaciones inteligentes basadas en el análisis de tus datos
              </p>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-4 min-w-max">
                  {insights.map((insight) => {
                    const isRead = readInsights.has(insight.id)
                    
                    const getIcon = () => {
                      switch (insight.type) {
                        case 'danger':
                          return <AlertTriangle className="h-5 w-5" />
                        case 'warning':
                          return <ShoppingCart className="h-5 w-5" />
                        case 'success':
                          return <CheckCircle className="h-5 w-5" />
                        default:
                          return <Info className="h-5 w-5" />
                      }
                    }

                    const getColorClasses = () => {
                      switch (insight.type) {
                        case 'danger':
                          return 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'
                        case 'warning':
                          return 'border-[rgba(92,156,124,0.3)] dark:border-[rgba(92,156,124,0.2)] bg-[rgba(92,156,124,0.1)] dark:bg-[rgba(92,156,124,0.05)]'
                        case 'success':
                          return 'border-[rgba(92,156,124,0.4)] dark:border-[rgba(92,156,124,0.3)] bg-[rgba(92,156,124,0.15)] dark:bg-[rgba(92,156,124,0.1)]'
                        default:
                          return 'border-[rgba(92,156,124,0.2)] dark:border-[rgba(92,156,124,0.15)] bg-[rgba(92,156,124,0.08)] dark:bg-[rgba(92,156,124,0.05)]'
                      }
                    }

                    const getTextColor = () => {
                      switch (insight.type) {
                        case 'danger':
                          return 'text-red-700 dark:text-red-400'
                        case 'warning':
                        case 'success':
                        default:
                          return 'text-[#5C9C7C] dark:text-[#7FB3A3]'
                      }
                    }


                    return (
                      <div
                        key={insight.id}
                        className={`p-4 rounded-lg border-2 ${getColorClasses()} transition-all hover:shadow-md min-w-[320px] max-w-[320px] flex-shrink-0 relative ${
                          isRead ? 'opacity-60 grayscale-[0.3]' : ''
                        }`}
                      >
                        <button
                          onClick={() => markInsightAsRead(insight.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        </button>
                        <div className="flex items-start gap-3 pr-6">
                          <div className={`flex-shrink-0 ${getTextColor()} ${isRead ? 'opacity-70' : ''}`}>
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm ${getTextColor()} mb-2 ${isRead ? 'opacity-70' : ''}`}>
                              {insight.title}
                            </h3>
                            <p className={`text-xs text-gray-600 dark:text-gray-300 mb-3 ${isRead ? 'opacity-60' : ''}`}>
                              {insight.description}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 flex-1">
                                <ArrowRight className={`h-3.5 w-3.5 ${isRead ? 'opacity-50' : ''}`} style={{ color: 'var(--sidebar-orange)' }} />
                                <p className={`text-xs font-medium text-gray-700 dark:text-gray-200 ${isRead ? 'opacity-60' : ''}`}>
                                  {insight.action}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!isRead) {
                                    markInsightAsRead(insight.id)
                                  }
                                }}
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all touch-manipulation ${
                                  isRead 
                                    ? 'bg-gray-300 dark:bg-gray-700 cursor-default' 
                                    : 'hover:scale-110 active:scale-95'
                                }`}
                                style={isRead ? {
                                  backgroundColor: 'rgba(156, 163, 175, 0.5)',
                                  color: 'white'
                                } : {
                                  backgroundColor: 'var(--sidebar-orange)',
                                  color: 'white'
                                }}
                                title={isRead ? "Ya leído" : "Marcar como leído"}
                                aria-label={isRead ? "Ya leído" : "Marcar como leído"}
                                disabled={isRead}
                              >
                                <CheckCircle className={`h-5 w-5 ${isRead ? 'opacity-80' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CardContent className="p-3 md:p-4">
            {/* Selector de Período Rápido */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Período Rápido
              </label>
              <select
                value={quickPeriod}
                onChange={(e) => handleQuickPeriodChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[rgba(255,255,255,0.06)] rounded-lg text-gray-900 dark:text-white bg-white dark:bg-[#1A1A1A]"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sidebar-orange)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(92, 156, 124, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <option value="1month">Último Mes</option>
                <option value="3months">Últimos 3 Meses</option>
                <option value="6months">Últimos 6 Meses</option>
                <option value="1year">Último Año</option>
                <option value="all">Desde Siempre</option>
              </select>
            </div>

            {/* Calendario para Selección Personalizada */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Selección Personalizada (Días/Semanas)
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Desde
                  </label>
                  <DatePicker
                    selectedDate={startDate}
                    onDateSelect={(date) => handleDateSelect(date, 'start')}
                    placeholder="Seleccionar fecha inicial"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Hasta
                  </label>
                  <DatePicker
                    selectedDate={endDate}
                    onDateSelect={(date) => handleDateSelect(date, 'end')}
                    placeholder="Seleccionar fecha final"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Usa el calendario para seleccionar días específicos o rangos de semanas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      ${summary.totalRevenue.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8" style={{ color: 'var(--sidebar-orange)' }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ganancia Bruta</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      ${summary.totalProfit.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8" style={{ color: 'var(--sidebar-orange)' }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Margen de Ganancia</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {summary.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <Percent className="h-8 w-8" style={{ color: 'var(--sidebar-orange)' }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ganancia Neta</p>
                    <p className={`text-xl font-bold mt-1 ${
                      summary.netProfit >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${summary.netProfit.toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      + Créditos: ${summary.totalCreditsPaid.toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      - Garantías: ${summary.totalWarrantiesCost.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8" style={{ color: 'var(--sidebar-orange)' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfica de Rentabilidad Mensual */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              Rentabilidad Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--sidebar-orange)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--sidebar-orange)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="mes" 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="var(--sidebar-orange)" 
                  fillOpacity={1} 
                  fill="url(#colorIngresos)"
                  name="Ingresos"
                />
                <Area 
                  type="monotone" 
                  dataKey="ganancia" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorGanancia)"
                  name="Ganancia"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Productos más Rentables */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: 'var(--sidebar-orange)' }} />
              Top 10 Productos Más Rentables
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  type="number"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="ganancia" fill="var(--sidebar-orange)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              Rentabilidad por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'var(--font-inter)' }}>
                <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Costos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ganancia
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Margen
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unidades
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1A] divide-y divide-gray-200 dark:divide-[rgba(255,255,255,0.06)]">
                  {productProfitability.slice(0, 20).map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.productName}
                        </div>
                        {product.productReference && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {product.productReference}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        ${product.totalRevenue.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        ${product.totalCost.toLocaleString('es-CO')}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${
                        product.totalProfit >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${product.totalProfit.toLocaleString('es-CO')}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${
                        product.profitMargin >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {product.profitMargin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {product.unitsSold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedRoute>
  )
}

