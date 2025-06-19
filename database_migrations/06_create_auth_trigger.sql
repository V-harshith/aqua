-- Create a trigger to automatically create user profiles when new auth users are created
-- This follows Supabase best practices with proper security definer and grants

-- First, drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with proper security definer and search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer', -- Default role for all new signups
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant necessary permissions to the auth admin role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.users TO supabase_auth_admin;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to work with the trigger
-- Remove the old policy that was causing issues
DROP POLICY IF EXISTS "Allow trigger to create user profiles" ON public.users;

-- Create a more specific policy for the trigger
CREATE POLICY "Enable insert for auth admin" ON public.users
  FOR INSERT TO supabase_auth_admin
  WITH CHECK (true);

-- Ensure the existing policies still work for regular users
-- This policy allows authenticated users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

-- This policy allows authenticated users to update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id AND role = OLD.role); -- Prevent role changes

-- Comment explaining the setup
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created. Uses security definer to run with elevated privileges.'; 