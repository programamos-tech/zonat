-- Crear tabla para registros de pago de créditos
CREATE TABLE IF NOT EXISTS credit_payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'mixed')),
  cash_amount DECIMAL(12,2),
  transfer_amount DECIMAL(12,2),
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_credit_payment_records_credit_id ON credit_payment_records(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_payment_records_payment_date ON credit_payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_credit_payment_records_user_id ON credit_payment_records(user_id);

-- Comentarios en la tabla
COMMENT ON TABLE credit_payment_records IS 'Tabla para registrar los abonos realizados por los clientes en créditos';
COMMENT ON COLUMN credit_payment_records.credit_id IS 'ID del crédito al que pertenece el pago';
COMMENT ON COLUMN credit_payment_records.amount IS 'Monto total del abono';
COMMENT ON COLUMN credit_payment_records.payment_method IS 'Método de pago: cash, transfer, mixed';
COMMENT ON COLUMN credit_payment_records.cash_amount IS 'Monto pagado en efectivo (para pagos mixtos)';
COMMENT ON COLUMN credit_payment_records.transfer_amount IS 'Monto pagado por transferencia (para pagos mixtos)';
