// Script para probar específicamente el crédito #076
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCredit076() {
  console.log('🧪 Probando específicamente el crédito #076...\n')

  try {
    // 1. Buscar el crédito #076
    console.log('📋 Buscando crédito #076...')
    const { data: credit, error: creditError } = await supabase
      .from('credits')
      .select('*')
      .eq('invoice_number', '#076')
      .single()

    if (creditError) {
      console.error('❌ Error al buscar crédito #076:', creditError.message)
      return
    }

    console.log('✅ Crédito #076 encontrado:')
    console.log(`   - ID: ${credit.id}`)
    console.log(`   - Status: "${credit.status}"`)
    console.log(`   - Total: $${credit.total_amount?.toLocaleString()}`)
    console.log(`   - Pagado: $${credit.paid_amount?.toLocaleString()}`)
    console.log(`   - Pendiente: $${credit.pending_amount?.toLocaleString()}`)

    // 2. Verificar si está anulado
    if (credit.status === 'cancelled') {
      console.log('\n❌ PROBLEMA: El crédito #076 ya está anulado!')
      console.log(`   - Anulado: ${credit.cancelled_at}`)
      console.log(`   - Anulado por: ${credit.cancelled_by_name}`)
      console.log(`   - Motivo: ${credit.cancellation_reason}`)
    } else {
      console.log('\n✅ El crédito #076 NO está anulado, debería poder anularse')
    }

    // 3. Buscar abonos del crédito #076
    console.log('\n📋 Buscando abonos del crédito #076...')
    
    // Primero buscar en la tabla payments (sistema antiguo)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_number', '#076')
      .eq('client_id', credit.client_id)

    if (paymentsError) {
      console.error('❌ Error al buscar payments:', paymentsError.message)
    } else {
      console.log(`✅ Payments encontrados: ${payments?.length || 0}`)
      if (payments && payments.length > 0) {
        payments.forEach((payment, index) => {
          console.log(`   ${index + 1}. Payment ID: ${payment.id}, Status: ${payment.status}`)
        })
      }
    }

    // 4. Buscar en payment_records
    if (payments && payments.length > 0) {
      const paymentIds = payments.map(p => p.id)
      const { data: paymentRecords, error: recordsError } = await supabase
        .from('payment_records')
        .select('*')
        .in('payment_id', paymentIds)

      if (recordsError) {
        console.error('❌ Error al buscar payment_records:', recordsError.message)
      } else {
        console.log(`✅ Payment records encontrados: ${paymentRecords?.length || 0}`)
        if (paymentRecords && paymentRecords.length > 0) {
          paymentRecords.forEach((record, index) => {
            console.log(`   ${index + 1}. Record ID: ${record.id}, Amount: $${record.amount?.toLocaleString()}, Status: ${record.status}`)
          })
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testCredit076()
