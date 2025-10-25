-- Script para verificar y corregir las restricciones PRIMARY KEY
-- Ejecutar este script en el SQL Editor de Supabase

-- =============================================
-- VERIFICAR RESTRICCIONES ACTUALES
-- =============================================

-- Verificar las restricciones de las tablas principales
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- =============================================
-- AGREGAR PRIMARY KEYS SI FALTAN
-- =============================================

-- Verificar si sales tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sales' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to sales table';
    ELSE
        RAISE NOTICE 'sales table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si sale_items tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sale_items' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE sale_items ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to sale_items table';
    ELSE
        RAISE NOTICE 'sale_items table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si warranties tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'warranties' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE warranties ADD CONSTRAINT warranties_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to warranties table';
    ELSE
        RAISE NOTICE 'warranties table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si payments tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payments' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to payments table';
    ELSE
        RAISE NOTICE 'payments table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si credits tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'credits' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE credits ADD CONSTRAINT credits_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to credits table';
    ELSE
        RAISE NOTICE 'credits table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si warranty_products tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'warranty_products' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE warranty_products ADD CONSTRAINT warranty_products_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to warranty_products table';
    ELSE
        RAISE NOTICE 'warranty_products table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si warranty_status_history tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'warranty_status_history' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE warranty_status_history ADD CONSTRAINT warranty_status_history_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to warranty_status_history table';
    ELSE
        RAISE NOTICE 'warranty_status_history table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si payment_records tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payment_records' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_records ADD CONSTRAINT payment_records_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to payment_records table';
    ELSE
        RAISE NOTICE 'payment_records table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si sale_payments tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sale_payments' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to sale_payments table';
    ELSE
        RAISE NOTICE 'sale_payments table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si company_config tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'company_config' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE company_config ADD CONSTRAINT company_config_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to company_config table';
    ELSE
        RAISE NOTICE 'company_config table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si logs tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'logs' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE logs ADD CONSTRAINT logs_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to logs table';
    ELSE
        RAISE NOTICE 'logs table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si products tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to products table';
    ELSE
        RAISE NOTICE 'products table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si clients tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to clients table';
    ELSE
        RAISE NOTICE 'clients table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si categories tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'categories' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to categories table';
    ELSE
        RAISE NOTICE 'categories table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si users tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to users table';
    ELSE
        RAISE NOTICE 'users table already has PRIMARY KEY';
    END IF;
END $$;

-- Verificar si roles tiene PRIMARY KEY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'roles' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to roles table';
    ELSE
        RAISE NOTICE 'roles table already has PRIMARY KEY';
    END IF;
END $$;

-- Mostrar todas las restricciones PRIMARY KEY después de la corrección
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;
