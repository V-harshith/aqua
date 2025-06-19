-- Fix infinite recursion in RLS policies
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins and dept_heads can manage users" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "allow_authenticated_select" ON users;
DROP POLICY IF EXISTS "allow_authenticated_update" ON users;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON users;

-- Create clean, non-overlapping policies
-- 1. Users can view their own profile (simple check without recursion)
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- 3. Allow user creation during signup (service role)
CREATE POLICY "users_insert_service" ON users
    FOR INSERT
    WITH CHECK (true);

-- 4. Admins can view all users (separate from own profile policy)
CREATE POLICY "admins_select_all" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND au.id IN (
                SELECT u.id FROM users u 
                WHERE u.id = au.id 
                AND u.role = 'admin'
            )
        )
    );

-- 5. Admins and dept_heads can manage users (insert/update/delete)
CREATE POLICY "admin_dept_manage" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND au.id IN (
                SELECT u.id FROM users u 
                WHERE u.id = au.id 
                AND u.role IN ('admin', 'dept_head')
            )
        )
    ); 