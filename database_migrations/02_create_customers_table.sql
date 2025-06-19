-- Create customers table for water service customers
-- Customers can be linked to users or exist independently

CREATE TYPE customer_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending'
);

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

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Customers can view their own data" ON public.customers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

CREATE POLICY "Staff can view all customers" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'accounts_manager')
    )
  );

CREATE POLICY "Managers can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER handle_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_water_connection_id ON public.customers(water_connection_id);
CREATE INDEX idx_customers_meter_number ON public.customers(meter_number);

-- Generate customer code function
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.customers
  WHERE customer_code ~ '^CUS[0-9]+$';
  
  new_code := 'CUS' || LPAD(counter::TEXT, 6, '0');
  
  RETURN new_code;
END;
$$ language 'plpgsql';

-- Auto-generate customer code trigger
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := generate_customer_code();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_customer_code_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_code(); 