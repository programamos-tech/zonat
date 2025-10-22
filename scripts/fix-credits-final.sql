-- Script final para arreglar definitivamente el problema de credits
-- Ejecutar este script en Supabase SQL Editor

-- Paso 1: Ver el estado actual
SELECT 'Estado actual:' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;

-- Paso 2: Corregir TODOS los valores problemáticos
SELECT 'Corrigiendo valores problemáticos...' as info;

-- Cambiar 'partial' a 'pending'
UPDATE credits 
SET status = 'pending' 
WHERE status = 'partial';

-- Cambiar cualquier otro valor no estándar a 'pending'
UPDATE credits 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'completed', 'cancelled');

-- Paso 3: Verificar que todos los valores son correctos
SELECT 'Verificando corrección...' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;

-- Paso 4: Eliminar el constraint existente (si existe)
SELECT 'Eliminando constraint existente...' as info;
ALTER TABLE credits DROP CONSTRAINT IF EXISTS credits_status_check;

-- Paso 5: Crear el nuevo constraint
SELECT 'Creando nuevo constraint...' as info;
ALTER TABLE credits 
ADD CONSTRAINT credits_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Paso 6: Verificar que el constraint se aplicó
SELECT 'Verificando constraint...' as info;
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';

-- Paso 7: Probar que funciona
SELECT 'Probando constraint...' as info;
-- Esto debería funcionar ahora
UPDATE credits 
SET status = 'cancelled' 
WHERE status = 'pending' 
LIMIT 1;

-- Verificar el resultado final
SELECT 'Resultado final:' as info;
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;
