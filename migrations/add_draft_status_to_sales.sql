-- Migración: Agregar status 'draft' a la tabla sales
-- Fecha: 2024
-- Descripción: Permite crear facturas borrador agregando 'draft' como valor válido en el campo status

-- Paso 1: Si existe un constraint CHECK en la columna status, primero debemos eliminarlo
-- Nota: El nombre del constraint puede variar, ajusta según tu esquema
DO $$ 
BEGIN
    -- Intentar eliminar constraint si existe (ajusta el nombre según tu esquema)
    ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
    ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_sales_status;
    ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_constraint;
EXCEPTION
    WHEN undefined_object THEN
        -- Si el constraint no existe, continuar
        NULL;
END $$;

-- Paso 2: Si la columna status es de tipo ENUM, necesitamos agregar el valor 'draft'
-- Opción A: Si es un tipo ENUM (PostgreSQL)
DO $$ 
BEGIN
    -- Verificar si existe el tipo enum y agregar 'draft' si no existe
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'sale_status_enum'
    ) THEN
        -- Agregar 'draft' al enum si no existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'draft' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sale_status_enum')
        ) THEN
            ALTER TYPE sale_status_enum ADD VALUE 'draft';
        END IF;
    END IF;
END $$;

-- Paso 3: Si la columna es VARCHAR/TEXT con CHECK constraint, crear nuevo constraint
-- Esto permite: 'pending', 'completed', 'cancelled', 'draft'
ALTER TABLE sales 
ADD CONSTRAINT sales_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'draft'));

-- Verificar que la migración se aplicó correctamente
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'sales' AND column_name = 'status';

