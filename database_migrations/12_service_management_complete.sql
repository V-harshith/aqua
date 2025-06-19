-- Service Management Complete Setup
-- This migration creates all tables needed for comprehensive service management

-- Service types and categories
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'installation', 'maintenance', 'repair', 'inspection'
    description TEXT,
    estimated_duration INTEGER NOT NULL, -- Minutes
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    requires_parts BOOLEAN DEFAULT false,
    skill_level VARCHAR(50) DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced', 'expert'
    priority_level INTEGER DEFAULT 3, -- 1=lowest, 5=highest
    is_emergency BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service requests from customers
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    customer_product_id UUID REFERENCES customer_products(id),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent', 'emergency'
    preferred_date DATE,
    preferred_time_slot VARCHAR(50), -- 'morning', 'afternoon', 'evening', 'anytime'
    customer_address TEXT NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    problem_description TEXT NOT NULL,
    customer_notes TEXT,
    images JSONB, -- Array of image URLs
    source VARCHAR(50) DEFAULT 'web', -- 'web', 'mobile', 'call', 'whatsapp'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technician assignments and task management
CREATE TABLE IF NOT EXISTS service_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    assigned_technician_id UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME NOT NULL,
    scheduled_time_end TIME NOT NULL,
    assignment_notes TEXT,
    technician_notes TEXT,
    travel_distance DECIMAL(8,2), -- KM
    estimated_travel_time INTEGER, -- Minutes
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'
    acceptance_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    rejection_reason TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Service execution tracking
CREATE TABLE IF NOT EXISTS service_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_assignment_id UUID NOT NULL REFERENCES service_assignments(id) ON DELETE CASCADE,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    work_performed TEXT NOT NULL,
    root_cause_analysis TEXT,
    solution_provided TEXT,
    parts_used JSONB, -- Array of {part_id, part_name, quantity, cost}
    labor_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
    materials_cost DECIMAL(10,2) DEFAULT 0,
    total_service_cost DECIMAL(10,2) NOT NULL,
    before_photos JSONB, -- Array of image URLs
    after_photos JSONB, -- Array of image URLs
    technician_signature TEXT, -- Base64 or URL
    customer_signature TEXT, -- Base64 or URL
    service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
    additional_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    warranty_period INTEGER DEFAULT 30, -- Days
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer feedback and ratings
CREATE TABLE IF NOT EXISTS service_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_execution_id UUID NOT NULL REFERENCES service_executions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    feedback_text TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service follow-ups and recurring maintenance
CREATE TABLE IF NOT EXISTS service_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_service_id UUID NOT NULL REFERENCES service_executions(id),
    followup_type VARCHAR(50) NOT NULL, -- 'warranty', 'maintenance', 'inspection', 'callback'
    scheduled_date DATE NOT NULL,
    assigned_technician_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Service analytics and performance tracking
CREATE TABLE IF NOT EXISTS service_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    technician_id UUID REFERENCES users(id),
    service_type_id UUID REFERENCES service_types(id),
    total_services INTEGER DEFAULT 0,
    completed_services INTEGER DEFAULT 0,
    cancelled_services INTEGER DEFAULT 0,
    avg_completion_time DECIMAL(8,2), -- Hours
    avg_customer_rating DECIMAL(3,2),
    total_revenue DECIMAL(12,2) DEFAULT 0,
    travel_distance DECIMAL(8,2) DEFAULT 0,
    first_time_fix_rate DECIMAL(5,2), -- Percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, technician_id, service_type_id)
);

-- Technician availability and scheduling
CREATE TABLE IF NOT EXISTS technician_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    time_slot_start TIME NOT NULL,
    time_slot_end TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'booked', 'unavailable'
    max_assignments INTEGER DEFAULT 1,
    current_assignments INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(technician_id, date, time_slot_start)
);

-- Emergency service protocols
CREATE TABLE IF NOT EXISTS emergency_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_name VARCHAR(255) NOT NULL,
    trigger_conditions JSONB NOT NULL, -- Conditions that trigger this protocol
    response_time_target INTEGER NOT NULL, -- Minutes
    escalation_levels JSONB NOT NULL, -- Array of escalation steps
    notification_templates JSONB, -- SMS/email templates
    required_skills JSONB, -- Required technician skills
    emergency_contacts JSONB, -- Emergency contact numbers
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service quality standards and checklists
CREATE TABLE IF NOT EXISTS service_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    checklist_name VARCHAR(255) NOT NULL,
    checklist_items JSONB NOT NULL, -- Array of checklist items
    mandatory_photos JSONB, -- Required photo points
    quality_standards JSONB, -- Quality criteria
    completion_criteria TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_service_assignments_technician_id ON service_assignments(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_scheduled_date ON service_assignments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_assignments_status ON service_assignments(status);
CREATE INDEX IF NOT EXISTS idx_service_executions_assignment_id ON service_executions(service_assignment_id);
CREATE INDEX IF NOT EXISTS idx_service_feedback_rating ON service_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_service_analytics_date ON service_analytics(date);
CREATE INDEX IF NOT EXISTS idx_technician_availability_date ON technician_availability(date, technician_id);

-- Enable RLS on all tables
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Service Management

-- Service Types - readable by all authenticated users
CREATE POLICY "Allow read service_types for authenticated users" ON service_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow manage service_types for managers" ON service_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager')
        )
    );

-- Service Requests - customers see their own, staff see all
CREATE POLICY "Allow customers to manage their service requests" ON service_requests
    FOR ALL USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician', 'dispatcher')
        )
    );

-- Service Assignments - technicians see their assignments, managers see all
CREATE POLICY "Allow technicians to see their assignments" ON service_assignments
    FOR SELECT USING (
        assigned_technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'dispatcher')
        )
    );

CREATE POLICY "Allow technicians to update their assignments" ON service_assignments
    FOR UPDATE USING (
        assigned_technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'dispatcher')
        )
    );

CREATE POLICY "Allow managers to manage all assignments" ON service_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'dispatcher')
        )
    );

-- Service Executions - technicians can manage their own, managers see all
CREATE POLICY "Allow technicians to manage their service executions" ON service_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM service_assignments sa
            WHERE sa.id = service_assignment_id
            AND (sa.assigned_technician_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM users 
                     WHERE id = auth.uid() 
                     AND role IN ('admin', 'service_manager', 'dispatcher')
                 ))
        )
    );

-- Service Feedback - customers can manage their feedback, staff can read
CREATE POLICY "Allow customers to manage their feedback" ON service_feedback
    FOR ALL USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician')
        )
    );

-- Other tables - restrict to service staff only
CREATE POLICY "Allow service staff access to followups" ON service_followups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician', 'dispatcher')
        )
    );

CREATE POLICY "Allow service staff access to analytics" ON service_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'dispatcher')
        )
    );

CREATE POLICY "Allow technicians to manage their availability" ON technician_availability
    FOR ALL USING (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'dispatcher')
        )
    );

CREATE POLICY "Allow service managers to access protocols" ON emergency_protocols
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager')
        )
    );

CREATE POLICY "Allow service staff to access checklists" ON service_checklists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'service_manager', 'technician')
        )
    );

-- Insert sample service types
INSERT INTO service_types (type_code, type_name, category, description, estimated_duration, base_price, skill_level) VALUES
('INSTALL_RO', 'RO System Installation', 'installation', 'Complete installation of RO water purification system', 180, 500.00, 'intermediate'),
('MAINT_RO', 'RO System Maintenance', 'maintenance', 'Regular maintenance service for RO systems', 90, 300.00, 'basic'),
('REPAIR_PUMP', 'Water Pump Repair', 'repair', 'Repair and troubleshooting of water pumps', 120, 400.00, 'intermediate'),
('FILTER_CHANGE', 'Filter Replacement', 'maintenance', 'Replace water filters in purification systems', 45, 150.00, 'basic'),
('EMERGENCY_REPAIR', 'Emergency Repair', 'repair', 'Emergency repair service for urgent issues', 60, 600.00, 'advanced'),
('INSPECTION', 'System Inspection', 'inspection', 'Comprehensive system inspection and testing', 75, 200.00, 'intermediate'),
('TANK_CLEANING', 'Water Tank Cleaning', 'maintenance', 'Complete cleaning and sanitization of water tanks', 240, 800.00, 'basic'),
('PIPE_REPAIR', 'Pipe Repair', 'repair', 'Repair of water supply pipes and connections', 90, 250.00, 'basic')
ON CONFLICT (type_code) DO NOTHING;

-- Insert sample emergency protocols
INSERT INTO emergency_protocols (protocol_name, trigger_conditions, response_time_target, escalation_levels, notification_templates) VALUES
('Water System Failure', '["no_water_supply", "contaminated_water", "system_breakdown"]', 30, 
 '[{"level": 1, "time": 15, "action": "notify_nearest_technician"}, {"level": 2, "time": 30, "action": "escalate_to_supervisor"}, {"level": 3, "time": 60, "action": "emergency_team_deployment"}]',
 '{"sms": "EMERGENCY: Water system failure reported. Technician {tech_name} assigned. ETA: {eta}", "email": "Emergency service request #{request_id} requires immediate attention."}'),
('Health Hazard', '["contaminated_water", "leakage", "electrical_hazard"]', 15,
 '[{"level": 1, "time": 10, "action": "immediate_technician_dispatch"}, {"level": 2, "time": 15, "action": "safety_team_alert"}, {"level": 3, "time": 30, "action": "health_department_notification"}]',
 '{"sms": "HEALTH HAZARD ALERT: Immediate service required at {address}. Technician {tech_name} dispatched.", "email": "URGENT: Health hazard reported - Service request #{request_id}"}')
ON CONFLICT (protocol_name) DO NOTHING;

-- Success message
SELECT 'Service Management System setup completed successfully!' as message; 