import { PurchaseOrder, PurchaseOrderItem } from '@/types'

// Datos mock de órdenes de compra
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'OC-2024-001',
    supplierId: '1',
    supplierName: 'Distribuidora Farmacéutica del Norte',
    status: 'received',
    estimatedDeliveryDate: '2024-12-15',
    receivedDate: '2024-12-14',
    total: 2500000,
    items: [
      {
        id: '1-1',
        purchaseOrderId: '1',
        productId: 'prod-1',
        productName: 'Paracetamol 500mg',
        productReference: 'PAR-500',
        quantity: 100,
        unitPrice: 2500,
        receivedQuantity: 100,
        total: 250000
      },
      {
        id: '1-2',
        purchaseOrderId: '1',
        productId: 'prod-2',
        productName: 'Ibuprofeno 400mg',
        productReference: 'IBU-400',
        quantity: 80,
        unitPrice: 3200,
        receivedQuantity: 80,
        total: 256000
      },
      {
        id: '1-3',
        purchaseOrderId: '1',
        productId: 'prod-3',
        productName: 'Amoxicilina 500mg',
        productReference: 'AMO-500',
        quantity: 50,
        unitPrice: 4500,
        receivedQuantity: 50,
        total: 225000
      }
    ],
    invoiceNumber: 'FAC-2024-1234',
    createdBy: 'user-1',
    createdByName: 'Diego',
    notes: 'Orden recibida completa',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-14T15:30:00Z'
  },
  {
    id: '2',
    orderNumber: 'OC-2024-002',
    supplierId: '2',
    supplierName: 'Laboratorios Genéricos S.A.',
    status: 'in_transit',
    estimatedDeliveryDate: '2024-12-25',
    total: 1800000,
    items: [
      {
        id: '2-1',
        purchaseOrderId: '2',
        productId: 'prod-4',
        productName: 'Omeprazol 20mg',
        productReference: 'OME-20',
        quantity: 60,
        unitPrice: 2800,
        total: 168000
      },
      {
        id: '2-2',
        purchaseOrderId: '2',
        productId: 'prod-5',
        productName: 'Loratadina 10mg',
        productReference: 'LOR-10',
        quantity: 40,
        unitPrice: 3200,
        total: 128000
      }
    ],
    createdBy: 'user-1',
    createdByName: 'Diego',
    notes: 'En camino desde Bogotá',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-18T09:00:00Z'
  },
  {
    id: '3',
    orderNumber: 'OC-2024-003',
    supplierId: '3',
    supplierName: 'Suministros Médicos del Caribe',
    status: 'pending',
    estimatedDeliveryDate: '2024-12-28',
    total: 950000,
    items: [
      {
        id: '3-1',
        purchaseOrderId: '3',
        productId: 'prod-6',
        productName: 'Guantes Nitrilo',
        productReference: 'GUA-NIT',
        quantity: 200,
        unitPrice: 4500,
        total: 900000
      }
    ],
    createdBy: 'user-1',
    createdByName: 'Diego',
    notes: 'Pendiente de confirmación',
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z'
  },
  {
    id: '4',
    orderNumber: 'OC-2024-004',
    supplierId: '1',
    supplierName: 'Distribuidora Farmacéutica del Norte',
    status: 'partial',
    estimatedDeliveryDate: '2024-12-22',
    receivedDate: '2024-12-21',
    total: 3200000,
    items: [
      {
        id: '4-1',
        purchaseOrderId: '4',
        productId: 'prod-7',
        productName: 'Aspirina 500mg',
        productReference: 'ASP-500',
        quantity: 150,
        unitPrice: 1800,
        receivedQuantity: 100,
        total: 270000
      },
      {
        id: '4-2',
        purchaseOrderId: '4',
        productId: 'prod-8',
        productName: 'Diclofenaco 50mg',
        productReference: 'DIC-50',
        quantity: 120,
        unitPrice: 3500,
        receivedQuantity: 120,
        total: 420000
      }
    ],
    createdBy: 'user-1',
    createdByName: 'Diego',
    notes: 'Recibido parcialmente - faltan 50 unidades de Aspirina',
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-21T14:00:00Z'
  },
  {
    id: '5',
    orderNumber: 'OC-2024-005',
    supplierId: '4',
    supplierName: 'Farmacia Mayorista Central',
    status: 'cancelled',
    estimatedDeliveryDate: '2024-12-30',
    total: 1200000,
    items: [
      {
        id: '5-1',
        purchaseOrderId: '5',
        productId: 'prod-9',
        productName: 'Vitamina C 1000mg',
        productReference: 'VIT-C',
        quantity: 80,
        unitPrice: 15000,
        total: 1200000
      }
    ],
    createdBy: 'user-1',
    createdByName: 'Diego',
    notes: 'Cancelada por cambio de proveedor',
    createdAt: '2024-12-12T10:00:00Z',
    updatedAt: '2024-12-15T11:00:00Z'
  }
]

export class PurchaseOrdersService {
  // Obtener todas las órdenes de compra
  static async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...mockPurchaseOrders]
  }

  // Obtener orden por ID
  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockPurchaseOrders.find(o => o.id === id) || null
  }

  // Obtener órdenes por proveedor
  static async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockPurchaseOrders.filter(o => o.supplierId === supplierId)
  }

  // Crear nueva orden de compra
  static async createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<{ order: PurchaseOrder | null, error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Generar número de orden
    const orderNumber = `OC-${new Date().getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`
    
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `order-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockPurchaseOrders.push(newOrder)
    return { order: newOrder, error: null }
  }

  // Actualizar orden de compra
  static async updatePurchaseOrder(id: string, orderData: Partial<Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'>>): Promise<{ order: PurchaseOrder | null, error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = mockPurchaseOrders.findIndex(o => o.id === id)
    if (index === -1) {
      return { order: null, error: 'Orden de compra no encontrada' }
    }
    
    // Si se actualizan los items, asegurarse de mantener la estructura correcta
    const updatedOrder = {
      ...mockPurchaseOrders[index],
      ...orderData,
      updatedAt: new Date().toISOString()
    }
    
    // Si se actualizaron items, recalcular el total
    if (orderData.items) {
      updatedOrder.total = orderData.items.reduce((sum, item) => sum + item.total, 0)
    }
    
    mockPurchaseOrders[index] = updatedOrder
    
    return { order: mockPurchaseOrders[index], error: null }
  }

  // Actualizar estado de orden
  static async updateOrderStatus(id: string, status: PurchaseOrder['status'], receivedDate?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const order = mockPurchaseOrders.find(o => o.id === id)
    if (!order) return false
    
    order.status = status
    if (receivedDate) {
      order.receivedDate = receivedDate
    }
    order.updatedAt = new Date().toISOString()
    
    return true
  }

  // Eliminar orden de compra
  static async deletePurchaseOrder(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = mockPurchaseOrders.findIndex(o => o.id === id)
    if (index === -1) {
      return false
    }
    
    mockPurchaseOrders.splice(index, 1)
    return true
  }
}

