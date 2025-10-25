-- Script para exportar el esquema completo de Supabase
-- Ejecutar en SQL Editor de Supabase

-- 1. Exportar estructura de tablas
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_table_sql
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 2. Exportar políticas RLS
SELECT 
    'CREATE POLICY ' || policyname || ' ON ' || schemaname || '.' || tablename ||
    ' FOR ' || cmd ||
    CASE 
        WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ')
        ELSE ''
    END ||
    CASE 
        WHEN qual IS NOT NULL THEN ' USING (' || qual || ')'
        ELSE ''
    END ||
    CASE 
        WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')'
        ELSE ''
    END || ';' as create_policy_sql
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Exportar funciones
SELECT 
    'CREATE OR REPLACE FUNCTION ' || routine_name || '(' ||
    string_agg(
        parameter_name || ' ' || data_type,
        ', '
    ) || ') RETURNS ' || return_type || ' AS $$' ||
    routine_definition || '$$ LANGUAGE ' || routine_language || ';' as create_function_sql
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. Exportar índices
SELECT 
    'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename ||
    ' (' || indexdef || ');' as create_index_sql
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
