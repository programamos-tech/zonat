-- Add last inventory timestamp to products
ALTER TABLE "public"."products"
ADD COLUMN IF NOT EXISTS "last_inventory_at" timestamp with time zone;

