-- =============================================
-- COMPLETE DATABASE SCHEMA FOR AQUA WATER MANAGEMENT APP
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE (Core user management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'admin', 
        'dept_head', 
        'service_manager', 
        'accounts_manager', 
        'product_manager', 
        'driver_manager', 
        'technician', 
        'customer'
    )),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CUSTOMERS TABLE (Customer-specific data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    connection_type VARCHAR(50) DEFAULT 'residential',
    meter_number VARCHAR(100),
    connection_date DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. COMPLAINTS TABLE (Customer complaints)
-- =============================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN (
        'water_quality', 
        'billing', 
        'connection', 
        'pressure', 
        'maintenance', 
        'general'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 
        'in_progress', 
        'resolved', 
        'closed'
    )),
    assigned_to UUID REFERENCES public.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 4. SERVICES TABLE (Service requests)
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'requested' CHECK (status IN (
        'requested', 
        'scheduled', 
        'in_progress', 
        'completed', 
        'cancelled'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_technician UUID REFERENCES public.users(id),
    scheduled_date DATE,
    scheduled_time TIME,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 5. PRODUCTS TABLE (Inventory management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    unit_price DECIMAL(10,2),
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 10,
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. VEHICLES TABLE (Fleet management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    capacity INTEGER,
    driver_id UUID REFERENCES public.users(id),
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN (
        'available', 
        'in_use', 
        'maintenance', 
        'out_of_service'
    )),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. DISTRIBUTIONS TABLE (Water delivery tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id),
    driver_id UUID REFERENCES public.users(id),
    delivery_date DATE NOT NULL,
    quantity_delivered INTEGER,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 
        'in_transit', 
        'delivered', 
        'failed'
    )),
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================
-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow admins and dept_heads to view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head')
        )
    );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head')
        )
    );

-- =============================================
-- CUSTOMERS TABLE POLICIES
-- =============================================
CREATE POLICY "Users can view own customer data" ON public.customers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager', 'accounts_manager')
        )
    );

CREATE POLICY "Staff can manage customers" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager')
        )
    );

-- =============================================
-- COMPLAINTS TABLE POLICIES
-- =============================================
CREATE POLICY "Users can view own complaints" ON public.complaints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = customer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all complaints" ON public.complaints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager', 'technician')
        )
    );

CREATE POLICY "Users can create complaints" ON public.complaints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = customer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage complaints" ON public.complaints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager')
        )
    );

-- =============================================
-- SERVICES TABLE POLICIES
-- =============================================
CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE id = customer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all services" ON public.services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager', 'technician')
        )
    );

CREATE POLICY "Staff can manage services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'service_manager')
        )
    );

-- =============================================
-- OTHER TABLE POLICIES (Products, Vehicles, Distributions)
-- =============================================
CREATE POLICY "Staff can view products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'product_manager', 'service_manager')
        )
    );

CREATE POLICY "Product managers can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'product_manager')
        )
    );

CREATE POLICY "Staff can view vehicles" ON public.vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'driver_manager', 'service_manager')
        )
    );

CREATE POLICY "Driver managers can manage vehicles" ON public.vehicles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'driver_manager')
        )
    );

CREATE POLICY "Staff can view distributions" ON public.distributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'driver_manager', 'service_manager')
        )
    );

CREATE POLICY "Driver managers can manage distributions" ON public.distributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'dept_head', 'driver_manager')
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON public.complaints;
CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_distributions_updated_at ON public.distributions;
CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON public.distributions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON public.complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_services_customer_id ON public.services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_assigned_technician ON public.services(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_distributions_customer_id ON public.distributions(customer_id);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
-- Create admin user (you should change the email to your own)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@aqua.com',
--     crypt('admin123', gen_salt('bf')),
--     NOW()
-- );

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- Schema creation completed successfully!
-- Remember to:
-- 1. Set your environment variables (.env.local)
-- 2. Enable authentication in Supabase dashboard
-- 3. Configure your auth providers if needed 