-- Script para agregar la columna invoice_number a la tabla credits
-- Agregar columna invoice_number si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'invoice_number'
    ) THEN
        ALTER TABLE credits ADD COLUMN invoice_number VARCHAR(100);
    END IF;
END $$;

-- Crear índice para invoice_number si no existe
CREATE INDEX IF NOT EXISTS idx_credits_invoice_number ON credits(invoice_number);

-- Verificar que la columna se agregó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credits' 
AND column_name = 'invoice_number';
