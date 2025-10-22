// Script simple para verificar columnas de anulación
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  console.log('URL:', supabaseUrl ? '✅' : '❌')
  console.log('Key:', supabaseKey ? '✅' : '❌')
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
      } else {
        console.log('⚠️ Tabla payment_records vacía, no se pueden verificar las columnas')
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkColumns()
