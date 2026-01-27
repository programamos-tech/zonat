import { supabase, supabaseAdmin } from './supabase'
import { Product } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from './auth-service'
import { StoresService } from './stores-service'
import { getCurrentUserStoreId, isMainStoreUser } from './store-helper'

export class ProductsService {
  // Helper para obtener stock según el tipo de tienda
  private static async getProductStockForStore(productId: string, storeId: string | null): Promise<{ warehouse: number, store: number, total: number }> {
    try {
    const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
    const isMainStore = !storeId || storeId === MAIN_STORE_ID

    if (isMainStore) {
      // Para tienda principal, obtener stock de products
        const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('stock_warehouse, stock_store')
        .eq('id', productId)
        .single()

        if (error) {
          console.error('[PRODUCTS SERVICE] Error fetching stock for main store:', error)
          return { warehouse: 0, store: 0, total: 0 }
        }

      if (!product) {
          console.warn('[PRODUCTS SERVICE] Product not found for stock:', productId)
        return { warehouse: 0, store: 0, total: 0 }
      }

      const warehouse = product.stock_warehouse || 0
      const store = product.stock_store || 0
      return { warehouse, store, total: warehouse + store }
    } else {
      // Para micro tiendas, obtener stock de store_stock
        const { data: storeStock, error } = await supabaseAdmin
        .from('store_stock')
        .select('quantity')
        .eq('store_id', storeId)
        .eq('product_id', productId)
        .maybeSingle()

        if (error) {
          console.error('[PRODUCTS SERVICE] Error fetching stock for micro store:', error)
          return { warehouse: 0, store: 0, total: 0 }
        }

      const storeStockQuantity = storeStock?.quantity || 0
      // En micro tiendas, todo el stock es "local" (store), no hay warehouse
      return { warehouse: 0, store: storeStockQuantity, total: storeStockQuantity }
      }
    } catch (error) {
      console.error('[PRODUCTS SERVICE] Exception in getProductStockForStore:', error)
      return { warehouse: 0, store: 0, total: 0 }
    }
  }

  // Helper para obtener stock de múltiples productos de una vez (optimizado)
  private static async getProductsStockForStore(productIds: string[], storeId: string | null): Promise<Map<string, { warehouse: number, store: number, total: number }>> {
    const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
    const isMainStore = !storeId || storeId === MAIN_STORE_ID
    const stockMap = new Map<string, { warehouse: number, store: number, total: number }>()

    console.log('[PRODUCTS SERVICE] getProductsStockForStore - storeId:', storeId, 'isMainStore:', isMainStore, 'productIds count:', productIds.length)

    if (isMainStore) {
      // Para tienda principal, obtener stock de products
      // Dividir en lotes para evitar timeouts y problemas con muchas peticiones
      const BATCH_SIZE = 100
      let products: any[] = []
      let error: any = null
      
      // Procesar en lotes
      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batch = productIds.slice(i, i + BATCH_SIZE)
        let batchSuccess = false
      
      try {
        const result = await supabaseAdmin
          .from('products')
          .select('id, stock_warehouse, stock_store')
            .in('id', batch)
          
          if (result.data) {
            products.push(...result.data)
            batchSuccess = true
          }
          
          if (result.error) {
            console.warn(`[PRODUCTS SERVICE] supabaseAdmin error for batch ${i / BATCH_SIZE + 1}:`, result.error)
            if (!error) {
        error = result.error
            }
          }
      } catch (err) {
          console.warn(`[PRODUCTS SERVICE] supabaseAdmin exception for batch ${i / BATCH_SIZE + 1}, trying supabase:`, err)
        }
        
        // Si el primer intento falló, intentar con supabase
        if (!batchSuccess) {
        try {
          const result = await supabase
            .from('products')
            .select('id, stock_warehouse, stock_store')
              .in('id', batch)
            
            if (result.data) {
              products.push(...result.data)
              batchSuccess = true
            }
            
            if (result.error) {
              console.warn(`[PRODUCTS SERVICE] supabase error for batch ${i / BATCH_SIZE + 1}:`, result.error)
              if (!error) {
          error = result.error
              }
            }
        } catch (err2) {
            console.error(`[PRODUCTS SERVICE] Both failed for batch ${i / BATCH_SIZE + 1}:`, err2)
            if (!error) {
          error = err2
            }
        }
        }
        
        // Si el lote falló completamente, continuar con el siguiente
        // Los productos de este lote tendrán stock 0 (se rellenará más abajo)
      }

      if (error) {
        console.error('[PRODUCTS SERVICE] Error fetching products stock:', {
          error,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          productIdsCount: productIds.length,
          productIdsSample: productIds.slice(0, 3)
        })
        // Si hay error, todos los productos tendrán stock 0 (se rellenará más abajo)
      }

      console.log('[PRODUCTS SERVICE] Fetched products for stock:', products.length || 0, 'products:', products.slice(0, 3))

      if (products.length > 0) {
        products.forEach((product: any) => {
          const warehouse = product.stock_warehouse || 0
          const store = product.stock_store || 0
          const stock = { warehouse, store, total: warehouse + store }
          stockMap.set(product.id, stock)
          if (productIds.indexOf(product.id) < 3) {
            console.log('[PRODUCTS SERVICE] Set stock for product:', product.id, stock)
          }
        })
      }
    } else {
      // Para micro tiendas, obtener stock de store_stock
      // Dividir en lotes para evitar timeouts con muchas peticiones
      const BATCH_SIZE = 100
      let storeStocks: any[] = []
      let error: any = null
      
      // Procesar en lotes
      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batch = productIds.slice(i, i + BATCH_SIZE)
        
        try {
          const result = await supabaseAdmin
            .from('store_stock')
            .select('product_id, quantity')
            .eq('store_id', storeId)
            .in('product_id', batch)
          
          if (result.data) {
            storeStocks.push(...result.data)
          }
          
          if (result.error && !error) {
            error = result.error
          }
        } catch (err) {
          console.warn(`[PRODUCTS SERVICE] supabaseAdmin failed for batch ${i / BATCH_SIZE + 1}, trying supabase:`, err)
          try {
            const result = await supabase
              .from('store_stock')
              .select('product_id, quantity')
              .eq('store_id', storeId)
              .in('product_id', batch)
            
            if (result.data) {
              storeStocks.push(...result.data)
            }
            
            if (result.error && !error) {
              error = result.error
            }
          } catch (err2) {
            console.error(`[PRODUCTS SERVICE] Both failed for batch ${i / BATCH_SIZE + 1}:`, err2)
            if (!error) {
              error = err2
            }
          }
        }
      }
      
      // Si no hay datos pero tampoco hay error, mantener storeStocks como array vacío
      // (no establecer como null para evitar problemas en el logging)

      if (error) {
        console.error('[PRODUCTS SERVICE] Error fetching store_stock:', {
          error,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          storeId,
          productIdsCount: productIds.length,
          productIdsSample: productIds.slice(0, 3)
        })
        // Si hay error, todos los productos tendrán stock 0 (se rellenará más abajo)
      }

      console.log('[PRODUCTS SERVICE] Fetched store_stock for storeId:', storeId, 'count:', storeStocks.length || 0, 'stocks:', storeStocks.slice(0, 3))

      if (storeStocks.length > 0) {
        storeStocks.forEach((stock: any) => {
          const quantity = Number(stock.quantity) || 0
          // Solo agregar al mapa si la cantidad es > 0, para evitar mostrar stock 0 innecesariamente
          if (quantity > 0) {
            stockMap.set(stock.product_id, { warehouse: 0, store: quantity, total: quantity })
            if (productIds.indexOf(stock.product_id) < 3) {
              console.log('[PRODUCTS SERVICE] Set stock for product from store_stock:', stock.product_id, { warehouse: 0, store: quantity, total: quantity })
            }
          }
        })
      }
    }

    // Rellenar con 0 para productos que no tienen stock (o que tienen stock 0)
    productIds.forEach(id => {
      if (!stockMap.has(id)) {
        stockMap.set(id, { warehouse: 0, store: 0, total: 0 })
      }
    })

    console.log('[PRODUCTS SERVICE] Final stockMap size:', stockMap.size, 'sample:', Array.from(stockMap.entries()).slice(0, 3))
    return stockMap
  }

  // Obtener todos los productos con paginación
  static async getAllProducts(page: number = 1, limit: number = 10): Promise<{ products: Product[], total: number, hasMore: boolean }> {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1
      const currentStoreId = getCurrentUserStoreId()

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

      // Mapear productos con stock correcto según el tipo de tienda (optimizado)
      const productIds = data.map((p: any) => p.id)
      const stockMap = await this.getProductsStockForStore(productIds, currentStoreId)
      
      const mappedProducts = data.map((product: any) => {
        const stock = stockMap.get(product.id) || { warehouse: 0, store: 0, total: 0 }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          brand: product.brand,
          reference: product.reference,
          price: product.price,
          cost: product.cost,
          stock: stock,
          status: product.status,
          createdAt: product.created_at,
          updatedAt: product.updated_at
        }
      })

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
  static async getAllProductsLegacy(storeId: string | null = null): Promise<Product[]> {
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

        // Obtener stock correcto según el tipo de tienda (optimizado)
        // Usar el storeId pasado como parámetro, o el del usuario actual si no se pasa
        const currentStoreId = storeId !== null ? storeId : getCurrentUserStoreId()
        console.log('[PRODUCTS SERVICE] getAllProductsLegacy - storeId:', storeId, 'currentStoreId:', currentStoreId)
        const productIds = data.map((p: any) => p.id)
        const stockMap = await this.getProductsStockForStore(productIds, currentStoreId)
        
        // Log para depuración
        if (productIds.length > 0) {
          const firstProductStock = stockMap.get(productIds[0])
          console.log('[PRODUCTS SERVICE] First product stock from map:', {
            productId: productIds[0],
            stock: firstProductStock,
            stockMapSize: stockMap.size
          })
        }
        
        const mappedProducts = data.map((product: any) => {
          // Usar el stock del stockMap (que ya tiene el stock correcto según el tipo de tienda)
          // Si no está en el stockMap, usar valores por defecto
          const stockFromMap = stockMap.get(product.id)
          const stock = stockFromMap || { warehouse: 0, store: 0, total: 0 }
          
          // Log para depuración
          if (productIds.indexOf(product.id) < 3) {
            console.log('[PRODUCTS SERVICE] Mapped product stock:', {
              productId: product.id,
              productName: product.name,
              stockFromMap: stockFromMap,
              stock_warehouse_from_db: product.stock_warehouse,
              stock_store_from_db: product.stock_store,
              finalStock: stock,
              currentStoreId: currentStoreId
            })
          }
          
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            categoryId: product.category_id,
            brand: product.brand,
            reference: product.reference,
            price: product.price,
            cost: product.cost,
            stock: stock,
            status: product.status,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          }
        })

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
      const currentStoreId = getCurrentUserStoreId()
      const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
      const isMainStore = !currentStoreId || currentStoreId === MAIN_STORE_ID

      if (isMainStore) {
        // Para tienda principal, sumar stock de products
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

          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        }

        return totalStock
      } else {
        // Para micro tiendas, sumar stock de store_stock
        const { data, error } = await supabaseAdmin
          .from('store_stock')
          .select('quantity')
          .eq('store_id', currentStoreId)

        if (error) {
          return 0
        }

        return data?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0
      }
    } catch (error) {
      return 0
    }
  }

  // Obtener producto por ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      console.log('[PRODUCTS SERVICE] getProductById called for:', id)
      
      // Usar supabaseAdmin para evitar problemas de permisos RLS en microtiendas
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[PRODUCTS SERVICE] Error fetching product by ID:', error)
        return null
      }

      if (!data) {
        console.error('[PRODUCTS SERVICE] Product not found:', id)
        return null
      }

      console.log('[PRODUCTS SERVICE] Product data fetched, getting stock...')

      // Obtener stock correcto según el tipo de tienda
      const currentStoreId = getCurrentUserStoreId()
      console.log('[PRODUCTS SERVICE] Current store ID:', currentStoreId)
      
      const stock = await this.getProductStockForStore(id, currentStoreId)
      console.log('[PRODUCTS SERVICE] Stock retrieved:', stock)

      const product = {
        id: data.id,
        name: data.name,
        description: data.description,
        categoryId: data.category_id,
        brand: data.brand,
        reference: data.reference,
        price: data.price,
        cost: data.cost,
        stock: stock,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      
      console.log('[PRODUCTS SERVICE] Product mapped successfully')
      return product
    } catch (error) {
      console.error('[PRODUCTS SERVICE] Exception in getProductById:', error)
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

      // Crear stock inicial en todas las micro tiendas activas (con cantidad 0)
      const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
      const allStores = await StoresService.getAllStores(false) // Solo tiendas activas
      const microStores = allStores.filter(store => store.id !== MAIN_STORE_ID)
      
      if (microStores.length > 0) {
        const storeStockInserts = microStores.map(store => ({
          store_id: store.id,
          product_id: data.id,
          quantity: 0, // Stock inicial en 0 para todas las micro tiendas
          location: 'local' // Todas las micro tiendas tienen stock en "local"
        }))
        
        const { error: storeStockError } = await supabaseAdmin
          .from('store_stock')
          .insert(storeStockInserts)
        
        if (storeStockError) {
          console.error('Error creating initial stock for micro stores:', storeStockError)
          // No fallar la creación del producto si hay error al crear stock en tiendas
        }
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
  static async deleteProduct(id: string, currentUserId?: string): Promise<{ success: boolean, error?: string }> {
    try {
      // Obtener información del producto antes de eliminarlo para el log
      const productToDelete = await this.getProductById(id)
      if (!productToDelete) {
        return { success: false, error: 'Producto no encontrado' }
      }

      // Validar que el producto no tenga stock
      const totalStock = (productToDelete.stock?.store || 0) + (productToDelete.stock?.warehouse || 0)
      if (totalStock > 0) {
        return { 
          success: false, 
          error: `No se puede eliminar el producto "${productToDelete.name}" porque tiene ${totalStock} unidad(es) en stock. Debe tener stock en 0 para poder eliminarlo.` 
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
      // Error silencioso en producción
        return { success: false, error: 'Error al eliminar el producto' }
      }

      // Registrar la actividad
      if (currentUserId) {
        await AuthService.logActivity(
          currentUserId,
          'product_delete',
          'products',
          {
            description: `Producto eliminado: ${productToDelete.name}`,
            productId: id,
            productName: productToDelete.name,
            productReference: productToDelete.reference,
            brand: productToDelete.brand,
            category: productToDelete.categoryId,
            price: productToDelete.price,
            cost: productToDelete.cost,
            stockStore: productToDelete.stock?.store || 0,
            stockWarehouse: productToDelete.stock?.warehouse || 0
          }
        )
      }

      return { success: true }
    } catch (error) {
      // Error silencioso en producción
      return { success: false, error: 'Error inesperado al eliminar el producto' }
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

      // Obtener stock correcto según el tipo de tienda
      const currentStoreId = getCurrentUserStoreId()
      const productIds = data.map((p: any) => p.id)
      const stockMap = await this.getProductsStockForStore(productIds, currentStoreId)
      
      const mappedProducts = data.map((product: any) => {
        const stock = stockMap.get(product.id) || { warehouse: 0, store: 0, total: 0 }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          brand: product.brand,
          reference: product.reference,
          price: product.price,
          cost: product.cost,
          stock: stock,
          status: product.status,
          createdAt: product.created_at,
          updatedAt: product.created_at // Usar created_at como fallback
        }
      })

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
  static async deductStockForSale(productId: string, quantity: number, currentUserId?: string): Promise<{ success: boolean, stockInfo?: { storeDeduction: number, warehouseDeduction: number, previousStoreStock: number, previousWarehouseStock: number, newStoreStock: number, newWarehouseStock: number } }> {
    try {
      const product = await this.getProductById(productId)
      if (!product) return { success: false }

      const { warehouse, store } = product.stock
      const totalAvailable = warehouse + store

      if (totalAvailable < quantity) {
      // Error silencioso en producción
        return { success: false }
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
        return { success: false }
      }

      // Retornar información del descuento (NO crear log aquí, se hará en el log de la venta)
      return {
        success: true,
        stockInfo: {
          storeDeduction,
          warehouseDeduction,
          previousStoreStock: store,
          previousWarehouseStock: warehouse,
          newStoreStock: store - storeDeduction,
          newWarehouseStock: warehouse - warehouseDeduction
        }
      }
    } catch (error) {
      // Error silencioso en producción
      return { success: false }
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

      // NOTA: No creamos log aquí porque cuando se cancela una venta, 
      // el log de 'sale_cancel' ya incluye toda la información del stock devuelto.
      // Este log solo se crearía si se devuelve stock fuera del contexto de cancelación de venta,
      // pero actualmente no hay ese caso de uso.

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

      const storeId = getCurrentUserStoreId()
      const MAIN_STORE_ID = '00000000-0000-0000-0000-000000000001'
      const isMainStore = !storeId || storeId === MAIN_STORE_ID

      let currentQuantity: number
      let difference: number

      if (isMainStore) {
        // Tienda principal: actualizar en tabla products
        const field = location === 'warehouse' ? 'stock_warehouse' : 'stock_store'
        currentQuantity = location === 'warehouse' ? product.stock.warehouse : product.stock.store
        difference = newQuantity - currentQuantity

        const { error } = await supabase
          .from('products')
          .update({
            [field]: newQuantity
          })
          .eq('id', productId)

        if (error) {
          console.error('[PRODUCTS SERVICE] Error adjusting stock for main store:', error)
          return false
        }
      } else {
        // Microtienda: actualizar en tabla store_stock
        // En microtiendas solo hay stock "local" (store), no warehouse
        if (location === 'warehouse') {
          console.error('[PRODUCTS SERVICE] Cannot adjust warehouse stock in micro store')
          return false
        }

        console.log('[PRODUCTS SERVICE] Adjusting stock for micro store:', {
          storeId,
          productId,
          newQuantity,
          location
        })

        // Obtener stock actual de la microtienda
        const { data: storeStock, error: fetchError } = await supabaseAdmin
          .from('store_stock')
          .select('quantity')
          .eq('store_id', storeId)
          .eq('product_id', productId)
          .maybeSingle()

        if (fetchError) {
          console.error('[PRODUCTS SERVICE] Error fetching stock for micro store:', fetchError)
          return false
        }

        currentQuantity = storeStock?.quantity || 0
        difference = newQuantity - currentQuantity

        console.log('[PRODUCTS SERVICE] Stock calculation for micro store:', {
          currentQuantity,
          newQuantity,
          difference
        })

        // Upsert en store_stock
        const { data: updatedStock, error: updateError } = await supabaseAdmin
          .from('store_stock')
          .upsert({
            store_id: storeId,
            product_id: productId,
            quantity: newQuantity,
            location: 'local'
          }, {
            onConflict: 'store_id,product_id'
          })
          .select()

        if (updateError) {
          console.error('[PRODUCTS SERVICE] Error adjusting stock for micro store:', updateError)
          return false
        }

        console.log('[PRODUCTS SERVICE] Stock updated successfully for micro store:', updatedStock)
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
            actionType: actionType,
            storeId: storeId || MAIN_STORE_ID
          }
        )
      }

      return true
    } catch (error) {
      console.error('[PRODUCTS SERVICE] Exception in adjustStock:', error)
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
