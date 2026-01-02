-- Migration: Create customer records for existing customer users
-- This links users with role='customer' to the customers table

-- Your 4 customer users:
-- 1. testin@gmail.com (testing)
-- 2. freakoffitnessig@gmail.com (harshith rao)
-- 3. harshithrao124@gmail.com (vercel vercel)
-- 4. biradar.v30@gmail.com (biradar vaibhav)

-- Create customer records for users who don't have one yet
INSERT INTO customers (
  user_id,
  customer_code,
  business_name,
  contact_person,
  billing_address,
  service_address,
  status,
  created_at,
  updated_at
)
SELECT 
  u.id as user_id,
  'CUST' || LPAD(ROW_NUMBER() OVER (ORDER BY u.created_at)::text, 4, '0') as customer_code,
  COALESCE(u.full_name, u.email) as business_name,
  COALESCE(u.full_name, 'Customer') as contact_person,
  'Address to be updated' as billing_address,
  'Address to be updated' as service_address,
  'active' as status,
  u.created_at,
  NOW() as updated_at
FROM users u
WHERE u.role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.user_id = u.id
  )
ORDER BY u.created_at;

-- Verify the results
SELECT 
  u.email,
  u.full_name,
  c.customer_code,
  c.business_name,
  c.status
FROM users u
LEFT JOIN customers c ON c.user_id = u.id
WHERE u.role = 'customer'
ORDER BY u.created_at;
