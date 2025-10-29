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
      } else if (saleData.paymentMethod === 'credit') {
        // Crear crédito para ventas a crédito
        const { CreditsService } = await import('./credits-service')
        
        await CreditsService.createCredit({
          saleId: sale.id,
          clientId: saleData.clientId,
          clientName: saleData.clientName,
          invoiceNumber: invoiceNumber,
          totalAmount: saleData.total,
          paidAmount: 0,
          pendingAmount: saleData.total,
          status: 'pending',
          dueDate: saleData.dueDate || null,
          lastPaymentAmount: null,
          lastPaymentDate: null,
          lastPaymentUser: null,
          createdBy: currentUserId,
          createdByName: currentUser?.name || 'Usuario'
        })
      } else {
        // Crear pago único para métodos no mixtos (cash, transfer, etc.)
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
      const paymentMethodLabel = saleData.paymentMethod === 'credit' ? 'Venta a Crédito' : 
                                 saleData.paymentMethod === 'cash' ? 'Venta en Efectivo' :
                                 saleData.paymentMethod === 'transfer' ? 'Venta por Transferencia' :
                                 saleData.paymentMethod === 'mixed' ? 'Venta Mixta' : 'Venta'
      
      // Usar acción diferente para ventas a crédito
      const logAction = saleData.paymentMethod === 'credit' ? 'credit_sale_create' : 'sale_create'
      
      await AuthService.logActivity(
        currentUserId,
        logAction,
        'sales',
        {
          description: `${paymentMethodLabel}: ${saleData.clientName} - Total: $${saleData.total.toLocaleString()}`,
          saleId: sale.id,
          clientName: saleData.clientName,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          itemsCount: saleData.items?.length || 0,
          items: saleData.items?.map(item => ({
            productName: item.productName,
            productReference: item.productReferenceCode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })) || []
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

      console.log('🔄 Iniciando cancelación de venta:', { id, reason, paymentMethod: sale.paymentMethod })
      console.log('🔍 Verificando si es venta a crédito...', { isCredit: sale.paymentMethod === 'credit' })
      
      // 🚀 OPTIMIZACIÓN: Obtener crédito una sola vez al inicio si es necesario
      let credit = null
      if (sale.paymentMethod === 'credit') {
        console.log('📋 Obteniendo información del crédito...')
        const { CreditsService } = await import('./credits-service')
        credit = await CreditsService.getCreditByInvoiceNumber(sale.invoiceNumber)
        
        if (!credit) {
          console.warn('⚠️ No se encontró crédito para la venta')
        } else {
          console.log('✅ Crédito encontrado:', { creditId: credit.id, invoiceNumber: credit.invoiceNumber })
        }
      }
      
      // Si es una venta a crédito, manejar cancelación parcial
      if (sale.paymentMethod === 'credit') {
        console.log('💳 Es una venta a crédito, manejando cancelación parcial...')
        
        // Devolver stock al local (siempre hacer esto para ventas a crédito canceladas)
        console.log('📦 Devolviendo stock al local para venta a crédito cancelada...')
        console.log('🔍 Venta items:', sale.items.map(item => ({ productId: item.productId, productName: item.productName, quantity: item.quantity })))
        
        // 🚀 OPTIMIZACIÓN: Usar procesamiento en lote en lugar de loop secuencial
        const stockReturnItems = sale.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName
        }))
        
        console.log('🚀 Iniciando procesamiento en lote para', stockReturnItems.length, 'productos')
        const stockReturnResult = await ProductsService.returnStockFromSaleBatch(stockReturnItems, currentUserId)
        
        if (stockReturnResult.success) {
          console.log('✅ Todos los productos fueron devueltos al stock exitosamente')
        } else {
          const failedReturns = stockReturnResult.results.filter(r => !r.success)
          console.warn('⚠️ Algunos productos no pudieron ser devueltos al stock:', failedReturns)
          // Continuar con la anulación aunque algunos productos no se pudieron devolver
        }

        // Actualizar el crédito para reflejar la cancelación parcial
        if (credit) {
          console.log('📋 Actualizando crédito para reflejar cancelación parcial...')
          
          // Recalcular el estado del crédito basado en las ventas activas
          // Esto se moverá después de actualizar la venta
        } else {
          console.warn('⚠️ No se encontró crédito para la venta')
        }
      } else {
        console.log('💰 Es una venta normal, devolviendo stock...')
        console.log('🔍 Payment method:', sale.paymentMethod)
        
        // 🚀 OPTIMIZACIÓN: Usar procesamiento en lote para ventas normales también
        const stockReturnItems = sale.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName
        }))
        
        console.log('🚀 Iniciando procesamiento en lote para venta normal:', stockReturnItems.length, 'productos')
        const stockReturnResult = await ProductsService.returnStockFromSaleBatch(stockReturnItems, currentUserId)
        
        if (stockReturnResult.success) {
          console.log('✅ Todos los productos fueron devueltos al stock exitosamente')
        } else {
          const failedReturns = stockReturnResult.results.filter(r => !r.success)
          console.warn('⚠️ Algunos productos no pudieron ser devueltos al stock:', failedReturns)
          // Continuar con la anulación aunque algunos productos no se pudieron devolver
        }
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

      console.log('✅ Venta marcada como cancelled en la DB')

      // Verificar que la venta se actualizó correctamente
      const { data: updatedSale, error: verifyError } = await supabase
        .from('sales')
        .select('id, status, invoice_number')
        .eq('id', id)
        .single()

      if (verifyError) {
        console.error('Error verificando venta actualizada:', verifyError)
      } else {
        console.log('🔍 Estado de la venta después de cancelar:', updatedSale)
        
        // 🚀 OPTIMIZACIÓN: Solo actualizar crédito si es necesario (evitar query redundante)
        if (sale.paymentMethod === 'credit') {
          console.log('📋 Actualizando crédito después de confirmar cancelación de venta...')
          // Usar el crédito que ya obtuvimos anteriormente en lugar de hacer otra query
          if (credit) {
            await this.updateCreditStatusAfterSaleCancellation(credit.id, sale.id)
          } else {
            console.warn('⚠️ No se encontró crédito para la venta')
          }
        }
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

  // Actualizar el estado del crédito después de cancelar una venta
  static async updateCreditStatusAfterSaleCancellation(creditId: string, cancelledSaleId: string): Promise<void> {
    try {
      console.log('🔄 Recalculando estado del crédito después de cancelación...')
      
      // Obtener la venta cancelada para obtener el cliente
      const cancelledSale = await this.getSaleById(cancelledSaleId)
      if (!cancelledSale) {
        console.error('No se pudo obtener la venta cancelada')
        return
      }

      // Obtener todas las ventas con el mismo número de factura (crédito específico)
      const { data: allSales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('invoice_number', cancelledSale.invoiceNumber)
        .order('created_at', { ascending: true })

      console.log('🔍 Todas las ventas del crédito:', allSales?.map(s => ({ 
        id: s.id, 
        invoiceNumber: s.invoice_number, 
        status: s.status, 
        total: s.total 
      })))

      if (salesError) {
        console.error('Error obteniendo ventas del crédito:', salesError)
        return
      }

      if (!allSales || allSales.length === 0) {
        console.warn('No se encontraron ventas para el crédito')
        return
      }

      // Calcular totales solo de ventas activas (no canceladas)
      const activeSales = allSales.filter(sale => sale.status !== 'cancelled')
      const totalAmount = activeSales.reduce((sum, sale) => sum + sale.total, 0)
      
      console.log('📊 Ventas activas:', activeSales.length, 'de', allSales.length, 'total')
      console.log('💰 Monto total activo:', totalAmount)

      // Si no hay ventas activas, solo actualizar los montos a 0 (mantener status original)
      if (activeSales.length === 0) {
        console.log('🚫 Todas las ventas están canceladas, actualizando montos a 0')
        console.log('🔍 Credit ID:', creditId)
        
        const { error: updateError } = await supabase
          .from('credits')
          .update({
            total_amount: 0,
            pending_amount: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', creditId)

        if (updateError) {
          console.error('Error actualizando montos del crédito:', updateError)
          throw updateError
        }

        console.log('✅ Montos del crédito actualizados a 0')
        return
      }

      // Obtener el monto pagado actual del crédito
      const { data: creditData, error: creditError } = await supabase
        .from('credits')
        .select('paid_amount')
        .eq('id', creditId)
        .single()

      if (creditError) {
        console.error('Error obteniendo datos del crédito:', creditError)
        return
      }

      const paidAmount = creditData.paid_amount || 0
      const pendingAmount = totalAmount - paidAmount

      // Determinar el nuevo estado del crédito
      let newStatus = 'pending'
      if (pendingAmount <= 0) {
        newStatus = 'completed'
      } else if (paidAmount > 0) {
        newStatus = 'partial'
      }

      console.log('📈 Nuevo estado calculado:', {
        totalAmount,
        paidAmount,
        pendingAmount,
        newStatus
      })

      // Actualizar el crédito
      const { error: updateError } = await supabase
        .from('credits')
        .update({
          total_amount: totalAmount,
          pending_amount: pendingAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditId)

      if (updateError) {
        console.error('Error actualizando crédito:', updateError)
        throw updateError
      }

      console.log('✅ Crédito actualizado exitosamente')
    } catch (error) {
      console.error('Error en updateCreditStatusAfterSaleCancellation:', error)
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

      const { data, error } = await searchQuery
        .or(searchConditions.join(','))
        .neq('status', 'cancelled') // Excluir ventas canceladas
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
