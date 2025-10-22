-- Agregar columnas para el usuario que creó el crédito
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);

-- Agregar comentarios a las nuevas columnas
COMMENT ON COLUMN credits.created_by IS 'ID del usuario que creó el crédito';
COMMENT ON COLUMN credits.created_by_name IS 'Nombre del usuario que creó el crédito';
