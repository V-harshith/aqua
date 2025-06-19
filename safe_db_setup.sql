-- COMPLETE DATABASE RESET FOR PROJECT AQUA WATER MANAGEMENT
-- This will fix the infinite recursion RLS issue by starting fresh

-- 1. DROP ALL EXISTING TABLES AND POLICIES
DROP TABLE IF EXISTS water_distributions CASCADE;
DROP TABLE IF EXISTS vehicle_maintenance CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS complaint_number_seq;
DROP SEQUENCE IF EXISTS service_number_seq;
DROP SEQUENCE IF EXISTS invoice_number_seq;

-- 2. CREATE TABLES WITH PROPER STRUCTURE
-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'dept_head', 'driver_manager', 'service_manager', 'accounts_manager', 'product_manager', 'technician', 'customer')),
    department TEXT,
    employee_id TEXT UNIQUE,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_code TEXT UNIQUE NOT NULL,
    business_name TEXT,
    contact_person TEXT,
    billing_address TEXT NOT NULL,
    service_address TEXT,
    water_connection_id TEXT,
    meter_number TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-incrementing sequences
CREATE SEQUENCE complaint_number_seq START 1;
CREATE SEQUENCE service_number_seq START 1;
CREATE SEQUENCE invoice_number_seq START 1;

-- Complaints table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT UNIQUE DEFAULT 'CMP' || LPAD(nextval('complaint_number_seq')::TEXT, 6, '0'),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    location TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_number TEXT UNIQUE DEFAULT 'SRV' || LPAD(nextval('service_number_seq')::TEXT, 6, '0'),
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    scheduled_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    materials_used JSONB,
    service_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 5. CREATE CLEAN RLS POLICIES (NO INFINITE RECURSION)

-- Users table policies - CRITICAL: Use auth.uid() directly, no table lookups
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "users_insert_signup" ON users
    FOR INSERT
    WITH CHECK (true);

-- Admin access - use a simple function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ SECURITY DEFINER LANGUAGE plpgsql;

CREATE POLICY "admin_all_access" ON users
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Customers policies
CREATE POLICY "customers_select_all" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager', 'accounts_manager', 'customer')
        )
    );

CREATE POLICY "customers_manage" ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager')
        )
    );

-- Products policies  
CREATE POLICY "products_select_all" ON products
    FOR SELECT
    USING (true);

CREATE POLICY "products_manage" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager')
        )
    );

-- Complaints policies
CREATE POLICY "complaints_select_relevant" ON complaints
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (
                role IN ('admin', 'dept_head', 'service_manager') OR
                (role = 'customer' AND id = (SELECT user_id FROM customers WHERE id = complaints.customer_id)) OR
                (role = 'technician' AND id = complaints.assigned_to)
            )
        )
    );

CREATE POLICY "complaints_insert" ON complaints
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'customer')
        )
    );

CREATE POLICY "complaints_update" ON complaints
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician')
        )
    );

-- Services policies
CREATE POLICY "services_select_relevant" ON services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (
                role IN ('admin', 'dept_head', 'service_manager') OR
                (role = 'customer' AND id = (SELECT user_id FROM customers WHERE id = services.customer_id)) OR
                (role = 'technician' AND id = services.assigned_technician)
            )
        )
    );

CREATE POLICY "services_manage" ON services
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician')
        )
    );

-- 6. INSERT INITIAL ADMIN USER
-- This creates an admin user that can be used to set up the system
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    department,
    employee_id
) VALUES (
    gen_random_uuid(),
    'admin@projectaqua.com',
    'System Administrator',
    'admin',
    'Administration',
    'ADM001'
) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

COMMENT ON TABLE users IS 'Core user authentication and role management';
COMMENT ON TABLE customers IS 'Customer information and water service details';
COMMENT ON TABLE complaints IS 'Customer complaints and issue tracking';
COMMENT ON TABLE services IS 'Service requests and technician assignments';
COMMENT ON TABLE products IS 'Water products and service catalog'; 