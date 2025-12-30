-- Comprehensive Schema Fix Migration
-- This migration adds ALL missing tables and columns to align database with code expectations
-- Run this ONCE in Supabase SQL Editor

-- ============================================================================
-- PART 1: Fix Products Table - Add Missing Inventory Columns
-- ============================================================================

-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10 CHECK (min_stock_level >= 0),
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS sku VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 15;

-- Update existing products to have stock levels
UPDATE public.products 
SET current_stock = 0, 
    min_stock_level = 10, 
    max_stock_level = 100,
    status = 'active',
    unit = COALESCE(unit_type, 'piece'),
    reorder_point = 15
WHERE current_stock IS NULL;

-- ============================================================================
-- PART 2: Create Missing Inventory Management Tables
-- ============================================================================

-- Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    gstin VARCHAR(20),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_number VARCHAR(100),
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Alerts Table
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'partial', 'completed', 'cancelled')),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
    line_total DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Create Missing Driver Management Tables
-- ============================================================================

-- Driver Operations Log Table
CREATE TABLE IF NOT EXISTS public.driver_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('start_distribution', 'end_distribution', 'complaint_register', 'leave_request')),
    details JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES auth.users(id),
    approved_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================================
-- PART 4: Create Water Distributions View (Maps to existing distributions table)
-- ============================================================================

-- Create a view that maps the existing 'distributions' table to 'water_distributions' 
-- This allows code expecting 'water_distributions' to work without changing the table name
CREATE OR REPLACE VIEW public.water_distributions AS
SELECT 
    id,
    delivery_date as distribution_date,
    driver_id,
    customer_id,
    vehicle_id,
    quantity_delivered as total_liters,
    CASE 
        WHEN delivered_at IS NOT NULL THEN 'completed'
        ELSE status::text
    END as status,
    delivered_at as end_time,
    created_at as start_time,
    delivery_notes as route_details,
    created_at,
    updated_at
FROM public.distributions;

-- ============================================================================
-- PART 5: Fix Services Table - Add Priority Column
-- ============================================================================

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency'));

-- Set default priority based on service type or status
UPDATE public.services 
SET priority = 'medium' 
WHERE priority IS NULL;

-- ============================================================================
-- PART 6: Fix Vehicles Table - Add Notes Column
-- ============================================================================

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- PART 7: Add Foreign Key Constraints
-- ============================================================================

-- Add supplier foreign key to products if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_supplier_id_fkey'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_supplier_id_fkey 
        FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 8: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_current_stock ON public.products(current_stock);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON public.stock_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_driver_operations_driver ON public.driver_operations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_services_priority ON public.services(priority);

-- ============================================================================
-- PART 9: Enable RLS on New Tables
-- ============================================================================

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 10: Create RLS Policies
-- ============================================================================

-- Product Categories - Viewable by all, manageable by product managers
CREATE POLICY "Staff view product categories" ON public.product_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product managers manage categories" ON public.product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager')
        )
    );

-- Suppliers - Viewable by staff, manageable by product/accounts managers
CREATE POLICY "Staff view suppliers" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager', 'service_manager')
        )
    );

CREATE POLICY "Managers manage suppliers" ON public.suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager')
        )
    );

-- Inventory Movements - Viewable by relevant staff, manageable by product managers
CREATE POLICY "Staff view inventory movements" ON public.inventory_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'accounts_manager')
        )
    );

CREATE POLICY "Product managers manage movements" ON public.inventory_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager')
        )
    );

-- Stock Alerts - Similar to inventory movements
CREATE POLICY "Staff view stock alerts" ON public.stock_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager')
        )
    );

CREATE POLICY "Product managers manage alerts" ON public.stock_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager')
        )
    );

-- Driver Operations - Users can log their own, managers can view all
CREATE POLICY "Users log own operations" ON public.driver_operations
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users view own operations" ON public.driver_operations
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Managers view all operations" ON public.driver_operations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('driver_manager', 'admin')
        )
    );

-- Leave Requests - Employees manage own, managers approve
CREATE POLICY "Employees manage own leave" ON public.leave_requests
    FOR ALL USING (auth.uid() = employee_id);

CREATE POLICY "Managers handle leave requests" ON public.leave_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('driver_manager', 'admin', 'dept_head')
        )
    );

-- ============================================================================
-- PART 11: Create Triggers for Automatic Stock Management
-- ============================================================================

-- Function to update product stock on inventory movement
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'in' THEN
        UPDATE public.products 
        SET current_stock = current_stock + NEW.quantity,
            last_restocked = NOW(),
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'out' THEN
        UPDATE public.products 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'adjustment' THEN
        UPDATE public.products 
        SET current_stock = NEW.new_stock,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stock automatically
DROP TRIGGER IF EXISTS trigger_update_product_stock ON public.inventory_movements;
CREATE TRIGGER trigger_update_product_stock
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to generate stock alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for low stock
    IF NEW.current_stock <= NEW.min_stock_level AND NEW.current_stock > 0 THEN
        INSERT INTO public.stock_alerts (product_id, alert_type, priority, message)
        VALUES (
            NEW.id, 
            'low_stock', 
            CASE 
                WHEN NEW.current_stock <= (NEW.min_stock_level * 0.5) THEN 'high'
                ELSE 'medium'
            END,
            'Product ' || NEW.name || ' is running low on stock. Current: ' || NEW.current_stock || ', Minimum: ' || NEW.min_stock_level
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check for out of stock
    IF NEW.current_stock = 0 THEN
        INSERT INTO public.stock_alerts (product_id, alert_type, priority, message)
        VALUES (
            NEW.id, 
            'out_of_stock', 
            'critical',
            'Product ' || NEW.name || ' is out of stock!'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check stock levels
DROP TRIGGER IF EXISTS trigger_check_stock_levels ON public.products;
CREATE TRIGGER trigger_check_stock_levels
    AFTER UPDATE OF current_stock ON public.products
    FOR EACH ROW EXECUTE FUNCTION check_stock_levels();

-- ============================================================================
-- PART 12: Insert Sample Data
-- ============================================================================

-- Sample Product Categories
INSERT INTO public.product_categories (name, description) VALUES
    ('Filters', 'Water filter cartridges and components'),
    ('Membranes', 'RO membranes and related filtration media'),
    ('Tanks', 'Water storage tanks and containers'),
    ('Pumps', 'Water pumps and pressure systems'),
    ('Pipes & Fittings', 'Plumbing pipes, joints, and fittings'),
    ('Electronic Components', 'Controllers, sensors, and electronic parts')
ON CONFLICT (name) DO NOTHING;

-- Sample Suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
    ('FilterCorp Ltd', 'Rajesh Kumar', 'rajesh@filtercorp.com', '+91-9876543210', 'Plot 15, Industrial Area, Bangalore'),
    ('Membrane Solutions', 'Priya Sharma', 'priya@membranesol.com', '+91-9876543211', '24 Tech Park, Hyderabad'),
    ('TankMakers Inc', 'Amit Patel', 'amit@tankmakers.com', '+91-9876543212', 'Factory Road, Pune'),
    ('PumpTech Systems', 'Sunita Reddy', 'sunita@pumptech.com', '+91-9876543213', 'Industrial Estate, Chennai')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Comprehensive Schema Fix Migration Completed Successfully!';
    RAISE NOTICE 'Added: Product inventory columns, 6 inventory tables, 2 driver tables';
    RAISE NOTICE 'Fixed: Services priority, Vehicles notes, Water distributions view';
    RAISE NOTICE 'Your database now matches all code expectations!';
END $$;
