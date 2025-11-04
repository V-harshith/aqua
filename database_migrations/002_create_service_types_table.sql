-- Migration: Create service_types table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- in minutes
    base_price DECIMAL(10,2),
    requires_parts BOOLEAN DEFAULT FALSE,
    skill_level VARCHAR(20) DEFAULT 'basic' CHECK (skill_level IN ('basic', 'intermediate', 'advanced', 'expert')),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    is_emergency BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category);
CREATE INDEX IF NOT EXISTS idx_service_types_status ON service_types(status);
CREATE INDEX IF NOT EXISTS idx_service_types_type_code ON service_types(type_code);

-- Enable RLS
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active service types" ON service_types;
CREATE POLICY "Anyone can view active service types" ON service_types
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage service types" ON service_types;
CREATE POLICY "Admins can manage service types" ON service_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager')
        )
    );

-- Insert default service types
INSERT INTO service_types (type_code, type_name, category, description, estimated_duration, base_price, skill_level) VALUES
('INST_PUMP', 'Water Pump Installation', 'Installation', 'Complete installation of water pump system', 240, 5000.00, 'intermediate'),
('MAINT_PUMP', 'Pump Maintenance', 'Maintenance', 'Regular maintenance and servicing of water pumps', 120, 1500.00, 'basic'),
('REPAIR_PUMP', 'Pump Repair', 'Repair', 'Repair of faulty water pump components', 180, 2500.00, 'intermediate'),
('PIPE_INSTALL', 'Pipeline Installation', 'Installation', 'Installation of water distribution pipes', 480, 8000.00, 'advanced'),
('PIPE_REPAIR', 'Pipeline Repair', 'Repair', 'Repair of damaged water pipes', 120, 1200.00, 'basic'),
('TANK_INSTALL', 'Water Tank Installation', 'Installation', 'Installation of water storage tanks', 360, 6000.00, 'intermediate'),
('TANK_CLEAN', 'Tank Cleaning', 'Maintenance', 'Cleaning and sanitization of water tanks', 180, 800.00, 'basic'),
('MOTOR_REPAIR', 'Motor Repair', 'Repair', 'Repair of water pump motors', 240, 3000.00, 'advanced'),
('VALVE_INSTALL', 'Valve Installation', 'Installation', 'Installation of control valves', 60, 500.00, 'basic'),
('EMERGENCY', 'Emergency Service', 'Emergency', 'Emergency water system repairs', 120, 2000.00, 'expert')
ON CONFLICT (type_code) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_service_types_updated_at 
    BEFORE UPDATE ON service_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();