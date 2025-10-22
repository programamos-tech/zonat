-- Script para corregir específicamente los créditos con status 'partial'
-- Ejecutar este script en Supabase SQL Editor

-- Ver el estado actual
SELECT 'Estado actual:' as info;
SELECT invoice_number, status 
FROM credits 
WHERE status = 'partial'
ORDER BY invoice_number;

-- Corregir específicamente los créditos #070 y #069
UPDATE credits 
SET status = 'pending' 
WHERE invoice_number = '#070' AND status = 'partial';

UPDATE credits 
SET status = 'pending' 
WHERE invoice_number = '#069' AND status = 'partial';

-- Verificar que se corrigieron
SELECT 'Después de la corrección:' as info;
SELECT invoice_number, status 
FROM credits 
WHERE invoice_number IN ('#070', '#069')
ORDER BY invoice_number;

-- Verificar que no hay más valores 'partial'
SELECT 'Verificando que no hay más valores partial:' as info;
SELECT COUNT(*) as partial_count
FROM credits 
WHERE status = 'partial';

-- Ahora probar que podemos actualizar a 'cancelled'
SELECT 'Probando actualización a cancelled:' as info;
UPDATE credits 
SET status = 'cancelled' 
WHERE invoice_number = '#075' AND status = 'pending'
LIMIT 1;

-- Verificar el resultado final
SELECT 'Resultado final:' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;
