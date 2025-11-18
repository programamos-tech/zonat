import { Supplier } from '@/types'

// Datos mock de proveedores
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora Farmacéutica del Norte',
    nit: '900123456-1',
    email: 'contacto@dfn.com.co',
    phone: '3001234567',
    address: 'Calle 50 #45-30',
    city: 'Barranquilla',
    state: 'Atlántico',
    contactPerson: 'Carlos Mendoza',
    contactPhone: '3001234568',
    paymentTerms: 'credit',
    creditDays: 30,
    rating: 4.5,
    status: 'active',
    notes: 'Proveedor principal de medicamentos',
    totalPurchased: 15000000,
    totalOrders: 45,
    averageDeliveryDays: 5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'Laboratorios Genéricos S.A.',
    nit: '800234567-2',
    email: 'ventas@labgenericos.com',
    phone: '3002345678',
    address: 'Carrera 30 #25-10',
    city: 'Bogotá',
    state: 'Cundinamarca',
    contactPerson: 'María González',
    contactPhone: '3002345679',
    paymentTerms: 'credit',
    creditDays: 45,
    rating: 4.8,
    status: 'active',
    notes: 'Especialistas en medicamentos genéricos',
    totalPurchased: 8500000,
    totalOrders: 28,
    averageDeliveryDays: 7,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-12-18T10:00:00Z'
  },
  {
    id: '3',
    name: 'Suministros Médicos del Caribe',
    nit: '900345678-3',
    email: 'info@sumedcaribe.com',
    phone: '3003456789',
    address: 'Avenida Circunvalar #100-50',
    city: 'Cartagena',
    state: 'Bolívar',
    contactPerson: 'Roberto Silva',
    contactPhone: '3003456790',
    paymentTerms: 'cash',
    rating: 4.2,
    status: 'active',
    notes: 'Materiales médicos y equipos',
    totalPurchased: 5200000,
    totalOrders: 15,
    averageDeliveryDays: 3,
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z'
  },
  {
    id: '4',
    name: 'Farmacia Mayorista Central',
    nit: '800456789-4',
    email: 'pedidos@farmayorista.com',
    phone: '3004567890',
    address: 'Calle 70 #50-20',
    city: 'Medellín',
    state: 'Antioquia',
    contactPerson: 'Ana Martínez',
    contactPhone: '3004567891',
    paymentTerms: 'credit',
    creditDays: 15,
    rating: 3.9,
    status: 'active',
    notes: 'Descuentos por volumen',
    totalPurchased: 3200000,
    totalOrders: 12,
    averageDeliveryDays: 6,
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z'
  },
  {
    id: '5',
    name: 'Droguería Express',
    nit: '900567890-5',
    email: 'ventas@drogueriaexpress.com',
    phone: '3005678901',
    address: 'Carrera 15 #10-05',
    city: 'Cali',
    state: 'Valle del Cauca',
    contactPerson: 'Luis Ramírez',
    contactPhone: '3005678902',
    paymentTerms: 'cash',
    rating: 4.0,
    status: 'inactive',
    notes: 'Proveedor temporal - en evaluación',
    totalPurchased: 1800000,
    totalOrders: 8,
    averageDeliveryDays: 4,
    createdAt: '2024-05-12T10:00:00Z',
    updatedAt: '2024-11-25T10:00:00Z'
  }
]

export class SuppliersService {
  // Obtener todos los proveedores
  static async getAllSuppliers(): Promise<Supplier[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...mockSuppliers]
  }

  // Obtener proveedor por ID
  static async getSupplierById(id: string): Promise<Supplier | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockSuppliers.find(s => s.id === id) || null
  }

  // Crear nuevo proveedor
  static async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ supplier: Supplier | null, error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newSupplier: Supplier = {
      ...supplierData,
      id: `supplier-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalPurchased: 0,
      totalOrders: 0,
      averageDeliveryDays: 0
    }
    
    mockSuppliers.push(newSupplier)
    return { supplier: newSupplier, error: null }
  }

  // Actualizar proveedor
  static async updateSupplier(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<{ supplier: Supplier | null, error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = mockSuppliers.findIndex(s => s.id === id)
    if (index === -1) {
      return { supplier: null, error: 'Proveedor no encontrado' }
    }
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...supplierData,
      updatedAt: new Date().toISOString()
    }
    
    return { supplier: mockSuppliers[index], error: null }
  }

  // Eliminar proveedor
  static async deleteSupplier(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = mockSuppliers.findIndex(s => s.id === id)
    if (index === -1) {
      return false
    }
    
    mockSuppliers.splice(index, 1)
    return true
  }
}

