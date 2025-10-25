-- Script para corregir la tabla company_config
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar columna nit si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'nit'
    ) THEN
        ALTER TABLE company_config ADD COLUMN nit VARCHAR(50);
    END IF;

    -- Agregar columna address si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE company_config ADD COLUMN address TEXT;
    END IF;

    -- Agregar columna phone si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE company_config ADD COLUMN phone VARCHAR(50);
    END IF;

    -- Agregar columna email si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE company_config ADD COLUMN email VARCHAR(255);
    END IF;

    -- Agregar columna logo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'logo'
    ) THEN
        ALTER TABLE company_config ADD COLUMN logo VARCHAR(500);
    END IF;

    -- Agregar columna dian_resolution si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'dian_resolution'
    ) THEN
        ALTER TABLE company_config ADD COLUMN dian_resolution VARCHAR(255);
    END IF;

    -- Agregar columna numbering_range si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_config' 
        AND column_name = 'numbering_range'
    ) THEN
        ALTER TABLE company_config ADD COLUMN numbering_range VARCHAR(100);
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_company_config_nit ON company_config(nit);
CREATE INDEX IF NOT EXISTS idx_company_config_email ON company_config(email);

-- Habilitar RLS (Row Level Security) si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'company_config' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas RLS solo si no existen
DO $$
BEGIN
    -- Política de lectura
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_config' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON company_config
            FOR SELECT USING (true);
    END IF;

    -- Política de inserción
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_config' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON company_config
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Política de actualización
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_config' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON company_config
            FOR UPDATE USING (true);
    END IF;

    -- Política de eliminación
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_config' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON company_config
            FOR DELETE USING (true);
    END IF;
END $$;

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

-- Verificar la estructura final
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
