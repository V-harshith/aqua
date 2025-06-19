-- COMPREHENSIVE RLS DEBUG SCRIPT
-- Run these queries one by one in Supabase SQL Editor to debug the profile access issue

-- 1. Check if policies were created correctly
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 4. Test direct query as authenticated user (should work)
SELECT 
  id, 
  email, 
  full_name, 
  role 
FROM public.users 
LIMIT 3;

-- 5. Check auth.uid() function
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 6. Check actual user data
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  pu.id as profile_id,
  pu.email as profile_email,
  pu.full_name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 7. FORCE CREATE MORE PERMISSIVE POLICIES (if needed)
-- Uncomment and run these if the above queries show issues:

/*
-- Drop ALL existing policies
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert" ON public.users;

-- Create extremely permissive policies for debugging
CREATE POLICY "debug_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "debug_update_all" ON public.users FOR UPDATE USING (true);
CREATE POLICY "debug_insert_all" ON public.users FOR INSERT WITH CHECK (true);

-- OR temporarily disable RLS entirely (DANGER - only for debugging)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
*/

-- 8. Final verification
SELECT 
  'Debug Complete' as status,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'users') as policy_count,
  (SELECT count(*) FROM public.users) as user_count; 