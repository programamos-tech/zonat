-- Script para limpiar usuarios Diego duplicados
-- Ejecutar este script en el SQL Editor de Supabase

-- Ver usuarios Diego actuales
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'diego@zonat.com'
ORDER BY created_at;

-- Eliminar el usuario más reciente (el duplicado)
-- Mantener el primero que se creó
DELETE FROM users 
WHERE email = 'diego@zonat.com' 
AND id = '953c5571-557e-4fc0-b36a-670561750d63';

-- Verificar que solo queda un usuario Diego
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'diego@zonat.com';
