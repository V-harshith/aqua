-- Enable RLS globally
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
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

CREATE TYPE service_status AS ENUM (
  'pending',
  'assigned',
  'in_progress', 
  'completed',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'upi',
  'online_banking',
  'card'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  department TEXT,
  employee_id TEXT UNIQUE,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (for detailed customer info)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_code TEXT UNIQUE NOT NULL,
  business_name TEXT,
  contact_person TEXT,
  billing_address TEXT NOT NULL,
  service_address TEXT,
  water_connection_id TEXT,
  meter_number TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Services catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_type TEXT NOT NULL, -- liters, hours, pieces, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority complaint_priority DEFAULT 'medium',
  status complaint_status DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  location TEXT,
  reported_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (work orders)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_number TEXT UNIQUE NOT NULL,
  complaint_id UUID REFERENCES complaints(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  assigned_technician UUID REFERENCES users(id),
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status service_status DEFAULT 'pending',
  scheduled_date DATE,
  completed_date DATE,
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  materials_used JSONB,
  service_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service items (products/materials used in services)
CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  service_id UUID REFERENCES services(id),
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  status invoice_status DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  payment_method payment_method,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_reference TEXT,
  transaction_id TEXT,
  payment_date DATE DEFAULT CURRENT_DATE,
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver/Vehicle management
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  capacity_liters INTEGER,
  driver_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water distribution tracking
CREATE TABLE water_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_date DATE DEFAULT CURRENT_DATE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  route_details JSONB,
  total_water_liters INTEGER NOT NULL,
  distributed_liters INTEGER DEFAULT 0,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distribution stops/deliveries
CREATE TABLE distribution_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES water_distributions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  planned_liters INTEGER NOT NULL,
  delivered_liters INTEGER,
  delivery_time TIME,
  customer_signature TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_services_customer_id ON services(customer_id);
CREATE INDEX idx_services_technician ON services(assigned_technician);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Can view own profile, admins can view all
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers: Role-based access
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'accounts_manager')
    )
  );

CREATE POLICY "Staff can manage customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'accounts_manager')
    )
  );

-- Products: Read access for authenticated users, write for managers
CREATE POLICY "All users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'product_manager', 'service_manager')
    )
  );

-- Complaints: Customers see own, staff see relevant ones
CREATE POLICY "Customers can view own complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE id = customer_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view assigned complaints" ON complaints
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'dept_head')
    )
  );

CREATE POLICY "Customers can create complaints" ON complaints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE id = customer_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage complaints" ON complaints
  FOR ALL USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'dept_head')
    )
  );

-- Services: Technicians see assigned, managers see all
CREATE POLICY "Technicians can view assigned services" ON services
  FOR SELECT USING (
    assigned_technician = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'dept_head')
    )
  );

CREATE POLICY "Managers can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'service_manager', 'dept_head')
    )
  );

-- Invoices: Customers see own, accounts managers see all
CREATE POLICY "Customers can view own invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE id = customer_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Accounts staff can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'accounts_manager', 'dept_head')
    )
  );

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_distributions_updated_at BEFORE UPDATE ON water_distributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default products/services
INSERT INTO products (name, description, category, unit_price, unit_type) VALUES
('Water Supply - Home', 'Residential water delivery service', 'Water Supply', 50.00, 'liters'),
('Water Supply - Commercial', 'Commercial water delivery service', 'Water Supply', 45.00, 'liters'),
('Pipeline Repair', 'Water pipeline repair service', 'Maintenance', 500.00, 'hours'),
('Meter Installation', 'Water meter installation service', 'Installation', 1500.00, 'pieces'),
('Pipeline Cleaning', 'Water pipeline cleaning service', 'Maintenance', 300.00, 'hours'),
('Emergency Water Supply', 'Emergency water delivery service', 'Emergency', 75.00, 'liters');

-- Create sequence for auto-numbering
CREATE SEQUENCE complaint_number_seq START 1000;
CREATE SEQUENCE service_number_seq START 2000;
CREATE SEQUENCE invoice_number_seq START 5000;

-- Functions for auto-numbering
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CMP-' || LPAD(nextval('complaint_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SRV-' || LPAD(nextval('service_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-numbering
CREATE TRIGGER set_complaint_number BEFORE INSERT ON complaints
  FOR EACH ROW WHEN (NEW.complaint_number IS NULL)
  EXECUTE FUNCTION generate_complaint_number();

CREATE TRIGGER set_service_number BEFORE INSERT ON services
  FOR EACH ROW WHEN (NEW.service_number IS NULL)
  EXECUTE FUNCTION generate_service_number();

CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
  FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number(); 