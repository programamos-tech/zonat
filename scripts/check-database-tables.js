const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseTables() {
  try {
    console.log('🔍 Verificando tablas en la base de datos...')
    
    // Verificar tabla sales
    console.log('\n📋 Verificando tabla "sales"...')
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id')
      .limit(1)
    
    if (salesError) {
      console.log('❌ Error en tabla sales:', salesError.message)
    } else {
      console.log('✅ Tabla sales existe')
    }
    
    // Verificar tabla clients
    console.log('\n👥 Verificando tabla "clients"...')
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .limit(1)
    
    if (clientsError) {
      console.log('❌ Error en tabla clients:', clientsError.message)
    } else {
      console.log('✅ Tabla clients existe')
    }
    
    // Verificar tabla products
    console.log('\n📦 Verificando tabla "products"...')
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (productsError) {
      console.log('❌ Error en tabla products:', productsError.message)
    } else {
      console.log('✅ Tabla products existe')
    }
    
    // Verificar tabla credits
    console.log('\n💳 Verificando tabla "credits"...')
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('id')
      .limit(1)
    
    if (creditsError) {
      console.log('❌ Error en tabla credits:', creditsError.message)
      if (creditsError.message.includes('relation "credits" does not exist')) {
        console.log('💡 La tabla credits no existe. Necesitas ejecutar el script SQL.')
      }
    } else {
      console.log('✅ Tabla credits existe')
    }
    
    // Verificar tabla payment_records
    console.log('\n💰 Verificando tabla "payment_records"...')
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payment_records')
      .select('id')
      .limit(1)
    
    if (paymentsError) {
      console.log('❌ Error en tabla payment_records:', paymentsError.message)
      if (paymentsError.message.includes('relation "payment_records" does not exist')) {
        console.log('💡 La tabla payment_records no existe. Necesitas ejecutar el script SQL.')
      }
    } else {
      console.log('✅ Tabla payment_records existe')
    }
    
    console.log('\n🎯 Resumen:')
    console.log('- Si alguna tabla no existe, ejecuta el script SQL correspondiente')
    console.log('- Las tablas necesarias para créditos son: credits y payment_records')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkDatabaseTables()
