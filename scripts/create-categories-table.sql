-- Script para crear la tabla categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON categories
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON categories
    FOR DELETE USING (true);

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;
