-- Driver Management Module - SQL Migration
-- Following Supabase best practices for RLS and performance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Water Distribution Tracking Table
CREATE TABLE IF NOT EXISTS public.water_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    total_liters INTEGER NOT NULL CHECK (total_liters > 0),
    route_details TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed')) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Operations Log Table (for audit trail)
CREATE TABLE IF NOT EXISTS public.driver_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('start_distribution', 'end_distribution', 'complaint_register', 'leave_request')),
    details JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES auth.users(id),
    approved_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance (following Context7 best practices)
CREATE INDEX IF NOT EXISTS idx_water_distributions_driver_date 
    ON public.water_distributions(driver_id, distribution_date);

CREATE INDEX IF NOT EXISTS idx_water_distributions_status 
    ON public.water_distributions(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_driver_operations_driver_timestamp 
    ON public.driver_operations(driver_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status 
    ON public.leave_requests(employee_id, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_pending 
    ON public.leave_requests(status, applied_date) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.water_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for water_distributions
-- Following Context7 best practices: explicit role specification, optimized auth.uid() usage

-- Policy 1: Drivers can manage their own distributions
CREATE POLICY "drivers_own_distributions" ON public.water_distributions
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = driver_id)
    WITH CHECK ((SELECT auth.uid()) = driver_id);

-- Policy 2: Managers can view all distributions in their department
CREATE POLICY "managers_view_distributions" ON public.water_distributions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE (SELECT auth.uid()) = id 
            AND role IN ('driver_manager', 'admin', 'dept_head')
        )
    );

-- Policy 3: Admins can manage all distributions
CREATE POLICY "admins_manage_distributions" ON public.water_distributions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE (SELECT auth.uid()) = id 
            AND role IN ('admin', 'dept_head')
        )
    );

-- RLS Policies for driver_operations (audit log)
-- Operations are immutable - only insert and select allowed

-- Policy 1: Users can log their own operations
CREATE POLICY "users_log_operations" ON public.driver_operations
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = driver_id);

-- Policy 2: Users can view their own operations
CREATE POLICY "users_view_own_operations" ON public.driver_operations
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = driver_id);

-- Policy 3: Managers can view operations in their department
CREATE POLICY "managers_view_operations" ON public.driver_operations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE (SELECT auth.uid()) = id 
            AND role IN ('driver_manager', 'admin', 'dept_head')
        )
    );

-- RLS Policies for leave_requests

-- Policy 1: Employees can manage their own leave requests
CREATE POLICY "employees_own_leave_requests" ON public.leave_requests
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = employee_id)
    WITH CHECK ((SELECT auth.uid()) = employee_id);

-- Policy 2: Managers can view and approve leave requests
CREATE POLICY "managers_handle_leave_requests" ON public.leave_requests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE (SELECT auth.uid()) = id 
            AND role IN ('driver_manager', 'admin', 'dept_head')
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER water_distributions_updated_at
    BEFORE UPDATE ON public.water_distributions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Security definer function for role checking (Context7 optimization)
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE (SELECT auth.uid()) = id 
        AND role = ANY(required_roles)
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT ALL ON public.water_distributions TO authenticated;
GRANT ALL ON public.driver_operations TO authenticated;
GRANT ALL ON public.leave_requests TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert some sample data for testing (optional)
/*
-- Sample driver (this would typically be inserted via the user management system)
INSERT INTO auth.users (id, email) VALUES 
    ('123e4567-e89b-12d3-a456-426614174000', 'driver@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, is_active) VALUES 
    ('123e4567-e89b-12d3-a456-426614174000', 'driver@example.com', 'John Driver', 'driver_manager', true)
ON CONFLICT (id) DO NOTHING;
*/

-- Create view for distribution analytics
CREATE OR REPLACE VIEW public.distribution_analytics AS
SELECT 
    DATE_TRUNC('day', distribution_date) as day,
    COUNT(*) as total_distributions,
    SUM(total_liters) as total_liters_distributed,
    AVG(total_liters) as avg_liters_per_distribution,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_distributions,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_distributions
FROM public.water_distributions
GROUP BY DATE_TRUNC('day', distribution_date)
ORDER BY day DESC;

-- RLS for the analytics view
ALTER VIEW public.distribution_analytics OWNER TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.water_distributions IS 'Tracks daily water distribution activities by drivers';
COMMENT ON TABLE public.driver_operations IS 'Audit log for all driver operations in the system';
COMMENT ON TABLE public.leave_requests IS 'Employee leave request management system';
COMMENT ON VIEW public.distribution_analytics IS 'Analytics view for water distribution reporting';

-- Create notification function for leave request status changes
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This would typically integrate with your notification system
    -- For now, we'll just log the change
    INSERT INTO public.driver_operations (driver_id, operation_type, details)
    VALUES (
        NEW.employee_id,
        'leave_request',
        jsonb_build_object(
            'action', 'status_changed',
            'old_status', OLD.status,
            'new_status', NEW.status,
            'leave_id', NEW.id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER leave_status_change_notification
    AFTER UPDATE OF status ON public.leave_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.notify_leave_status_change(); 