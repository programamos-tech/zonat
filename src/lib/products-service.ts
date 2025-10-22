import { supabase } from './supabase'
import { Product } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from './auth-service'

export class ProductsService {
  // Obtener todos los productos
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        return []
      }


      return data.map((product: any) => ({
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
    } catch (error) {
      console.error('Error in getAllProducts:', error)
      return []
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
        console.error('Error fetching product:', error)
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
      console.error('Error in getProductById:', error)
      return null
    }
  }

  // Crear nuevo producto
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, currentUserId?: string): Promise<Product | null> {
    try {
      const insertData = {
        id: uuidv4(),
        name: productData.name,
        description: productData.description,
        category_id: productData.categoryId,
        brand: productData.brand,
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
        console.error('Error creating product:', error)
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
      console.error('Error in createProduct:', error)
      return null
    }
  }

  // Actualizar producto
  static async updateProduct(id: string, updates: Partial<Product>, currentUserId?: string): Promise<boolean> {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.description) updateData.description = updates.description
      if (updates.categoryId) updateData.category_id = updates.categoryId
      if (updates.brand) updateData.brand = updates.brand
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
        console.error('Error updating product:', error)
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
      console.error('Error in updateProduct:', error)
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
        console.error('Error deleting product:', error)
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
      console.error('Error in deleteProduct:', error)
      return false
    }
  }

  // Buscar productos
  static async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,reference.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching products:', error)
        return []
      }

      return data.map((product: any) => ({
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
    } catch (error) {
      console.error('Error in searchProducts:', error)
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
        console.error('Insufficient stock for transfer')
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
        console.error('Error transferring stock:', error)
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
      console.error('Error in transferStock:', error)
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
        console.error(`Insufficient stock for product ${productId}. Available: ${totalAvailable}, Required: ${quantity}`)
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
        console.error('Error deducting stock:', error)
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const description = `Venta: Se descontaron ${quantity} unidades del producto "${product.name}". Local: -${storeDeduction}, Bodega: -${warehouseDeduction}`
        
        await AuthService.logActivity(
          currentUserId,
          'sale_stock_deduction',
          'products',
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
      console.error('Error in deductStockForSale:', error)
      return false
    }
  }

  // Devolver stock de una venta cancelada
  static async returnStockFromSale(productId: string, quantity: number, currentUserId?: string): Promise<boolean> {
    try {
      const product = await this.getProductById(productId)
      if (!product) return false

      // Devolver el stock al local (store) por defecto
      const { error } = await supabase
        .from('products')
        .update({
          stock_store: (product.stock.store || 0) + quantity
        })
        .eq('id', productId)

      if (error) {
        console.error('Error returning stock:', error)
        return false
      }

      // Registrar la actividad
      if (currentUserId) {
        const description = `Cancelación de venta: Se devolvieron ${quantity} unidades del producto "${product.name}" al local`
        
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
      }

      return true
    } catch (error) {
      console.error('Error in returnStockFromSale:', error)
      return false
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
        console.error('Error adjusting stock:', error)
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
      console.error('Error in adjustStock:', error)
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
        console.error('Error updating product stock:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateProductStock:', error)
      return false
    }
  }

  // Devolver stock de una venta cancelada
  static async returnStockFromSale(productId: string, quantity: number): Promise<boolean> {
    try {
      console.log('Returning stock for product:', productId, 'quantity:', quantity)
      
      // Obtener el producto actual
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, name, stock_warehouse, stock_store')
        .eq('id', productId)
        .single()

      if (fetchError) {
        console.error('Error fetching product for stock return:', {
          productId,
          error: fetchError,
          errorCode: fetchError.code,
          errorMessage: fetchError.message
        })
        return false
      }

      if (!product) {
        console.error('Product not found for stock return:', productId)
        return false
      }

      console.log('Product found:', product.name, 'warehouse stock:', product.stock_warehouse, 'store stock:', product.stock_store)

      const currentStoreStock = product.stock_store || 0
      const newStoreStock = currentStoreStock + quantity

      // Actualizar el stock del local (asumiendo que las ventas se hacen desde el local)
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_store: newStoreStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) {
        console.error('Error returning stock to product:', updateError)
        return false
      }

      console.log('Stock returned successfully:', quantity, 'units to store')
      return true
    } catch (error) {
      console.error('Error in returnStockFromSale:', error)
      return false
    }
  }
}
