-- Script para crear la tabla company_config
CREATE TABLE IF NOT EXISTS company_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    nit VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo VARCHAR(500),
    dian_resolution VARCHAR(255),
    numbering_range VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_company_config_nit ON company_config(nit);
CREATE INDEX IF NOT EXISTS idx_company_config_email ON company_config(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Enable read access for all users" ON company_config
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON company_config
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON company_config
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON company_config
    FOR DELETE USING (true);

-- Insertar configuración por defecto si no existe
INSERT INTO company_config (
    id,
    name,
    nit,
    address,
    phone,
    email,
    logo,
    dian_resolution,
    numbering_range
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Zonat - Más Que Jugos',
    '900123456-1',
    'Calle 123 #45-67, Bogotá, Colombia',
    '+57 1 234 5678',
    'info@zonat.com',
    '/zonat-logo.png',
    'Resolución DIAN 12345',
    '1-1000'
) ON CONFLICT (id) DO NOTHING;

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;

-- Verificar que se insertó la configuración por defecto
SELECT * FROM company_config;
