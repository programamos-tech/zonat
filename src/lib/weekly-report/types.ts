export type WeeklyStoreUser = {
  userId: string
  name: string
  salesCount: number
  actionsCount: number
}

export type WeeklyTopProduct = {
  productId: string
  name: string
  quantity: number
  revenue: number
}

export type WeeklyClientDebt = {
  clientId: string
  clientName: string
  pendingAmount: number
  daysOverdue: number
  invoiceNumber?: string
}

export type PeriodDayMetrics = {
  date: string
  label: string
  salesCount: number
  totalRevenue: number
  cashRevenue: number
  transferRevenue: number
  creditAbonosRevenue: number
  creditsIssuedCount: number
  creditsIssuedAmount: number
}

export type WeeklyStoreReport = {
  storeId: string
  storeName: string
  salesCount: number
  totalRevenue: number
  cashRevenue: number
  transferRevenue: number
  creditAbonosRevenue: number
  creditsIssuedCount: number
  creditsIssuedAmount: number
  days: PeriodDayMetrics[]
  activeUsers: WeeklyStoreUser[]
  topProducts: WeeklyTopProduct[]
  overdueClients: WeeklyClientDebt[]
  currentClients: WeeklyClientDebt[]
  overdueCount: number
  currentCount: number
  overdueTotal: number
  currentTotal: number
}

export type MainStoreWeeklySaleRow = {
  invoiceNumber: string
  date: string
  clientName: string
  sellerName: string
  paymentMethod: string
  itemsCount: number
  units: number
  total: number
  cash: number
  transfer: number
}

export type MainStoreWeeklySaleItemRow = {
  invoiceNumber: string
  date: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
  sellerName: string
}

export type MainStoreWeeklyCreditRow = {
  invoiceNumber: string
  date: string
  clientName: string
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  status: string
  dueDate: string
  daysOverdue: number
}

export type MainStoreWeeklyPayload = {
  storeId: string
  storeName: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  sales: {
    count: number
    units: number
    total: number
    cash: number
    transfer: number
    credit: number
    abonos: number
    rows: MainStoreWeeklySaleRow[]
    items: MainStoreWeeklySaleItemRow[]
  }
  credits: {
    issuedCount: number
    issuedAmount: number
    issued: MainStoreWeeklyCreditRow[]
    overdueCount: number
    overdueTotal: number
    overdue: MainStoreWeeklyCreditRow[]
    currentCount: number
    currentTotal: number
    current: MainStoreWeeklyCreditRow[]
  }
}

export type WeeklyReportPayload = {
  kind: 'weekly' | 'monthly'
  periodLabel: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  stores: WeeklyStoreReport[]
  totals: {
    salesCount: number
    totalRevenue: number
    cashRevenue: number
    transferRevenue: number
    creditAbonosRevenue: number
    creditsIssuedCount: number
    creditsIssuedAmount: number
    overdueClients: number
    currentClients: number
  }
}
