// Script para verificar los créditos más recientes
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecentCredits() {
  console.log('🔍 Verificando los créditos más recientes...\n')

  try {
    // Obtener los créditos más recientes
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (creditsError) {
      console.error('❌ Error al obtener créditos:', creditsError.message)
      return
    }

    console.log('📋 Créditos más recientes:')
    credits.forEach((credit, index) => {
      console.log(`\n${index + 1}. Crédito ${credit.invoice_number}:`)
      console.log(`   - ID: ${credit.id}`)
      console.log(`   - Status: "${credit.status}"`)
      console.log(`   - Total: $${credit.total_amount?.toLocaleString()}`)
      console.log(`   - Pagado: $${credit.paid_amount?.toLocaleString()}`)
      console.log(`   - Pendiente: $${credit.pending_amount?.toLocaleString()}`)
      console.log(`   - Creado: ${credit.created_at}`)
      console.log(`   - Actualizado: ${credit.updated_at}`)
      if (credit.cancelled_at) {
        console.log(`   - Anulado: ${credit.cancelled_at}`)
        console.log(`   - Anulado por: ${credit.cancelled_by_name}`)
        console.log(`   - Motivo: ${credit.cancellation_reason}`)
      }
    })

    // Verificar si hay algún crédito que debería estar activo pero está anulado
    const activeCredits = credits.filter(credit => 
      credit.status === 'cancelled' && 
      credit.cancelled_at && 
      new Date(credit.cancelled_at) > new Date(Date.now() - 60000) // Último minuto
    )

    if (activeCredits.length > 0) {
      console.log('\n⚠️ Créditos anulados recientemente:')
      activeCredits.forEach(credit => {
        console.log(`   - ${credit.invoice_number}: anulado hace ${Math.round((Date.now() - new Date(credit.cancelled_at).getTime()) / 1000)} segundos`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkRecentCredits()
