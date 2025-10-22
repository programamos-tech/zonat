-- Script para SOLO actualizar el constraint, sin tocar los datos existentes
-- Ejecutar este script en Supabase SQL Editor

-- Paso 1: Ver qué valores de status existen actualmente
SELECT 'Valores de status actuales:' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;

-- Paso 2: Ver el constraint actual
SELECT 'Constraint actual:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';

-- Paso 3: Eliminar el constraint existente
SELECT 'Eliminando constraint existente...' as info;
ALTER TABLE credits DROP CONSTRAINT IF EXISTS credits_status_check;

-- Paso 4: Crear el nuevo constraint que incluya 'cancelled'
SELECT 'Creando nuevo constraint con cancelled...' as info;
ALTER TABLE credits 
ADD CONSTRAINT credits_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'partial'));

-- Paso 5: Verificar que el nuevo constraint se aplicó
SELECT 'Verificando nuevo constraint...' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';

-- Paso 6: Probar que ahora podemos usar 'cancelled'
SELECT 'Probando que cancelled funciona...' as info;
UPDATE credits 
SET status = 'cancelled' 
WHERE invoice_number = '#075' AND status = 'pending';

-- Verificar el resultado
SELECT 'Resultado final:' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;
