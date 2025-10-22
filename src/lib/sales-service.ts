import { supabase } from './supabase'
import { Sale, SaleItem, SalePayment } from '@/types'
import { AuthService } from './auth-service'
import { ProductsService } from './products-service'

export class SalesService {
  // Generar el siguiente número de factura
  static async getNextInvoiceNumber(): Promise<string> {
    try {
      const { count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error getting sales count:', error)
        return '#001' // Fallback
      }

      const nextNumber = (count || 0) + 1
      return `#${nextNumber.toString().padStart(3, '0')}`
    } catch (error) {
      console.error('Error generating invoice number:', error)
      return '#001' // Fallback
    }
  }

  static async getAllSales(page: number = 1, limit: number = 10): Promise<{ sales: Sale[], total: number, hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit
      
      // Obtener el total de ventas
      const { count, error: countError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('Error getting sales count:', countError)
        throw countError
      }
      
      // Obtener las ventas paginadas con los códigos de referencia y pagos mixtos
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount,
            discount_type,
            tax,
            total,
            products!inner (
              reference
            )
          ),
          sale_payments (
            id,
            payment_type,
            amount,
            reference,
            notes,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching sales:', error)
        throw error
      }

      const sales = data?.map(sale => ({
        id: sale.id,
        clientId: sale.client_id,
        clientName: sale.client_name,
        total: sale.total,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        discountType: sale.discount_type || 'amount',
        status: sale.status,
        paymentMethod: sale.payment_method,
        payments: sale.sale_payments?.map((payment: any) => ({
          id: payment.id,
          saleId: payment.sale_id,
          paymentType: payment.payment_type,
          amount: payment.amount,
          reference: payment.reference,
          notes: payment.notes,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        })) || [],
        invoiceNumber: sale.invoice_number,
        sellerId: sale.seller_id,
        sellerName: sale.seller_name,
        sellerEmail: sale.seller_email,
        createdAt: sale.created_at,
        items: sale.sale_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productReferenceCode: item.products?.reference || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          discountType: item.discount_type || 'amount',
          tax: item.tax || 0,
          total: item.total
        })) || []
      })) || []

      return {
        sales,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    } catch (error) {
      console.error('Error in getAllSales:', error)
      throw error
    }
  }

  static async getSaleById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount,
            discount_type,
            tax,
            total,
            products!inner (
              reference
            )
          ),
          sale_payments (
            id,
            payment_type,
            amount,
            reference,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching sale:', error)
        throw error
      }

      if (!data) return null

      const result = {
        id: data.id,
        clientId: data.client_id,
        clientName: data.client_name,
        total: data.total,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        discountType: data.discount_type || 'amount',
        status: data.status,
        paymentMethod: data.payment_method,
        payments: data.sale_payments?.map((payment: any) => ({
          id: payment.id,
          saleId: payment.sale_id,
          paymentType: payment.payment_type,
          amount: payment.amount,
          reference: payment.reference,
          notes: payment.notes,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        })) || [],
        invoiceNumber: data.invoice_number,
        sellerId: data.seller_id,
        sellerName: data.seller_name,
        sellerEmail: data.seller_email,
        createdAt: data.created_at,
        items: data.sale_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productReferenceCode: item.products?.reference || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          discountType: item.discount_type || 'amount',
          tax: item.tax || 0,
          total: item.total
        })) || []
      }

      return result
    } catch (error) {
      console.error('Error in getSaleById:', error)
      throw error
    }
  }

  static async createSale(saleData: Omit<Sale, 'id' | 'createdAt'>, currentUserId: string): Promise<Sale> {
    try {
      // Generar número de factura secuencial
      const invoiceNumber = await this.getNextInvoiceNumber()
      
      // Obtener información del usuario actual
      const currentUser = await AuthService.getCurrentUser()
      
      // Crear la venta
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: saleData.clientId,
          client_name: saleData.clientName,
          total: saleData.total,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          discount: saleData.discount,
          discount_type: saleData.discountType || 'amount',
          status: saleData.status,
          payment_method: saleData.paymentMethod,
          invoice_number: invoiceNumber,
          seller_id: currentUser?.id || currentUserId,
          seller_name: currentUser?.name || 'Usuario',
          seller_email: currentUser?.email || ''
        })
        .select()
        .single()

      if (saleError) {
        console.error('Error creating sale:', saleError)
        throw saleError
      }

      // Crear los items de la venta y descontar stock
      if (saleData.items && saleData.items.length > 0) {
        // Primero descontar stock de todos los productos
        for (const item of saleData.items) {
          const stockDeducted = await ProductsService.deductStockForSale(
            item.productId, 
            item.quantity, 
            currentUserId
          )
          
          if (!stockDeducted) {
            // Si no se pudo descontar stock, revertir la venta
            await supabase.from('sales').delete().eq('id', sale.id)
            throw new Error(`No hay suficiente stock para el producto: ${item.productName}`)
          }
        }

        // Si todo el stock se descontó correctamente, crear los items de la venta
        const saleItems = saleData.items.map(item => ({
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount || 0,
          discount_type: item.discountType || 'amount',
          tax: item.tax || 0,
          total: item.total
        }))

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems)

        if (itemsError) {
          console.error('Error creating sale items:', itemsError)
          throw itemsError
        }
      }

      // Crear registros de pago según el método
      if (saleData.paymentMethod === 'mixed' && saleData.payments && saleData.payments.length > 0) {
        // Crear pagos mixtos
        const paymentRecords = saleData.payments.map(payment => ({
          sale_id: sale.id,
          payment_type: payment.paymentType,
          amount: payment.amount,
          reference: payment.reference || null,
          notes: payment.notes || null
        }))

        const { error: paymentsError } = await supabase
          .from('sale_payments')
          .insert(paymentRecords)

        if (paymentsError) {
          console.error('Error creating mixed payments:', paymentsError)
          throw paymentsError
        }
      } else if (saleData.paymentMethod !== 'credit') {
        // Crear pago único para métodos no mixtos
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: sale.id,
            client_id: saleData.clientId,
            client_name: saleData.clientName,
            invoice_number: invoiceNumber,
            total_amount: saleData.total,
            paid_amount: saleData.paymentMethod === 'cash' ? saleData.total : 0,
            pending_amount: saleData.paymentMethod === 'cash' ? 0 : saleData.total,
            status: saleData.paymentMethod === 'cash' ? 'completed' : 'pending'
          })

        if (paymentError) {
          console.error('Error creating payment:', paymentError)
          throw paymentError
        }
      }

      // Log de actividad
      await AuthService.logActivity(
        currentUserId,
        'sale_create',
        'sales',
        {
          description: `Nueva venta creada: ${saleData.clientName} - Total: $${saleData.total.toLocaleString()}`,
          saleId: sale.id,
          clientName: saleData.clientName,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          itemsCount: saleData.items?.length || 0
        }
      )

      // Obtener la venta completa con toda la información (códigos de referencia, vendedor, etc.)
      const completeSale = await this.getSaleById(sale.id)
      
      if (!completeSale) {
        throw new Error('Error al obtener la venta creada')
      }

      return completeSale
    } catch (error) {
      console.error('Error in createSale:', error)
      throw error
    }
  }

  static async updateSale(id: string, saleData: Partial<Sale>, currentUserId: string): Promise<Sale> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({
          client_id: saleData.clientId,
          client_name: saleData.clientName,
          total: saleData.total,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          discount: saleData.discount,
          discount_type: saleData.discountType || 'amount',
          status: saleData.status,
          payment_method: saleData.paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating sale:', error)
        throw error
      }

      // Log de actividad
      await AuthService.logActivity(
        currentUserId,
        'sale_update',
        'sales',
        {
          description: `Venta actualizada: ${saleData.clientName || 'Venta'} - Total: $${saleData.total?.toLocaleString() || 'N/A'}`,
          saleId: id,
          changes: Object.keys(saleData).join(', ')
        }
      )

      return {
        id: data.id,
        clientId: data.client_id,
        clientName: data.client_name,
        total: data.total,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        status: data.status,
        paymentMethod: data.payment_method,
        createdAt: data.created_at,
        items: saleData.items || []
      }
    } catch (error) {
      console.error('Error in updateSale:', error)
      throw error
    }
  }

  static async deleteSale(id: string, currentUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting sale:', error)
        throw error
      }

      // Log de actividad
      await AuthService.logActivity(
        currentUserId,
        'sale_delete',
        'sales',
        {
          description: `Venta eliminada: ID ${id}`,
          saleId: id
        }
      )
    } catch (error) {
      console.error('Error in deleteSale:', error)
      throw error
    }
  }

  static async cancelSale(id: string, reason: string, currentUserId: string): Promise<{ success: boolean, totalRefund?: number }> {
    try {
      // Obtener la venta para verificar si tiene crédito
      const sale = await this.getSaleById(id)
      if (!sale) {
        throw new Error('Venta no encontrada')
      }

      let totalRefund = 0

      // Si es una venta a crédito, anular el crédito y sus abonos
      if (sale.paymentMethod === 'credit') {
        const { CreditsService } = await import('./credits-service')
        const credit = await CreditsService.getCreditByInvoiceNumber(sale.invoiceNumber)
        
        if (credit) {
          const currentUser = await AuthService.getCurrentUser()
          const cancelResult = await CreditsService.cancelCredit(
            credit.id, 
            reason, 
            currentUserId, 
            currentUser?.name || 'Usuario'
          )
          totalRefund = cancelResult.totalRefund
        }
      }

      // Devolver productos al stock
      const stockReturnResults = []
      for (const item of sale.items) {
        try {
          const result = await ProductsService.returnStockFromSale(item.productId, item.quantity)
          stockReturnResults.push({ productId: item.productId, success: result })
        } catch (error) {
          console.error(`Error returning stock for product ${item.productId}:`, error)
          stockReturnResults.push({ productId: item.productId, success: false, error })
        }
      }
      
      // Verificar si hubo errores en el retorno de stock
      const failedReturns = stockReturnResults.filter(r => !r.success)
      if (failedReturns.length > 0) {
        console.warn('Some products could not be returned to stock:', failedReturns)
        // Continuar con la anulación aunque algunos productos no se pudieron devolver
      }

      // Anular la venta
      const { error } = await supabase
        .from('sales')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error cancelling sale:', error)
        throw error
      }

      // Log de actividad
      await AuthService.logActivity(
        currentUserId,
        'sale_cancel',
        'sales',
        {
          description: `Venta cancelada: ID ${id} - Motivo: ${reason}${totalRefund > 0 ? ` - Reembolso: $${totalRefund.toLocaleString()}` : ''}`,
          saleId: id,
          reason: reason,
          totalRefund: totalRefund
        }
      )

      return { success: true, totalRefund }
    } catch (error) {
      console.error('Error in cancelSale:', error)
      throw error
    }
  }

  static async searchSales(searchTerm: string): Promise<Sale[]> {
    try {
      // Limpiar el término de búsqueda
      const cleanTerm = searchTerm.trim()
      if (!cleanTerm) return []

      // Construir la consulta de búsqueda
      let searchQuery = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount,
            discount_type,
            tax,
            total,
            products!inner (
              reference
            )
          )
        `)

      // Lógica de búsqueda mejorada
      let searchConditions: string[] = []

      // Si el término es un número, priorizar búsqueda por número de factura
      if (!isNaN(Number(cleanTerm))) {
        const numericValue = Number(cleanTerm)
        
        // Buscar por número de factura exacto (sin el #)
        searchConditions.push(`invoice_number.eq.#${cleanTerm.padStart(3, '0')}`)
        
        // Buscar por número de factura que contenga el número (para casos como #010, #100, etc.)
        searchConditions.push(`invoice_number.ilike.%${cleanTerm}%`)
        
        // Buscar por monto exacto
        searchConditions.push(`total.eq.${numericValue}`)
        searchConditions.push(`subtotal.eq.${numericValue}`)
        
        // Buscar en otros campos que puedan contener el número
        searchConditions.push(`client_name.ilike.%${cleanTerm}%`)
        searchConditions.push(`seller_name.ilike.%${cleanTerm}%`)
      } else {
        // Para términos no numéricos, buscar en campos de texto
        searchConditions = [
          `client_name.ilike.%${cleanTerm}%`,
          `invoice_number.ilike.%${cleanTerm}%`,
          `payment_method.ilike.%${cleanTerm}%`,
          `seller_name.ilike.%${cleanTerm}%`,
          `seller_email.ilike.%${cleanTerm}%`
        ]
        
        // Agregar búsqueda por métodos de pago en español
        const paymentMethodMappings = {
          'efectivo': 'cash',
          'contado': 'cash',
          'efectivo/contado': 'cash',
          'crédito': 'credit',
          'credito': 'credit',
          'transferencia': 'transfer',
          'garantía': 'warranty',
          'garantia': 'warranty',
          'mixto': 'mixed'
        }
        
        // Si el término coincide con un método de pago en español, buscar por el valor en inglés
        const lowerTerm = cleanTerm.toLowerCase()
        if (paymentMethodMappings[lowerTerm]) {
          searchConditions.push(`payment_method.eq.${paymentMethodMappings[lowerTerm]}`)
        }
      }

      const { data, error } = await searchQuery.or(searchConditions.join(','))
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching sales:', error)
        throw error
      }

      // Filtrar y ordenar resultados para priorizar coincidencias exactas
      const results = data?.map(sale => ({
        id: sale.id,
        clientId: sale.client_id,
        clientName: sale.client_name,
        total: sale.total,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        discountType: sale.discount_type || 'amount',
        status: sale.status,
        paymentMethod: sale.payment_method,
        invoiceNumber: sale.invoice_number,
        sellerId: sale.seller_id,
        sellerName: sale.seller_name,
        sellerEmail: sale.seller_email,
        createdAt: sale.created_at,
        items: sale.sale_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productReferenceCode: item.products?.reference || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          discountType: item.discount_type || 'amount',
          tax: item.tax || 0,
          total: item.total
        })) || []
      })) || []

      // Si el término es numérico, priorizar resultados que coincidan con el número de factura
      if (!isNaN(Number(cleanTerm))) {
        return results.sort((a, b) => {
          // Priorizar coincidencias exactas en el número de factura
          const aExactMatch = a.invoiceNumber === `#${cleanTerm.padStart(3, '0')}` ? 3 : 0
          const bExactMatch = b.invoiceNumber === `#${cleanTerm.padStart(3, '0')}` ? 3 : 0
          
          // Luego coincidencias parciales en el número de factura
          const aPartialMatch = a.invoiceNumber?.includes(cleanTerm) ? 2 : 0
          const bPartialMatch = b.invoiceNumber?.includes(cleanTerm) ? 2 : 0
          
          // Finalmente coincidencias en otros campos
          const aOtherMatch = (a.clientName?.includes(cleanTerm) || a.sellerName?.includes(cleanTerm)) ? 1 : 0
          const bOtherMatch = (b.clientName?.includes(cleanTerm) || b.sellerName?.includes(cleanTerm)) ? 1 : 0
          
          const aScore = aExactMatch + aPartialMatch + aOtherMatch
          const bScore = bExactMatch + bPartialMatch + bOtherMatch
          
          return bScore - aScore
        })
      }

      return results
    } catch (error) {
      console.error('Error in searchSales:', error)
      throw error
    }
  }
}
