import { supabase } from './supabase'
import { Client } from '@/types'
import { AuthService } from './auth-service'

export class ClientsService {
  // Obtener todos los clientes
  static async getAllClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
      // Error silencioso en producción
        return []
      }

      return data.map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        document: client.document,
        address: client.address,
        city: client.city,
        state: client.state,
        type: client.type,
        creditLimit: client.credit_limit || 0,
        currentDebt: client.current_debt || 0,
        status: client.status,
        createdAt: client.created_at
      }))
    } catch (error) {
      // Error silencioso en producción
      return []
    }
  }

  // Obtener cliente por ID
  static async getClientById(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
      // Error silencioso en producción
        return null
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        type: data.type,
        creditLimit: data.credit_limit || 0,
        currentDebt: data.current_debt || 0,
        status: data.status,
        createdAt: data.created_at
      }
    } catch (error) {
      // Error silencioso en producción
      return null
    }
  }

  // Crear nuevo cliente
  static async createClient(clientData: Omit<Client, 'id' | 'createdAt'>, currentUserId?: string): Promise<{ client: Client | null, error: string | null }> {
    try {
      // Manejar email vacío o 'N/A' - usar null para campos vacíos
      const emailValue = clientData.email && clientData.email.trim() !== '' && clientData.email.trim().toLowerCase() !== 'n/a' 
        ? clientData.email.trim() 
        : null

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          email: emailValue,
          phone: clientData.phone,
          document: clientData.document,
          address: clientData.address,
          city: clientData.city,
          state: clientData.state,
          type: clientData.type,
          credit_limit: clientData.creditLimit,
          current_debt: clientData.currentDebt,
          status: clientData.status
        })
        .select()
        .single()

      if (error) {
      // Error silencioso en producción
        // Manejar errores específicos
        if (error.code === '23505') {
          if (error.message.includes('clients_email_key')) {
            return { client: null, error: 'Ya existe un cliente con este email. Por favor, usa un email diferente o déjalo vacío.' }
          } else if (error.message.includes('clients_document_key')) {
            return { client: null, error: 'Ya existe un cliente con este documento. Por favor, verifica el número de cédula/NIT.' }
          }
        }
        
        return { client: null, error: 'Error al crear el cliente. Por favor, intenta nuevamente.' }
      }

      const newClient = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        type: data.type,
        creditLimit: data.credit_limit || 0,
        currentDebt: data.current_debt || 0,
        status: data.status,
        createdAt: data.created_at
      }

      // Registrar la actividad
      if (currentUserId) {
        await AuthService.logActivity(
          currentUserId,
          'client_create',
          'clients',
          {
            description: `Nuevo cliente creado: ${clientData.name}`,
            clientId: data.id,
            clientName: clientData.name,
            clientEmail: clientData.email || 'Sin email',
            clientPhone: clientData.phone || 'Sin teléfono',
            clientDocument: clientData.document,
            clientType: clientData.type
          }
        )
      }

      return { client: newClient, error: null }
    } catch (error) {
      // Error silencioso en producción
      return { client: null, error: 'Error inesperado al crear el cliente.' }
    }
  }

  // Actualizar cliente
  static async updateClient(id: string, updates: Partial<Client>, currentUserId?: string): Promise<boolean> {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.email !== undefined) {
        // Manejar email vacío o 'N/A' - usar null para campos vacíos
        const emailValue = updates.email && updates.email.trim() !== '' && updates.email.trim().toLowerCase() !== 'n/a' 
          ? updates.email.trim() 
          : null
        updateData.email = emailValue
      }
      if (updates.phone) updateData.phone = updates.phone
      if (updates.document) updateData.document = updates.document
      if (updates.address) updateData.address = updates.address
      if (updates.city) updateData.city = updates.city
      if (updates.state) updateData.state = updates.state
      if (updates.type) updateData.type = updates.type
      if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit
      if (updates.currentDebt !== undefined) updateData.current_debt = updates.currentDebt
      if (updates.status) updateData.status = updates.status

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        await AuthService.logActivity(
          currentUserId,
          'client_update',
          'clients',
          {
            description: `Cliente actualizado: ${updates.name || 'Cliente'}`,
            clientId: id,
            clientName: updates.name,
            updatedFields: Object.keys(updates),
            changes: updates
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Eliminar cliente
  static async deleteClient(id: string, currentUserId?: string): Promise<boolean> {
    try {
      // Obtener información del cliente antes de eliminarlo para el log
      const clientToDelete = await this.getClientById(id)
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId && clientToDelete) {
        await AuthService.logActivity(
          currentUserId,
          'client_delete',
          'clients',
          {
            description: `Cliente eliminado: ${clientToDelete.name}`,
            clientId: id,
            clientName: clientToDelete.name,
            clientEmail: clientToDelete.email || 'Sin email',
            clientDocument: clientToDelete.document
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Buscar clientes
  static async searchClients(query: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,document.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
      // Error silencioso en producción
        return []
      }

      return data.map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        document: client.document,
        address: client.address,
        city: client.city,
        state: client.state,
        type: client.type,
        creditLimit: client.credit_limit || 0,
        currentDebt: client.current_debt || 0,
        status: client.status,
        createdAt: client.created_at
      }))
    } catch (error) {
      // Error silencioso en producción
      return []
    }
  }
}

