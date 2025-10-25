import { supabase } from './supabase'
import { Credit, PaymentRecord } from '@/types'

export class CreditsService {
  // Crear un nuevo crédito
  static async createCredit(creditData: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credit> {
    const { data, error } = await supabase
      .from('credits')
      .insert([{
        sale_id: creditData.saleId,
        client_id: creditData.clientId,
        client_name: creditData.clientName,
        invoice_number: creditData.invoiceNumber,
        total_amount: creditData.totalAmount,
        paid_amount: creditData.paidAmount,
        pending_amount: creditData.pendingAmount,
        status: creditData.status,
        due_date: creditData.dueDate,
        last_payment_amount: creditData.lastPaymentAmount,
        last_payment_date: creditData.lastPaymentDate,
        last_payment_user: creditData.lastPaymentUser,
        created_by: creditData.createdBy,
        created_by_name: creditData.createdByName
      }])
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      saleId: data.sale_id,
      clientId: data.client_id,
      clientName: data.client_name,
      invoiceNumber: data.invoice_number,
      totalAmount: data.total_amount,
      paidAmount: data.paid_amount,
      pendingAmount: data.pending_amount,
      status: data.status,
      dueDate: data.due_date,
      lastPaymentAmount: data.last_payment_amount,
      lastPaymentDate: data.last_payment_date,
      lastPaymentUser: data.last_payment_user,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // Obtener todos los créditos
  static async getAllCredits(): Promise<Credit[]> {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(credit => ({
      id: credit.id,
      saleId: credit.sale_id,
      clientId: credit.client_id,
      clientName: credit.client_name,
      invoiceNumber: credit.invoice_number,
      totalAmount: credit.total_amount,
      paidAmount: credit.paid_amount,
      pendingAmount: credit.pending_amount,
      status: credit.status,
      dueDate: credit.due_date,
      lastPaymentAmount: credit.last_payment_amount,
      lastPaymentDate: credit.last_payment_date,
      lastPaymentUser: credit.last_payment_user,
      createdBy: credit.created_by,
      createdByName: credit.created_by_name,
      createdAt: credit.created_at,
      updatedAt: credit.updated_at
    }))
  }

  // Obtener crédito por ID
  static async getCreditById(id: string): Promise<Credit | null> {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      id: data.id,
      saleId: data.sale_id,
      clientId: data.client_id,
      clientName: data.client_name,
      invoiceNumber: data.invoice_number,
      totalAmount: data.total_amount,
      paidAmount: data.paid_amount,
      pendingAmount: data.pending_amount,
      status: data.status,
      dueDate: data.due_date,
      lastPaymentAmount: data.last_payment_amount,
      lastPaymentDate: data.last_payment_date,
      lastPaymentUser: data.last_payment_user,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // Actualizar crédito
  static async updateCredit(id: string, updates: Partial<Credit>): Promise<Credit> {
    const updateData: any = {}
    
    if (updates.paidAmount !== undefined) updateData.paid_amount = updates.paidAmount
    if (updates.pendingAmount !== undefined) updateData.pending_amount = updates.pendingAmount
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.lastPaymentAmount !== undefined) updateData.last_payment_amount = updates.lastPaymentAmount
    if (updates.lastPaymentDate !== undefined) updateData.last_payment_date = updates.lastPaymentDate
    if (updates.lastPaymentUser !== undefined) updateData.last_payment_user = updates.lastPaymentUser

    const { data, error } = await supabase
      .from('credits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      saleId: data.sale_id,
      clientId: data.client_id,
      clientName: data.client_name,
      invoiceNumber: data.invoice_number,
      totalAmount: data.total_amount,
      paidAmount: data.paid_amount,
      pendingAmount: data.pending_amount,
      status: data.status,
      dueDate: data.due_date,
      lastPaymentAmount: data.last_payment_amount,
      lastPaymentDate: data.last_payment_date,
      lastPaymentUser: data.last_payment_user,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // Crear registro de pago
  static async createPaymentRecord(paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord> {
    // Obtener el crédito para crear un registro en la tabla payments
    const credit = await this.getCreditById(paymentData.creditId!)
    if (!credit) {
      throw new Error('Crédito no encontrado')
    }

    // Crear un registro en la tabla payments (sistema antiguo)
    const paymentInsertData = {
      sale_id: credit.saleId,
      client_id: credit.clientId,
      client_name: credit.clientName,
      invoice_number: credit.invoiceNumber,
      total_amount: credit.totalAmount,
      paid_amount: credit.paidAmount + paymentData.amount!,
      pending_amount: credit.pendingAmount - paymentData.amount!,
      last_payment_amount: paymentData.amount,
      last_payment_date: paymentData.paymentDate,
      last_payment_user: paymentData.userId,
      status: (credit.pendingAmount - paymentData.amount! <= 0) ? 'completed' : 'partial'
    }

    const { data: paymentDataResult, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentInsertData])
      .select()
      .single()

    if (paymentError) throw paymentError

    // Crear registros de pago en payment_records
    let paymentRecords = []
    
    if (paymentData.paymentMethod === 'mixed' && paymentData.cashAmount && paymentData.transferAmount) {
      // Para pagos mixtos, crear DOS registros separados
      const baseDescription = paymentData.description || ''
      
      // Registro para efectivo
      const cashRecord = {
        payment_id: paymentDataResult.id,
        amount: paymentData.cashAmount,
        payment_date: paymentData.paymentDate,
        payment_method: 'cash',
        user_id: paymentData.userId,
        user_name: paymentData.userName,
        description: baseDescription ? `${baseDescription} (Parte en efectivo)` : 'Pago mixto - Parte en efectivo'
      }
      
      // Registro para transferencia
      const transferRecord = {
        payment_id: paymentDataResult.id,
        amount: paymentData.transferAmount,
        payment_date: paymentData.paymentDate,
        payment_method: 'transfer',
        user_id: paymentData.userId,
        user_name: paymentData.userName,
        description: baseDescription ? `${baseDescription} (Parte por transferencia)` : 'Pago mixto - Parte por transferencia'
      }
      
      // Insertar ambos registros
      const { data: cashData, error: cashError } = await supabase
        .from('payment_records')
        .insert([cashRecord])
        .select()
        .single()
      
      if (cashError) throw cashError
      
      const { data: transferData, error: transferError } = await supabase
        .from('payment_records')
        .insert([transferRecord])
        .select()
        .single()
      
      if (transferError) throw transferError
      
      paymentRecords = [cashData, transferData]
      
    } else {
      // Para pagos simples (cash o transfer), crear un solo registro
      const insertData: any = {
        payment_id: paymentDataResult.id,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        user_id: paymentData.userId,
        user_name: paymentData.userName
      }
      
      if (paymentData.description) {
        insertData.description = paymentData.description
      }
      
      const { data, error } = await supabase
        .from('payment_records')
        .insert([insertData])
        .select()
        .single()
      
      if (error) throw error
      
      paymentRecords = [data]
    }

    // Actualizar el crédito con el nuevo monto pendiente
    const newPendingAmount = credit.pendingAmount - paymentData.amount!
    const newPaidAmount = credit.paidAmount + paymentData.amount!
    const newStatus = newPendingAmount <= 0 ? 'completed' : 'partial'
    
    // Actualizar el crédito en la tabla credits
    await this.updateCredit(credit.id, {
      pendingAmount: newPendingAmount,
      paidAmount: newPaidAmount,
      status: newStatus,
      lastPaymentAmount: paymentData.amount,
      lastPaymentDate: paymentData.paymentDate,
      lastPaymentUser: paymentData.userName
    })

    // Actualizar el estado de la venta si el crédito se completó
    if (newPendingAmount <= 0) {
      // El crédito se completó, actualizar el estado de la venta
      const { error: saleUpdateError } = await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', credit.saleId)

      if (saleUpdateError) {
        console.error('Error updating sale status:', saleUpdateError)
        // No lanzamos error aquí para no interrumpir el flujo del pago
      }
    }

    // Retornar el primer registro (o crear un registro consolidado para la respuesta)
    const firstRecord = paymentRecords[0]
    
    return {
      id: firstRecord.id,
      creditId: paymentData.creditId, // Mantener el creditId original
      amount: paymentData.amount, // Monto total original
      paymentDate: firstRecord.payment_date,
      paymentMethod: paymentData.paymentMethod, // Método original (mixed)
      cashAmount: paymentData.cashAmount, // Mantener los valores originales
      transferAmount: paymentData.transferAmount, // Mantener los valores originales
      description: paymentData.description,
      userId: firstRecord.user_id,
      userName: firstRecord.user_name,
      createdAt: firstRecord.created_at
    }
  }

  // Obtener historial de pagos de un crédito
  static async getPaymentHistory(creditId: string): Promise<PaymentRecord[]> {
    // Obtener el crédito para buscar en payments
    const credit = await this.getCreditById(creditId)
    if (!credit) {
      throw new Error('Crédito no encontrado')
    }

    // Buscar en payments por invoice_number y client_id
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('invoice_number', credit.invoiceNumber)
      .eq('client_id', credit.clientId)

    if (paymentsError) throw paymentsError

    if (!payments || payments.length === 0) {
      return [] // No hay pagos registrados
    }

    // Obtener los registros de pago para estos payments
    const paymentIds = payments.map(p => p.id)
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .in('payment_id', paymentIds)
      .order('payment_date', { ascending: false })

    if (error) throw error

    return data.map(payment => ({
      id: payment.id,
      creditId: creditId, // Mantener el creditId original
      amount: payment.amount,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      cashAmount: undefined, // La tabla no tiene este campo
      transferAmount: undefined, // La tabla no tiene este campo
      description: payment.description,
      userId: payment.user_id,
      userName: payment.user_name,
      createdAt: payment.created_at
    }))
  }

  // Anular un crédito y todos sus abonos
  static async cancelCredit(creditId: string, reason: string, userId: string, userName: string): Promise<{ success: boolean, totalRefund: number }> {
    try {
      // Obtener el crédito
      const credit = await this.getCreditById(creditId)
      if (!credit) {
        throw new Error('Crédito no encontrado')
      }

      if (credit.status === 'cancelled') {
        throw new Error('El crédito ya está anulado')
      }

      // Obtener todos los abonos del crédito
      const paymentHistory = await this.getPaymentHistory(creditId)
      const totalRefund = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)

      // Anular todos los abonos en payment_records
      for (const payment of paymentHistory) {
        const { error: cancelError } = await supabase
          .from('payment_records')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: userId,
            cancelled_by_name: userName,
            cancellation_reason: reason
          })
          .eq('id', payment.id)

        if (cancelError) {
          console.error('Error detallado cancelando abono:', cancelError)
          throw new Error(`Error al anular los abonos: ${cancelError.message}`)
        }
      }

      // Anular el crédito en la tabla credits
      const { error: creditError } = await supabase
        .from('credits')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancelled_by_name: userName,
          cancellation_reason: reason
        })
        .eq('id', creditId)

      if (creditError) {
        console.error('Error detallado al anular crédito:', creditError)
        throw new Error(`Error al anular el crédito: ${creditError.message}`)
      }

      // Anular el crédito en la tabla payments (sistema antiguo)
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancelled_by_name: userName,
          cancellation_reason: reason
        })
        .eq('invoice_number', credit.invoiceNumber)
        .eq('client_id', credit.clientId)

      if (paymentError) {
        console.error('Error cancelando payment:', paymentError)
        // No lanzamos error aquí para no interrumpir el flujo
      }

      // RESTAURAR STOCK: Obtener la venta asociada y restaurar el stock de todos los productos
      try {
        const { SalesService } = await import('./sales-service')
        const { ProductsService } = await import('./products-service')
        
        // Obtener la venta por sale_id
        const sale = await SalesService.getSaleById(credit.saleId)
        if (sale && sale.items && sale.items.length > 0) {
          console.log('🔄 Restaurando stock para venta cancelada:', sale.invoiceNumber)
          console.log('📦 Productos a restaurar:', sale.items.length)
          
          // Restaurar stock de todos los productos de la venta
          const stockReturnResults = []
          for (const item of sale.items) {
            try {
              console.log('🔄 Llamando returnStockFromSale desde credits-service:', { 
                productId: item.productId, 
                quantity: item.quantity, 
                userId 
              })
              const result = await ProductsService.returnStockFromSale(item.productId, item.quantity, userId)
              stockReturnResults.push({ 
                productId: item.productId, 
                productName: item.productName,
                quantity: item.quantity,
                success: result 
              })
              
              if (result) {
                console.log(`✅ Stock restaurado: ${item.productName} (+${item.quantity} unidades)`)
              } else {
                console.error(`❌ Error restaurando stock: ${item.productName}`)
              }
            } catch (error) {
              console.error(`❌ Error returning stock for product ${item.productId}:`, error)
              stockReturnResults.push({ 
                productId: item.productId, 
                productName: item.productName,
                quantity: item.quantity,
                success: false, 
                error 
              })
            }
          }
          
          // Verificar si hubo errores en el retorno de stock
          const failedReturns = stockReturnResults.filter(r => !r.success)
          if (failedReturns.length > 0) {
            console.warn('⚠️ Algunos productos no pudieron ser restaurados al stock:', failedReturns)
            // Continuar con la anulación aunque algunos productos no se pudieron devolver
          } else {
            console.log('✅ Stock restaurado exitosamente para todos los productos')
          }
        } else {
          console.warn('⚠️ No se encontró la venta asociada al crédito o no tiene items')
        }
        
        // ACTUALIZAR STATUS DE LA VENTA: Marcar la venta como cancelada
        if (sale) {
          try {
            const { error: saleUpdateError } = await supabase
              .from('sales')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', credit.saleId)

            if (saleUpdateError) {
              console.error('❌ Error actualizando status de la venta:', saleUpdateError)
            } else {
              console.log('✅ Status de la venta actualizado a "cancelled"')
            }
          } catch (saleError) {
            console.error('❌ Error actualizando venta:', saleError)
          }
        }
      } catch (stockError) {
        console.error('❌ Error restaurando stock al cancelar crédito:', stockError)
        // No lanzamos error aquí para no interrumpir la cancelación del crédito
      }

      return { success: true, totalRefund }
    } catch (error) {
      console.error('Error cancelando crédito:', error)
      throw error
    }
  }

  // Obtener todos los registros de pago (abonos)
  static async getAllPaymentRecords(): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .order('payment_date', { ascending: false })

      if (error) throw error

      return data.map(payment => ({
        id: payment.id,
        creditId: null, // No hay credit_id directo en payment_records
        amount: payment.amount,
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        cashAmount: undefined, // La tabla no tiene este campo
        transferAmount: undefined, // La tabla no tiene este campo
        description: payment.description,
        userId: payment.user_id,
        userName: payment.user_name,
        status: payment.status || 'active', // Incluir status, por defecto 'active'
        cancelledAt: payment.cancelled_at,
        cancelledBy: payment.cancelled_by,
        cancelledByName: payment.cancelled_by_name,
        cancellationReason: payment.cancellation_reason,
        createdAt: payment.created_at
      }))
    } catch (error) {
      console.error('Error fetching payment records:', error)
      return []
    }
  }

  // Obtener crédito por número de factura
  static async getCreditByInvoiceNumber(invoiceNumber: string): Promise<Credit | null> {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No encontrado
        }
        throw error
      }

      return {
        id: data.id,
        saleId: data.sale_id,
        clientId: data.client_id,
        clientName: data.client_name,
        invoiceNumber: data.invoice_number,
        totalAmount: data.total_amount,
        paidAmount: data.paid_amount,
        pendingAmount: data.pending_amount,
        status: data.status,
        dueDate: data.due_date,
        lastPaymentAmount: data.last_payment_amount,
        lastPaymentDate: data.last_payment_date,
        lastPaymentUser: data.last_payment_user,
        createdBy: data.created_by,
        createdByName: data.created_by_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error fetching credit by invoice number:', error)
      return null
    }
  }
}
