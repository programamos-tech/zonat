import { AdminClient, AdminClientStats, AdminClientStatus } from '@/types'

const generateId = () => Math.random().toString(36).substring(2, 11)

const mockPartnerClients: AdminClient[] = [
  {
    id: generateId(),
    businessName: 'Farmacia Vida Plena',
    brandName: 'Vida Plena IPS',
    ownerName: 'María Fernanda P.',
    nit: '901234567-8',
    email: 'operaciones@vidaplena.com',
    phone: '+57 312 456 7890',
    address: 'Calle 38 #14-26',
    city: 'Sincelejo',
    department: 'Sucre',
    country: 'Colombia',
    industry: 'Farmacia',
    status: 'active',
    createdAt: '2024-02-12',
    goLiveDate: '2024-03-01',
    tags: ['farmacia', 'retail'],
    usage: {
      totalUsers: 14,
      activeUsers: 11,
      totalReferences: 1250,
      activeReferences: 980,
      warehouses: 2,
      monthlyTransactions: 860
    },
    billing: {
      plan: 'growth',
      baseFee: 980000,
      perUserFee: 35000,
      perReferenceFee: 150,
      nextInvoiceDate: '2024-12-01',
      lastInvoiceAmount: 1285000,
      lastInvoiceStatus: 'paid',
      currency: 'COP'
    },
    credentials: {
      portalUrl: 'https://vidaplena.oviler.app',
      adminEmail: 'admin@vidaplena.com',
      lastLogin: '2024-11-17T09:24:00Z'
    },
    contacts: [
      {
        name: 'María Fernanda Pinilla',
        role: 'Gerente General',
        email: 'm.pinilla@vidaplena.com',
        phone: '+57 312 456 7890',
        whatsapp: '+57 312 456 7890'
      },
      {
        name: 'Andrés Cortés',
        role: 'Director TI',
        email: 'andres.cortes@vidaplena.com',
        phone: '+57 301 987 6543'
      }
    ],
    notes: 'Cliente con soporte premium. Solicitar roadmap trimestral.'
  },
  {
    id: generateId(),
    businessName: 'TecnoRed SAS',
    brandName: 'TecnoRed Store',
    ownerName: 'Carlos Ríos',
    nit: '900567890-1',
    email: 'contacto@tecnored.com',
    phone: '+57 315 222 9988',
    address: 'Carrera 57 #102-11',
    city: 'Barranquilla',
    department: 'Atlántico',
    country: 'Colombia',
    industry: 'Tecnología',
    status: 'trial',
    createdAt: '2024-10-05',
    tags: ['tecnología', 'multi-sede'],
    usage: {
      totalUsers: 8,
      activeUsers: 6,
      totalReferences: 620,
      activeReferences: 540,
      warehouses: 3,
      monthlyTransactions: 410
    },
    billing: {
      plan: 'starter',
      baseFee: 650000,
      perUserFee: 25000,
      perReferenceFee: 120,
      nextInvoiceDate: '2024-11-30',
      lastInvoiceAmount: 0,
      lastInvoiceStatus: 'pending',
      currency: 'COP'
    },
    credentials: {
      portalUrl: 'https://tecnored.oviler.app',
      adminEmail: 'admin@tecnored.com',
      tempPassword: 'Oviler2024!'
    },
    contacts: [
      {
        name: 'Carlos Ríos',
        role: 'CEO',
        email: 'crios@tecnored.com',
        phone: '+57 315 222 9988'
      }
    ],
    notes: 'En onboarding. Requiere integración con ERP actual.'
  },
  {
    id: generateId(),
    businessName: 'Librería Horizonte',
    ownerName: 'Tatiana Guerrero',
    nit: '904568231-5',
    email: 'tatiana@horizonte.co',
    phone: '+57 300 345 6677',
    address: 'Calle 19 #4-12',
    city: 'Bogotá',
    department: 'Cundinamarca',
    country: 'Colombia',
    industry: 'Librería',
    status: 'suspended',
    createdAt: '2023-11-02',
    goLiveDate: '2024-01-10',
    usage: {
      totalUsers: 5,
      activeUsers: 0,
      totalReferences: 3100,
      activeReferences: 0,
      warehouses: 1,
      monthlyTransactions: 0
    },
    billing: {
      plan: 'growth',
      baseFee: 920000,
      perUserFee: 30000,
      perReferenceFee: 100,
      nextInvoiceDate: '2024-11-20',
      lastInvoiceAmount: 920000,
      lastInvoiceStatus: 'overdue',
      currency: 'COP'
    },
    credentials: {
      portalUrl: 'https://horizonte.oviler.app',
      adminEmail: 'admin@horizonte.co',
      lastLogin: '2024-08-15T14:10:00Z'
    },
    contacts: [
      {
        name: 'Tatiana Guerrero',
        role: 'Propietaria',
        email: 'tatiana@horizonte.co',
        phone: '+57 300 345 6677'
      }
    ],
    notes: 'Suspendido por falta de pago. Solicitar plan de recuperación.'
  }
]

const calculateStats = (clients: AdminClient[]): AdminClientStats => {
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'active').length
  const trialClients = clients.filter(c => c.status === 'trial').length
  const suspendedClients = clients.filter(c => c.status === 'suspended').length
  const totalUsers = clients.reduce((sum, client) => sum + client.usage.totalUsers, 0)
  const totalReferences = clients.reduce((sum, client) => sum + client.usage.totalReferences, 0)
  const totalRevenuePotential = clients.reduce((sum, client) => {
    const planAmount = client.billing.baseFee
    const usersExtra = Math.max(client.usage.totalUsers - 5, 0) * client.billing.perUserFee
    const referencesExtra = Math.max(client.usage.activeReferences - 500, 0) * client.billing.perReferenceFee
    return sum + planAmount + usersExtra + referencesExtra
  }, 0)

  return {
    totalClients,
    activeClients,
    trialClients,
    suspendedClients,
    totalUsers,
    totalReferences,
    totalRevenuePotential
  }
}

export interface CreateAdminClientInput {
  businessName: string
  ownerName: string
  nit: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  industry: string
  plan: 'starter' | 'growth' | 'enterprise'
}

export class PartnerClientsService {
  static async getAllClients(): Promise<{ clients: AdminClient[]; stats: AdminClientStats }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      clients: [...mockPartnerClients],
      stats: calculateStats(mockPartnerClients)
    }
  }

  static async getClientById(id: string): Promise<AdminClient | null> {
    await new Promise(resolve => setTimeout(resolve, 250))
    return mockPartnerClients.find(client => client.id === id) || null
  }

  static async createClient(payload: CreateAdminClientInput): Promise<AdminClient> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const newClient: AdminClient = {
      id: generateId(),
      businessName: payload.businessName,
      ownerName: payload.ownerName,
      nit: payload.nit,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      country: payload.country,
      industry: payload.industry,
      status: 'onboarding',
      createdAt: new Date().toISOString(),
      usage: {
        totalUsers: 0,
        activeUsers: 0,
        totalReferences: 0,
        activeReferences: 0,
        warehouses: 0,
        monthlyTransactions: 0
      },
      billing: {
        plan: payload.plan,
        baseFee: payload.plan === 'enterprise' ? 1500000 : payload.plan === 'growth' ? 980000 : 650000,
        perUserFee: payload.plan === 'enterprise' ? 45000 : payload.plan === 'growth' ? 35000 : 25000,
        perReferenceFee: payload.plan === 'enterprise' ? 200 : payload.plan === 'growth' ? 150 : 100,
        nextInvoiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        lastInvoiceAmount: 0,
        lastInvoiceStatus: 'pending',
        currency: 'COP'
      },
      credentials: {
        portalUrl: `https://${payload.businessName.toLowerCase().replace(/\s+/g, '')}.oviler.app`,
        adminEmail: payload.email,
        tempPassword: 'Oviler123!'
      },
      contacts: [
        {
          name: payload.ownerName,
          role: 'Propietario',
          email: payload.email,
          phone: payload.phone
        }
      ]
    }

    mockPartnerClients.unshift(newClient)
    return newClient
  }

  static async updateStatus(id: string, status: AdminClientStatus): Promise<AdminClient | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = mockPartnerClients.findIndex(client => client.id === id)
    if (index === -1) return null
    mockPartnerClients[index] = {
      ...mockPartnerClients[index],
      status
    }
    return mockPartnerClients[index]
  }
}

