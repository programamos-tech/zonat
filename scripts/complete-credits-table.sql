-- Script completo para corregir la tabla credits con todas las columnas necesarias
-- Primero verificar la estructura actual
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credits' 
ORDER BY ordinal_position;

-- Agregar todas las columnas faltantes
DO $$
BEGIN
    -- Agregar columna invoice_number si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'invoice_number'
    ) THEN
        ALTER TABLE credits ADD COLUMN invoice_number VARCHAR(100);
    END IF;

    -- Agregar columna created_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE credits ADD COLUMN created_by UUID;
    END IF;

    -- Agregar columna created_by_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'created_by_name'
    ) THEN
        ALTER TABLE credits ADD COLUMN created_by_name VARCHAR(255);
    END IF;

    -- Agregar columna updated_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE credits ADD COLUMN updated_by UUID;
    END IF;

    -- Agregar columna updated_by_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'updated_by_name'
    ) THEN
        ALTER TABLE credits ADD COLUMN updated_by_name VARCHAR(255);
    END IF;

    -- Agregar columna notes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE credits ADD COLUMN notes TEXT;
    END IF;

    -- Agregar columna due_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'due_date'
    ) THEN
        ALTER TABLE credits ADD COLUMN due_date DATE;
    END IF;

    -- Agregar columna interest_rate si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'interest_rate'
    ) THEN
        ALTER TABLE credits ADD COLUMN interest_rate DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna payment_frequency si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'payment_frequency'
    ) THEN
        ALTER TABLE credits ADD COLUMN payment_frequency VARCHAR(50) DEFAULT 'monthly';
    END IF;

    -- Agregar columna minimum_payment si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'minimum_payment'
    ) THEN
        ALTER TABLE credits ADD COLUMN minimum_payment DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna last_payment_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'last_payment_date'
    ) THEN
        ALTER TABLE credits ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna last_payment_amount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'last_payment_amount'
    ) THEN
        ALTER TABLE credits ADD COLUMN last_payment_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna next_payment_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'next_payment_date'
    ) THEN
        ALTER TABLE credits ADD COLUMN next_payment_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna total_paid si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'total_paid'
    ) THEN
        ALTER TABLE credits ADD COLUMN total_paid DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna payment_count si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'payment_count'
    ) THEN
        ALTER TABLE credits ADD COLUMN payment_count INTEGER DEFAULT 0;
    END IF;

    -- Agregar columna is_overdue si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'is_overdue'
    ) THEN
        ALTER TABLE credits ADD COLUMN is_overdue BOOLEAN DEFAULT false;
    END IF;

    -- Agregar columna overdue_days si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'overdue_days'
    ) THEN
        ALTER TABLE credits ADD COLUMN overdue_days INTEGER DEFAULT 0;
    END IF;

    -- Agregar columna credit_score si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'credit_score'
    ) THEN
        ALTER TABLE credits ADD COLUMN credit_score INTEGER;
    END IF;

    -- Agregar columna risk_level si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE credits ADD COLUMN risk_level VARCHAR(50) DEFAULT 'medium';
    END IF;

    -- Agregar columna tags si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE credits ADD COLUMN tags TEXT[];
    END IF;

    -- Agregar columna metadata si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE credits ADD COLUMN metadata JSONB;
    END IF;

    -- Agregar columna payment_method si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE credits ADD COLUMN payment_method VARCHAR(50) DEFAULT 'credit';
    END IF;

    -- Agregar columna payment_terms si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'payment_terms'
    ) THEN
        ALTER TABLE credits ADD COLUMN payment_terms VARCHAR(255);
    END IF;

    -- Agregar columna discount_percentage si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'discount_percentage'
    ) THEN
        ALTER TABLE credits ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna discount_amount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE credits ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna tax_percentage si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'tax_percentage'
    ) THEN
        ALTER TABLE credits ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna tax_amount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE credits ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna subtotal si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE credits ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna total_amount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE credits ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna pending_amount si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'pending_amount'
    ) THEN
        ALTER TABLE credits ADD COLUMN pending_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;

    -- Agregar columna currency si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE credits ADD COLUMN currency VARCHAR(10) DEFAULT 'COP';
    END IF;

    -- Agregar columna exchange_rate si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'exchange_rate'
    ) THEN
        ALTER TABLE credits ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 1.0000;
    END IF;

    -- Agregar columna is_active si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE credits ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Agregar columna is_cancelled si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'is_cancelled'
    ) THEN
        ALTER TABLE credits ADD COLUMN is_cancelled BOOLEAN DEFAULT false;
    END IF;

    -- Agregar columna cancelled_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE credits ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Agregar columna cancelled_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE credits ADD COLUMN cancelled_by UUID;
    END IF;

    -- Agregar columna cancellation_reason si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE credits ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_credits_client_id ON credits(client_id);
CREATE INDEX IF NOT EXISTS idx_credits_sale_id ON credits(sale_id);
CREATE INDEX IF NOT EXISTS idx_credits_invoice_number ON credits(invoice_number);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_created_by ON credits(created_by);
CREATE INDEX IF NOT EXISTS idx_credits_due_date ON credits(due_date);
CREATE INDEX IF NOT EXISTS idx_credits_is_overdue ON credits(is_overdue);
CREATE INDEX IF NOT EXISTS idx_credits_is_active ON credits(is_active);
CREATE INDEX IF NOT EXISTS idx_credits_is_cancelled ON credits(is_cancelled);

-- Verificar la estructura final
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credits' 
ORDER BY ordinal_position;
