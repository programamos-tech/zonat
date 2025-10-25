-- Script para verificar la estructura actual de company_config
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;
