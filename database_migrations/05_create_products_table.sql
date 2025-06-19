-- Create products table for water products and inventory

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

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can view all products" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'product_manager', 'service_manager', 'accounts_manager')
    )
  );

CREATE POLICY "Product managers can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head', 'product_manager')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_name ON public.products(name);

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