-- COMPREHENSIVE FIX FOR PROFILE ACCESS ISSUES
-- Run this script in Supabase SQL Editor to resolve all RLS policy problems

-- 1. First, check current state
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT STATE ANALYSIS ===';
    RAISE NOTICE 'Auth users count: %', (SELECT count(*) FROM auth.users);
    RAISE NOTICE 'Profile users count: %', (SELECT count(*) FROM public.users);
    RAISE NOTICE 'RLS enabled: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public');
    RAISE NOTICE 'Policy count: %', (SELECT count(*) FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public');
END $$;

-- 2. Drop ALL existing problematic policies
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 3. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, permissive policies for authenticated users
CREATE POLICY "allow_authenticated_select" ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "allow_authenticated_insert" ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_authenticated_update" ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Grant necessary permissions to authenticated role
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- 6. Create profiles for existing auth users who don't have them
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    phone, 
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'customer'::user_role) as role,
    au.raw_user_meta_data->>'phone' as phone,
    true as is_active,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Verify the fix
DO $$
DECLARE
    auth_count INTEGER;
    profile_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT count(*) INTO auth_count FROM auth.users;
    SELECT count(*) INTO profile_count FROM public.users;
    SELECT count(*) INTO policy_count FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE '=== FIX VERIFICATION ===';
    RAISE NOTICE 'Auth users: %', auth_count;
    RAISE NOTICE 'Profile users: %', profile_count;
    RAISE NOTICE 'Active policies: %', policy_count;
    
    IF auth_count = profile_count THEN
        RAISE NOTICE '✅ SUCCESS: All auth users have profiles';
    ELSE
        RAISE NOTICE '❌ ISSUE: Mismatch between auth users (%) and profiles (%)', auth_count, profile_count;
    END IF;
END $$;

-- 8. Test query that should now work
SELECT 
    'Profile access test' as test_name,
    count(*) as user_count,
    array_agg(role) as roles_found
FROM public.users;

-- 9. Display current policies for verification
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname; 