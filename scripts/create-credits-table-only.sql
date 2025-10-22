-- Crear solo la tabla de créditos (si no existe)
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
  due_date DATE,
  last_payment_amount DECIMAL(12,2),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_user VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para la tabla credits
CREATE INDEX IF NOT EXISTS idx_credits_client_id ON credits(client_id);
CREATE INDEX IF NOT EXISTS idx_credits_sale_id ON credits(sale_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_due_date ON credits(due_date);

-- Crear función para actualizar updated_at automáticamente (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at en credits
DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;
CREATE TRIGGER update_credits_updated_at 
    BEFORE UPDATE ON credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios en la tabla
COMMENT ON TABLE credits IS 'Tabla para gestionar los créditos otorgados a los clientes';
COMMENT ON COLUMN credits.sale_id IS 'ID de la venta asociada al crédito';
COMMENT ON COLUMN credits.client_id IS 'ID del cliente que tiene el crédito';
COMMENT ON COLUMN credits.total_amount IS 'Monto total del crédito';
COMMENT ON COLUMN credits.paid_amount IS 'Monto total pagado hasta la fecha';
COMMENT ON COLUMN credits.pending_amount IS 'Monto pendiente de pago';
COMMENT ON COLUMN credits.status IS 'Estado del crédito: pending, partial, completed, overdue';
COMMENT ON COLUMN credits.due_date IS 'Fecha de vencimiento del crédito';
