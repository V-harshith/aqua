-- Complete Authentication Fix for Project Aqua
-- Run this script in your Supabase SQL Editor
-- This will fix the signup profile creation issue

-- =============================================================================
-- 1. First, ensure the database schema is complete
-- =============================================================================

-- Check if users table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Create the users table if it doesn't exist
        CREATE TABLE public.users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'customer',
          department TEXT,
          employee_id TEXT UNIQUE,
          address TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created users table with RLS enabled';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END
$$;

-- =============================================================================
-- 2. Drop existing auth trigger and function to start fresh
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- 3. Create the proper auth trigger function with best practices
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'customer', -- Default role for all new signups
    true
  );
  
  RAISE LOG 'Created user profile for: % (ID: %)', NEW.email, NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where user already exists
    RAISE LOG 'User profile already exists for: % (ID: %)', NEW.email, NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error creating user profile for % (ID: %): %', NEW.email, NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 4. Grant necessary permissions
-- =============================================================================

-- Grant permissions to the auth admin role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.users TO supabase_auth_admin;
GRANT SELECT ON TABLE public.users TO supabase_auth_admin;

-- =============================================================================
-- 5. Create the trigger
-- =============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 6. Update Row Level Security policies
-- =============================================================================

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow trigger to create user profiles" ON public.users;
DROP POLICY IF EXISTS "Enable insert for auth admin" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create comprehensive RLS policies
-- Policy 1: Allow auth admin to insert (for the trigger)
CREATE POLICY "Enable insert for auth admin" ON public.users
  FOR INSERT TO supabase_auth_admin
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Policy 3: Allow authenticated users to update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id AND role = OLD.role);

-- Policy 4: Allow admins to view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Policy 5: Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- =============================================================================
-- 7. Test the setup
-- =============================================================================

-- Add a comment to the function
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates user profile when new auth user is created. Uses security definer with proper error handling.';

-- Verify the trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        RAISE NOTICE 'Auth trigger created successfully!';
    ELSE
        RAISE EXCEPTION 'Auth trigger was not created!';
    END IF;
END
$$;

-- =============================================================================
-- 8. Create updated_at trigger for users table
-- =============================================================================

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the updated_at trigger for users table
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 9. Final verification
-- =============================================================================

-- Check if everything is set up correctly
SELECT 
  'Auth trigger setup complete!' as status,
  COUNT(*) as existing_users_count
FROM public.users;

-- Show the current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname; 