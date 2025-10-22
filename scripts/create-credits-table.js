const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCreditsTable() {
  try {
    console.log('🔧 Creando tabla credits...')
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-credits-table-only.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 Contenido del SQL:')
    console.log(sqlContent)
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Intentar crear la tabla usando una query directa
    console.log('🚀 Intentando crear la tabla...')
    
    // Dividir el SQL en statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`📝 Ejecutando statement ${i + 1}/${statements.length}...`)
        console.log(`SQL: ${statement.substring(0, 100)}...`)
        
        try {
          // Intentar con rpc exec si existe
          const { error: rpcError } = await supabase.rpc('exec', { sql: statement })
          
          if (rpcError) {
            console.log('⚠️  RPC exec no disponible, intentando método alternativo...')
            
            // Método alternativo: intentar una query simple para verificar si la tabla existe
            const { error: testError } = await supabase
              .from('credits')
              .select('id')
              .limit(0)
            
            if (testError && testError.message.includes('does not exist')) {
              console.log('✅ La tabla credits no existe, necesitas crearla manualmente')
            } else {
              console.log('✅ La tabla credits ya existe o se creó correctamente')
            }
          } else {
            console.log('✅ Statement ejecutado correctamente')
          }
        } catch (err) {
          console.log('⚠️  Error ejecutando statement:', err.message)
        }
      }
    }
    
    // Verificar si la tabla existe ahora
    console.log('\n🔍 Verificando si la tabla credits existe...')
    const { data, error } = await supabase
      .from('credits')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('❌ La tabla credits aún no existe:', error.message)
      console.log('\n💡 INSTRUCCIONES MANUALES:')
      console.log('1. Ve a https://supabase.com/dashboard')
      console.log('2. Selecciona tu proyecto')
      console.log('3. Ve a SQL Editor')
      console.log('4. Copia y pega el siguiente SQL:')
      console.log('\n' + '='.repeat(50))
      console.log(sqlContent)
      console.log('='.repeat(50))
    } else {
      console.log('✅ ¡La tabla credits existe y está funcionando!')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createCreditsTable()
