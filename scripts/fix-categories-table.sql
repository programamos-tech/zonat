-- Script para corregir la tabla categories
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Agregar la columna status si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE categories ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- Habilitar RLS (Row Level Security) si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'categories' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas RLS solo si no existen
DO $$
BEGIN
    -- Política de lectura
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON categories
            FOR SELECT USING (true);
    END IF;

    -- Política de inserción
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON categories
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Política de actualización
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON categories
            FOR UPDATE USING (true);
    END IF;

    -- Política de eliminación
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON categories
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
WHERE table_name = 'categories' 
ORDER BY ordinal_position;
