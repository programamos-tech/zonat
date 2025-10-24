-- Script para arreglar la restricción de email en la tabla clients
-- Este script permite múltiples emails vacíos pero mantiene la unicidad para emails válidos

-- 1. Eliminar la restricción UNIQUE existente
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- 2. Crear una nueva restricción UNIQUE que permita múltiples valores NULL/vacíos
-- En PostgreSQL, las restricciones UNIQUE permiten múltiples valores NULL
-- Pero necesitamos manejar strings vacíos de manera especial

-- 3. Crear un índice parcial que solo aplique a emails no vacíos
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique_non_empty 
ON clients (email) 
WHERE email IS NOT NULL AND email != '';

-- 4. Opcional: Crear un índice para mejorar búsquedas por email
CREATE INDEX IF NOT EXISTS idx_clients_email_search 
ON clients (email) 
WHERE email IS NOT NULL AND email != '';
