-- Script para agregar la columna credit_limit a la tabla clients
-- Agregar columna credit_limit si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'credit_limit'
    ) THEN
        ALTER TABLE clients ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0.00;
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
AND column_name = 'credit_limit';
