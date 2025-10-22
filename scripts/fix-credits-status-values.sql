-- Script para arreglar los valores de status en la tabla credits
-- Ejecutar este script en Supabase SQL Editor

-- Paso 1: Ver qué valores de status existen actualmente
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;

-- Paso 2: Actualizar valores problemáticos
-- Cambiar 'partial' a 'pending' (asumiendo que partial significa pendiente)
UPDATE credits 
SET status = 'pending' 
WHERE status = 'partial';

-- Cambiar cualquier otro valor no estándar a 'pending'
UPDATE credits 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'completed', 'cancelled');

-- Paso 3: Verificar que todos los valores son correctos
SELECT status, COUNT(*) as count
FROM credits 
GROUP BY status
ORDER BY status;

-- Paso 4: Ahora sí, eliminar el constraint existente
ALTER TABLE credits DROP CONSTRAINT IF EXISTS credits_status_check;

-- Paso 5: Crear el nuevo constraint que incluya 'cancelled'
ALTER TABLE credits 
ADD CONSTRAINT credits_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Paso 6: Verificar que el constraint se aplicó correctamente
-- Usar conbin en lugar de consrc para compatibilidad
SELECT conname, conbin 
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass 
AND conname = 'credits_status_check';
