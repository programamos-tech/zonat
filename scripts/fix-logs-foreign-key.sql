-- Script para agregar la foreign key entre logs y users
-- Verificar si la foreign key ya existe
DO $$
BEGIN
    -- Verificar si la foreign key logs_user_id_fkey ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'logs_user_id_fkey' 
        AND table_name = 'logs'
    ) THEN
        -- Agregar la foreign key
        ALTER TABLE logs 
        ADD CONSTRAINT logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key logs_user_id_fkey agregada exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key logs_user_id_fkey ya existe';
    END IF;
END $$;

-- Verificar que la foreign key se creó correctamente
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'logs'
    AND tc.constraint_name = 'logs_user_id_fkey';
