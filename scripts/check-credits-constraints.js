// Script para verificar constraints de la tabla credits
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConstraints() {
  console.log('🔍 Verificando constraints de la tabla credits...\n')

  try {
    // Obtener un crédito para ver su estructura actual
    const { data: credits, error: fetchError } = await supabase
      .from('credits')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.error('❌ Error al obtener créditos:', fetchError.message)
      return
    }

    if (credits && credits.length > 0) {
      const credit = credits[0]
      console.log('📋 Crédito actual:', {
        id: credit.id,
        invoice_number: credit.invoice_number,
        status: credit.status,
        status_type: typeof credit.status
      })
    }

    // Probar diferentes valores de status
    const testStatuses = ['pending', 'completed', 'cancelled', 'active', 'inactive']
    
    for (const status of testStatuses) {
      console.log(`\n🧪 Probando status: "${status}"`)
      
      const { data: testData, error: testError } = await supabase
        .from('credits')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', credits[0].id)
        .select()

      if (testError) {
        console.log(`❌ Error con status "${status}":`, testError.message)
      } else {
        console.log(`✅ Status "${status}" aceptado`)
        // Revertir el cambio
        await supabase
          .from('credits')
          .update({ 
            status: credits[0].status,
            updated_at: new Date().toISOString()
          })
          .eq('id', credits[0].id)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkConstraints()
