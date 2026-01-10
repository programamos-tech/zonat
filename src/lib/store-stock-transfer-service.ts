import { supabase, supabaseAdmin } from './supabase'
import { StoreStockTransfer, StoreStock, TransferItem } from '@/types'

export class StoreStockTransferService {
  // Crear transferencia con múltiples productos
  static async createTransfer(
    fromStoreId: string,
    toStoreId: string,
    items: Array<{ productId: string; productName: string; productReference?: string; quantity: number; fromLocation: 'warehouse' | 'store' }>,
    description?: string,
    notes?: string,
    createdBy?: string,
    createdByName?: string
  ): Promise<StoreStockTransfer | null> {
    try {
      // Validar que hay items
      if (!items || items.length === 0) {
        console.error('Transfer must have at least one item')
        return null
      }

      const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
      const isFromMainStore = fromStoreId === MAIN_STORE_ID || !fromStoreId

      // Verificar stock disponible para todos los productos
      for (const item of items) {
        if (isFromMainStore) {
          // Para la tienda principal, verificar stock en products
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock_warehouse, stock_store')
            .eq('id', item.productId)
            .single()
          
          if (!product) {
            console.error(`Product not found: ${item.productId}`)
            return null
          }

          const availableStock = item.fromLocation === 'warehouse' 
            ? (product.stock_warehouse || 0)
            : (product.stock_store || 0)

          if (availableStock < item.quantity) {
            console.error(`Insufficient stock for product ${item.productName}. Available: ${availableStock}, Requested: ${item.quantity}`)
            return null
          }
        } else {
          // Para micro tiendas, verificar stock en store_stock
          const stock = await this.getStoreStock(fromStoreId, item.productId)
          if (!stock || stock.quantity < item.quantity) {
            console.error(`Insufficient stock for product ${item.productName}`)
            return null
          }
        }
      }

      // Crear la transferencia principal
      const { data: transfer, error: transferError } = await supabaseAdmin
        .from('stock_transfers')
        .insert({
          from_store_id: fromStoreId,
          to_store_id: toStoreId,
          status: 'pending',
          description: description || null,
          notes: notes || null,
          created_by: createdBy || null,
          created_by_name: createdByName || null,
          // Campos legacy para compatibilidad (deprecated)
          product_id: items[0].productId,
          product_name: items[0].productName || 'Producto',
          quantity: items.reduce((sum, item) => sum + item.quantity, 0)
        })
        .select()
        .maybeSingle()

      if (transferError) {
        console.error('Error creating transfer:', transferError)
        return null
      }

      if (!transfer) {
        console.error('Transfer was not created')
        return null
      }

      // Crear los items de la transferencia con from_location
      const transferItems = items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.productId,
        product_name: item.productName,
        product_reference: item.productReference || null,
        quantity: item.quantity,
        from_location: item.fromLocation
      }))

      const { error: itemsError } = await supabaseAdmin
        .from('transfer_items')
        .insert(transferItems)

      if (itemsError) {
        console.error('Error creating transfer items:', itemsError)
        // Eliminar la transferencia si falla la creación de items
        await supabaseAdmin.from('stock_transfers').delete().eq('id', transfer.id)
        return null
      }

      // Reducir stock de la tienda origen según el tipo de tienda
      for (const item of items) {
        if (isFromMainStore) {
          // Para la tienda principal, descontar de products.stock_warehouse o products.stock_store
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock_warehouse, stock_store')
            .eq('id', item.productId)
            .single()

          if (product) {
            const field = item.fromLocation === 'warehouse' ? 'stock_warehouse' : 'stock_store'
            const currentStock = item.fromLocation === 'warehouse' 
              ? (product.stock_warehouse || 0)
              : (product.stock_store || 0)
            const newStock = currentStock - item.quantity

            if (newStock < 0) {
              console.error(`Insufficient stock for product ${item.productName}`)
              // Revertir la transferencia
              await supabaseAdmin.from('stock_transfers').delete().eq('id', transfer.id)
              return null
            }

            const { error: updateError } = await supabaseAdmin
              .from('products')
              .update({ [field]: newStock })
              .eq('id', item.productId)

            if (updateError) {
              console.error('Error updating product stock:', updateError)
              await supabaseAdmin.from('stock_transfers').delete().eq('id', transfer.id)
              return null
            }
          }
        } else {
          // Para micro tiendas, descontar de store_stock
          await this.updateStoreStock(fromStoreId, item.productId, -item.quantity)
        }
      }

      // Obtener la transferencia completa con items
      return await this.getTransferById(transfer.id)
    } catch (error) {
      console.error('Error in createTransfer:', error)
      return null
    }
  }

  // Obtener transferencia por ID con sus items
  static async getTransferById(transferId: string): Promise<StoreStockTransfer | null> {
    try {
      // Primero obtener la transferencia sin las relaciones para evitar errores
      const { data: transfer, error: transferError } = await supabaseAdmin
        .from('stock_transfers')
        .select('*')
        .eq('id', transferId)
        .single()

      if (transferError) {
        // Si es el error PGRST116, intentar sin .single()
        if (transferError.code === 'PGRST116') {
          const { data: transfers, error: multiError } = await supabaseAdmin
            .from('stock_transfers')
            .select('*')
            .eq('id', transferId)
            .limit(1)
          
          if (multiError || !transfers || transfers.length === 0) {
            console.error('Error fetching transfer:', multiError || transferError)
            return null
          }
          
          // Obtener nombres de las tiendas por separado
          const fromStoreId = transfers[0].from_store_id
          const toStoreId = transfers[0].to_store_id
          
          const [fromStoreResult, toStoreResult] = await Promise.all([
            supabaseAdmin.from('stores').select('id, name').eq('id', fromStoreId).single(),
            supabaseAdmin.from('stores').select('id, name').eq('id', toStoreId).single()
          ])
          
          const transferWithStores = {
            ...transfers[0],
            from_store: fromStoreResult.data || { id: fromStoreId, name: null },
            to_store: toStoreResult.data || { id: toStoreId, name: null }
          }
          
          // Obtener items
          const { data: items } = await supabaseAdmin
            .from('transfer_items')
            .select('*')
            .eq('transfer_id', transferId)
            .order('created_at', { ascending: true })
          
          return this.mapTransfer(transferWithStores, items || [])
        }
        
        console.error('Error fetching transfer:', transferError)
        return null
      }

      if (!transfer) {
        return null
      }

      // Obtener nombres de las tiendas por separado si no están en la relación
      let fromStore = null
      let toStore = null
      
      if (transfer.from_store_id) {
        const { data: fromStoreData } = await supabaseAdmin
          .from('stores')
          .select('id, name')
          .eq('id', transfer.from_store_id)
          .single()
        fromStore = fromStoreData
      }
      
      if (transfer.to_store_id) {
        const { data: toStoreData } = await supabaseAdmin
          .from('stores')
          .select('id, name')
          .eq('id', transfer.to_store_id)
          .single()
        toStore = toStoreData
      }

      const transferWithStores = {
        ...transfer,
        from_store: fromStore || { id: transfer.from_store_id, name: null },
        to_store: toStore || { id: transfer.to_store_id, name: null }
      }

      // Obtener items de la transferencia
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('transfer_items')
        .select('*')
        .eq('transfer_id', transferId)
        .order('created_at', { ascending: true })

      if (itemsError) {
        console.error('Error fetching transfer items:', itemsError)
      }

      return this.mapTransfer(transferWithStores, items || [])
    } catch (error) {
      console.error('Error in getTransferById:', error)
      return null
    }
  }

  // Obtener transferencias pendientes de recepción para una tienda
  static async getPendingTransfers(storeId: string): Promise<StoreStockTransfer[]> {
    try {
      const { data: transfers, error } = await supabaseAdmin
        .from('stock_transfers')
        .select('*')
        .eq('to_store_id', storeId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending transfers:', error)
        return []
      }

      if (!transfers || transfers.length === 0) {
        return []
      }

      // Obtener nombres de tiendas y items para cada transferencia
      const transfersWithItems = await Promise.all(
        transfers.map(async (transfer: any) => {
          // Obtener nombres de las tiendas por separado
          const [fromStoreResult, toStoreResult] = await Promise.all([
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.from_store_id).single(),
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.to_store_id).single()
          ])

          const transferWithStores = {
            ...transfer,
            from_store: fromStoreResult.data || { id: transfer.from_store_id, name: null },
            to_store: toStoreResult.data || { id: transfer.to_store_id, name: null }
          }

          // Obtener items de la transferencia
          const { data: items } = await supabaseAdmin
            .from('transfer_items')
            .select('*')
            .eq('transfer_id', transfer.id)
            .order('created_at', { ascending: true })

          return this.mapTransfer(transferWithStores, items || [])
        })
      )

      return transfersWithItems
    } catch (error) {
      console.error('Error in getPendingTransfers:', error)
      return []
    }
  }

  // Obtener transferencias recibidas (completadas) para una tienda
  static async getReceivedTransfers(storeId: string): Promise<StoreStockTransfer[]> {
    try {
      const { data: transfers, error } = await supabaseAdmin
        .from('stock_transfers')
        .select('*')
        .eq('to_store_id', storeId)
        .eq('status', 'received')
        .order('received_at', { ascending: false })

      if (error) {
        console.error('Error fetching received transfers:', error)
        return []
      }

      if (!transfers || transfers.length === 0) {
        return []
      }

      // Obtener nombres de tiendas y items para cada transferencia
      const transfersWithItems = await Promise.all(
        transfers.map(async (transfer: any) => {
          // Obtener nombres de las tiendas por separado
          const [fromStoreResult, toStoreResult] = await Promise.all([
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.from_store_id).single(),
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.to_store_id).single()
          ])

          const transferWithStores = {
            ...transfer,
            from_store: fromStoreResult.data || { id: transfer.from_store_id, name: null },
            to_store: toStoreResult.data || { id: transfer.to_store_id, name: null }
          }

          // Obtener items de la transferencia
          const { data: items } = await supabaseAdmin
            .from('transfer_items')
            .select('*')
            .eq('transfer_id', transfer.id)
            .order('created_at', { ascending: true })

          return this.mapTransfer(transferWithStores, items || [])
        })
      )

      return transfersWithItems
    } catch (error) {
      console.error('Error in getReceivedTransfers:', error)
      return []
    }
  }

  // Obtener todas las transferencias de una tienda (enviadas y recibidas)
  static async getStoreTransfers(storeId: string, direction: 'sent' | 'received' | 'all' = 'all'): Promise<StoreStockTransfer[]> {
    try {
      // Obtener transferencias sin relaciones para evitar errores
      let query = supabaseAdmin
        .from('stock_transfers')
        .select('*')
        .order('created_at', { ascending: false })

      if (direction === 'sent') {
        query = query.eq('from_store_id', storeId)
      } else if (direction === 'received') {
        query = query.eq('to_store_id', storeId)
      } else {
        query = query.or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
      }

      const { data: transfers, error } = await query

      if (error) {
        console.error('Error fetching transfers:', error)
        return []
      }

      if (!transfers || transfers.length === 0) {
        return []
      }

      // Obtener nombres de tiendas y items para cada transferencia
      const transfersWithItems = await Promise.all(
        transfers.map(async (transfer: any) => {
          // Obtener nombres de las tiendas por separado
          const [fromStoreResult, toStoreResult] = await Promise.all([
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.from_store_id).single(),
            supabaseAdmin.from('stores').select('id, name').eq('id', transfer.to_store_id).single()
          ])

          const transferWithStores = {
            ...transfer,
            from_store: fromStoreResult.data || { id: transfer.from_store_id, name: null },
            to_store: toStoreResult.data || { id: transfer.to_store_id, name: null }
          }

          // Obtener items de la transferencia
          const { data: items } = await supabaseAdmin
            .from('transfer_items')
            .select('*')
            .eq('transfer_id', transfer.id)
            .order('created_at', { ascending: true })

          return this.mapTransfer(transferWithStores, items || [])
        })
      )

      return transfersWithItems
    } catch (error) {
      console.error('Error in getStoreTransfers:', error)
      return []
    }
  }

  // Recibir transferencia (marcar como recibida)
  static async receiveTransfer(
    transferId: string,
    receivedBy?: string,
    receivedByName?: string,
    receivedItems?: Array<{ itemId: string; quantityReceived: number; note?: string }>
  ): Promise<boolean> {
    try {
      // Obtener la transferencia con sus items
      const transfer = await this.getTransferById(transferId)
      if (!transfer || transfer.status !== 'pending') {
        console.error('Transfer not found or already processed')
        return false
      }

      // Si se proporcionan items específicos, usar esos; si no, recibir todo
      const itemsToReceive = receivedItems && receivedItems.length > 0
        ? receivedItems
        : (transfer.items || []).map(item => ({
            itemId: item.id,
            quantityReceived: item.quantity,
            note: undefined
          }))

      // Validar que las cantidades recibidas no excedan las esperadas y no sean negativas
      if (transfer.items && transfer.items.length > 0) {
        for (const receivedItem of itemsToReceive) {
          const originalItem = transfer.items.find(item => item.id === receivedItem.itemId)
          if (!originalItem) {
            console.error(`Item ${receivedItem.itemId} not found in transfer`)
            return false
          }
          if (receivedItem.quantityReceived > originalItem.quantity) {
            console.error(`Received quantity (${receivedItem.quantityReceived}) exceeds expected (${originalItem.quantity}) for item ${originalItem.productName}`)
            return false
          }
          if (receivedItem.quantityReceived < 0) {
            console.error(`Received quantity cannot be negative for item ${originalItem.productName}`)
            return false
          }
          // Permitir 0 para recepciones parciales (sin stock recibido)
        }
      }

      // Actualizar estado de la transferencia
      const { error: updateError } = await supabaseAdmin
        .from('stock_transfers')
        .update({
          status: 'received',
          received_by: receivedBy || null,
          received_by_name: receivedByName || null,
          received_at: new Date().toISOString()
        })
        .eq('id', transferId)

      if (updateError) {
        console.error('Error updating transfer:', updateError)
        return false
      }

      // Actualizar transfer_items con cantidades recibidas y notas
      if (transfer.items && transfer.items.length > 0) {
        for (const receivedItem of itemsToReceive) {
          const originalItem = transfer.items.find(item => item.id === receivedItem.itemId)
          if (originalItem) {
            // Actualizar el item con la cantidad recibida y nota (NO modificar quantity original)
            await supabaseAdmin
              .from('transfer_items')
              .update({
                quantity_received: receivedItem.quantityReceived,
                notes: receivedItem.note || null
              })
              .eq('id', receivedItem.itemId)

            // Aumentar stock en la tienda destino solo con la cantidad recibida (si es mayor a 0)
            // Permitir 0 para recepciones parciales sin stock
            if (receivedItem.quantityReceived > 0) {
              await this.updateStoreStock(transfer.toStoreId, originalItem.productId, receivedItem.quantityReceived)
            }
          }
        }
      } else {
        // Compatibilidad con transferencias legacy (un solo producto)
        if (transfer.productId && transfer.quantity) {
          const quantityToReceive = itemsToReceive.length > 0 
            ? itemsToReceive[0].quantityReceived 
            : transfer.quantity
          await this.updateStoreStock(transfer.toStoreId, transfer.productId, quantityToReceive)
        }
      }

      return true
    } catch (error) {
      console.error('Error in receiveTransfer:', error)
      return false
    }
  }

  // Cancelar transferencia
  static async cancelTransfer(transferId: string): Promise<boolean> {
    try {
      // Obtener la transferencia con sus items
      const transfer = await this.getTransferById(transferId)
      if (!transfer || transfer.status !== 'pending') {
        console.error('Cannot cancel non-pending transfer')
        return false
      }

      // Actualizar estado
      const { error: updateError } = await supabaseAdmin
        .from('stock_transfers')
        .update({
          status: 'cancelled'
        })
        .eq('id', transferId)

      if (updateError) {
        console.error('Error cancelling transfer:', updateError)
        return false
      }

      const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
      const isFromMainStore = transfer.fromStoreId === MAIN_STORE_ID || !transfer.fromStoreId

      // Devolver stock a la tienda origen para cada producto
      if (transfer.items && transfer.items.length > 0) {
        for (const item of transfer.items) {
          if (isFromMainStore && item.fromLocation) {
            // Para la tienda principal, devolver a products.stock_warehouse o products.stock_store
            const { data: product } = await supabaseAdmin
              .from('products')
              .select('stock_warehouse, stock_store')
              .eq('id', item.productId)
              .single()

            if (product) {
              const field = item.fromLocation === 'warehouse' ? 'stock_warehouse' : 'stock_store'
              const currentStock = item.fromLocation === 'warehouse' 
                ? (product.stock_warehouse || 0)
                : (product.stock_store || 0)
              const newStock = currentStock + item.quantity

              const { error: updateStockError } = await supabaseAdmin
                .from('products')
                .update({ [field]: newStock })
                .eq('id', item.productId)

              if (updateStockError) {
                console.error('Error returning stock to product:', updateStockError)
              }
            }
          } else {
            // Para micro tiendas, devolver a store_stock
            await this.updateStoreStock(transfer.fromStoreId, item.productId, item.quantity)
          }
        }
      } else {
        // Compatibilidad con transferencias legacy
        if (transfer.productId && transfer.quantity) {
          if (isFromMainStore) {
            // Asumir warehouse por defecto para legacy
            const { data: product } = await supabaseAdmin
              .from('products')
              .select('stock_warehouse')
              .eq('id', transfer.productId)
              .single()

            if (product) {
              const newStock = (product.stock_warehouse || 0) + transfer.quantity
              await supabaseAdmin
                .from('products')
                .update({ stock_warehouse: newStock })
                .eq('id', transfer.productId)
            }
          } else {
            await this.updateStoreStock(transfer.fromStoreId, transfer.productId, transfer.quantity)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error in cancelTransfer:', error)
      return false
    }
  }

  // Obtener stock de un producto en una tienda
  static async getStoreStock(storeId: string, productId: string): Promise<StoreStock | null> {
    try {
      const { data, error } = await supabase
        .from('store_stock')
        .select(`
          *,
          store:stores(id, name),
          product:products(id, name, reference)
        `)
        .eq('store_id', storeId)
        .eq('product_id', productId)
        .single()

      if (error) {
        // Si no existe, retornar stock 0
        if (error.code === 'PGRST116') {
          return {
            id: '',
            storeId: storeId,
            productId: productId,
            quantity: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        console.error('Error fetching store stock:', error)
        return null
      }

      return this.mapStoreStock(data)
    } catch (error) {
      console.error('Error in getStoreStock:', error)
      return null
    }
  }

  // Obtener todo el stock de una tienda
  static async getStoreStocks(storeId: string): Promise<StoreStock[]> {
    try {
      const { data, error } = await supabase
        .from('store_stock')
        .select(`
          *,
          product:products(id, name, reference, price, cost)
        `)
        .eq('store_id', storeId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching store stocks:', error)
        return []
      }

      return data.map((stock: any) => this.mapStoreStock(stock))
    } catch (error) {
      console.error('Error in getStoreStocks:', error)
      return []
    }
  }

  // Actualizar stock de una tienda
  static async updateStoreStock(
    storeId: string,
    productId: string,
    quantityChange: number
  ): Promise<boolean> {
    try {
      // Obtener stock actual
      const currentStock = await this.getStoreStock(storeId, productId)
      const newQuantity = (currentStock?.quantity || 0) + quantityChange

      if (newQuantity < 0) {
        console.error('Insufficient stock')
        return false
      }

      // Upsert stock
      const { error } = await supabaseAdmin
        .from('store_stock')
        .upsert({
          store_id: storeId,
          product_id: productId,
          quantity: newQuantity
        }, {
          onConflict: 'store_id,product_id'
        })

      if (error) {
        console.error('Error updating store stock:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateStoreStock:', error)
      return false
    }
  }

  // Mapear datos de transferencia
  private static mapTransfer(data: any, items: any[] = []): StoreStockTransfer {
    const transferItems: TransferItem[] = items.map((item: any) => ({
      id: item.id,
      transferId: item.transfer_id,
      productId: item.product_id,
      productName: item.product_name,
      productReference: item.product_reference || undefined,
      quantity: item.quantity, // Cantidad original/enviada
      quantityReceived: item.quantity_received || undefined, // Cantidad recibida (si aplica)
      fromLocation: item.from_location || undefined,
      notes: item.notes || undefined, // Nota del item
      createdAt: item.created_at,
      updatedAt: item.updated_at || item.created_at
    }))

    return {
      id: data.id,
      transferNumber: data.transfer_number || undefined,
      fromStoreId: data.from_store_id,
      fromStoreName: data.from_store?.name || undefined,
      toStoreId: data.to_store_id,
      toStoreName: data.to_store?.name || undefined,
      status: data.status,
      description: data.description || undefined,
      notes: data.notes || undefined,
      createdBy: data.created_by || undefined,
      createdByName: data.created_by_name || undefined,
      receivedBy: data.received_by || undefined,
      receivedByName: data.received_by_name || undefined,
      receivedAt: data.received_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: transferItems.length > 0 ? transferItems : undefined,
      // Campos legacy para compatibilidad
      productId: data.product_id || (transferItems.length > 0 ? transferItems[0].productId : undefined),
      productName: data.product_name || (transferItems.length > 0 ? transferItems[0].productName : undefined),
      quantity: data.quantity || (transferItems.length > 0 ? transferItems.reduce((sum, item) => sum + item.quantity, 0) : undefined)
    }
  }

  // Mapear datos de stock
  private static mapStoreStock(data: any): StoreStock {
    return {
      id: data.id,
      storeId: data.store_id,
      storeName: data.store?.name || undefined,
      productId: data.product_id,
      productName: data.product?.name || undefined,
      quantity: data.quantity || 0,
      location: data.location || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
