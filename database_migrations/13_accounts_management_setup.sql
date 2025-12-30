-- Accounts Management Module - SQL Migration
-- Following Supabase best practices for financial data and RLS

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    due_date DATE NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb, -- Store line items as JSON for simplicity, or normalize if needed
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'card')),
    transaction_reference TEXT, -- UPI ID, Cheque No, etc.
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Expenses Table (Optional - for basic tracking)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- e.g., 'Fuel', 'Maintenance', 'Salaries'
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    incurred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies

-- Invoices: 
-- Customers can view their own
-- Staff (Accounts, Admin, Service Managers) can view all
-- Accounts/Admin can manage

CREATE POLICY "Customers view own invoices" ON public.invoices
    FOR SELECT USING (
        (SELECT auth.uid()) IN (
            SELECT user_id FROM public.customers WHERE id = invoices.customer_id
        )
    );

CREATE POLICY "Staff view all invoices" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Accounts manage invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager')
        )
    );

-- Payments:
-- Customers view own
-- Staff view all
-- Accounts/Admin manage

CREATE POLICY "Customers view own payments" ON public.payments
    FOR SELECT USING (
        (SELECT auth.uid()) IN (
            SELECT user_id FROM public.customers WHERE id = payments.customer_id
        )
    );

CREATE POLICY "Staff view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Accounts manage payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager')
        )
    );

-- Expenses:
-- Staff view/submit
-- Accounts/Admin manage

CREATE POLICY "Staff view expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager', 'dept_head', 'driver_manager', 'service_manager', 'product_manager')
        )
    );

CREATE POLICY "Staff submit expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager', 'dept_head', 'driver_manager', 'service_manager', 'product_manager')
        )
    );

CREATE POLICY "Accounts manage expenses" ON public.expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'accounts_manager')
        )
    );

-- Updated_at Trigger
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sample Data (Optional) can be added here if needed
