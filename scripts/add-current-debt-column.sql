-- Script para agregar la columna current_debt a la tabla clients
-- Agregar columna current_debt si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'current_debt'
    ) THEN
        ALTER TABLE clients ADD COLUMN current_debt DECIMAL(15,2) DEFAULT 0.00;
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'current_debt';
