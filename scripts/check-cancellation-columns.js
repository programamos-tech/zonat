// Script para verificar si las columnas de anulación existen
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log('🔍 Verificando columnas de anulación...\n')

  try {
    // Verificar tabla payment_records
    console.log('📋 Verificando tabla payment_records:')
    const { data: paymentRecords, error: prError } = await supabase
      .from('payment_records')
      .select('*')
      .limit(1)

    if (prError) {
      console.error('❌ Error al acceder a payment_records:', prError.message)
    } else {
      console.log('✅ Tabla payment_records accesible')
      if (paymentRecords && paymentRecords.length > 0) {
        const columns = Object.keys(paymentRecords[0])
        console.log('📝 Columnas disponibles:', columns)
        
        const requiredColumns = ['status', 'cancelled_at', 'cancelled_by', 'cancelled_by_name', 'cancellation_reason']
        const missingColumns = requiredColumns.filter(col => !columns.includes(col))
        
        if (missingColumns.length > 0) {
          console.log('❌ Columnas faltantes:', missingColumns)
        } else {
          console.log('✅ Todas las columnas de anulación están presentes')
        }
      }
    }

    // Verificar tabla credits
    console.log('\n📋 Verificando tabla credits:')
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .limit(1)

    if (creditsError) {
      console.error('❌ Error al acceder a credits:', creditsError.message)
    } else {
      console.log('✅ Tabla credits accesible')
      if (credits && credits.length > 0) {
        const columns = Object.keys(credits[0])
        console.log('📝 Columnas disponibles:', columns)
        
        const requiredColumns = ['status', 'cancelled_at', 'cancelled_by', 'cancelled_by_name', 'cancellation_reason']
        const missingColumns = requiredColumns.filter(col => !columns.includes(col))
        
        if (missingColumns.length > 0) {
          console.log('❌ Columnas faltantes:', missingColumns)
        } else {
          console.log('✅ Todas las columnas de anulación están presentes')
        }
      }
    }

    // Verificar tabla payments
    console.log('\n📋 Verificando tabla payments:')
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    if (paymentsError) {
      console.error('❌ Error al acceder a payments:', paymentsError.message)
    } else {
      console.log('✅ Tabla payments accesible')
      if (payments && payments.length > 0) {
        const columns = Object.keys(payments[0])
        console.log('📝 Columnas disponibles:', columns)
        
        const requiredColumns = ['status', 'cancelled_at', 'cancelled_by', 'cancelled_by_name', 'cancellation_reason']
        const missingColumns = requiredColumns.filter(col => !columns.includes(col))
        
        if (missingColumns.length > 0) {
          console.log('❌ Columnas faltantes:', missingColumns)
        } else {
          console.log('✅ Todas las columnas de anulación están presentes')
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkColumns()
