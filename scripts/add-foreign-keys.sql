-- Script para agregar las foreign keys faltantes
-- Ejecutar este script en el SQL Editor de Supabase

-- =============================================
-- AGREGAR FOREIGN KEYS
-- =============================================

-- 1. Foreign key para products.category_id -> categories.id
ALTER TABLE products 
ADD CONSTRAINT fk_products_category_id 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 2. Foreign key para sales.client_id -> clients.id
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. Foreign key para sale_items.sale_id -> sales.id
ALTER TABLE sale_items 
ADD CONSTRAINT fk_sale_items_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- 4. Foreign key para sale_items.product_id -> products.id
ALTER TABLE sale_items 
ADD CONSTRAINT fk_sale_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 5. Foreign key para payments.sale_id -> sales.id
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- 6. Foreign key para payments.client_id -> clients.id
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 7. Foreign key para payment_records.payment_id -> payments.id
ALTER TABLE payment_records 
ADD CONSTRAINT fk_payment_records_payment_id 
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

-- 8. Foreign key para payment_records.user_id -> users.id
ALTER TABLE payment_records 
ADD CONSTRAINT fk_payment_records_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. Foreign key para credits.sale_id -> sales.id
ALTER TABLE credits 
ADD CONSTRAINT fk_credits_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- 10. Foreign key para credits.client_id -> clients.id
ALTER TABLE credits 
ADD CONSTRAINT fk_credits_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 11. Foreign key para sale_payments.sale_id -> sales.id
ALTER TABLE sale_payments 
ADD CONSTRAINT fk_sale_payments_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- 12. Foreign key para warranties.original_sale_id -> sales.id
ALTER TABLE warranties 
ADD CONSTRAINT fk_warranties_original_sale_id 
FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- 13. Foreign key para warranties.client_id -> clients.id
ALTER TABLE warranties 
ADD CONSTRAINT fk_warranties_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 14. Foreign key para warranties.product_received_id -> products.id
ALTER TABLE warranties 
ADD CONSTRAINT fk_warranties_product_received_id 
FOREIGN KEY (product_received_id) REFERENCES products(id) ON DELETE CASCADE;

-- 15. Foreign key para warranties.product_delivered_id -> products.id
ALTER TABLE warranties 
ADD CONSTRAINT fk_warranties_product_delivered_id 
FOREIGN KEY (product_delivered_id) REFERENCES products(id) ON DELETE SET NULL;

-- 16. Foreign key para warranties.created_by -> users.id
ALTER TABLE warranties 
ADD CONSTRAINT fk_warranties_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 17. Foreign key para warranty_products.warranty_id -> warranties.id
ALTER TABLE warranty_products 
ADD CONSTRAINT fk_warranty_products_warranty_id 
FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE CASCADE;

-- 18. Foreign key para warranty_products.product_id -> products.id
ALTER TABLE warranty_products 
ADD CONSTRAINT fk_warranty_products_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 19. Foreign key para warranty_status_history.warranty_id -> warranties.id
ALTER TABLE warranty_status_history 
ADD CONSTRAINT fk_warranty_status_history_warranty_id 
FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE CASCADE;

-- 20. Foreign key para warranty_status_history.changed_by -> users.id
ALTER TABLE warranty_status_history 
ADD CONSTRAINT fk_warranty_status_history_changed_by 
FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 21. Foreign key para logs.user_id -> users.id
ALTER TABLE logs 
ADD CONSTRAINT fk_logs_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Verificar que las foreign keys se agregaron correctamente
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema='public'
ORDER BY tc.table_name, kcu.column_name;
