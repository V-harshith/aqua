# Supabase Database Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 2. Run Database Migration

1. Copy the SQL from `supabase/migrations/001_initial_schema.sql`
2. Go to your Supabase project dashboard → SQL Editor
3. Paste and run the SQL to create all tables, types, and policies

## 3. Test Connection

Run the development server to test the connection:

```bash
npm run dev
```

## Database Schema Overview

### Core Tables
- **users** - User profiles with role-based access (8 roles)
- **customers** - Customer details and service addresses
- **complaints** - Service complaints with status tracking
- **services** - Work orders linked to complaints
- **products** - Service catalog for material tracking
- **vehicles** - Vehicle and driver management
- **water_distributions** - Water delivery tracking

### Features Included
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control (8 user roles)
- ✅ Auto-generated complaint/service/invoice numbers
- ✅ Automatic timestamp updates
- ✅ Relational data with foreign keys
- ✅ TypeScript interfaces in `src/lib/supabase.ts`

### Default User Roles
- **admin** - Full system access
- **dept_head** - Department management
- **driver_manager** - Vehicle and driver operations
- **service_manager** - Service request management
- **accounts_manager** - Financial operations
- **product_manager** - Service catalog management
- **technician** - Field service operations
- **customer** - Customer portal access

## Next Steps

After completing this setup, you can proceed to:
1. Implement authentication and role-based access control
2. Build the user management system
3. Create the complaint management interface
4. Develop the service management module
5. Build the water distribution and vehicle management system
6. Create admin dashboard and reporting features 