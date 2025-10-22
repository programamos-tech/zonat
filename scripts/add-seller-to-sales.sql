-- Agregar campos del vendedor a la tabla sales
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS seller_id TEXT,
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS seller_email TEXT;

-- Actualizar ventas existentes con información del vendedor por defecto
-- (Esto asume que el usuario admin es el que hizo las ventas anteriores)
UPDATE sales 
SET 
  seller_id = 'admin-user-id', -- Reemplaza con el ID real del usuario admin
  seller_name = 'Admin',
  seller_email = 'admin@zonat.com'
WHERE seller_id IS NULL;