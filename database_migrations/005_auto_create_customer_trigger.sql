-- Migration: Auto-create customer record when user with role='customer' is created
-- This ensures customer users automatically have a linked customer record

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION create_customer_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_customer_code TEXT;
BEGIN
  -- Only create customer record if the role is 'customer'
  IF NEW.role = 'customer' THEN
    -- Check if customer record already exists
    IF NOT EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.id) THEN
      -- Generate customer code
      SELECT 'CUST' || LPAD((COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 5) AS INTEGER)), 0) + 1)::TEXT, 4, '0')
      INTO new_customer_code
      FROM customers
      WHERE customer_code LIKE 'CUST%';
      
      -- If no customers exist yet
      IF new_customer_code IS NULL THEN
        new_customer_code := 'CUST0001';
      END IF;
      
      -- Insert customer record
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
      ) VALUES (
        NEW.id,
        new_customer_code,
        COALESCE(NEW.full_name, NEW.email),
        COALESCE(NEW.full_name, 'Customer'),
        COALESCE(NEW.address, 'Address to be updated'),
        COALESCE(NEW.address, 'Address to be updated'),
        'active',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_customer_trigger ON users;

-- Create the trigger
CREATE TRIGGER auto_create_customer_trigger
AFTER INSERT OR UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION create_customer_for_user();

-- Also create customer records for existing customer users who don't have one
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
  u.id,
  'CUST' || LPAD(ROW_NUMBER() OVER (ORDER BY u.created_at)::TEXT, 4, '0'),
  COALESCE(u.full_name, u.email),
  COALESCE(u.full_name, 'Customer'),
  COALESCE(u.address, 'Address to be updated'),
  COALESCE(u.address, 'Address to be updated'),
  'active',
  u.created_at,
  NOW()
FROM users u
WHERE u.role = 'customer'
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.user_id = u.id)
ORDER BY u.created_at;

-- Verify the results
SELECT 
  u.email,
  u.full_name,
  u.role,
  c.customer_code,
  c.business_name
FROM users u
LEFT JOIN customers c ON c.user_id = u.id
WHERE u.role = 'customer'
ORDER BY c.customer_code;
