-- Product Management Complete Setup
-- This migration creates all tables needed for product management

-- Product catalog table
CREATE TABLE IF NOT EXISTS product_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'water_purifier', 'accessories', 'spare_parts'
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    description TEXT,
    specifications JSONB,
    base_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'discontinued'
    warranty_months INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer products (installed products)
CREATE TABLE IF NOT EXISTS customer_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product_catalog(id),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    installation_date DATE NOT NULL,
    installation_address TEXT NOT NULL,
    installation_technician_id UUID REFERENCES users(id),
    warranty_end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'replaced'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AMC/CMC subscriptions
CREATE TABLE IF NOT EXISTS product_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id) ON DELETE CASCADE,
    subscription_type VARCHAR(10) NOT NULL, -- 'amc', 'cmc'
    plan_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    services_included JSONB, -- Array of included services
    service_frequency INTEGER, -- Days between services
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    auto_renewal BOOLEAN DEFAULT true,
    next_service_due DATE,
    services_completed INTEGER DEFAULT 0,
    total_services_allowed INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service history for subscriptions
CREATE TABLE IF NOT EXISTS subscription_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES product_subscriptions(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    technician_id UUID REFERENCES users(id),
    service_type VARCHAR(100) NOT NULL,
    work_performed TEXT,
    parts_replaced JSONB, -- Array of parts used
    customer_feedback INTEGER CHECK (customer_feedback >= 1 AND customer_feedback <= 5),
    feedback_notes TEXT,
    next_service_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory management
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'spare_parts', 'consumables', 'tools'
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL, -- 'pieces', 'liters', 'kg'
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 10,
    maximum_stock INTEGER NOT NULL DEFAULT 1000,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    location VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements (in/out)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'purchase', 'service', 'wastage', 'adjustment'
    reference_id UUID, -- Reference to service, purchase order, etc.
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service scheduling
CREATE TABLE IF NOT EXISTS service_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id),
    subscription_id UUID REFERENCES product_subscriptions(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    service_type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    assigned_technician_id UUID REFERENCES users(id),
    estimated_duration INTEGER, -- Minutes
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product performance tracking
CREATE TABLE IF NOT EXISTS product_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id),
    metric_name VARCHAR(100) NOT NULL, -- 'tds_level', 'flow_rate', 'filter_life'
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID REFERENCES users(id),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_products_customer_id ON customer_products(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_status ON customer_products(status);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_customer_product_id ON product_subscriptions(customer_product_id);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_status ON product_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_next_service_due ON product_subscriptions(next_service_due);
CREATE INDEX IF NOT EXISTS idx_subscription_services_subscription_id ON subscription_services(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_services_service_date ON subscription_services(service_date);
CREATE INDEX IF NOT EXISTS idx_service_schedules_scheduled_date ON service_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_schedules_technician ON service_schedules(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

-- RLS Policies
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;

-- Product catalog - readable by all authenticated users
CREATE POLICY "Allow read product_catalog for authenticated users" ON product_catalog
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow manage product_catalog for product managers" ON product_catalog
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager')
        )
    );

-- Customer products - customers see their own, managers see all
CREATE POLICY "Allow customers to see their products" ON customer_products
    FOR SELECT USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

CREATE POLICY "Allow manage customer products for managers" ON customer_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager')
        )
    );

-- Product subscriptions - customers see their own, managers see all
CREATE POLICY "Allow customers to see their subscriptions" ON product_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_products cp
            WHERE cp.id = customer_product_id
            AND (cp.customer_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM users 
                     WHERE id = auth.uid() 
                     AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
                 ))
        )
    );

CREATE POLICY "Allow manage subscriptions for managers" ON product_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager')
        )
    );

-- Subscription services - similar pattern
CREATE POLICY "Allow view subscription services" ON subscription_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product_subscriptions ps
            JOIN customer_products cp ON ps.customer_product_id = cp.id
            WHERE ps.id = subscription_id
            AND (cp.customer_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM users 
                     WHERE id = auth.uid() 
                     AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
                 ))
        )
    );

CREATE POLICY "Allow manage subscription services for staff" ON subscription_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

-- Inventory - only for staff
CREATE POLICY "Allow inventory access for staff" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

CREATE POLICY "Allow stock movements for staff" ON stock_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

-- Service schedules - customers see their own, staff see all
CREATE POLICY "Allow view service schedules" ON service_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_products cp
            WHERE cp.id = customer_product_id
            AND (cp.customer_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM users 
                     WHERE id = auth.uid() 
                     AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
                 ))
        )
    );

CREATE POLICY "Allow manage service schedules for staff" ON service_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

-- Product performance - customers see their own, staff see all
CREATE POLICY "Allow view product performance" ON product_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_products cp
            WHERE cp.id = customer_product_id
            AND (cp.customer_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM users 
                     WHERE id = auth.uid() 
                     AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
                 ))
        )
    );

CREATE POLICY "Allow record product performance for staff" ON product_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician')
        )
    );

-- Insert sample data
INSERT INTO product_catalog (product_code, product_name, category, brand, model, description, base_price, warranty_months) VALUES
('WP-RO-001', 'RO Water Purifier 8L', 'water_purifier', 'AquaPure', 'AP-RO-8L', '8 stage RO purification system', 15000.00, 24),
('WP-UV-001', 'UV Water Purifier 6L', 'water_purifier', 'AquaPure', 'AP-UV-6L', '6 stage UV purification system', 8000.00, 12),
('ACC-TDS-001', 'TDS Meter Digital', 'accessories', 'Generic', 'TDS-100', 'Digital TDS meter for water testing', 500.00, 6),
('SP-FILTER-001', 'RO Membrane Filter', 'spare_parts', 'AquaPure', 'AP-MEM-75', '75 GPD RO membrane filter', 1200.00, 3),
('SP-FILTER-002', 'Carbon Filter Block', 'spare_parts', 'AquaPure', 'AP-CB-10', '10 inch carbon block filter', 300.00, 3);

INSERT INTO inventory_items (item_code, item_name, category, unit_of_measure, current_stock, minimum_stock, unit_cost) VALUES
('INV-MEM-001', 'RO Membrane 75GPD', 'spare_parts', 'pieces', 50, 10, 1200.00),
('INV-CB-001', 'Carbon Block Filter', 'spare_parts', 'pieces', 100, 20, 300.00),
('INV-PP-001', 'PP Sediment Filter', 'spare_parts', 'pieces', 150, 30, 150.00),
('INV-UV-001', 'UV Lamp 11W', 'spare_parts', 'pieces', 25, 5, 800.00),
('INV-TOOL-001', 'Filter Wrench Set', 'tools', 'pieces', 10, 2, 500.00);

-- Success message
SELECT 'Product Management System setup completed successfully!' as message; 