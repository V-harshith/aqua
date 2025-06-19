-- Safe Incremental Database Setup
-- This script checks for existing tables and only creates what's missing
-- Run this in Supabase SQL Editor

-- 1. Create users table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE public.users (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'customer',
            department TEXT,
            employee_id TEXT UNIQUE,
            address TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            CONSTRAINT users_role_check CHECK (role IN (
                'admin', 'dept_head', 'driver_manager', 'service_manager', 
                'accounts_manager', 'product_manager', 'technician', 'customer'
            ))
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
        CREATE INDEX IF NOT EXISTS idx_users_employee_id ON public.users(employee_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'Users table already exists - skipping creation';
    END IF;
END $$;

-- 2. Create customers table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        CREATE TABLE public.customers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            customer_code TEXT UNIQUE NOT NULL,
            business_name TEXT,
            contact_person TEXT,
            billing_address TEXT NOT NULL,
            service_address TEXT,
            water_connection_id TEXT UNIQUE,
            meter_number TEXT,
            registration_date DATE DEFAULT CURRENT_DATE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
        CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
        
        RAISE NOTICE 'Created customers table';
    ELSE
        RAISE NOTICE 'Customers table already exists - skipping creation';
    END IF;
END $$;

-- 3. Create products table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        CREATE TABLE public.products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            unit_type TEXT NOT NULL DEFAULT 'piece',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
        
        RAISE NOTICE 'Created products table';
    ELSE
        RAISE NOTICE 'Products table already exists - skipping creation';
    END IF;
END $$;

-- 4. Create complaints table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints') THEN
        CREATE TABLE public.complaints (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            complaint_number TEXT UNIQUE NOT NULL,
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'open',
            assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
            location TEXT,
            reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            resolved_at TIMESTAMP WITH TIME ZONE,
            resolution_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            CONSTRAINT complaints_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            CONSTRAINT complaints_status_check CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON public.complaints(customer_id);
        CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
        CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
        CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON public.complaints(complaint_number);
        
        RAISE NOTICE 'Created complaints table';
    ELSE
        RAISE NOTICE 'Complaints table already exists - skipping creation';
    END IF;
END $$;

-- 5. Create services table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        CREATE TABLE public.services (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            service_number TEXT UNIQUE NOT NULL,
            complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            assigned_technician UUID REFERENCES public.users(id) ON DELETE SET NULL,
            service_type TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            scheduled_date TIMESTAMP WITH TIME ZONE,
            completed_date TIMESTAMP WITH TIME ZONE,
            estimated_hours DECIMAL(5,2),
            actual_hours DECIMAL(5,2),
            materials_used JSONB,
            service_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            CONSTRAINT services_status_check CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_services_customer_id ON public.services(customer_id);
        CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
        CREATE INDEX IF NOT EXISTS idx_services_assigned_technician ON public.services(assigned_technician);
        CREATE INDEX IF NOT EXISTS idx_services_service_number ON public.services(service_number);
        CREATE INDEX IF NOT EXISTS idx_services_complaint_id ON public.services(complaint_id);
        
        RAISE NOTICE 'Created services table';
    ELSE
        RAISE NOTICE 'Services table already exists - skipping creation';
    END IF;
END $$;

-- 6. Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Get user details from auth.users
    user_email := NEW.email;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
    
    -- Insert new user profile
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        role,
        department,
        employee_id,
        address,
        is_active
    ) VALUES (
        NEW.id,
        user_email,
        user_name,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'employee_id',
        NEW.raw_user_meta_data->>'address',
        true
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 7. Create trigger only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
        RAISE NOTICE 'Created auth trigger';
    ELSE
        RAISE NOTICE 'Auth trigger already exists - skipping creation';
    END IF;
END $$;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.users TO supabase_auth_admin;

-- 9. Enable RLS on all tables if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies only if they don't exist

-- Users policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Created users view policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Created users update policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Admins can view all users') THEN
        CREATE POLICY "Admins can view all users" ON public.users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE 'Created admin view users policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can insert users') THEN
        CREATE POLICY "Service role can insert users" ON public.users
            FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created users insert policy';
    END IF;
END $$;

-- Customers policies  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view customers') THEN
        CREATE POLICY "Users can view customers" ON public.customers
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND is_active = true
                )
            );
        RAISE NOTICE 'Created customers view policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Staff can manage customers') THEN
        CREATE POLICY "Staff can manage customers" ON public.customers
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'dept_head', 'service_manager', 'accounts_manager')
                    AND is_active = true
                )
            );
        RAISE NOTICE 'Created customers management policy';
    END IF;
END $$;

-- Products policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can view products') THEN
        CREATE POLICY "Users can view products" ON public.products
            FOR SELECT USING (is_active = true);
        RAISE NOTICE 'Created products view policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Product managers can manage products') THEN
        CREATE POLICY "Product managers can manage products" ON public.products
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'product_manager')
                    AND is_active = true
                )
            );
        RAISE NOTICE 'Created products management policy';
    END IF;
END $$;

-- Complaints policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'complaints' AND policyname = 'Users can view complaints') THEN
        CREATE POLICY "Users can view complaints" ON public.complaints
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND is_active = true
                )
            );
        RAISE NOTICE 'Created complaints view policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'complaints' AND policyname = 'Staff can manage complaints') THEN
        CREATE POLICY "Staff can manage complaints" ON public.complaints
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'dept_head', 'service_manager')
                    AND is_active = true
                )
            );
        RAISE NOTICE 'Created complaints management policy';
    END IF;
END $$;

-- Services policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can view services') THEN
        CREATE POLICY "Users can view services" ON public.services
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND is_active = true
                )
            );
        RAISE NOTICE 'Created services view policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Staff can manage services') THEN
        CREATE POLICY "Staff can manage services" ON public.services
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'dept_head', 'service_manager', 'technician')
                    AND is_active = true
                )
            );
        RAISE NOTICE 'Created services management policy';
    END IF;
END $$;

-- 11. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check and add missing columns to existing tables
    
    -- Add columns to users table if missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Add phone column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
            ALTER TABLE public.users ADD COLUMN phone TEXT;
            RAISE NOTICE 'Added phone column to users table';
        END IF;
        
        -- Add department column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'department') THEN
            ALTER TABLE public.users ADD COLUMN department TEXT;
            RAISE NOTICE 'Added department column to users table';
        END IF;
        
        -- Add employee_id column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'employee_id') THEN
            ALTER TABLE public.users ADD COLUMN employee_id TEXT UNIQUE;
            RAISE NOTICE 'Added employee_id column to users table';
        END IF;
        
        -- Add address column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'address') THEN
            ALTER TABLE public.users ADD COLUMN address TEXT;
            RAISE NOTICE 'Added address column to users table';
        END IF;
        
        -- Add is_active column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active') THEN
            ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
            RAISE NOTICE 'Added is_active column to users table';
        END IF;
    END IF;
    
    -- Add columns to customers table if missing and table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'water_connection_id') THEN
            ALTER TABLE public.customers ADD COLUMN water_connection_id TEXT UNIQUE;
            RAISE NOTICE 'Added water_connection_id column to customers table';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'meter_number') THEN
            ALTER TABLE public.customers ADD COLUMN meter_number TEXT;
            RAISE NOTICE 'Added meter_number column to customers table';
        END IF;
    END IF;
    
END $$;

-- 12. Update updated_at triggers for all tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Create updated_at triggers for all tables
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'customers', 'products', 'complaints', 'services')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS handle_%I_updated_at ON public.%I;
            CREATE TRIGGER handle_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
        ', tbl, tbl, tbl, tbl);
        
        RAISE NOTICE 'Created/updated trigger for % table', tbl;
    END LOOP;
END $$;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Safe incremental database setup completed successfully!';
    RAISE NOTICE 'All existing tables were preserved, missing components were added.';
END $$; 