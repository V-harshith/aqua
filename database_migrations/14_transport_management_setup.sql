-- Transport Management Module - SQL Migration
-- Defines Vehicles and Routes for Water Distribution

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    vehicle_type TEXT DEFAULT 'tanker',
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Routes Table
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT UNIQUE NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT,
    estimated_liters INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    last_delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_routes_name ON public.routes(route_name);

-- RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Staff can view all
-- Admin/Driver Manager can manage

CREATE POLICY "Staff view vehicles" ON public.vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'driver_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Managers manage vehicles" ON public.vehicles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'driver_manager')
        )
    );

CREATE POLICY "Staff view routes" ON public.routes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'driver_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Managers manage routes" ON public.routes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'driver_manager')
        )
    );

-- Updated_at triggers
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sample Data
INSERT INTO public.vehicles (vehicle_number, capacity, status, vehicle_type) VALUES 
('KA-01-AB-1234', 5000, 'available', 'tanker'),
('KA-01-AB-5678', 6000, 'in_use', 'tanker'),
('KA-01-AB-9012', 4000, 'maintenance', 'tanker')
ON CONFLICT (vehicle_number) DO UPDATE 
SET vehicle_type = EXCLUDED.vehicle_type;

INSERT INTO public.routes (route_name, location_name, address, estimated_liters, priority) VALUES 
('Central District', 'City Center', 'Main Street, Central', 3000, 'high'),
('North Zone', 'Industrial Area', 'Tech Park, North', 5000, 'medium'),
('South Sector', 'Residential Complex', 'Green Valley, South', 2500, 'low')
ON CONFLICT (route_name) DO NOTHING;
