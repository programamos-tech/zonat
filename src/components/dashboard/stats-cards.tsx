'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  CreditCard, 
  AlertTriangle,
  ShoppingCart,
  BarChart3
} from 'lucide-react'
import { DashboardStats } from '@/types'
import { getPeriodChanges } from '@/data/timeBasedData'

interface StatsCardsProps {
  stats: DashboardStats
  period?: string
}

export function StatsCards({ stats, period = 'month' }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value}%`
  }

  const changes = getPeriodChanges(period)

  const cards = [
    {
      title: 'Ventas Totales',
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      color: 'text-brand-lime',
      bgColor: 'bg-brand-lime-soft',
      change: changes.sales,
      changeColor: 'text-brand-lime'
    },
    {
      title: 'Inversión Total',
      value: formatCurrency(stats.totalInvestment),
      icon: TrendingUp,
      color: 'text-brand-coral',
      bgColor: 'bg-brand-coral-soft',
      change: changes.investment,
      changeColor: 'text-brand-coral'
    },
    {
      title: 'Ganancia Total',
      value: formatCurrency(stats.totalProfit),
      icon: BarChart3,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold-soft',
      change: changes.profit,
      changeColor: 'text-brand-gold'
    },
    {
      title: 'Margen de Ganancia',
      value: formatPercentage(stats.profitMargin),
      icon: TrendingUp,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold-soft',
      change: changes.margin,
      changeColor: 'text-brand-gold'
    },
    {
      title: 'Productos en Stock',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-brand-lime',
      bgColor: 'bg-brand-lime-soft',
      change: changes.products,
      changeColor: 'text-brand-lime'
    },
    {
      title: 'Clientes Activos',
      value: stats.totalClients.toString(),
      icon: Users,
      color: 'text-brand-coral',
      bgColor: 'bg-brand-coral-soft',
      change: changes.clients,
      changeColor: 'text-brand-coral'
    },
    {
      title: 'Pagos Pendientes',
      value: formatCurrency(stats.pendingPayments),
      icon: CreditCard,
      color: 'text-brand-coral',
      bgColor: 'bg-brand-coral-soft',
      change: changes.payments,
      changeColor: 'text-brand-coral'
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockProducts.toString(),
      icon: AlertTriangle,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold-soft',
      change: changes.stock,
      changeColor: 'text-brand-gold'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {card.value}
            </div>
            <p className={`text-xs ${card.changeColor} mt-1`}>
              {card.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
