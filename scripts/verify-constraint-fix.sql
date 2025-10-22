-- Script simple para verificar que el constraint se aplicó correctamente
-- Ejecutar este script en Supabase SQL Editor

-- Verificar que el constraint existe
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';

-- Probar que podemos actualizar a 'cancelled'
-- (Esto debería funcionar si el constraint está correcto)
UPDATE credits 
SET status = 'pending' 
WHERE status = 'cancelled' 
LIMIT 1;

-- Verificar los valores de status actuales
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;
