// Script para debuggear el problema del constraint de credits
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCreditsStatus() {
  console.log('🔍 Debuggeando el problema del constraint de credits...\n')

  try {
    // 1. Ver todos los valores de status actuales
    console.log('📋 Valores de status actuales:')
    const { data: statusData, error: statusError } = await supabase
      .from('credits')
      .select('id, invoice_number, status')
      .order('created_at', { ascending: false })

    if (statusError) {
      console.error('❌ Error al obtener créditos:', statusError.message)
      return
    }

    console.log('📝 Créditos encontrados:')
    statusData.forEach(credit => {
      console.log(`  - ${credit.invoice_number}: status = "${credit.status}" (tipo: ${typeof credit.status})`)
    })

    // 2. Verificar si hay valores problemáticos
    const problemStatuses = statusData.filter(credit => 
      !['pending', 'completed', 'cancelled'].includes(credit.status)
    )

    if (problemStatuses.length > 0) {
      console.log('\n❌ Valores problemáticos encontrados:')
      problemStatuses.forEach(credit => {
        console.log(`  - ${credit.invoice_number}: "${credit.status}"`)
      })
    } else {
      console.log('\n✅ Todos los valores de status son válidos')
    }

    // 3. Intentar una actualización simple para probar el constraint
    console.log('\n🧪 Probando actualización simple...')
    const testCredit = statusData[0]
    if (testCredit) {
      console.log(`Probando con crédito: ${testCredit.invoice_number}`)
      
      const { data: updateData, error: updateError } = await supabase
        .from('credits')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', testCredit.id)
        .select()

      if (updateError) {
        console.error('❌ Error en actualización simple:', updateError.message)
        console.error('Detalles:', updateError)
      } else {
        console.log('✅ Actualización simple exitosa')
      }
    }

    // 4. Intentar actualización a 'cancelled'
    console.log('\n🧪 Probando actualización a "cancelled"...')
    if (testCredit) {
      const { data: cancelData, error: cancelError } = await supabase
        .from('credits')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: '00000000-0000-0000-0000-000000000000',
          cancelled_by_name: 'Debug Test',
          cancellation_reason: 'Prueba de debug'
        })
        .eq('id', testCredit.id)
        .select()

      if (cancelError) {
        console.error('❌ Error al actualizar a "cancelled":', cancelError.message)
        console.error('Detalles:', cancelError)
      } else {
        console.log('✅ Actualización a "cancelled" exitosa')
        console.log('📝 Datos actualizados:', cancelData)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

debugCreditsStatus()
