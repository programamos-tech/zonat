import { LogEntry } from '@/types/logs'

export const mockLogs: LogEntry[] = [
  {
    id: '1',
    type: 'transfer',
    action: 'Transferencia de Stock',
    description: 'Transferencia de 5 unidades de MacBook Pro 16" M3 desde Bodega hacia Local',
    details: {
      productId: '1',
      productName: 'MacBook Pro 16" M3',
      fromLocation: 'warehouse',
      toLocation: 'store',
      quantity: 5,
      reason: 'Reposición de tienda para temporada alta',
      stockBefore: {
        warehouse: 10,
        store: 2,
        total: 12
      },
      stockAfter: {
        warehouse: 5,
        store: 7,
        total: 12
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    type: 'sale',
    action: 'Nueva Venta',
    description: 'Venta #1234 - TechStore Central - Total: $9,976',
    details: {
      saleId: '1',
      clientId: '1',
      clientName: 'TechStore Central',
      total: 9976,
      paymentMethod: 'transfer',
      items: [
        {
          productId: '1',
          productName: 'MacBook Pro 16" M3',
          quantity: 2,
          unitPrice: 2500
        },
        {
          productId: '2',
          productName: 'iPhone 15 Pro',
          quantity: 3,
          unitPrice: 1200
        }
      ]
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-20T10:30:00Z'
  },
  {
    id: '3',
    type: 'product_create',
    action: 'Producto Creado',
    description: 'Nuevo producto: Samsung Galaxy S24 Ultra',
    details: {
      productId: '3',
      productName: 'Samsung Galaxy S24 Ultra',
      changes: {
        name: { from: null, to: 'Samsung Galaxy S24 Ultra' },
        price: { from: null, to: 1100 },
        stock: { from: null, to: { warehouse: 8, store: 2, total: 10 } }
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-19T16:45:00Z'
  },
  {
    id: '4',
    type: 'product_edit',
    action: 'Producto Editado',
    description: 'Actualización de precio: MacBook Pro 16" M3',
    details: {
      productId: '1',
      productName: 'MacBook Pro 16" M3',
      changes: {
        price: { from: 2400, to: 2500 },
        stock: { from: { warehouse: 8, store: 2, total: 10 }, to: { warehouse: 10, store: 2, total: 12 } }
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-19T14:20:00Z'
  },
  {
    id: '5',
    type: 'client_create',
    action: 'Cliente Creado',
    description: 'Nuevo cliente: ElectroMax',
    details: {
      clientId: '2',
      clientName: 'ElectroMax',
      changes: {
        type: { from: null, to: 'minorista' },
        email: { from: null, to: 'contacto@electromax.com' }
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-18T11:15:00Z'
  },
  {
    id: '6',
    type: 'transfer',
    action: 'Transferencia de Stock',
    description: 'Transferencia de 3 unidades de iPhone 15 Pro desde Local hacia Bodega',
    details: {
      productId: '2',
      productName: 'iPhone 15 Pro',
      fromLocation: 'store',
      toLocation: 'warehouse',
      quantity: 3,
      reason: 'Devolución de productos no vendidos',
      stockBefore: {
        warehouse: 5,
        store: 8,
        total: 13
      },
      stockAfter: {
        warehouse: 8,
        store: 5,
        total: 13
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-18T09:30:00Z'
  },
  {
    id: '7',
    type: 'category_create',
    action: 'Categoría Creada',
    description: 'Nueva categoría: Smartphones',
    details: {
      categoryId: '3',
      categoryName: 'Smartphones',
      changes: {
        name: { from: null, to: 'Smartphones' },
        description: { from: null, to: 'Teléfonos inteligentes y accesorios' }
      }
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-17T15:20:00Z'
  },
  {
    id: '8',
    type: 'sale',
    action: 'Venta Cancelada',
    description: 'Venta #1230 cancelada - María González - Motivo: Cliente cambió de opinión',
    details: {
      saleId: '3',
      clientId: '3',
      clientName: 'María González',
      total: 1392,
      paymentMethod: 'cash',
      items: [
        {
          productId: '2',
          productName: 'iPhone 15 Pro',
          quantity: 1,
          unitPrice: 1200
        }
      ]
    },
    userId: '1',
    userName: 'Diego Admin',
    timestamp: '2024-01-17T10:45:00Z'
  }
]
