-- Create users table for the water management system
-- This extends Supabase auth.users with profile information

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

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins and dept_heads can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'dept_head')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_department ON public.users(department);
CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_is_active ON public.users(is_active); 