-- Script para crear el usuario de Diego en la base de datos
-- Ejecutar este script en el SQL Editor de Supabase

-- Crear usuario Diego
INSERT INTO users (
  name,
  email,
  password,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Diego',
  'diego@zonat.com',
  'admin123',
  'Super Admin',
  '[
    {
      "module": "dashboard",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "products",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "clients",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "sales",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "payments",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "warranties",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "roles",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    },
    {
      "module": "logs",
      "permissions": ["view", "create", "edit", "delete", "cancel"]
    }
  ]'::jsonb,
  true,
  NOW(),
  NOW()
);

-- Verificar que el usuario se creó correctamente
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'diego@zonat.com';
