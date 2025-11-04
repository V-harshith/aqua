-- Verification script to check if migrations were successful
-- Run this in Supabase SQL editor to verify everything is working

-- Check if notifications table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Check if service_types table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_types' 
ORDER BY ordinal_position;

-- Check RLS policies for notifications
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Check RLS policies for service_types
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'service_types';

-- Check if service types data was inserted
SELECT 
    type_code,
    type_name,
    category,
    status,
    created_at
FROM service_types 
ORDER BY category, type_name;

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('notifications', 'service_types')
ORDER BY tablename, indexname;