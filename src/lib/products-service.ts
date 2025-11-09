import { supabase } from './supabase'
import { Product } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from './auth-service'

export class ProductsService {
  // Obtener todos los productos con paginación
  static async getAllProducts(page: number = 1, limit: number = 10): Promise<{ products: Product[], total: number, hasMore: boolean }> {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      // Obtener productos paginados
      // Ordenar por created_at (más recientes primero)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
      // Error silencioso en producción
        return { products: [], total: 0, hasMore: false }
      }

      // Obtener el total de productos
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (countError) {
      // Error silencioso en producción
        return { products: [], total: 0, hasMore: false }
      }

      const mappedProducts = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.category_id,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        cost: product.cost,
        stock: {
          warehouse: product.stock_warehouse || 0,
          store: product.stock_store || 0,
          total: (product.stock_warehouse || 0) + (product.stock_store || 0)
        },
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }))

      // Ordenar en el cliente: productos con stock primero, luego por fecha más reciente
      const products = mappedProducts.sort((a, b) => {
        const aHasStock = a.stock.total > 0
        const bHasStock = b.stock.total > 0
        
        // Si uno tiene stock y el otro no, el que tiene stock va primero
        if (aHasStock && !bHasStock) return -1
        if (!aHasStock && bHasStock) return 1
        
        // Si ambos tienen stock o ambos no tienen stock, ordenar por fecha más reciente
        const aDate = a.updatedAt || a.createdAt
        const bDate = b.updatedAt || b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })

      return {
        products,
        total: count || 0,
        hasMore: to < (count || 0) - 1
      }
    } catch (error) {
      // Error silencioso en producción
      return { products: [], total: 0, hasMore: false }
    }
  }

  // Obtener todos los productos (sin paginación - para compatibilidad)
  static async getAllProductsLegacy(): Promise<Product[]> {
    try {
      // Supabase tiene un límite por defecto de 1000 registros, necesitamos obtener todos en lotes
      const allProducts: Product[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1
        
        const { data, error, count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) {
          // Error silencioso en producción
          break
        }

        if (!data || data.length === 0) {
          hasMore = false
          break
        }

        const mappedProducts = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          brand: product.brand,
          reference: product.reference,
          price: product.price,
          cost: product.cost,
          stock: {
            warehouse: product.stock_warehouse || 0,
            store: product.stock_store || 0,
            total: (product.stock_warehouse || 0) + (product.stock_store || 0)
          },
          status: product.status,
          createdAt: product.created_at,
          updatedAt: product.updated_at
        }))

        // Ordenar: productos con stock primero, luego por fecha más reciente
        const sortedProducts = mappedProducts.sort((a, b) => {
          const aHasStock = a.stock.total > 0
          const bHasStock = b.stock.total > 0
          
          if (aHasStock && !bHasStock) return -1
          if (!aHasStock && bHasStock) return 1
          
          const aDate = a.updatedAt || a.createdAt
          const bDate = b.updatedAt || b.createdAt
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })

        allProducts.push(...sortedProducts)

        // Si obtuvimos menos productos que el tamaño de página, no hay más
        if (data.length < pageSize) {
          hasMore = false
        } else {
          // Verificar si hay más productos basado en el count
          const totalCount = count || 0
          if (to >= totalCount - 1) {
            hasMore = false
          } else {
            page++
          }
        }
      }

      // Ordenar todos los productos al final: productos con stock primero, luego por fecha más reciente
      return allProducts.sort((a, b) => {
        const aHasStock = a.stock.total > 0
        const bHasStock = b.stock.total > 0
        
        if (aHasStock && !bHasStock) return -1
        if (!aHasStock && bHasStock) return 1
        
        const aDate = a.updatedAt || a.createdAt
        const bDate = b.updatedAt || b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    } catch (error) {
      // Error silencioso en producción
      return []
    }
  }

  // Obtener el stock total de todos los productos (más eficiente que obtener todos los productos)
  static async getTotalStock(): Promise<number> {
    try {
      // Obtener todos los productos en lotes para evitar el límite de 1000
      let totalStock = 0
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from('products')
          .select('stock_warehouse, stock_store')
          .range(from, to)

        if (error) {
          break
        }

        if (!data || data.length === 0) {
          hasMore = false
          break
        }

        const pageStock = data.reduce((sum, product) => {
          const warehouseStock = product.stock_warehouse || 0
          const storeStock = product.stock_store || 0
          return sum + warehouseStock + storeStock
        }, 0)

        totalStock += pageStock

        // Si obtuvimos menos productos que el tamaño de página, no hay más
        if (data.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      }

      return totalStock
    } catch (error) {
      return 0
    }
  }

  // Obtener producto por ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
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
        description: data.description,
        categoryId: data.category_id,
        brand: data.brand,
        reference: data.reference,
        price: data.price,
        cost: data.cost,
        stock: {
          warehouse: data.stock_warehouse || 0,
          store: data.stock_store || 0,
          total: (data.stock_warehouse || 0) + (data.stock_store || 0)
        },
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      // Error silencioso en producción
      return null
    }
  }

  // Crear nuevo producto
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, currentUserId?: string): Promise<Product | null> {
    try {
      const insertData = {
        id: uuidv4(),
        name: productData.name,
        description: productData.description || null, // Convertir string vacío a null
        category_id: productData.categoryId || null, // Convertir string vacío a null
        brand: productData.brand || null, // Convertir string vacío a null
        reference: productData.reference,
        price: productData.price,
        cost: productData.cost,
        stock_warehouse: productData.stock.warehouse,
        stock_store: productData.stock.store,
        status: productData.status
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single()

      if (error) {
      // Error silencioso en producción
        return null
      }

      // Registrar la actividad
      if (currentUserId) {
        await AuthService.logActivity(
          currentUserId,
          'product_create',
          'products',
          {
            description: `Se creó el producto "${productData.name}" (Ref: ${productData.reference}) con stock en Bodega: ${productData.stock.warehouse}, Local: ${productData.stock.store}`,
            productName: productData.name,
            productReference: productData.reference,
            stockWarehouse: productData.stock.warehouse,
            stockStore: productData.stock.store,
            category: productData.categoryId,
            brand: productData.brand,
            price: productData.price,
            cost: productData.cost
          }
        )
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        categoryId: data.category_id,
        brand: data.brand,
        reference: data.reference,
        price: data.price,
        cost: data.cost,
        stock: {
          warehouse: data.stock_warehouse || 0,
          store: data.stock_store || 0,
          total: (data.stock_warehouse || 0) + (data.stock_store || 0)
        },
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      // Error silencioso en producción
      return null
    }
  }

  // Actualizar producto
  static async updateProduct(id: string, updates: Partial<Product>, currentUserId?: string): Promise<boolean> {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description || null // Manejar string vacío
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId || null // Manejar string vacío
      if (updates.brand !== undefined) updateData.brand = updates.brand || null // Manejar string vacío
      if (updates.reference) updateData.reference = updates.reference
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.cost !== undefined) updateData.cost = updates.cost
      if (updates.stock) {
        updateData.stock_warehouse = updates.stock.warehouse
        updateData.stock_store = updates.stock.store
      }
      if (updates.status) updateData.status = updates.status

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        // Obtener el producto actual para mostrar información más detallada
        const currentProduct = await this.getProductById(id)
        const productName = updates.name || currentProduct?.name || `ID: ${id}`
        
        await AuthService.logActivity(
          currentUserId,
          'product_update',
          'products',
          {
            description: `Se actualizó el producto "${productName}". Campos modificados: ${Object.keys(updates).join(', ')}`,
            productId: id,
            productName: productName,
            productReference: currentProduct?.reference,
            changes: Object.keys(updates),
            updatedFields: updates,
            previousValues: currentProduct ? {
              name: currentProduct.name,
              reference: currentProduct.reference,
              brand: currentProduct.brand,
              price: currentProduct.price,
              cost: currentProduct.cost,
              stock: currentProduct.stock
            } : null
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Eliminar producto
  static async deleteProduct(id: string, currentUserId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        await AuthService.logActivity(
          currentUserId,
          'product_delete',
          'products',
          {
            description: `Se eliminó el producto con ID: ${id}`,
            productId: id
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Buscar productos
  static async searchProducts(query: string): Promise<Product[]> {
    try {
      const cleanQuery = query.trim()
      
      if (!cleanQuery) {
        return []
      }

      // Búsqueda simplificada sin timeout - buscar en referencia y nombre
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category_id, brand, reference, price, cost, stock_warehouse, stock_store, status, created_at')
        .or(`reference.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
      // Error silencioso en producción
        return []
      }

      const mappedProducts = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.category_id,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        cost: product.cost,
        stock: {
          warehouse: product.stock_warehouse || 0,
          store: product.stock_store || 0,
          total: (product.stock_warehouse || 0) + (product.stock_store || 0)
        },
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.created_at // Usar created_at como fallback
      }))

      // Ordenar: productos con stock primero, luego por fecha más reciente
      return mappedProducts.sort((a, b) => {
        const aHasStock = a.stock.total > 0
        const bHasStock = b.stock.total > 0
        
        if (aHasStock && !bHasStock) return -1
        if (!aHasStock && bHasStock) return 1
        
        const aDate = a.updatedAt || a.createdAt
        const bDate = b.updatedAt || b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    } catch (error) {
      // Error silencioso en producción
      return []
    }
  }

  // Transferir stock entre ubicaciones
  static async transferStock(productId: string, from: 'warehouse' | 'store', to: 'warehouse' | 'store', quantity: number, currentUserId?: string): Promise<boolean> {
    try {
      const product = await this.getProductById(productId)
      if (!product) return false

      const fromField = from === 'warehouse' ? 'stock_warehouse' : 'stock_store'
      const toField = to === 'warehouse' ? 'stock_warehouse' : 'stock_store'

      const currentFromStock = from === 'warehouse' ? product.stock.warehouse : product.stock.store
      const currentToStock = to === 'warehouse' ? product.stock.warehouse : product.stock.store

      if (currentFromStock < quantity) {
      // Error silencioso en producción
        return false
      }

      const { error } = await supabase
        .from('products')
        .update({
          [fromField]: currentFromStock - quantity,
          [toField]: currentToStock + quantity
        })
        .eq('id', productId)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const fromLocation = from === 'warehouse' ? 'Bodega' : 'Local'
        const toLocation = to === 'warehouse' ? 'Bodega' : 'Local'
        
        await AuthService.logActivity(
          currentUserId,
          'stock_transfer',
          'products',
          {
            description: `Se transfirieron ${quantity} unidades del producto "${product.name}" de ${fromLocation} a ${toLocation}`,
            productId: productId,
            productName: product.name,
            productReference: product.reference,
            fromLocation: from,
            toLocation: to,
            quantity: quantity,
            fromLocationLabel: fromLocation,
            toLocationLabel: toLocation,
            previousStock: {
              warehouse: product.stock.warehouse,
              store: product.stock.store
            },
            newStock: {
              warehouse: from === 'warehouse' ? product.stock.warehouse - quantity : product.stock.warehouse + (to === 'warehouse' ? quantity : 0),
              store: from === 'store' ? product.stock.store - quantity : product.stock.store + (to === 'store' ? quantity : 0)
            }
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Descontar stock para venta (primero del local, luego de bodega)
  static async deductStockForSale(productId: string, quantity: number, currentUserId?: string): Promise<boolean> {
    try {
      const product = await this.getProductById(productId)
      if (!product) return false

      const { warehouse, store } = product.stock
      const totalAvailable = warehouse + store

      if (totalAvailable < quantity) {
      // Error silencioso en producción
        return false
      }

      let remainingToDeduct = quantity
      let warehouseDeduction = 0
      let storeDeduction = 0

      // Primero descontar del local (store)
      if (store > 0 && remainingToDeduct > 0) {
        storeDeduction = Math.min(store, remainingToDeduct)
        remainingToDeduct -= storeDeduction
      }

      // Si aún falta, descontar de bodega (warehouse)
      if (remainingToDeduct > 0) {
        warehouseDeduction = Math.min(warehouse, remainingToDeduct)
        remainingToDeduct -= warehouseDeduction
      }

      // Actualizar el stock en la base de datos
      const { error } = await supabase
        .from('products')
        .update({
          stock_warehouse: warehouse - warehouseDeduction,
          stock_store: store - storeDeduction
        })
        .eq('id', productId)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const description = `Venta: Se descontaron ${quantity} unidades del producto "${product.name}". Local: -${storeDeduction}, Bodega: -${warehouseDeduction}`
        
        await AuthService.logActivity(
          currentUserId,
          'sale_stock_deduction',
          'sales',
          {
            description,
            productId: productId,
            productName: product.name,
            productReference: product.reference,
            quantityDeducted: quantity,
            storeDeduction: storeDeduction,
            warehouseDeduction: warehouseDeduction,
            previousStoreStock: store,
            previousWarehouseStock: warehouse,
            newStoreStock: store - storeDeduction,
            newWarehouseStock: warehouse - warehouseDeduction
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Devolver stock de una venta cancelada
  static async returnStockFromSale(productId: string, quantity: number, currentUserId?: string): Promise<boolean> {
    try {

      const product = await this.getProductById(productId)
      if (!product) {
      // Error silencioso en producción
        return false
      }

      // Devolver el stock al local (store) por defecto
      const newStockStore = (product.stock.store || 0) + quantity

      const { error } = await supabase
        .from('products')
        .update({
          stock_store: newStockStore
        })
        .eq('id', productId)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const description = `Cancelación de venta: Se devolvieron ${quantity} unidades del producto "${product.name}" al local`

        try {
          await AuthService.logActivity(
            currentUserId,
            'sale_cancellation_stock_return',
            'products',
            {
              description,
              productId: productId,
              productName: product.name,
              productReference: product.reference,
              quantityReturned: quantity,
              previousStoreStock: product.stock.store,
              newStoreStock: (product.stock.store || 0) + quantity,
              location: 'store',
              reason: 'Venta cancelada'
            }
          )

        } catch (logError) {
      // Error silencioso en producción
        }
      } else {

      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // 🚀 NUEVA FUNCIÓN: Devolver stock de múltiples productos en lote (OPTIMIZADA)
  static async returnStockFromSaleBatch(items: Array<{productId: string, quantity: number, productName?: string}>, currentUserId?: string): Promise<{success: boolean, results: Array<{productId: string, success: boolean, error?: any}>}> {
    try {

      if (!items || items.length === 0) {

        return { success: true, results: [] }
      }

      // 1. Obtener todos los productos de una vez
      const productIds = items.map(item => item.productId)

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, reference, stock_store')
        .in('id', productIds)

      if (productsError) {
      // Error silencioso en producción
        throw productsError
      }

      // 2. Preparar actualizaciones masivas
      const updates = items.map(item => {
        const product = products?.find(p => p.id === item.productId)
        if (!product) {
      // Error silencioso en producción
          return null
        }

        const currentStock = product.stock_store || 0
        const newStock = currentStock + item.quantity

        return {
          id: item.productId,
          stock_store: newStock,
          productName: product.name,
          productReference: product.reference,
          quantity: item.quantity,
          previousStock: currentStock
        }
      }).filter(Boolean)

      if (updates.length === 0) {
      // Error silencioso en producción
        return { success: false, results: items.map(item => ({ productId: item.productId, success: false, error: 'Producto no encontrado' })) }
      }

      // 3. Actualización masiva usando Promise.all

      const updatePromises = updates.map(async (update) => {
        try {
          const { error } = await supabase
            .from('products')
            .update({ stock_store: update.stock_store })
            .eq('id', update.id)

          if (error) {
      // Error silencioso en producción
            return { productId: update.id, success: false, error }
          }

          return { 
            productId: update.id, 
            success: true, 
            productName: update.productName, 
            productReference: update.productReference,
            quantity: update.quantity,
            previousStock: update.previousStock,
            newStock: update.stock_store
          }
        } catch (error) {
      // Error silencioso en producción
          return { productId: update.id, success: false, error }
        }
      })

      const results = await Promise.all(updatePromises)

      // 4. Log consolidado (una sola vez)
      if (currentUserId) {
        const successfulUpdates = results.filter(r => r.success)
        const failedUpdates = results.filter(r => !r.success)
        
        const description = `Cancelación de venta masiva: Se devolvieron ${successfulUpdates.length} productos al stock${failedUpdates.length > 0 ? ` (${failedUpdates.length} fallaron)` : ''}`

        try {
          await AuthService.logActivity(
            currentUserId,
            'sale_cancellation_stock_return_batch',
            'products',
            {
              description,
              successfulUpdates: successfulUpdates.map(r => ({
                productId: r.productId,
                productName: r.productName,
                productReference: r.productReference,
                quantityReturned: r.quantity,
                previousStoreStock: r.previousStock,
                newStoreStock: r.newStock,
                location: 'store',
                reason: 'Venta cancelada'
              })),
              failedUpdates: failedUpdates.map(r => ({
                productId: r.productId,
                error: r.error
              })),
              totalItems: items.length,
              batchProcessing: true
            }
          )

        } catch (logError) {
      // Error silencioso en producción
          // No fallar la operación principal por un error de log
        }
      }

      const allSuccessful = results.every(r => r.success)

      return { success: allSuccessful, results }
    } catch (error) {
      // Error silencioso en producción
      return { success: false, results: items.map(item => ({ productId: item.productId, success: false, error })) }
    }
  }

  // Ajustar stock
  static async adjustStock(productId: string, location: 'warehouse' | 'store', newQuantity: number, reason: string, currentUserId?: string): Promise<boolean> {
    try {
      const product = await this.getProductById(productId)
      if (!product) return false

      const field = location === 'warehouse' ? 'stock_warehouse' : 'stock_store'
      const currentQuantity = location === 'warehouse' ? product.stock.warehouse : product.stock.store
      const difference = newQuantity - currentQuantity

      const { error } = await supabase
        .from('products')
        .update({
          [field]: newQuantity
        })
        .eq('id', productId)

      if (error) {
      // Error silencioso en producción
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const locationLabel = location === 'warehouse' ? 'Bodega' : 'Local'
        const actionType = difference > 0 ? 'incremento' : 'reducción'
        
        await AuthService.logActivity(
          currentUserId,
          'stock_adjustment',
          'products',
          {
            description: `Se ajustó el stock del producto "${product.name}" en ${locationLabel}. ${actionType} de ${Math.abs(difference)} unidades. Razón: ${reason}`,
            productId: productId,
            productName: product.name,
            productReference: product.reference,
            location: location,
            locationLabel: locationLabel,
            previousQuantity: currentQuantity,
            newQuantity: newQuantity,
            difference: difference,
            reason: reason,
            actionType: actionType
          }
        )
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Actualizar stock (método simplificado para garantías)
  static async updateProductStock(productId: string, stockUpdate: { local: number; warehouse: number }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock_store: stockUpdate.local,
          stock_warehouse: stockUpdate.warehouse
        })
        .eq('id', productId)

      if (error) {
      // Error silencioso en producción
        return false
      }

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

  // Importar productos masivamente desde CSV
  static async importProductsFromCSV(products: any[]): Promise<boolean> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) {
      // Error silencioso en producción
        return false
      }

      // Verificar que no existan referencias duplicadas
      const references = products.map(p => p.reference)
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('reference')
        .in('reference', references)

      if (checkError) {
      // Error silencioso en producción
        return false
      }

      const existingReferences = existingProducts?.map(p => p.reference) || []
      const duplicateReferences = references.filter(ref => existingReferences.includes(ref))
      
      if (duplicateReferences.length > 0) {
      // Error silencioso en producción
        return false
      }

      // Preparar datos para inserción
      const productsToInsert = products.map(product => ({
        id: uuidv4(),
        name: product.name,
        reference: product.reference,
        description: product.name, // Usar el nombre como descripción
        price: product.price,
        cost: product.cost,
        stock_warehouse: product.stock,
        stock_store: 0, // Todo el stock va a bodega
        category_id: null, // Sin categoría por defecto
        brand: product.brand,
        status: 'active',
        created_at: new Date().toISOString()
        // Removido updated_at ya que no existe en la tabla
      }))

      // Insertar productos en lotes de 100
      const batchSize = 100
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('products')
          .insert(batch)

        if (insertError) {
      // Error silencioso en producción
          return false
        }
      }

      // Registrar actividad
      await AuthService.logActivity(
        'products_import',
        `Importación masiva de ${products.length} productos desde CSV`,
        {
          imported_count: products.length,
          references: references.slice(0, 10) // Solo las primeras 10 referencias
        }
      )

      return true
    } catch (error) {
      // Error silencioso en producción
      return false
    }
  }

}
