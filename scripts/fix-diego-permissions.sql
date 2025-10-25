-- Script para verificar y corregir los permisos de Diego
-- Ejecutar este script en el SQL Editor de Supabase

-- Verificar el usuario Diego actual
SELECT 
  id,
  name,
  email,
  role,
  permissions,
  is_active
FROM users 
WHERE email = 'diego@zonat.com';

-- Actualizar los permisos de Diego con el formato correcto
UPDATE users 
SET permissions = '[
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
role = 'Super Admin',
updated_at = NOW()
WHERE email = 'diego@zonat.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  name,
  email,
  role,
  permissions,
  is_active,
  updated_at
FROM users 
WHERE email = 'diego@zonat.com';
