-- Ejecutar este SQL en el SQL Editor de Supabase

-- Crear tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nit VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  dian_resolution VARCHAR(255),
  numbering_range VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración de Zona T
INSERT INTO company_config (
  name, 
  nit, 
  address, 
  phone, 
  email, 
  logo, 
  dian_resolution, 
  numbering_range
) VALUES (
  'Zona T',
  '1035770226-9',
  'Carrera 20 #22-02, Sincelejo, Sucre',
  '3135206736',
  'info@zonat.com',
  '/zonat-logo.png',
  NULL,
  NULL
) ON CONFLICT (id) DO NOTHING;
