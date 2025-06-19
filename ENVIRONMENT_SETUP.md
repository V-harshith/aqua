# Environment Variables Setup Guide

This application requires Supabase environment variables to function properly. Follow these steps to set up your environment:

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## How to Get These Values

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard

2. **Select your project** (or create a new one if you haven't)

3. **Navigate to Settings > API**

4. **Copy the values**:
   - **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Copy to `SUPABASE_SERVICE_ROLE_KEY`

## Example .env.local File

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Important Security Notes

⚠️ **Never commit .env.local to version control**
✅ The .env.local file is already in .gitignore
🔒 Keep your service_role_key secret - it has admin privileges

## After Setting Up

1. **Restart your development server**: `npm run dev`
2. **Test user creation** through the admin panel
3. **Check the browser console** for any remaining errors

## Database Setup

Make sure you've also run the database setup script:

```sql
-- Run this in your Supabase SQL editor
-- File: safe_db_setup.sql
```

## Troubleshooting

- **"Server configuration error"**: Environment variables are missing
- **"Failed to create user"**: Check service_role_key permissions
- **Database errors**: Ensure tables are created with safe_db_setup.sql

## Next Steps

Once environment variables are set up:
1. Try creating a user through `/admin/users/new`
2. Test dashboard navigation
3. Verify user management functionality works 