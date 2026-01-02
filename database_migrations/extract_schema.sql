-- Schema Extraction Query for Aqua App
-- Run this in Supabase SQL Editor to get your ACTUAL database schema

-- Part 1: List all tables
SELECT 
    'TABLE' as object_type,
    table_name,
    NULL as column_name,
    NULL as data_type,
    NULL as is_nullable,
    NULL as column_default
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

-- Part 2: List all columns for each table
SELECT 
    'COLUMN' as object_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY object_type DESC, table_name, column_name;
