-- Remove payment-related tables and types
-- This migration removes payment functionality from the water management system

-- Drop payment-related tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Drop payment-related types
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;

-- Update service_items table to remove pricing fields (keep for material tracking only)
ALTER TABLE service_items 
DROP COLUMN IF EXISTS unit_price CASCADE,
DROP COLUMN IF EXISTS total_price CASCADE;

-- Remove payment-related indexes
DROP INDEX IF EXISTS idx_invoices_customer_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_payments_invoice_id;

-- Remove payment-related triggers
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS set_invoice_number ON invoices;

-- Remove payment-related functions
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;

-- Update customers table to remove billing-specific fields if needed
-- (keeping billing_address as it might be used for service address)

-- Remove unit_price from products table as it's not needed without billing
ALTER TABLE products 
DROP COLUMN IF EXISTS unit_price CASCADE;

-- Update RLS policies to remove invoice-related policies
DROP POLICY IF EXISTS "Customers can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Accounts staff can manage invoices" ON invoices;

-- Add a notes field to services for any cost-related tracking if needed
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS cost_notes TEXT; 