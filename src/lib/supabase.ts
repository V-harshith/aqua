import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Database types
export type UserRole = 
  | 'admin'
  | 'dept_head' 
  | 'driver_manager'
  | 'service_manager'
  | 'accounts_manager'
  | 'product_manager' 
  | 'technician'
  | 'customer';

export type ComplaintStatus = 
  | 'open'
  | 'assigned' 
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ServiceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
// Payment types removed - not needed for water management system

// Database interfaces
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  employee_id?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  customer_code: string;
  business_name?: string;
  contact_person?: string;
  billing_address: string;
  service_address?: string;
  water_connection_id?: string;
  meter_number?: string;
  registration_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  unit_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  customer_id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: string;
  location?: string;
  reported_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_user?: User;
}

export interface Service {
  id: string;
  service_number: string;
  complaint_id?: string;
  customer_id: string;
  assigned_technician?: string;
  service_type: string;
  description: string;
  status: ServiceStatus;
  scheduled_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  materials_used?: any;
  service_notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: User;
  complaint?: Complaint;
}

// Invoice and Payment interfaces removed - not needed for water management system

// Database schema type
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Customer, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Product, 'id'>>;
      };
      complaints: {
        Row: Complaint;
        Insert: Omit<Complaint, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Complaint, 'id'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Service, 'id'>>;
      };
      // Invoice and Payment tables removed
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Utility functions for the water management system
export const waterAPI = {
  // Users
  async getUser(id: string) {
    return supabase.from('users').select('*').eq('id', id).single();
  },

  async getUsersByRole(role: UserRole) {
    return supabase.from('users').select('*').eq('role', role).eq('is_active', true);
  },

  // Customers
  async getCustomers() {
    return supabase.from('customers').select(`
      *,
      user:users(*)
    `);
  },

  async getCustomer(id: string) {
    return supabase.from('customers').select(`
      *,
      user:users(*)
    `).eq('id', id).single();
  },

  // Complaints
  async getComplaints() {
    return supabase.from('complaints').select(`
      *,
      customer:customers(*),
      assigned_user:users(*)
    `).order('created_at', { ascending: false });
  },

  async getComplaintsByStatus(status: ComplaintStatus) {
    return supabase.from('complaints').select(`
      *,
      customer:customers(*),
      assigned_user:users(*)
    `).eq('status', status).order('created_at', { ascending: false });
  },

  async getComplaintsByUser(userId: string) {
    return supabase.from('complaints').select(`
      *,
      customer:customers(*)
    `).eq('assigned_to', userId).order('created_at', { ascending: false });
  },

  // Services
  async getServices() {
    return supabase.from('services').select(`
      *,
      customer:customers(*),
      technician:users(*),
      complaint:complaints(*)
    `).order('created_at', { ascending: false });
  },

  async getServicesByTechnician(technicianId: string) {
    return supabase.from('services').select(`
      *,
      customer:customers(*),
      complaint:complaints(*)
    `).eq('assigned_technician', technicianId).order('created_at', { ascending: false });
  },

  // Invoices
  // Invoice-related functions removed

  // Products
  async getProducts() {
    return supabase.from('products').select('*').eq('is_active', true);
  },

  // Dashboard stats
  async getDashboardStats() {
    const [complaints, services, customers] = await Promise.all([
      supabase.from('complaints').select('status'),
      supabase.from('services').select('status'),
      supabase.from('customers').select('status')
    ]);

    return {
      complaints: complaints.data || [],
      services: services.data || [],
      customers: customers.data || []
    };
  }
};