export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'superadmin' | 'admin' | 'vendedor' | 'inventario' | 'contador'
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  module: string
  actions: string[]
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  reference: string
  description: string
  price: number
  cost: number
  stock: {
    warehouse: number
    store: number
    total: number
  }
  categoryId: string
  brand: string
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock'
  createdAt: string
  updatedAt: string
}

export interface StockTransfer {
  id: string
  productId: string
  productName: string
  fromLocation: 'warehouse' | 'store'
  toLocation: 'warehouse' | 'store'
  quantity: number
  reason: string
  userId: string
  userName: string
  createdAt: string
}

export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  location: 'warehouse' | 'store'
  type: 'add' | 'remove'
  quantity: number
  reason: string
  userId: string
  userName: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  document: string
  address: string
  city: string
  state: string
  type: 'minorista' | 'mayorista' | 'consumidor_final'
  creditLimit: number
  currentDebt: number
  status: 'active' | 'inactive'
  nit?: string
  createdAt: string
}

export interface CompanyConfig {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  logo?: string
  dianResolution?: string
  numberingRange?: string
  createdAt: string
  updatedAt: string
}

export interface SalePayment {
  id: string
  saleId: string
  paymentType: 'cash' | 'transfer' | 'credit' | 'warranty'
  amount: number
  reference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Warranty {
  id: string
  originalSaleId: string
  clientId: string
  clientName: string
  productReceivedId: string
  productReceivedName: string
  productReceivedSerial?: string
  productDeliveredId?: string
  productDeliveredName?: string
  reason: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'discarded'
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  createdBy?: string
  // Relaciones
  originalSale?: Sale
  client?: Client
  productReceived?: Product
  productDelivered?: Product
  warrantyProducts?: WarrantyProduct[]
  statusHistory?: WarrantyStatusHistory[]
}

export interface WarrantyProduct {
  id: string
  warrantyId: string
  productId: string
  serialNumber?: string
  condition: 'defective' | 'repaired' | 'discarded'
  notes?: string
  createdAt: string
  updatedAt: string
  // Relaciones
  product?: Product
}

export interface WarrantyStatusHistory {
  id: string
  warrantyId: string
  previousStatus?: string
  newStatus: string
  notes?: string
  changedBy?: string
  changedAt: string
  // Relaciones
  changedByUser?: User
}

export interface Sale {
  id: string
  clientId: string
  clientName: string
  total: number
  subtotal: number
  tax: number
  discount: number
  discountType?: 'percentage' | 'amount'
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: 'cash' | 'credit' | 'transfer' | 'warranty' | 'mixed'
  payments?: SalePayment[] // Para pagos mixtos
  invoiceNumber?: string
  sellerId?: string
  sellerName?: string
  sellerEmail?: string
  createdAt: string
  items: SaleItem[]
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  productReferenceCode?: string
  quantity: number
  unitPrice: number
  discount?: number
  discountType?: 'percentage' | 'amount'
  tax?: number
  total: number
}

export interface Credit {
  id: string
  saleId: string
  clientId: string
  clientName: string
  invoiceNumber: string
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  lastPaymentAmount?: number
  lastPaymentDate?: string
  lastPaymentUser?: string
  status: 'pending' | 'partial' | 'completed' | 'overdue'
  dueDate?: string
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentRecord {
  id: string
  creditId: string
  amount: number
  paymentDate: string
  paymentMethod: 'cash' | 'transfer' | 'mixed'
  cashAmount?: number
  transferAmount?: number
  description?: string
  userId: string
  userName: string
  createdAt: string
}

// Mantener Payment para compatibilidad
export interface Payment extends Credit {}

export interface DashboardStats {
  totalSales: number
  totalInvestment: number
  totalProfit: number
  profitMargin: number
  totalProducts: number
  totalClients: number
  pendingPayments: number
  lowStockProducts: number
}
