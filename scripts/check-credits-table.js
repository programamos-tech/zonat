// Script para verificar la tabla credits
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCreditsTable() {
  console.log('🔍 Verificando tabla credits...\n')

  try {
    // Verificar tabla credits
    console.log('📋 Verificando tabla credits:')
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
      } else {
        console.log('⚠️ Tabla credits vacía, no se pueden verificar las columnas')
        console.log('🔧 Intentando verificar estructura de la tabla...')
        
        // Intentar hacer un SELECT con las columnas que necesitamos
        const { data: testData, error: testError } = await supabase
          .from('credits')
          .select('id, status, cancelled_at, cancelled_by, cancelled_by_name, cancellation_reason')
          .limit(1)
        
        if (testError) {
          console.log('❌ Error al verificar columnas específicas:', testError.message)
        } else {
          console.log('✅ Las columnas de anulación existen en la tabla')
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkCreditsTable()
