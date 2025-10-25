-- Script para agregar la columna last_payment_user a la tabla credits
-- Agregar columna last_payment_user si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'last_payment_user'
    ) THEN
        ALTER TABLE credits ADD COLUMN last_payment_user UUID;
    END IF;
END $$;

-- Crear índice para last_payment_user si no existe
CREATE INDEX IF NOT EXISTS idx_credits_last_payment_user ON credits(last_payment_user);

-- Verificar que la columna se agregó correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credits' 
AND column_name = 'last_payment_user';
