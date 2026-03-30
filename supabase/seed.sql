-- ============================================
-- DATOS DE PRUEBA PARA DESARROLLO LOCAL
-- ============================================
-- Este archivo se ejecuta automáticamente cuando haces: supabase db reset
-- Los datos aquí NO afectan producción ni zonat-dev
-- ============================================

-- ============================================
-- 1. CREAR ROL DE SUPERADMIN
-- ============================================
INSERT INTO roles (name, description, permissions, is_system) VALUES
('superadmin', 'Super Administrador con todos los permisos',
  '["all"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CREAR USUARIOS SUPERADMIN (local)
-- ============================================
-- Passwords: admin123 (texto plano para desarrollo local)
-- NOTA: La app usa comparación de texto plano (ver api/auth/login)
-- Emails: ps@zonat.com y diego@zonat.com (cualquiera sirve para entrar)
INSERT INTO users (name, email, password, role, permissions, is_active) VALUES
(
  'Super Admin',
  'ps@zonat.com',
  'admin123',
  'superadmin',
  '["all"]'::jsonb,
  true
),
(
  'Diego Admin',
  'diego@zonat.com',
  'admin123',
  'superadmin',
  '["all"]'::jsonb,
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. CREAR CATEGORÍAS
-- ============================================
INSERT INTO categories (name, description) VALUES
('Electrónica', 'Productos electrónicos y tecnología'),
('Electrodomésticos', 'Electrodomésticos para el hogar'),
('Computación', 'Computadoras y accesorios'),
('Telefonía', 'Teléfonos móviles y accesorios'),
('Audio y Video', 'Equipos de audio y video')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CREAR PRODUCTOS DE PRUEBA
-- ============================================
INSERT INTO products (name, description, category_id, brand, reference, price, cost, stock_warehouse, stock_store, status) VALUES
-- Electrónica
(
  'Laptop HP Pavilion 15',
  'Laptop HP Pavilion 15.6" Intel Core i5 8GB RAM 256GB SSD',
  (SELECT id FROM categories WHERE name = 'Computación' LIMIT 1),
  'HP',
  'LAP-HP-001',
  899.99,
  650.00,
  5,
  2,
  'active'
),
(
  'Mouse Logitech MX Master 3',
  'Mouse inalámbrico ergonómico con sensor de alta precisión',
  (SELECT id FROM categories WHERE name = 'Computación' LIMIT 1),
  'Logitech',
  'MOU-LOG-001',
  99.99,
  65.00,
  15,
  8,
  'active'
),
(
  'Teclado Mecánico Razer',
  'Teclado mecánico gaming RGB con switches Cherry MX',
  (SELECT id FROM categories WHERE name = 'Computación' LIMIT 1),
  'Razer',
  'TEC-RAZ-001',
  149.99,
  95.00,
  10,
  5,
  'active'
),
-- Telefonía
(
  'iPhone 14 Pro 128GB',
  'iPhone 14 Pro 6.1" 128GB Space Black',
  (SELECT id FROM categories WHERE name = 'Telefonía' LIMIT 1),
  'Apple',
  'IPH-APP-001',
  999.99,
  750.00,
  3,
  1,
  'active'
),
(
  'Samsung Galaxy S23',
  'Samsung Galaxy S23 6.1" 256GB Phantom Black',
  (SELECT id FROM categories WHERE name = 'Telefonía' LIMIT 1),
  'Samsung',
  'GAL-SAM-001',
  799.99,
  580.00,
  8,
  4,
  'active'
),
(
  'AirPods Pro 2da Gen',
  'Audífonos inalámbricos con cancelación de ruido activa',
  (SELECT id FROM categories WHERE name = 'Audio y Video' LIMIT 1),
  'Apple',
  'AIR-APP-001',
  249.99,
  175.00,
  20,
  12,
  'active'
),
-- Electrodomésticos
(
  'Refrigeradora Samsung 18 pies',
  'Refrigeradora French Door 18 pies cúbicos acero inoxidable',
  (SELECT id FROM categories WHERE name = 'Electrodomésticos' LIMIT 1),
  'Samsung',
  'REF-SAM-001',
  1299.99,
  920.00,
  2,
  1,
  'active'
),
(
  'Microondas LG 1.5 pies',
  'Microondas digital 1.5 pies cúbicos 1200W',
  (SELECT id FROM categories WHERE name = 'Electrodomésticos' LIMIT 1),
  'LG',
  'MIC-LG-001',
  199.99,
  135.00,
  6,
  3,
  'active'
),
-- Audio y Video
(
  'Smart TV Samsung 55"',
  'Smart TV Samsung 55" 4K UHD Crystal Display',
  (SELECT id FROM categories WHERE name = 'Audio y Video' LIMIT 1),
  'Samsung',
  'TV-SAM-001',
  549.99,
  380.00,
  4,
  2,
  'active'
),
(
  'Soundbar Sony HT-S400',
  'Barra de sonido 2.1 canales con subwoofer inalámbrico',
  (SELECT id FROM categories WHERE name = 'Audio y Video' LIMIT 1),
  'Sony',
  'SOU-SON-001',
  299.99,
  195.00,
  7,
  4,
  'active'
)
ON CONFLICT (reference) DO NOTHING;

-- ============================================
-- 5. CREAR CLIENTES DE PRUEBA
-- ============================================
INSERT INTO clients (name, email, phone, document, address, city, state, type, status) VALUES
('Juan Pérez', 'juan.perez@test.com', '809-555-0001', '001-0000001-1', 'Calle Principal #123', 'Santo Domingo', 'Santo Domingo', 'minorista', 'active'),
('María García', 'maria.garcia@test.com', '809-555-0002', '001-0000002-2', 'Av. Kennedy #456', 'Santo Domingo', 'Santo Domingo', 'mayorista', 'active'),
('Carlos Rodríguez', 'carlos.rodriguez@test.com', '809-555-0003', '001-0000003-3', 'Calle Duarte #789', 'Santiago', 'Santiago', 'consumidor_final', 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================
SELECT 'Seed completado exitosamente! 🌱' as message,
       (SELECT COUNT(*) FROM products) as productos_creados,
       (SELECT COUNT(*) FROM categories) as categorias_creadas,
       (SELECT COUNT(*) FROM users) as usuarios_creados,
       (SELECT COUNT(*) FROM clients) as clientes_creados;
