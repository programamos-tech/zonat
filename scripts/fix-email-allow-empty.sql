-- Script para permitir emails vacíos en la tabla clients
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Eliminar la restricción UNIQUE existente
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- 2. Permitir valores NULL en la columna email
ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;

-- 3. Crear un índice único parcial que solo aplique a emails no vacíos
-- Esto permite múltiples emails NULL/vacíos, pero mantiene unicidad para emails válidos
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique_non_empty
ON clients (email)
WHERE email IS NOT NULL AND email != '';
