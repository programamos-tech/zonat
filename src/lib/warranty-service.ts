import { supabase } from './supabase'
import { Warranty, WarrantyProduct, WarrantyStatusHistory } from '@/types'
import { AuthService } from './auth-service'

export class WarrantyService {
  // Obtener todas las garantías con paginación
  static async getAllWarranties(page: number = 1, limit: number = 20): Promise<{
    warranties: Warranty[]
    total: number
    hasMore: boolean
  }> {
    try {
      const offset = (page - 1) * limit

      // Obtener garantías con relaciones
      const { data: warranties, error: warrantiesError } = await supabase
        .from('warranties')
        .select(`
          *,
          original_sale:sales!original_sale_id (
            id,
            invoice_number,
            total,
            created_at
          ),
          client:clients!client_id (
            id,
            name,
            email,
            phone
          ),
          product_received:products!product_received_id (
            id,
            name,
            reference,
            price
          ),
          product_delivered:products!product_delivered_id (
            id,
            name,
            reference,
            price
          ),
          warranty_products (
            id,
            product_id,
            serial_number,
            condition,
            notes,
            created_at,
            product:products (
              id,
              name,
              reference
            )
          ),
          warranty_status_history (
            id,
            previous_status,
            new_status,
            notes,
            changed_at,
            changed_by_user:users (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (warrantiesError) {
        throw warrantiesError
      }

      // Obtener total de garantías
      const { count, error: countError } = await supabase
        .from('warranties')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw countError
      }

      // Mapear datos a la interfaz TypeScript
      const mappedWarranties: Warranty[] = warranties.map(warranty => ({
        id: warranty.id,
        originalSaleId: warranty.original_sale_id,
        clientId: warranty.client_id,
        clientName: warranty.client_name,
        productReceivedId: warranty.product_received_id,
        productReceivedName: warranty.product_received_name,
        productReceivedSerial: warranty.product_received_serial,
        productDeliveredId: warranty.product_delivered_id,
        productDeliveredName: warranty.product_delivered_name,
        reason: warranty.reason,
        status: warranty.status,
        notes: warranty.notes,
        createdAt: warranty.created_at,
        updatedAt: warranty.updated_at,
        completedAt: warranty.completed_at,
        createdBy: warranty.created_by,
        // Relaciones
        originalSale: warranty.original_sale ? {
          id: warranty.original_sale.id,
          invoiceNumber: warranty.original_sale.invoice_number,
          total: warranty.original_sale.total,
          createdAt: warranty.original_sale.created_at
        } as any : undefined,
        client: warranty.client,
        productReceived: warranty.product_received,
        productDelivered: warranty.product_delivered,
        warrantyProducts: warranty.warranty_products?.map(wp => ({
          id: wp.id,
          warrantyId: wp.warranty_id,
          productId: wp.product_id,
          serialNumber: wp.serial_number,
          condition: wp.condition,
          notes: wp.notes,
          createdAt: wp.created_at,
          updatedAt: wp.updated_at,
          product: wp.product
        })),
        statusHistory: warranty.warranty_status_history?.map(sh => ({
          id: sh.id,
          warrantyId: sh.warranty_id,
          previousStatus: sh.previous_status,
          newStatus: sh.new_status,
          notes: sh.notes,
          changedBy: sh.changed_by,
          changedAt: sh.changed_at,
          changedByUser: sh.changed_by_user
        }))
      }))

      return {
        warranties: mappedWarranties,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Obtener garantía por ID
  static async getWarrantyById(id: string): Promise<Warranty | null> {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select(`
          *,
          original_sale:sales!original_sale_id (
            id,
            invoice_number,
            total,
            created_at
          ),
          client:clients!client_id (
            id,
            name,
            email,
            phone
          ),
          product_received:products!product_received_id (
            id,
            name,
            reference,
            price
          ),
          product_delivered:products!product_delivered_id (
            id,
            name,
            reference,
            price
          ),
          warranty_products (
            id,
            product_id,
            serial_number,
            condition,
            notes,
            created_at,
            product:products (
              id,
              name,
              reference
            )
          ),
          warranty_status_history (
            id,
            previous_status,
            new_status,
            notes,
            changed_at,
            changed_by_user:users (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      if (!data) return null

      // Mapear datos (similar al método anterior)
      return {
        id: data.id,
        originalSaleId: data.original_sale_id,
        clientId: data.client_id,
        clientName: data.client_name,
        productReceivedId: data.product_received_id,
        productReceivedName: data.product_received_name,
        productReceivedSerial: data.product_received_serial,
        productDeliveredId: data.product_delivered_id,
        productDeliveredName: data.product_delivered_name,
        reason: data.reason,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        createdBy: data.created_by,
        originalSale: data.original_sale,
        client: data.client,
        productReceived: data.product_received,
        productDelivered: data.product_delivered,
        warrantyProducts: data.warranty_products,
        statusHistory: data.warranty_status_history
      }
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Crear nueva garantía
  static async createWarranty(warrantyData: Omit<Warranty, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warranty> {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .insert([{
          original_sale_id: warrantyData.originalSaleId,
          client_id: warrantyData.clientId,
          client_name: warrantyData.clientName,
          product_received_id: warrantyData.productReceivedId,
          product_received_name: warrantyData.productReceivedName,
          product_received_serial: warrantyData.productReceivedSerial,
          product_delivered_id: warrantyData.productDeliveredId,
          product_delivered_name: warrantyData.productDeliveredName,
          reason: warrantyData.reason,
          status: warrantyData.status,
          notes: warrantyData.notes,
          created_by: warrantyData.createdBy
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Crear entrada en el historial de estados
      await this.addStatusHistory(data.id, null, warrantyData.status, 'Garantía creada', warrantyData.createdBy)

      // Log de actividad
      if (warrantyData.createdBy) {
        await AuthService.logActivity(
          warrantyData.createdBy,
          'warranty_create',
          'warranties',
          {
            description: `Nueva garantía creada: ${warrantyData.clientName} - Producto: ${warrantyData.productReceivedName}`,
            warrantyId: data.id,
            clientName: warrantyData.clientName,
            productReceivedName: warrantyData.productReceivedName,
            productDeliveredName: warrantyData.productDeliveredName || 'Sin producto de reemplazo',
            status: warrantyData.status,
            reason: warrantyData.reason
          }
        )
      }

      // Crear entrada en warranty_products para el producto defectuoso
      await supabase
        .from('warranty_products')
        .insert([{
          warranty_id: data.id,
          product_id: warrantyData.productReceivedId,
          serial_number: warrantyData.productReceivedSerial,
          condition: 'defective',
          notes: warrantyData.reason
        }])

      // Si la garantía está completada y tiene producto de reemplazo, descontar del inventario
      if (warrantyData.status === 'completed' && warrantyData.productDeliveredId) {
        try {
          // Importar el servicio de productos dinámicamente para evitar dependencias circulares
          const { ProductsService } = await import('./products-service')
          
          // Obtener el producto actual para verificar el stock
          const product = await ProductsService.getProductById(warrantyData.productDeliveredId)
          if (product) {
            const currentStock = (product.stock?.local || 0) + (product.stock?.warehouse || 0)
            const quantityToDeduct = warrantyData.replacementQuantity || 1
            
            if (currentStock >= quantityToDeduct) {
              // Descontar del stock local primero, luego del warehouse
              let localDeduction = Math.min(quantityToDeduct, product.stock?.local || 0)
              let warehouseDeduction = quantityToDeduct - localDeduction
              
              await ProductsService.updateProductStock(warrantyData.productDeliveredId, {
                local: (product.stock?.local || 0) - localDeduction,
                warehouse: (product.stock?.warehouse || 0) - warehouseDeduction
              })
            } else {

            }
          }
        } catch (stockError) {
      // Error silencioso en producción
          // No lanzar el error para no interrumpir la creación de la garantía
        }
      }

      return this.getWarrantyById(data.id) as Promise<Warranty>
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Actualizar estado de garantía
  static async updateWarrantyStatus(
    warrantyId: string, 
    newStatus: string, 
    notes?: string, 
    userId?: string
  ): Promise<void> {
    try {
      // Obtener estado actual
      const { data: currentWarranty, error: fetchError } = await supabase
        .from('warranties')
        .select('status')
        .eq('id', warrantyId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const previousStatus = currentWarranty.status

      // Actualizar estado
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Si se completa, agregar fecha de completado
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('warranties')
        .update(updateData)
        .eq('id', warrantyId)

      if (updateError) {
        throw updateError
      }

      // Agregar al historial
      await this.addStatusHistory(warrantyId, previousStatus, newStatus, notes, userId)

      // Log de actividad
      if (userId) {
        await AuthService.logActivity(
          userId,
          'warranty_status_update',
          'warranties',
          {
            description: `Estado de garantía actualizado: ${previousStatus} → ${newStatus}`,
            warrantyId: warrantyId,
            previousStatus: previousStatus,
            newStatus: newStatus,
            notes: notes || 'Sin notas adicionales'
          }
        )
      }
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Agregar entrada al historial de estados
  static async addStatusHistory(
    warrantyId: string,
    previousStatus: string | null,
    newStatus: string,
    notes?: string,
    userId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('warranty_status_history')
        .insert([{
          warranty_id: warrantyId,
          previous_status: previousStatus,
          new_status: newStatus,
          notes: notes,
          changed_by: userId
        }])

      if (error) {
        throw error
      }
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Buscar garantías
  static async searchWarranties(searchTerm: string): Promise<Warranty[]> {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select(`
          *,
          original_sale:sales!original_sale_id (
            id,
            invoice_number,
            total,
            created_at
          ),
          client:clients!client_id (
            id,
            name,
            email,
            phone
          ),
          product_received:products!product_received_id (
            id,
            name,
            reference,
            price
          )
        `)
        .or(`client_name.ilike.%${searchTerm}%,product_received_name.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      // Mapear datos (similar a getAllWarranties)
      return data.map(warranty => ({
        id: warranty.id,
        originalSaleId: warranty.original_sale_id,
        clientId: warranty.client_id,
        clientName: warranty.client_name,
        productReceivedId: warranty.product_received_id,
        productReceivedName: warranty.product_received_name,
        productReceivedSerial: warranty.product_received_serial,
        productDeliveredId: warranty.product_delivered_id,
        productDeliveredName: warranty.product_delivered_name,
        reason: warranty.reason,
        status: warranty.status,
        notes: warranty.notes,
        createdAt: warranty.created_at,
        updatedAt: warranty.updated_at,
        completedAt: warranty.completed_at,
        createdBy: warranty.created_by,
        originalSale: warranty.original_sale,
        client: warranty.client,
        productReceived: warranty.product_received
      }))
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }

  // Obtener estadísticas de garantías
  static async getWarrantyStats(): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    rejected: number
    discarded: number
  }> {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select('status')

      if (error) {
        throw error
      }

      const stats = {
        total: data.length,
        pending: data.filter(w => w.status === 'pending').length,
        inProgress: data.filter(w => w.status === 'in_progress').length,
        completed: data.filter(w => w.status === 'completed').length,
        rejected: data.filter(w => w.status === 'rejected').length,
        discarded: data.filter(w => w.status === 'discarded').length
      }

      return stats
    } catch (error) {
      // Error silencioso en producción
      throw error
    }
  }
}
