'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Sale } from '@/types'

interface CancelledInvoicesModalProps {
  isOpen: boolean
  onClose: () => void
  sales: Sale[]
  allSales: Sale[]
}

export function CancelledInvoicesModal({ isOpen, onClose, sales, allSales }: CancelledInvoicesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  
  // Calcular métricas
  const metrics = {
    // Facturas anuladas en el período seleccionado
    cancelledSales: sales.filter(sale => sale.status === 'cancelled'),
    
    // Total de ventas en el período seleccionado
    totalSales: sales.length,
    
    // Tasa de anulación
    cancellationRate: sales.length > 0 ? (sales.filter(sale => sale.status === 'cancelled').length / sales.length) * 100 : 0,
    
    // Valor total anulado
    totalCancelledValue: sales.filter(sale => sale.status === 'cancelled').reduce((sum, sale) => sum + sale.total, 0),
    
    // Pérdida potencial (valor de las facturas anuladas)
    potentialLoss: sales.filter(sale => sale.status === 'cancelled').reduce((sum, sale) => sum + sale.total, 0),
    
    // Comparación con el mes anterior
    previousMonthComparison: calculatePreviousMonthComparison(),
    
    // Facturas anuladas por día de la semana
    cancellationsByDay: calculateCancellationsByDay(),
    
    // Usuarios que más anulan
    cancellationsByUser: calculateCancellationsByUser(),
    
    // Facturas anuladas recientes
    recentCancellations: sales
      .filter(sale => sale.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }

  function calculatePreviousMonthComparison() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Mes actual
    const currentMonthSales = allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    
    // Mes anterior
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const previousMonthSales = allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate.getMonth() === previousMonth && saleDate.getFullYear() === previousYear
    })
    
    const currentCancellations = currentMonthSales.filter(sale => sale.status === 'cancelled').length
    const previousCancellations = previousMonthSales.filter(sale => sale.status === 'cancelled').length
    
    const currentRate = currentMonthSales.length > 0 ? (currentCancellations / currentMonthSales.length) * 100 : 0
    const previousRate = previousMonthSales.length > 0 ? (previousCancellations / previousMonthSales.length) * 100 : 0
    
    return {
      current: currentRate,
      previous: previousRate,
      change: currentRate - previousRate,
      trend: currentRate > previousRate ? 'up' : currentRate < previousRate ? 'down' : 'stable'
    }
  }

  function calculateCancellationsByDay() {
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const cancellations = sales.filter(sale => sale.status === 'cancelled')
    
    const byDay = daysOfWeek.map(day => ({ day, count: 0 }))
    
    cancellations.forEach(sale => {
      const dayOfWeek = new Date(sale.createdAt).getDay()
      byDay[dayOfWeek].count++
    })
    
    return byDay
  }

  function calculateCancellationsByUser() {
    const cancellations = sales.filter(sale => sale.status === 'cancelled')
    const byUser: { [key: string]: { name: string, count: number, value: number } } = {}
    
    cancellations.forEach(sale => {
      const userName = sale.sellerName || 'Usuario Desconocido'
      if (!byUser[userName]) {
        byUser[userName] = { name: userName, count: 0, value: 0 }
      }
      byUser[userName].count++
      byUser[userName].value += sale.total
    })
    
    return Object.values(byUser).sort((a, b) => b.count - a.count).slice(0, 5)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-600 dark:text-red-400'
      case 'down':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 bottom-0 left-64 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pl-6 pr-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análisis de Facturas Anuladas
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Métricas detalladas y tendencias de cancelaciones
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tasa de Anulación */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Tasa de Anulación
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatPercentage(metrics.cancellationRate)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {metrics.cancelledSales.length} de {metrics.totalSales} ventas
                  </p>
                </CardContent>
              </Card>

              {/* Valor Total Anulado */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Valor Total Anulado
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatCurrency(metrics.totalCancelledValue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pérdida potencial
                  </p>
                </CardContent>
              </Card>

              {/* Pérdida Potencial */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Pérdida Potencial
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatCurrency(metrics.potentialLoss)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dinero no ingresado
                  </p>
                </CardContent>
              </Card>

              {/* Tendencia */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {getTrendIcon(metrics.previousMonthComparison.trend)}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Tendencia Mensual
                    </span>
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${getTrendColor(metrics.previousMonthComparison.trend)}`}>
                    {formatPercentage(Math.abs(metrics.previousMonthComparison.change))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    vs mes anterior
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análisis detallado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facturas anuladas por día */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Anulaciones por Día de la Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.cancellationsByDay.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ 
                                width: `${metrics.cancelledSales.length > 0 ? (day.count / metrics.cancelledSales.length) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                            {day.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Usuarios que más anulan */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Usuarios con Más Anulaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.cancellationsByUser.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.count} anulaciones
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(user.value)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Valor perdido
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Facturas anuladas recientes */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Facturas Anuladas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.recentCancellations.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {metrics.recentCancellations.map((sale, index) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {sale.invoiceNumber} - {sale.clientName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(sale.createdAt).toLocaleString('es-CO')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(sale.total)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {sale.sellerName || 'Usuario desconocido'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No hay facturas anuladas en este período</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
