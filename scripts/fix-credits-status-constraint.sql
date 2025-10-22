-- Script para arreglar el constraint de status en la tabla credits
-- Ejecutar este script en Supabase SQL Editor

-- Primero, eliminar el constraint existente
ALTER TABLE credits DROP CONSTRAINT IF EXISTS credits_status_check;

-- Crear el nuevo constraint que incluya 'cancelled'
ALTER TABLE credits 
ADD CONSTRAINT credits_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Verificar que el constraint se aplicó correctamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';
