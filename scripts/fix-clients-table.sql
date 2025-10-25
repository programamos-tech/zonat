-- Script para verificar y corregir la tabla clients
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar columna city si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE clients ADD COLUMN city VARCHAR(255);
    END IF;

    -- Agregar columna state si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE clients ADD COLUMN state VARCHAR(255);
    END IF;

    -- Agregar columna postal_code si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE clients ADD COLUMN postal_code VARCHAR(20);
    END IF;

    -- Agregar columna country si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE clients ADD COLUMN country VARCHAR(255) DEFAULT 'Colombia';
    END IF;

    -- Agregar columna notes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
    END IF;

    -- Agregar columna status si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;

    -- Agregar columna is_active si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Habilitar RLS (Row Level Security) si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'clients' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas RLS solo si no existen
DO $$
BEGIN
    -- Política de lectura
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON clients
            FOR SELECT USING (true);
    END IF;

    -- Política de inserción
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON clients
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Política de actualización
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON clients
            FOR UPDATE USING (true);
    END IF;

    -- Política de eliminación
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON clients
            FOR DELETE USING (true);
    END IF;
END $$;

-- Verificar la estructura final
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
