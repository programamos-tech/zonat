import { supabase } from './supabase'
import { CompanyConfig } from '@/types'

export class CompanyService {
  // Obtener configuración de la empresa
  static async getCompanyConfig(): Promise<CompanyConfig | null> {
    try {
      const { data, error } = await supabase
        .from('company_config')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching company config:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        nit: data.nit,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo: data.logo,
        dianResolution: data.dian_resolution,
        numberingRange: data.numbering_range,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error in getCompanyConfig:', error)
      return null
    }
  }

  // Crear o actualizar configuración de la empresa
  static async upsertCompanyConfig(config: Partial<CompanyConfig>): Promise<CompanyConfig | null> {
    try {
      const configData = {
        name: config.name,
        nit: config.nit,
        address: config.address,
        phone: config.phone,
        email: config.email,
        logo: config.logo,
        dian_resolution: config.dianResolution,
        numbering_range: config.numberingRange,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('company_config')
        .upsert(configData, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('Error upserting company config:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        nit: data.nit,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo: data.logo,
        dianResolution: data.dian_resolution,
        numberingRange: data.numbering_range,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error in upsertCompanyConfig:', error)
      return null
    }
  }

  // Inicializar configuración por defecto de Zona T
  static async initializeDefaultConfig(): Promise<CompanyConfig | null> {
    const defaultConfig = {
      name: 'Zona T',
      nit: '1035770226-9',
      address: 'Carrera 20 #22-02, Sincelejo, Sucre',
      phone: '3135206736',
      email: 'info@zonat.com',
      logo: '/zonat-logo.png',
      dianResolution: undefined,
      numberingRange: undefined
    }

    try {
      // Intentar crear la configuración directamente
      const { data, error } = await supabase
        .from('company_config')
        .insert([{
          name: defaultConfig.name,
          nit: defaultConfig.nit,
          address: defaultConfig.address,
          phone: defaultConfig.phone,
          email: defaultConfig.email,
          logo: defaultConfig.logo,
          dian_resolution: defaultConfig.dianResolution,
          numbering_range: defaultConfig.numberingRange
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating default config:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        nit: data.nit,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logo: data.logo,
        dianResolution: data.dian_resolution,
        numberingRange: data.numbering_range,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error in initializeDefaultConfig:', error)
      return null
    }
  }
}
