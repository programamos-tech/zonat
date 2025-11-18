'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminClient, AdminClientStats } from '@/types'
import { PartnerClientsService, CreateAdminClientInput } from '@/lib/partner-clients-service'
import { toast } from 'sonner'
import {
  Users,
  Layers,
  Briefcase,
  DollarSign,
  Search,
  Filter,
  Plus,
  MapPin,
  Mail,
  Phone,
  Building2,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react'

const initialFormState: CreateAdminClientInput = {
  businessName: '',
  ownerName: '',
  nit: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Colombia',
  industry: '',
  plan: 'starter'
}

const statusLabels: Record<string, { label: string; styles: string }> = {
  active: { label: 'Activo', styles: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' },
  trial: { label: 'Trial', styles: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  onboarding: { label: 'Onboarding', styles: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' },
  suspended: { label: 'Suspendido', styles: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)

export default function AdminClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [stats, setStats] = useState<AdminClientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | keyof typeof statusLabels>('all')
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)
  const [isCreating, setIsCreating] = useState(false)

  const loadClients = async () => {
    setRefreshing(true)
    try {
      const data = await PartnerClientsService.getAllClients()
      setClients(data.clients)
      setStats(data.stats)
    } catch (error) {
      toast.error('No pudimos cargar los clientes de Oviler.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' ? true : client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  const handleCreateClient = async () => {
    if (!formData.businessName || !formData.ownerName || !formData.email) {
      toast.warning('Por favor completa al menos el nombre del negocio, responsable y correo.')
      return
    }

    setIsCreating(true)
    try {
      const newClient = await PartnerClientsService.createClient(formData)
      setClients(prev => [newClient, ...prev])
      setStats(prev => (prev ? { ...prev, totalClients: prev.totalClients + 1 } : prev))
      toast.success('Cliente creado en mock. ¡Revisa los detalles!')
      setFormData(initialFormState)
      setIsCreateModalOpen(false)
    } catch (error) {
      toast.error('No pudimos crear el cliente. Intenta de nuevo.')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[var(--swatch--gray-950)]" style={{ fontFamily: 'var(--font-inter)' }}>
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando clientes Oviler...
        </div>
      </div>
    )
  }

  return (
      <>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-[var(--swatch--gray-950)] min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">Panel interno</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Clientes Oviler</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mt-2">
              Controla los negocios conectados a Oviler, monitorea su uso y prepara la facturación según usuarios y referencias activas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={loadClients}
              disabled={refreshing}
              className="rounded-xl border-gray-200 dark:border-[rgba(255,255,255,0.08)]"
              style={{ color: 'var(--sidebar-orange)' }}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-white rounded-xl px-4 py-2"
              style={{ backgroundColor: 'var(--sidebar-orange)' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeClients ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stats?.totalClients ?? 0} totales</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Layers className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Referencias</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalReferences ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Totales en la plataforma</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Trials</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.trialClients ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Clientes probando Oviler</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Potencial mensual</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalRevenuePotential ?? 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimado según uso</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
          <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por negocio, responsable, NIT, industria..."
                className="pl-9 rounded-xl border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1A1A1A]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              {(['all', 'active', 'trial', 'onboarding', 'suspended'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === filter
                      ? 'bg-[var(--sidebar-orange)] text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-[#1F1F1F] dark:text-gray-300'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : statusLabels[filter].label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl text-gray-900 dark:text-white">Negocios conectados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay registros para los filtros seleccionados.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1F1F1F] text-gray-500 dark:text-gray-300">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Negocio</th>
                    <th className="text-left font-semibold px-4 py-3">Responsable</th>
                    <th className="text-left font-semibold px-4 py-3">Plan</th>
                    <th className="text-left font-semibold px-4 py-3">Usuarios</th>
                    <th className="text-left font-semibold px-4 py-3">Referencias</th>
                    <th className="text-left font-semibold px-4 py-3">Estado</th>
                    <th className="text-left font-semibold px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{client.businessName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{client.nit}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white">{client.ownerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{client.email}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-900 dark:text-white">{client.billing.plan}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {client.usage.activeUsers}/{client.usage.totalUsers}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {client.usage.activeReferences}/{client.usage.totalReferences}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusLabels[client.status].styles}`}>
                          {statusLabels[client.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs rounded-lg border-gray-200 dark:border-gray-700"
                            onClick={() => setSelectedClient(client)}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs rounded-lg border-gray-200 dark:border-gray-700"
                            style={{ color: client.status === 'active' ? '#E11D48' : 'var(--sidebar-orange)' }}
                            onClick={async () => {
                              const nextStatus = client.status === 'active' ? 'suspended' : 'active'
                              await PartnerClientsService.updateStatus(client.id, nextStatus)
                              setClients(prev =>
                                prev.map(item => (item.id === client.id ? { ...item, status: nextStatus } : item))
                              )
                              toast.success(`Cliente marcado como ${nextStatus === 'active' ? 'activo' : 'suspendido'}`)
                            }}
                          >
                            {client.status === 'active' ? 'Suspender' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/30" onClick={() => setSelectedClient(null)}>
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Cliente</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClient.businessName}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">{selectedClient.billing.plan} plan</Badge>
                  <Badge className={statusLabels[selectedClient.status].styles}>{statusLabels[selectedClient.status].label}</Badge>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedClient(null)}>
                Cerrar
              </Button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50 dark:bg-[#1F1F1F] border-0">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Información Comercial</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-3 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.address}, {selectedClient.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.email}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-[#1F1F1F] border-0">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Uso y Métricas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Usuarios</p>
                      <p className="font-semibold">{selectedClient.usage.activeUsers}/{selectedClient.usage.totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Referencias activas</p>
                      <p className="font-semibold">{selectedClient.usage.activeReferences}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bodegas</p>
                      <p className="font-semibold">{selectedClient.usage.warehouses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Transacciones / mes</p>
                      <p className="font-semibold">{selectedClient.usage.monthlyTransactions}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-50 dark:bg-[#1F1F1F] border-0">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Facturación</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-900 dark:text-white">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Próxima factura</p>
                    <p className="font-semibold">{new Date(selectedClient.billing.nextInvoiceDate).toLocaleDateString('es-CO')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última factura</p>
                    <p className="font-semibold">{formatCurrency(selectedClient.billing.lastInvoiceAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      selectedClient.billing.lastInvoiceStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : selectedClient.billing.lastInvoiceStatus === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {selectedClient.billing.lastInvoiceStatus === 'paid' ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {selectedClient.billing.lastInvoiceStatus === 'paid' ? 'Pago al día' : selectedClient.billing.lastInvoiceStatus === 'pending' ? 'Pendiente' : 'Vencido'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Credenciales</p>
                <div className="bg-gray-900 text-white rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>URL</span>
                    <span className="font-semibold">{selectedClient.credentials.portalUrl}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Admin</span>
                    <span className="font-semibold">{selectedClient.credentials.adminEmail}</span>
                  </div>
                  {selectedClient.credentials.tempPassword && (
                    <div className="flex justify-between text-sm">
                      <span>Password temporal</span>
                      <span className="font-semibold">{selectedClient.credentials.tempPassword}</span>
                    </div>
                  )}
                  {selectedClient.credentials.lastLogin && (
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Último acceso</span>
                      <span>{new Date(selectedClient.credentials.lastLogin).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Nuevo negocio</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Crear cliente Oviler</h2>
              </div>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cerrar</Button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { label: 'Nombre del negocio', name: 'businessName' },
                { label: 'Nombre del responsable', name: 'ownerName' },
                { label: 'NIT', name: 'nit' },
                { label: 'Correo de contacto', name: 'email', type: 'email' },
                { label: 'Teléfono', name: 'phone' },
                { label: 'Dirección', name: 'address' },
                { label: 'Ciudad', name: 'city' },
                { label: 'Industria', name: 'industry' }
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                  <Input
                    type={field.type || 'text'}
                    value={(formData as any)[field.name]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="rounded-xl border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1A1A1A]"
                  />
                </div>
              ))}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="rounded-xl border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1A1A1A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value as CreateAdminClientInput['plan'] }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleCreateClient}
                disabled={isCreating}
                className="text-white rounded-xl"
                style={{ backgroundColor: 'var(--sidebar-orange)' }}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
  )
}

