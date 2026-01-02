-- Migration: Add missing tracking number fields (FIXED VERSION)
-- Run this in your Supabase SQL editor

-- Add service_number to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS service_number VARCHAR(50) UNIQUE;

-- Add complaint_number to complaints table  
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS complaint_number VARCHAR(50) UNIQUE;

-- Add employee_id to users table (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);

-- Add complaint_id to services table (link services to complaints)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_services_service_number ON public.services(service_number);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON public.complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_services_complaint_id ON public.services(complaint_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_service_number();
DROP FUNCTION IF EXISTS generate_complaint_number();

-- Function to auto-generate service numbers
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    next_seq INTEGER;
    new_number TEXT;
BEGIN
    -- Format: SRV-YYYYMM-0001
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(service_number FROM 12) AS INTEGER)
    ), 0) + 1
    INTO next_seq
    FROM public.services
    WHERE service_number LIKE 'SRV-' || year_month || '-%';
    
    -- Generate the new service number
    new_number := 'SRV-' || year_month || '-' || LPAD(next_seq::TEXT, 4, '0');
    
    NEW.service_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate complaint numbers
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    next_seq INTEGER;
    new_number TEXT;
BEGIN
    -- Format: CMP-YYYYMM-0001
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(complaint_number FROM 12) AS INTEGER)
    ), 0) + 1
    INTO next_seq
    FROM public.complaints
    WHERE complaint_number LIKE 'CMP-' || year_month || '-%';
    
    -- Generate the new complaint number
    new_number := 'CMP-' || year_month || '-' || LPAD(next_seq::TEXT, 4, '0');
    
    NEW.complaint_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_service_number ON public.services;
DROP TRIGGER IF EXISTS set_complaint_number ON public.complaints;

-- Create triggers to auto-generate numbers on insert
CREATE TRIGGER set_service_number
    BEFORE INSERT ON public.services
    FOR EACH ROW
    WHEN (NEW.service_number IS NULL)
    EXECUTE FUNCTION generate_service_number();

CREATE TRIGGER set_complaint_number
    BEFORE INSERT ON public.complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL)
    EXECUTE FUNCTION generate_complaint_number();

-- Update existing records with generated numbers (if any exist without numbers)
DO $$
DECLARE
    service_record RECORD;
    complaint_record RECORD;
    counter INTEGER;
BEGIN
    -- Update services without service_number
    counter := 1;
    FOR service_record IN 
        SELECT id FROM public.services WHERE service_number IS NULL ORDER BY created_at
    LOOP
        UPDATE public.services 
        SET service_number = 'SRV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = service_record.id;
        counter := counter + 1;
    END LOOP;
    
    -- Update complaints without complaint_number
    counter := 1;
    FOR complaint_record IN 
        SELECT id FROM public.complaints WHERE complaint_number IS NULL ORDER BY created_at
    LOOP
        UPDATE public.complaints 
        SET complaint_number = 'CMP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = complaint_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make service_number and complaint_number NOT NULL after populating (only if columns were just added)
DO $$
BEGIN
    -- Only set NOT NULL if there are no NULL values
    IF NOT EXISTS (SELECT 1 FROM public.services WHERE service_number IS NULL) THEN
        ALTER TABLE public.services ALTER COLUMN service_number SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.complaints WHERE complaint_number IS NULL) THEN
        ALTER TABLE public.complaints ALTER COLUMN complaint_number SET NOT NULL;
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.services.service_number IS 'Auto-generated service tracking number (format: SRV-YYYYMM-0001)';
COMMENT ON COLUMN public.complaints.complaint_number IS 'Auto-generated complaint tracking number (format: CMP-YYYYMM-0001)';
COMMENT ON COLUMN public.services.complaint_id IS 'Optional link to related complaint';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added tracking number fields and auto-generation triggers.';
END $$;
