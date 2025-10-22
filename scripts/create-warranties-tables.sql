-- Crear tabla de garantías
CREATE TABLE IF NOT EXISTS warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  product_received_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_received_name VARCHAR(255) NOT NULL,
  product_received_serial VARCHAR(255), -- Número de serie del producto defectuoso
  product_delivered_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Producto nuevo entregado
  product_delivered_name VARCHAR(255),
  reason TEXT NOT NULL, -- Motivo de la garantía
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected', 'discarded'
  notes TEXT, -- Notas adicionales
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Crear tabla de productos de garantía (merma)
CREATE TABLE IF NOT EXISTS warranty_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES warranties(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serial_number VARCHAR(255),
  condition VARCHAR(50) NOT NULL DEFAULT 'defective', -- 'defective', 'repaired', 'discarded'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial de estados de garantías
CREATE TABLE IF NOT EXISTS warranty_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES warranties(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_warranties_original_sale_id ON warranties(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_warranties_client_id ON warranties(client_id);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties(status);
CREATE INDEX IF NOT EXISTS idx_warranties_created_at ON warranties(created_at);
CREATE INDEX IF NOT EXISTS idx_warranty_products_warranty_id ON warranty_products(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_products_condition ON warranty_products(condition);
CREATE INDEX IF NOT EXISTS idx_warranty_status_history_warranty_id ON warranty_status_history(warranty_id);

-- Agregar comentarios para documentación
COMMENT ON TABLE warranties IS 'Tabla principal de garantías asociadas a ventas';
COMMENT ON TABLE warranty_products IS 'Productos defectuosos recibidos por garantías (merma)';
COMMENT ON TABLE warranty_status_history IS 'Historial de cambios de estado de garantías';

COMMENT ON COLUMN warranties.original_sale_id IS 'ID de la venta original que generó la garantía';
COMMENT ON COLUMN warranties.product_received_id IS 'ID del producto defectuoso recibido';
COMMENT ON COLUMN warranties.product_delivered_id IS 'ID del producto nuevo entregado';
COMMENT ON COLUMN warranties.status IS 'Estado actual: pending, in_progress, completed, rejected, discarded';
COMMENT ON COLUMN warranty_products.condition IS 'Condición del producto: defective, repaired, discarded';
