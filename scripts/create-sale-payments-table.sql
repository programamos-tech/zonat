-- Crear tabla para manejar pagos mixtos de ventas
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL, -- 'cash', 'transfer', 'credit', 'warranty'
  amount DECIMAL(10,2) NOT NULL,
  reference VARCHAR(255), -- Número de transferencia, referencia de pago, etc.
  notes TEXT, -- Notas adicionales sobre el pago
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_payment_type ON sale_payments(payment_type);

-- Agregar comentarios para documentación
COMMENT ON TABLE sale_payments IS 'Tabla para manejar pagos mixtos y múltiples métodos de pago por venta';
COMMENT ON COLUMN sale_payments.payment_type IS 'Tipo de pago: cash, transfer, credit, warranty';
COMMENT ON COLUMN sale_payments.amount IS 'Monto específico para este método de pago';
COMMENT ON COLUMN sale_payments.reference IS 'Referencia del pago (número de transferencia, etc.)';
COMMENT ON COLUMN sale_payments.notes IS 'Notas adicionales sobre el pago';
