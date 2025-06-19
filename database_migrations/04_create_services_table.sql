-- Create services table for tracking service requests and work orders

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

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for services table
CREATE POLICY "Customers can view their own services" ON public.services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all services" ON public.services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'technician')
    )
  );

CREATE POLICY "Managers can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager')
    )
  );

CREATE POLICY "Technicians can update assigned services" ON public.services
  FOR UPDATE USING (
    assigned_technician = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'technician'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER handle_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_services_customer_id ON public.services(customer_id);
CREATE INDEX idx_services_assigned_technician ON public.services(assigned_technician);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_service_type ON public.services(service_type);
CREATE INDEX idx_services_scheduled_date ON public.services(scheduled_date);
CREATE INDEX idx_services_complaint_id ON public.services(complaint_id);
CREATE INDEX idx_services_created_at ON public.services(created_at);
CREATE INDEX idx_services_number ON public.services(service_number);

-- Generate service number function
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(service_number FROM 8) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.services
  WHERE service_number ~ ('^SRV' || year_month || '[0-9]+$');
  
  new_number := 'SRV' || year_month || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ language 'plpgsql';

-- Auto-generate service number trigger
CREATE OR REPLACE FUNCTION set_service_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_number IS NULL OR NEW.service_number = '' THEN
    NEW.service_number := generate_service_number();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_service_number_trigger
  BEFORE INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_number();

-- Auto-set completed_date when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_date := timezone('utc'::text, now());
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_completed_date_trigger
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_date(); 