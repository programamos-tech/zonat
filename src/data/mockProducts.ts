import { Product, Category, StockTransfer, StockAdjustment } from '@/types'

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electrodomésticos',
    description: 'Productos para el hogar y electrodomésticos',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Tecnología',
    description: 'Dispositivos electrónicos y tecnología',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Accesorios',
    description: 'Accesorios y complementos',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '4',
    name: 'Herramientas',
    description: 'Herramientas y equipos de trabajo',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '5',
    name: 'Audio y Video',
    description: 'Equipos de audio y video',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'SILICONA MÁGICAS 6 LITE',
    reference: '923',
    description: 'SILICONA MÁGICAS 6 LITE - X9B 6',
    price: 15000,
    cost: 10000,
    stock: {
      warehouse: 15,
      store: 5,
      total: 20
    },
    categoryId: '3',
    brand: 'Mágicas',
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'PISTOLA M416 FULL',
    reference: '921',
    description: 'PISTOLA M416 FULL 95',
    price: 25000,
    cost: 18000,
    stock: {
      warehouse: 5,
      store: 3,
      total: 8
    },
    categoryId: '4',
    brand: 'Gaming Pro',
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    name: 'MÁQUINA VGR 318',
    reference: '919',
    description: 'MÁQUINA VGR 318 45',
    price: 45000,
    cost: 32000,
    stock: {
      warehouse: 2,
      store: 0,
      total: 2
    },
    categoryId: '4',
    brand: 'VGR',
    status: 'active',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-19'
  },
  {
    id: '4',
    name: 'TELEVISOR HARVIC 55 PULGADAS',
    reference: '112',
    description: 'TELEVISOR HARVIC 55 PULGADAS 1.300',
    price: 1300000,
    cost: 950000,
    stock: {
      warehouse: 0,
      store: 0,
      total: 0
    },
    categoryId: '1',
    brand: 'Harvic',
    status: 'out_of_stock',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-17'
  },
  {
    id: '5',
    name: 'CELULAR NOTE 14 PRO 256GB',
    reference: '990',
    description: 'CELULAR NOTE 14 PRO 256GB',
    price: 850000,
    cost: 650000,
    stock: {
      warehouse: 0,
      store: 0,
      total: 0
    },
    categoryId: '2',
    brand: 'Samsung',
    status: 'out_of_stock',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-16'
  },
  {
    id: '6',
    name: 'POWER BANK V88 30.000 MAH',
    reference: '9',
    description: 'POWER BANK V88 30.000 MAH 70',
    price: 70000,
    cost: 45000,
    stock: {
      warehouse: 10,
      store: 6,
      total: 16
    },
    categoryId: '3',
    brand: 'V88',
    status: 'active',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-14'
  },
  {
    id: '7',
    name: 'VENTILADOR DE MANO',
    reference: '10',
    description: 'VENTILADOR DE MANO 10',
    price: 25000,
    cost: 15000,
    stock: {
      warehouse: 80,
      store: 41,
      total: 121
    },
    categoryId: '1',
    brand: 'Cool Air',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-13'
  },
  {
    id: '8',
    name: 'PARLANTE GTS 1248',
    reference: '12',
    description: 'PARLANTE GTS 1248 2676 30',
    price: 30000,
    cost: 20000,
    stock: {
      warehouse: 6,
      store: 5,
      total: 11
    },
    categoryId: '5',
    brand: 'GTS',
    status: 'active',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-12'
  },
  {
    id: '9',
    name: 'TELEVISOR HARVIC 43 PULGADAS',
    reference: '915',
    description: 'TELEVISOR HARVIC 43 PULGADAS 800',
    price: 800000,
    cost: 600000,
    stock: {
      warehouse: 0,
      store: 0,
      total: 0
    },
    categoryId: '1',
    brand: 'Harvic',
    status: 'out_of_stock',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-11'
  },
  {
    id: '10',
    name: 'AURICULARES BLUETOOTH',
    reference: '914',
    description: 'AURICULARES BLUETOOTH PREMIUM',
    price: 45000,
    cost: 30000,
    stock: {
      warehouse: 2,
      store: 2,
      total: 4
    },
    categoryId: '5',
    brand: 'SoundMax',
    status: 'active',
    createdAt: '2024-01-06',
    updatedAt: '2024-01-10'
  },
  {
    id: '11',
    name: 'CABLE USB-C 2M',
    reference: '447',
    description: 'CABLE USB-C 2M RÁPIDO',
    price: 12000,
    cost: 8000,
    stock: {
      warehouse: 15,
      store: 10,
      total: 25
    },
    categoryId: '3',
    brand: 'TechCable',
    status: 'active',
    createdAt: '2024-01-07',
    updatedAt: '2024-01-09'
  },
  {
    id: '12',
    name: 'MESA GAMING RGB',
    reference: '979',
    description: 'MESA GAMING RGB LED 120CM',
    price: 180000,
    cost: 120000,
    stock: {
      warehouse: 2,
      store: 1,
      total: 3
    },
    categoryId: '4',
    brand: 'GamingDesk',
    status: 'active',
    createdAt: '2024-01-09',
    updatedAt: '2024-01-08'
  },
  {
    id: '13',
    name: 'MOUSE GAMING RGB',
    reference: '368',
    description: 'MOUSE GAMING RGB 12000 DPI',
    price: 35000,
    cost: 25000,
    stock: {
      warehouse: 4,
      store: 3,
      total: 7
    },
    categoryId: '3',
    brand: 'GamingMouse',
    status: 'active',
    createdAt: '2024-01-11',
    updatedAt: '2024-01-07'
  }
]

export const mockStockTransfers: StockTransfer[] = [
  {
    id: '1',
    productId: '1',
    productName: 'SILICONA MÁGICAS 6 LITE',
    fromLocation: 'warehouse',
    toLocation: 'store',
    quantity: 5,
    reason: 'Reposición de stock en local',
    userId: '1',
    userName: 'Diego Admin',
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    productId: '6',
    productName: 'POWER BANK V88 30.000 MAH',
    fromLocation: 'warehouse',
    toLocation: 'store',
    quantity: 4,
    reason: 'Aumentar inventario en local',
    userId: '1',
    userName: 'Diego Admin',
    createdAt: '2024-01-19T14:15:00Z'
  }
]

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: '1',
    productId: '7',
    productName: 'VENTILADOR DE MANO',
    location: 'warehouse',
    type: 'add',
    quantity: 50,
    reason: 'Nueva compra de inventario',
    userId: '1',
    userName: 'Diego Admin',
    createdAt: '2024-01-18T09:00:00Z'
  },
  {
    id: '2',
    productId: '3',
    productName: 'MÁQUINA VGR 318',
    location: 'store',
    type: 'remove',
    quantity: 1,
    reason: 'Producto dañado',
    userId: '1',
    userName: 'Diego Admin',
    createdAt: '2024-01-17T16:45:00Z'
  }
]