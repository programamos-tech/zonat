-- Script para agregar columnas de anulación a las tablas de créditos y abonos
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columnas de anulación a la tabla credits
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Agregar columnas de anulación a la tabla payment_records
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_cancelled_at ON credits(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_cancelled_at ON payment_records(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_cancelled_at ON payments(cancelled_at);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN credits.status IS 'Estado del crédito: pending, completed, cancelled';
COMMENT ON COLUMN credits.cancelled_at IS 'Fecha y hora de anulación del crédito';
COMMENT ON COLUMN credits.cancelled_by IS 'ID del usuario que anuló el crédito';
COMMENT ON COLUMN credits.cancelled_by_name IS 'Nombre del usuario que anuló el crédito';
COMMENT ON COLUMN credits.cancellation_reason IS 'Motivo de la anulación del crédito';

COMMENT ON COLUMN payment_records.status IS 'Estado del abono: active, cancelled';
COMMENT ON COLUMN payment_records.cancelled_at IS 'Fecha y hora de anulación del abono';
COMMENT ON COLUMN payment_records.cancelled_by IS 'ID del usuario que anuló el abono';
COMMENT ON COLUMN payment_records.cancelled_by_name IS 'Nombre del usuario que anuló el abono';
COMMENT ON COLUMN payment_records.cancellation_reason IS 'Motivo de la anulación del abono';

COMMENT ON COLUMN payments.status IS 'Estado del pago: active, cancelled';
COMMENT ON COLUMN payments.cancelled_at IS 'Fecha y hora de anulación del pago';
COMMENT ON COLUMN payments.cancelled_by IS 'ID del usuario que anuló el pago';
COMMENT ON COLUMN payments.cancelled_by_name IS 'Nombre del usuario que anuló el pago';
COMMENT ON COLUMN payments.cancellation_reason IS 'Motivo de la anulación del pago';
