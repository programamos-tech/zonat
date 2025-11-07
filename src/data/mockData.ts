import { Product, Client, Sale, Category, User, Payment, PaymentRecord, Role, Permission } from '@/types'

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3',
    description: 'Laptop profesional con chip M3',
    categoryId: '1',
    brand: 'Apple',
    reference: 'MBP16-M3-512',
    price: 2500,
    cost: 1800,
    stock: {
      warehouse: 3,
      store: 2,
      total: 5
    },
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    description: 'Smartphone premium con cámara avanzada',
    categoryId: '2',
    brand: 'Apple',
    reference: 'IP15P-256',
    price: 1200,
    cost: 900,
    stock: {
      warehouse: 8,
      store: 4,
      total: 12
    },
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Smartphone Android de gama alta',
    categoryId: '2',
    brand: 'Samsung',
    reference: 'SGS24U-512',
    price: 1100,
    cost: 850,
    stock: {
      warehouse: 6,
      store: 3,
      total: 9
    },
    status: 'active',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-19'
  },
  {
    id: '4',
    name: 'Dell XPS 13',
    description: 'Laptop ultrabook con pantalla 4K',
    categoryId: '1',
    brand: 'Dell',
    reference: 'DXPS13-4K',
    price: 1400,
    cost: 1100,
    stock: {
      warehouse: 4,
      store: 2,
      total: 6
    },
    status: 'active',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-17'
  },
  {
    id: '5',
    name: 'iPad Air M2',
    description: 'Tablet con chip M2 y pantalla Liquid Retina',
    categoryId: '3',
    brand: 'Apple',
    reference: 'IPADAIR-M2',
    price: 800,
    cost: 600,
    stock: {
      warehouse: 10,
      store: 5,
      total: 15
    },
    status: 'active',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-16'
  }
]

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechStore Central',
    email: 'contacto@techstorecentral.com',
    phone: '+52 55 1234 5678',
    document: '900123456-7',
    address: 'Calle 30 #25-15, Barrio La Palma',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'mayorista',
    creditLimit: 50000,
    currentDebt: 12500,
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'ElectroMax',
    email: 'ventas@electromax.com',
    phone: '+52 55 9876 5432',
    document: '800987654-3',
    address: 'Carrera 15 #20-30, Centro',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'minorista',
    creditLimit: 25000,
    currentDebt: 8500,
    status: 'active',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+52 55 5555 1234',
    document: '12345678',
    address: 'Calle 25 #15-20, Barrio El Prado',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'consumidor_final',
    creditLimit: 0,
    currentDebt: 0,
    status: 'active',
    createdAt: '2024-01-03'
  },
  {
    id: '4',
    name: 'Distribuidora Norte',
    email: 'admin@distribuidoranorte.com',
    phone: '+52 55 4444 7777',
    document: '900444777-1',
    address: 'Carrera 8 #12-45, Zona Industrial',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'mayorista',
    creditLimit: 75000,
    currentDebt: 32000,
    status: 'active',
    createdAt: '2024-01-04'
  },
  {
    id: '5',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+52 55 3333 9999',
    document: '87654321',
    address: 'Calle 18 #8-12, Barrio San Carlos',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'consumidor_final',
    creditLimit: 0,
    currentDebt: 0,
    status: 'active',
    createdAt: '2024-01-05'
  },
  {
    id: '6',
    name: 'TecnoShop Plus',
    email: 'info@tecnoshopplus.com',
    phone: '+52 55 2222 8888',
    document: '900222888-5',
    address: 'Carrera 22 #30-15, Barrio La Esperanza',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'minorista',
    creditLimit: 30000,
    currentDebt: 12000,
    status: 'active',
    createdAt: '2024-01-06'
  },
  {
    id: '7',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+52 55 1111 7777',
    document: '11223344',
    address: 'Calle 35 #25-8, Barrio El Recreo',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'consumidor_final',
    creditLimit: 0,
    currentDebt: 0,
    status: 'active',
    createdAt: '2024-01-07'
  },
  {
    id: '8',
    name: 'Comercial del Sur',
    email: 'ventas@comercialdelsur.com',
    phone: '+52 55 6666 2222',
    document: '900666222-9',
    address: 'Carrera 5 #18-30, Centro Comercial',
    city: 'Sincelejo',
    state: 'Sucre',
    type: 'mayorista',
    creditLimit: 60000,
    currentDebt: 28000,
    status: 'active',
    createdAt: '2024-01-08'
  }
]

export const mockSales: Sale[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'TechStore Central',
    items: [
      { id: '1', productId: '1', productName: 'MacBook Pro 16" M3', quantity: 2, unitPrice: 2500, total: 5000 },
      { id: '2', productId: '2', productName: 'iPhone 15 Pro', quantity: 3, unitPrice: 1200, total: 3600 }
    ],
    subtotal: 8600,
    tax: 1376,
    discount: 0,
    total: 9976,
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'ElectroMax',
    items: [
      { id: '3', productId: '3', productName: 'Samsung Galaxy S24 Ultra', quantity: 1, unitPrice: 1100, total: 1100 },
      { id: '4', productId: '5', productName: 'iPad Air M2', quantity: 2, unitPrice: 800, total: 1600 }
    ],
    subtotal: 2700,
    tax: 432,
    discount: 100,
    total: 3032,
    paymentMethod: 'credit',
    status: 'completed',
    createdAt: '2024-01-19T14:15:00Z'
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'María González',
    items: [
      { id: '5', productId: '2', productName: 'iPhone 15 Pro', quantity: 1, unitPrice: 1200, total: 1200 }
    ],
    subtotal: 1200,
    tax: 192,
    discount: 0,
    total: 1392,
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '4',
    clientId: '4',
    clientName: 'Distribuidora Norte',
    items: [
      { id: '6', productId: '1', productName: 'MacBook Pro 16" M3', quantity: 5, unitPrice: 2500, total: 12500 },
      { id: '7', productId: '4', productName: 'Dell XPS 13', quantity: 3, unitPrice: 1400, total: 4200 }
    ],
    subtotal: 16700,
    tax: 2672,
    discount: 500,
    total: 18872,
    paymentMethod: 'warranty',
    status: 'completed',
    createdAt: '2024-01-17T09:20:00Z'
  },
  {
    id: '5',
    clientId: '5',
    clientName: 'Carlos Rodríguez',
    items: [
      { id: '8', productId: '5', productName: 'iPad Air M2', quantity: 1, unitPrice: 800, total: 800 }
    ],
    subtotal: 800,
    tax: 128,
    discount: 0,
    total: 928,
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '2024-01-16T11:30:00Z'
  },
  {
    id: '6',
    clientId: '6',
    clientName: 'TecnoShop Plus',
    items: [
      { id: '9', productId: '3', productName: 'Samsung Galaxy S24 Ultra', quantity: 2, unitPrice: 1100, total: 2200 },
      { id: '10', productId: '2', productName: 'iPhone 15 Pro', quantity: 1, unitPrice: 1200, total: 1200 }
    ],
    subtotal: 3400,
    tax: 544,
    discount: 200,
    total: 3744,
    paymentMethod: 'mixed',
    status: 'completed',
    createdAt: '2024-01-15T13:45:00Z'
  }
]

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Laptops',
    description: 'Computadoras portátiles',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Smartphones',
    description: 'Teléfonos inteligentes',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Tablets',
    description: 'Tabletas electrónicas',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

export const mockPayments: Payment[] = [
  {
    id: '1',
    saleId: '2',
    clientId: '2',
    clientName: 'ElectroMax',
    invoiceNumber: 'FC1-52',
    totalAmount: 3032,
    paidAmount: 1230,
    pendingAmount: 1802,
    lastPaymentAmount: 1230,
    lastPaymentDate: '2024-01-20T09:11:00Z',
    lastPaymentUser: 'Vendedor 1',
    status: 'partial',
    dueDate: '2024-02-15',
    createdAt: '2024-01-19T14:15:00Z',
    updatedAt: '2024-01-20T09:11:00Z'
  },
  {
    id: '2',
    saleId: '4',
    clientId: '4',
    clientName: 'Distribuidora Norte',
    invoiceNumber: 'FC1-51',
    totalAmount: 18872,
    paidAmount: 0,
    pendingAmount: 18872,
    status: 'pending',
    dueDate: '2024-02-20',
    createdAt: '2024-01-17T09:20:00Z',
    updatedAt: '2024-01-17T09:20:00Z'
  },
  {
    id: '3',
    saleId: '6',
    clientId: '6',
    clientName: 'TecnoShop Plus',
    invoiceNumber: 'FC1-50',
    totalAmount: 3744,
    paidAmount: 0,
    pendingAmount: 3744,
    status: 'pending',
    dueDate: '2024-02-10',
    createdAt: '2024-01-15T13:45:00Z',
    updatedAt: '2024-01-15T13:45:00Z'
  },
  {
    id: '4',
    saleId: '1',
    clientId: '1',
    clientName: 'TechStore Central',
    invoiceNumber: 'FC1-49',
    totalAmount: 9976,
    paidAmount: 0,
    pendingAmount: 9976,
    status: 'pending',
    dueDate: '2024-02-05',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '5',
    saleId: '3',
    clientId: '3',
    clientName: 'María González',
    invoiceNumber: 'FC1-48',
    totalAmount: 1392,
    paidAmount: 0,
    pendingAmount: 1392,
    status: 'pending',
    dueDate: '2024-01-30',
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '6',
    saleId: '5',
    clientId: '5',
    clientName: 'Carlos Rodríguez',
    invoiceNumber: 'FC1-47',
    totalAmount: 928,
    paidAmount: 200,
    pendingAmount: 728,
    lastPaymentAmount: 200,
    lastPaymentDate: '2024-01-15T17:34:00Z',
    lastPaymentUser: 'Vendedor 1',
    status: 'partial',
    dueDate: '2024-01-25',
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-15T17:34:00Z'
  }
]

export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: '1',
    paymentId: '1',
    amount: 1230,
    paymentDate: '2024-01-20T09:11:00Z',
    paymentMethod: 'cash',
    description: 'Abono inicial',
    userId: '1',
    userName: 'Vendedor 1',
    createdAt: '2024-01-20T09:11:00Z'
  },
  {
    id: '2',
    paymentId: '6',
    amount: 200,
    paymentDate: '2024-01-15T17:34:00Z',
    paymentMethod: 'transfer',
    description: 'Primer abono',
    userId: '1',
    userName: 'Vendedor 1',
    createdAt: '2024-01-15T17:34:00Z'
  }
]

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Administrador',
    description: 'Acceso completo a todos los módulos y funciones',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'products', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'cancel'] },
      { module: 'payments', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'logs', actions: ['view'] }
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Administrador',
    description: 'Gestión completa de productos, clientes y ventas',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'products', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'cancel'] },
      { module: 'payments', actions: ['view', 'create', 'edit'] },
      { module: 'logs', actions: ['view'] }
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Vendedor',
    description: 'Creación de facturas y gestión de abonos',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'clients', actions: ['view', 'create', 'edit'] },
      { module: 'sales', actions: ['view', 'create', 'edit'] },
      { module: 'payments', actions: ['view', 'create'] }
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '4',
    name: 'Inventario',
    description: 'Gestión de productos y stock',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'products', actions: ['view', 'create', 'edit'] },
      { module: 'logs', actions: ['view'] }
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '5',
    name: 'Contador',
    description: 'Gestión de pagos y reportes financieros',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'payments', actions: ['view', 'create', 'edit'] },
      { module: 'sales', actions: ['view'] },
      { module: 'logs', actions: ['view'] }
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Diego Admin',
    email: 'admin@zonat.com',
    password: 'admin123',
    role: 'superadmin',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'products', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'cancel'] },
      { module: 'payments', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'logs', actions: ['view'] }
    ],
    isActive: true,
    lastLogin: '2024-01-20T10:30:00Z',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'María Vendedora',
    email: 'maria@zonat.com',
    password: 'vendedor123',
    role: 'vendedor',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'clients', actions: ['view', 'create', 'edit'] },
      { module: 'sales', actions: ['view', 'create', 'edit'] },
      { module: 'payments', actions: ['view', 'create'] }
    ],
    isActive: true,
    lastLogin: '2024-01-19T14:15:00Z',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-19T14:15:00Z'
  },
  {
    id: '3',
    name: 'Carlos Inventario',
    email: 'carlos@zonat.com',
    password: 'inventario123',
    role: 'inventario',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'products', actions: ['view', 'create', 'edit'] },
      { module: 'logs', actions: ['view'] }
    ],
    isActive: true,
    lastLogin: '2024-01-18T09:20:00Z',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-18T09:20:00Z'
  },
  {
    id: '4',
    name: 'Ana Contadora',
    email: 'ana@zonat.com',
    password: 'contador123',
    role: 'contador',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'payments', actions: ['view', 'create', 'edit'] },
      { module: 'sales', actions: ['view'] },
      { module: 'logs', actions: ['view'] }
    ],
    isActive: true,
    lastLogin: '2024-01-17T16:45:00Z',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-17T16:45:00Z'
  }
]
