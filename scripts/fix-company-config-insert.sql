-- Script para corregir el INSERT de company_config
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_config' 
ORDER BY ordinal_position;

-- Eliminar el registro existente si existe
DELETE FROM company_config WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insertar configuración por defecto con todas las columnas necesarias
INSERT INTO company_config (
    id,
    key,
    value,
    name,
    nit,
    address,
    phone,
    email,
    logo,
    dian_resolution,
    numbering_range
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'company_info',
    'default',
    'Zonat - Más Que Jugos',
    '900123456-1',
    'Calle 123 #45-67, Bogotá, Colombia',
    '+57 1 234 5678',
    'info@zonat.com',
    '/zonat-logo.png',
    'Resolución DIAN 12345',
    '1-1000'
);

-- Verificar que se insertó correctamente
SELECT * FROM company_config;
