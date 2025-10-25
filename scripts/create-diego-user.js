const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usando las credenciales de Programamos)
const supabaseUrl = 'https://bbkihgtgpuzzyywhmkwtwgc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyODAzMiwiZXhwIjoyMDc2OTA0MDMyfQ.IVwGBykWyy2UH724J1TKUnaq47ccIXVUOoPxI2E-ghw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDiegoUser() {
  try {
    console.log('🚀 Creando usuario de Diego...')

    // Datos del usuario Diego
    const diegoUser = {
      name: 'Diego',
      email: 'diego@zonat.com',
      password: 'admin123', // En producción, esto debería estar hasheado
      role: 'Super Admin',
      permissions: [
        {
          module: 'dashboard',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'products',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'clients',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'sales',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'payments',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'warranties',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'roles',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        },
        {
          module: 'logs',
          permissions: ['view', 'create', 'edit', 'delete', 'cancel']
        }
      ],
      is_active: true
    }

    // Crear el usuario
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: diegoUser.name,
        email: diegoUser.email,
        password: diegoUser.password,
        role: diegoUser.role,
        permissions: diegoUser.permissions,
        is_active: diegoUser.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creando usuario:', error)
      return false
    }

    console.log('✅ Usuario Diego creado exitosamente:')
    console.log('📧 Email:', user.email)
    console.log('👤 Nombre:', user.name)
    console.log('🔑 Rol:', user.role)
    console.log('🆔 ID:', user.id)
    console.log('✅ Activo:', user.is_active)

    return true

  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Ejecutar la función
createDiegoUser()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ¡Usuario Diego creado exitosamente!')
      console.log('🔐 Puedes iniciar sesión con:')
      console.log('   Email: diego@zonat.com')
      console.log('   Contraseña: admin123')
    } else {
      console.log('\n❌ Error creando el usuario')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
