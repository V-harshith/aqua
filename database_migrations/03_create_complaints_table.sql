-- Create complaints table for customer complaints and issues

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

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for complaints table
CREATE POLICY "Customers can view their own complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager', 'technician')
    )
  );

CREATE POLICY "Managers can manage complaints" ON public.complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'service_manager')
    )
  );

CREATE POLICY "Technicians can update assigned complaints" ON public.complaints
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'technician'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER handle_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_complaints_customer_id ON public.complaints(customer_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_category ON public.complaints(category);
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at);
CREATE INDEX idx_complaints_number ON public.complaints(complaint_number);

-- Generate complaint number function
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 8) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.complaints
  WHERE complaint_number ~ ('^CMP' || year_month || '[0-9]+$');
  
  new_number := 'CMP' || year_month || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ language 'plpgsql';

-- Auto-generate complaint number trigger
CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
    NEW.complaint_number := generate_complaint_number();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_complaint_number_trigger
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION set_complaint_number();

-- Auto-set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    NEW.resolved_at := timezone('utc'::text, now());
  ELSIF NEW.status != 'resolved' THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_resolved_at_trigger
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at(); 