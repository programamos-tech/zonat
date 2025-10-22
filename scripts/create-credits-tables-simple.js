const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno del archivo .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Configurando tablas de créditos...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Faltante')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCreditsTables() {
  try {
    console.log('📋 Creando tabla credits...')
    
    // Crear tabla credits
    const { error: creditsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS credits (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name VARCHAR(255) NOT NULL,
          invoice_number VARCHAR(50) NOT NULL,
          total_amount DECIMAL(12,2) NOT NULL,
          paid_amount DECIMAL(12,2) DEFAULT 0,
          pending_amount DECIMAL(12,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
          due_date DATE,
          last_payment_amount DECIMAL(12,2),
          last_payment_date TIMESTAMP WITH TIME ZONE,
          last_payment_user VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (creditsError) {
      console.log('⚠️  Error creando tabla credits (puede que ya exista):', creditsError.message)
    } else {
      console.log('✅ Tabla credits creada correctamente')
    }
    
    console.log('📋 Creando tabla payment_records...')
    
    // Crear tabla payment_records
    const { error: paymentsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS payment_records (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
          amount DECIMAL(12,2) NOT NULL,
          payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'mixed')),
          cash_amount DECIMAL(12,2),
          transfer_amount DECIMAL(12,2),
          description TEXT,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (paymentsError) {
      console.log('⚠️  Error creando tabla payment_records (puede que ya exista):', paymentsError.message)
    } else {
      console.log('✅ Tabla payment_records creada correctamente')
    }
    
    console.log('🎉 ¡Configuración completada!')
    console.log('🚀 Las tablas de créditos están listas para usar.')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
    console.log('💡 Sugerencia: Ejecuta el SQL manualmente en el dashboard de Supabase')
  }
}

createCreditsTables()
