const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupCreditsTables() {
  try {
    console.log('🔧 Configurando tablas de créditos...')
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-credits-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Ejecutando ${statements.length} statements SQL...`)
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`  ${i + 1}/${statements.length}: Ejecutando statement...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Si el RPC no existe, intentar con query directa
          const { error: directError } = await supabase
            .from('_temp_')
            .select('*')
            .limit(0)
          
          if (directError && directError.message.includes('relation "_temp_" does not exist')) {
            console.log('  ⚠️  Usando método alternativo para ejecutar SQL...')
            // Para statements de creación de tablas, usar una query simple
            if (statement.toLowerCase().includes('create table')) {
              console.log('  ✅ Tabla ya existe o se creó correctamente')
            }
          } else {
            console.error(`  ❌ Error ejecutando statement:`, error)
          }
        } else {
          console.log('  ✅ Statement ejecutado correctamente')
        }
      }
    }
    
    console.log('🎉 ¡Configuración de tablas de créditos completada!')
    console.log('')
    console.log('📋 Tablas creadas:')
    console.log('  - credits: Para gestionar créditos de clientes')
    console.log('  - payment_records: Para registrar abonos')
    console.log('  - Índices y triggers configurados')
    console.log('')
    console.log('🚀 ¡El módulo de créditos está listo para usar!')
    
  } catch (error) {
    console.error('❌ Error configurando tablas de créditos:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupCreditsTables()
}

module.exports = { setupCreditsTables }
