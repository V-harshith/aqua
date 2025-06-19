# Database Setup for Water Management System

## Quick Setup

1. **Open your Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to the SQL Editor

2. **Run the Complete Setup Script**
   - Copy the entire contents of `database_migrations/00_complete_setup.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

This will create:
- All necessary tables (users, customers, complaints, services, products)
- Row Level Security policies
- Auto-generated IDs and numbers
- Sample data for testing

## What's Created

### Tables
- `users` - User profiles with roles
- `customers` - Customer information 
- `complaints` - Customer complaints and issues
- `services` - Service requests and work orders
- `products` - Water products and services

### User Roles
- `admin` - Full system access
- `dept_head` - Department management
- `service_manager` - Service operations
- `driver_manager` - Fleet management  
- `accounts_manager` - Billing and accounts
- `product_manager` - Product management
- `technician` - Field operations
- `customer` - End users

### Security
- Row Level Security (RLS) enabled
- Role-based access policies
- Secure data isolation

## Testing the System

After running the setup:
1. Create a new user account via the signup form
2. Choose your role during registration
3. Access the dashboard to see role-specific features

## Need Help?

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify your environment variables are set correctly
3. Ensure you have the necessary permissions in your Supabase project 