'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { useSales } from '@/contexts/sales-context'
import { Sale } from '@/types'

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'

export default function DashboardPage() {
  const { sales, refreshSales } = useSales()
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [allSales, setAllSales] = useState<Sale[]>([])

  // Cargar todas las ventas para el dashboard
  useEffect(() => {
    const loadAllSales = async () => {
      try {
        // Importar SalesService directamente para obtener todas las ventas
        const { SalesService } = await import('@/lib/sales-service')
        
        // Cargar todas las ventas sin paginación
        let allSalesData: Sale[] = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const result = await SalesService.getAllSales(page, 50) // 50 por página para ser más eficiente
          allSalesData = [...allSalesData, ...result.sales]
          hasMore = result.hasMore
          page++
        }
        
        console.log(`Dashboard: Cargadas ${allSalesData.length} ventas totales`)
        setAllSales(allSalesData)
      } catch (error) {
        console.error('Error cargando todas las ventas:', error)
        // Fallback a las ventas del context si hay error
        setAllSales(sales)
      }
    }
    
    loadAllSales()
  }, [sales])

  // Filtrar ventas por período
  const filteredSales = useMemo(() => {
    if (dateFilter === 'all') return allSales

    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
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
        return sales
    }

    const filtered = allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= startDate && saleDate <= endDate
    })

    // Debug log para verificar el filtrado
    console.log(`Filtro: ${dateFilter}, Ventas totales: ${allSales.length}, Ventas filtradas: ${filtered.length}`)
    console.log(`Rango: ${startDate.toLocaleString('es-CO')} - ${endDate.toLocaleString('es-CO')}`)
    
    // Debug: mostrar fechas de las primeras 3 ventas
    if (allSales.length > 0) {
      console.log('Fechas de ventas (primeras 3):')
      allSales.slice(0, 3).forEach((sale, index) => {
        console.log(`Venta ${index + 1}: ${new Date(sale.createdAt).toLocaleString('es-CO')}`)
      })
    }

    return filtered
  }, [allSales, dateFilter])

  // Calcular ingresos detallados por método de pago
  const incomeData = useMemo(() => {
    const incomeByMethod: { [key: string]: { amount: number; count: number } } = {}
    let totalAmount = 0
    let totalCount = 0

    console.log(`Calculando ingresos para ${filteredSales.length} ventas filtradas`)

    filteredSales.forEach(sale => {
      totalCount++
      
      // Debug específico para garantías
      if (sale.paymentMethod === 'warranty') {
        console.log(`🔍 GARANTÍA ENCONTRADA:`, {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          clientName: sale.clientName,
          total: sale.total,
          subtotal: sale.subtotal,
          tax: sale.tax,
          createdAt: sale.createdAt
        })
      }
      
      if (sale.paymentMethod === 'mixed' && sale.payments) {
        // Para ventas mixtas, sumar cada método de pago
        sale.payments.forEach(payment => {
          if (!incomeByMethod[payment.paymentType]) {
            incomeByMethod[payment.paymentType] = { amount: 0, count: 0 }
          }
          incomeByMethod[payment.paymentType].amount += payment.amount
          incomeByMethod[payment.paymentType].count++
          totalAmount += payment.amount
        })
      } else {
        // Para ventas normales, sumar al método correspondiente
        if (!incomeByMethod[sale.paymentMethod]) {
          incomeByMethod[sale.paymentMethod] = { amount: 0, count: 0 }
        }
        incomeByMethod[sale.paymentMethod].amount += sale.total
        incomeByMethod[sale.paymentMethod].count++
        totalAmount += sale.total
      }
    })

    console.log(`Resultado: Total ${totalAmount}, Transacciones ${totalCount}`)
    console.log('Ingresos por método:', incomeByMethod)
    
    return {
      incomeByMethod,
      totalAmount,
      totalCount
    }
  }, [filteredSales])

  // Obtener etiqueta del método de pago
  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      credit: 'Crédito',
      warranty: 'Garantía',
      mixed: 'Mixto'
    }
    return labels[method] || method
  }

  // Obtener color del método de pago
  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      cash: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      transfer: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      credit: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
      warranty: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      mixed: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400'
    }
    return colors[method] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
  }

  // Obtener icono del método de pago
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      case 'transfer':
        return <TrendingUp className="h-4 w-4" />
      case 'credit':
        return <CreditCard className="h-4 w-4" />
      case 'warranty':
        return <CreditCard className="h-4 w-4" />
      case 'mixed':
        return <CreditCard className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

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

  // Exportar a CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Método de Pago', 'Cantidad', 'Monto Total', 'Porcentaje'],
      ...Object.entries(incomeData.incomeByMethod).map(([method, data]) => [
        getPaymentMethodLabel(method),
        data.count.toString(),
        new Intl.NumberFormat('es-CO', { 
          style: 'currency', 
          currency: 'COP',
          minimumFractionDigits: 0 
        }).format(data.amount),
        `${((data.amount / incomeData.totalAmount) * 100).toFixed(1)}%`
      ]),
      ['TOTAL', incomeData.totalCount.toString(), 
        new Intl.NumberFormat('es-CO', { 
          style: 'currency', 
          currency: 'COP',
          minimumFractionDigits: 0 
        }).format(incomeData.totalAmount), '100%']
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resumen-ingresos-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="xl:ml-0 ml-20">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Resumen de ingresos y ventas - ZONA T
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {/* Filtros */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Período:
            </span>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'quarter', 'year', 'all'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                    dateFilter === filter 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {getDateFilterLabel(filter)}
                </button>
              ))}
        </div>
      </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Total Ingresos
                </p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
                  }).format(incomeData.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Transacciones
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {incomeData.totalCount}
                </p>
              </div>
              <CreditCard className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Promedio por Transacción
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 0 
                  }).format(incomeData.totalCount > 0 ? incomeData.totalAmount / incomeData.totalCount : 0)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Método de Pago */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          📊 Desglose por Método de Pago
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(incomeData.incomeByMethod).map(([method, data]) => (
            <Card key={method} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getPaymentMethodColor(method)}`}>
                      {getPaymentMethodIcon(method)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {getPaymentMethodLabel(method)}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data.count} transacciones
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Monto Total:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                      {new Intl.NumberFormat('es-CO', { 
                        style: 'currency', 
                        currency: 'COP',
                        minimumFractionDigits: 0 
                      }).format(data.amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Porcentaje:
                    </span>
                    <span className="font-semibold text-emerald-600 text-lg">
                      {incomeData.totalAmount > 0 ? ((data.amount / incomeData.totalAmount) * 100).toFixed(1) : '0'}%
                    </span>
      </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${incomeData.totalAmount > 0 ? (data.amount / incomeData.totalAmount) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Última actualización: {new Date().toLocaleString('es-CO')}</span>
          <div className="flex items-center gap-4">
            <span>
              Período: <span className="font-semibold text-emerald-600">{getDateFilterLabel(dateFilter)}</span>
            </span>
            <span>
              Mostrando <span className="font-semibold text-blue-600">{incomeData.totalCount}</span> de <span className="font-semibold text-gray-600">{allSales.length}</span> transacciones
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
