-- Script simplificado para agregar SOLO las columnas faltantes
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columnas de anulación a la tabla payment_records
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Agregar columnas de anulación a la tabla credits
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Agregar columnas de anulación a la tabla payments (sistema antiguo)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
