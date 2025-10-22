const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCreditsTableDirect() {
  try {
    console.log('🔧 Creando tabla credits directamente...')
    
    // Intentar crear la tabla usando una inserción de prueba
    console.log('📋 Intentando crear la tabla con una inserción de prueba...')
    
    // Primero, vamos a intentar insertar un registro de prueba
    // Esto debería fallar si la tabla no existe, pero nos dará más información
    const testInsert = {
      sale_id: '00000000-0000-0000-0000-000000000000', // UUID temporal
      client_id: '00000000-0000-0000-0000-000000000000', // UUID temporal
      client_name: 'Test Client',
      invoice_number: 'TEST-001',
      total_amount: 100.00,
      paid_amount: 0,
      pending_amount: 100.00,
      status: 'pending',
      due_date: '2024-12-31'
    }
    
    console.log('🧪 Datos de prueba:', testInsert)
    
    const { data, error } = await supabase
      .from('credits')
      .insert([testInsert])
      .select()
    
    if (error) {
      console.log('❌ Error al insertar (esperado si la tabla no existe):', error.message)
      
      if (error.message.includes('does not exist')) {
        console.log('\n💡 LA TABLA CREDITS NO EXISTE')
        console.log('📋 INSTRUCCIONES PARA CREARLA:')
        console.log('')
        console.log('1. Ve a: https://supabase.com/dashboard')
        console.log('2. Selecciona tu proyecto')
        console.log('3. Ve a "SQL Editor"')
        console.log('4. Copia y pega este SQL:')
        console.log('')
        console.log('='.repeat(60))
        console.log('CREATE TABLE IF NOT EXISTS credits (')
        console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
        console.log('  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,')
        console.log('  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,')
        console.log('  client_name VARCHAR(255) NOT NULL,')
        console.log('  invoice_number VARCHAR(50) NOT NULL,')
        console.log('  total_amount DECIMAL(12,2) NOT NULL,')
        console.log('  paid_amount DECIMAL(12,2) DEFAULT 0,')
        console.log('  pending_amount DECIMAL(12,2) NOT NULL,')
        console.log('  status VARCHAR(20) DEFAULT \'pending\' CHECK (status IN (\'pending\', \'partial\', \'completed\', \'overdue\')),')
        console.log('  due_date DATE,')
        console.log('  last_payment_amount DECIMAL(12,2),')
        console.log('  last_payment_date TIMESTAMP WITH TIME ZONE,')
        console.log('  last_payment_user VARCHAR(255),')
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),')
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
        console.log(');')
        console.log('')
        console.log('CREATE INDEX IF NOT EXISTS idx_credits_client_id ON credits(client_id);')
        console.log('CREATE INDEX IF NOT EXISTS idx_credits_sale_id ON credits(sale_id);')
        console.log('CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);')
        console.log('CREATE INDEX IF NOT EXISTS idx_credits_due_date ON credits(due_date);')
        console.log('='.repeat(60))
        console.log('')
        console.log('5. Ejecuta el script')
        console.log('6. Verifica que la tabla se creó correctamente')
        console.log('')
        console.log('🚀 Una vez creada, el módulo de créditos funcionará perfectamente!')
      }
    } else {
      console.log('✅ ¡La tabla credits existe y funciona!')
      console.log('📊 Datos insertados:', data)
      
      // Limpiar el registro de prueba
      if (data && data.length > 0) {
        await supabase
          .from('credits')
          .delete()
          .eq('id', data[0].id)
        console.log('🧹 Registro de prueba eliminado')
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createCreditsTableDirect()
