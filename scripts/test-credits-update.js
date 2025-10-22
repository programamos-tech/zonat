// Script para probar actualización en la tabla credits
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCreditsUpdate() {
  console.log('🧪 Probando actualización en tabla credits...\n')

  try {
    // Primero, obtener un crédito existente
    console.log('📋 Obteniendo créditos existentes...')
    const { data: credits, error: fetchError } = await supabase
      .from('credits')
      .select('id, invoice_number, status')
      .limit(1)

    if (fetchError) {
      console.error('❌ Error al obtener créditos:', fetchError.message)
      return
    }

    if (!credits || credits.length === 0) {
      console.log('⚠️ No hay créditos en la tabla para probar')
      return
    }

    const credit = credits[0]
    console.log('✅ Crédito encontrado:', credit)

    // Intentar una actualización simple
    console.log('\n🔧 Probando actualización simple...')
    const { data: updateData, error: updateError } = await supabase
      .from('credits')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', credit.id)
      .select()

    if (updateError) {
      console.error('❌ Error en actualización simple:', updateError.message)
      console.error('Detalles del error:', updateError)
    } else {
      console.log('✅ Actualización simple exitosa')
    }

    // Intentar actualización con columnas de anulación
    console.log('\n🔧 Probando actualización con columnas de anulación...')
    const { data: cancelData, error: cancelError } = await supabase
      .from('credits')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: '00000000-0000-0000-0000-000000000000', // UUID de prueba
        cancelled_by_name: 'Usuario de Prueba',
        cancellation_reason: 'Prueba de anulación'
      })
      .eq('id', credit.id)
      .select()

    if (cancelError) {
      console.error('❌ Error en actualización de anulación:', cancelError.message)
      console.error('Detalles del error:', cancelError)
    } else {
      console.log('✅ Actualización de anulación exitosa')
      console.log('📝 Datos actualizados:', cancelData)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testCreditsUpdate()
