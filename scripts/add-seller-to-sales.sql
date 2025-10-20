-- Agregar campos de vendedor a la tabla de ventas
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);

-- Actualizar ventas existentes con un usuario por defecto (admin)
UPDATE sales 
SET 
  user_id = (SELECT id FROM users WHERE email = 'admin@zonat.com' LIMIT 1),
  user_name = 'Admin',
  user_email = 'admin@zonat.com'
WHERE user_id IS NULL;
