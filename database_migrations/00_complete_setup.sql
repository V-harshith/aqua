-- Complete Water Management System Database Setup
-- Run this script in your Supabase SQL editor to set up all tables

-- =============================================================================
-- 1. Create ENUM types
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'dept_head', 
  'driver_manager',
  'service_manager',
  'accounts_manager',
  'product_manager', 
  'technician',
  'customer'
);

CREATE TYPE customer_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending'
);

CREATE TYPE complaint_status AS ENUM (
  'open',
  'assigned', 
  'in_progress',
  'resolved',
  'closed',
  'cancelled'
);

CREATE TYPE complaint_priority AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

CREATE TYPE complaint_category AS ENUM (
  'water_quality',
  'supply_interruption',
  'billing_issue',
  'meter_reading',
  'pipe_leak',
  'pressure_issue',
  'service_request',
  'other'
);

CREATE TYPE service_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE service_type AS ENUM (
  'installation',
  'maintenance',
  'repair',
  'inspection',
  'meter_reading',
  'connection',
  'disconnection',
  'emergency',
  'other'
);

CREATE TYPE product_category AS ENUM (
  'bottled_water',
  'bulk_water',
  'water_equipment',
  'filters',
  'accessories',
  'chemicals',
  'other'
);

CREATE TYPE unit_type AS ENUM (
  'liters',
  'gallons',
  'bottles',
  'pieces',
  'kilograms',
  'meters',
  'hours'
);

-- =============================================================================
-- 2. Create utility functions
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 3. Create main tables
-- =============================================================================

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  department TEXT,
  employee_id TEXT UNIQUE,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_code TEXT NOT NULL UNIQUE,
  business_name TEXT,
  contact_person TEXT,
  billing_address TEXT NOT NULL,
  service_address TEXT,
  water_connection_id TEXT UNIQUE,
  meter_number TEXT,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status customer_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  unit_type unit_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category complaint_category NOT NULL,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  location TEXT,
  reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_number TEXT NOT NULL UNIQUE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  assigned_technician UUID REFERENCES public.users(id) ON DELETE SET NULL,
  service_type service_type NOT NULL,
  description TEXT NOT NULL,
  status service_status NOT NULL DEFAULT 'pending',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  materials_used JSONB DEFAULT '[]'::jsonb,
  service_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 4. Enable Row Level Security
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. Create RLS Policies
-- =============================================================================

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and dept_heads can manage users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head'))
  );

-- Products policies
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can view all products" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'product_manager', 'service_manager', 'accounts_manager'))
  );

CREATE POLICY "Product managers can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'product_manager'))
  );

-- Customers policies
CREATE POLICY "Customers can view their own data" ON public.customers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'customer')
  );

CREATE POLICY "Staff can view all customers" ON public.customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'accounts_manager'))
  );

CREATE POLICY "Managers can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager'))
  );

-- Complaints policies
CREATE POLICY "Customers can view their own complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Customers can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'technician'))
  );

CREATE POLICY "Managers can manage complaints" ON public.complaints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager'))
  );

-- Services policies
CREATE POLICY "Customers can view their own services" ON public.services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all services" ON public.services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'technician'))
  );

CREATE POLICY "Managers can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager'))
  );

-- =============================================================================
-- 6. Create triggers for updated_at
-- =============================================================================

CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 7. Create indexes for performance
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_department ON public.users(department);
CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- Customers indexes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_customers_status ON public.customers(status);

-- Products indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_name ON public.products(name);

-- Complaints indexes
CREATE INDEX idx_complaints_customer_id ON public.complaints(customer_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);

-- Services indexes
CREATE INDEX idx_services_customer_id ON public.services(customer_id);
CREATE INDEX idx_services_assigned_technician ON public.services(assigned_technician);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_service_type ON public.services(service_type);

-- =============================================================================
-- 8. Auto-generate functions and triggers
-- =============================================================================

-- Customer code generation
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
  INTO counter FROM public.customers WHERE customer_code ~ '^CUS[0-9]+$';
  new_code := 'CUS' || LPAD(counter::TEXT, 6, '0');
  RETURN new_code;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := generate_customer_code();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_customer_code_trigger BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION set_customer_code();

-- Complaint number generation
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 8) AS INTEGER)), 0) + 1
  INTO counter FROM public.complaints WHERE complaint_number ~ ('^CMP' || year_month || '[0-9]+$');
  new_number := 'CMP' || year_month || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
    NEW.complaint_number := generate_complaint_number();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_complaint_number_trigger BEFORE INSERT ON public.complaints FOR EACH ROW EXECUTE FUNCTION set_complaint_number();

-- Service number generation
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(service_number FROM 8) AS INTEGER)), 0) + 1
  INTO counter FROM public.services WHERE service_number ~ ('^SRV' || year_month || '[0-9]+$');
  new_number := 'SRV' || year_month || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_service_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_number IS NULL OR NEW.service_number = '' THEN
    NEW.service_number := generate_service_number();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_service_number_trigger BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION set_service_number();

-- =============================================================================
-- 9. Insert sample data
-- =============================================================================

-- Insert default products
INSERT INTO public.products (name, description, category, unit_price, unit_type) VALUES
('5L Bottled Water', 'Pure drinking water in 5-liter bottles', 'bottled_water', 15.00, 'bottles'),
('20L Bottled Water', 'Pure drinking water in 20-liter bottles', 'bottled_water', 45.00, 'bottles'),
('Bulk Water Supply', 'Bulk water delivery service', 'bulk_water', 2.50, 'liters'),
('Water Meter Installation', 'Water meter installation service', 'water_equipment', 150.00, 'pieces'),
('Pipe Repair Service', 'Professional pipe repair service', 'water_equipment', 85.00, 'hours'),
('Water Quality Test', 'Comprehensive water quality testing', 'other', 35.00, 'pieces'),
('Water Filter Cartridge', 'Replacement filter cartridge', 'filters', 25.00, 'pieces'),
('Emergency Water Service', 'Emergency water supply service', 'bulk_water', 5.00, 'liters');

-- =============================================================================
-- Database setup complete!
-- ============================================================================= 