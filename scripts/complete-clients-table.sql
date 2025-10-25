-- Script completo para corregir la tabla clients con todas las columnas necesarias
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Agregar todas las columnas faltantes
DO $$
BEGIN
    -- Agregar columna type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE clients ADD COLUMN type VARCHAR(50) DEFAULT 'individual';
    END IF;

    -- Agregar columna city si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE clients ADD COLUMN city VARCHAR(255);
    END IF;

    -- Agregar columna state si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE clients ADD COLUMN state VARCHAR(255);
    END IF;

    -- Agregar columna postal_code si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE clients ADD COLUMN postal_code VARCHAR(20);
    END IF;

    -- Agregar columna country si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE clients ADD COLUMN country VARCHAR(255) DEFAULT 'Colombia';
    END IF;

    -- Agregar columna notes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
    END IF;

    -- Agregar columna status si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;

    -- Agregar columna is_active si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Agregar columna credit_limit si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'credit_limit'
    ) THEN
        ALTER TABLE clients ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna current_debt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'current_debt'
    ) THEN
        ALTER TABLE clients ADD COLUMN current_debt DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna document_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'document_type'
    ) THEN
        ALTER TABLE clients ADD COLUMN document_type VARCHAR(50) DEFAULT 'CC';
    END IF;

    -- Agregar columna document_number si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'document_number'
    ) THEN
        ALTER TABLE clients ADD COLUMN document_number VARCHAR(50);
    END IF;

    -- Agregar columna birth_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE clients ADD COLUMN birth_date DATE;
    END IF;

    -- Agregar columna gender si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'gender'
    ) THEN
        ALTER TABLE clients ADD COLUMN gender VARCHAR(20);
    END IF;

    -- Agregar columna occupation si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'occupation'
    ) THEN
        ALTER TABLE clients ADD COLUMN occupation VARCHAR(255);
    END IF;

    -- Agregar columna company_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE clients ADD COLUMN company_name VARCHAR(255);
    END IF;

    -- Agregar columna tax_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'tax_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN tax_id VARCHAR(50);
    END IF;

    -- Agregar columna website si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE clients ADD COLUMN website VARCHAR(255);
    END IF;

    -- Agregar columna social_media si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'social_media'
    ) THEN
        ALTER TABLE clients ADD COLUMN social_media JSONB;
    END IF;

    -- Agregar columna preferences si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE clients ADD COLUMN preferences JSONB;
    END IF;

    -- Agregar columna tags si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE clients ADD COLUMN tags TEXT[];
    END IF;

    -- Agregar columna source si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE clients ADD COLUMN source VARCHAR(100);
    END IF;

    -- Agregar columna assigned_to si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE clients ADD COLUMN assigned_to UUID;
    END IF;

    -- Agregar columna last_contact si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'last_contact'
    ) THEN
        ALTER TABLE clients ADD COLUMN last_contact TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna next_follow_up si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'next_follow_up'
    ) THEN
        ALTER TABLE clients ADD COLUMN next_follow_up TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna total_purchases si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'total_purchases'
    ) THEN
        ALTER TABLE clients ADD COLUMN total_purchases DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna last_purchase si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'last_purchase'
    ) THEN
        ALTER TABLE clients ADD COLUMN last_purchase TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna average_order_value si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'average_order_value'
    ) THEN
        ALTER TABLE clients ADD COLUMN average_order_value DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna purchase_frequency si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'purchase_frequency'
    ) THEN
        ALTER TABLE clients ADD COLUMN purchase_frequency INTEGER DEFAULT 0;
    END IF;

    -- Agregar columna loyalty_points si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'loyalty_points'
    ) THEN
        ALTER TABLE clients ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;

    -- Agregar columna referral_code si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE clients ADD COLUMN referral_code VARCHAR(50);
    END IF;

    -- Agregar columna referred_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE clients ADD COLUMN referred_by UUID;
    END IF;

    -- Agregar columna created_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE clients ADD COLUMN created_by UUID;
    END IF;

    -- Agregar columna updated_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE clients ADD COLUMN updated_by UUID;
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_document_number ON clients(document_number);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);

-- Verificar la estructura final
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
