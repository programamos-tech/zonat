-- Script completo para crear TODAS las tablas necesarias
-- Ejecutar este script en el SQL Editor de Supabase

-- =============================================
-- 1. TABLA DE USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. TABLA DE ROLES
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. TABLA DE CLIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  document VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('mayorista', 'minorista', 'consumidor_final')),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  current_debt DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TABLA DE CATEGORÍAS
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. TABLA DE PRODUCTOS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID,
  brand VARCHAR(255),
  reference VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  cost DECIMAL(15,2) NOT NULL,
  stock_warehouse INTEGER DEFAULT 0,
  stock_store INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. TABLA DE VENTAS
-- =============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit', 'transfer', 'warranty', 'mixed')),
  invoice_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. TABLA DE ITEMS DE VENTA
-- =============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. TABLA DE PAGOS
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_payment_amount DECIMAL(12,2),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_user VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. TABLA DE REGISTROS DE PAGO
-- =============================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
  description TEXT,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 10. TABLA DE CRÉDITOS
-- =============================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 11. TABLA DE PAGOS DE VENTAS
-- =============================================
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('cash', 'transfer', 'credit')),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 12. TABLA DE GARANTÍAS
-- =============================================
CREATE TABLE IF NOT EXISTS warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_sale_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  product_received_id UUID NOT NULL,
  product_received_name VARCHAR(255) NOT NULL,
  product_received_serial VARCHAR(255),
  product_delivered_id UUID,
  product_delivered_name VARCHAR(255),
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'discarded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- =============================================
-- 13. TABLA DE PRODUCTOS DE GARANTÍA
-- =============================================
CREATE TABLE IF NOT EXISTS warranty_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL,
  product_id UUID NOT NULL,
  serial_number VARCHAR(255),
  condition VARCHAR(50) NOT NULL DEFAULT 'defective' CHECK (condition IN ('defective', 'repaired', 'discarded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 14. TABLA DE HISTORIAL DE ESTADOS DE GARANTÍAS
-- =============================================
CREATE TABLE IF NOT EXISTS warranty_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 15. TABLA DE CONFIGURACIÓN DE EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS company_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 16. TABLA DE LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar que todas las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
