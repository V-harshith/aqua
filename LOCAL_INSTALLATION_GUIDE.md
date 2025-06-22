# 🚀 Project Aqua - Local Installation Guide

## Prerequisites

### System Requirements
- **Node.js**: v18.0 or higher
- **npm**: v8.0 or higher  
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Environment Setup
- **OS**: Windows 10/11, macOS, or Linux
- **Browser**: Chrome, Firefox, or Edge (latest versions)
- **Memory**: Minimum 4GB RAM
- **Storage**: 1GB free space

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/V-harshith/aqua.git
cd aqua
```

### 2. Install Dependencies
```bash
# Install all project dependencies
npm install

# Clear npm cache if needed
npm cache clean --force
```

### 3. Environment Configuration
Create `.env.local` file in root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://okmvjnwrmmxypxplalwp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbXZqbndybW14eXB4cGxhbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMTc1ODYsImV4cCI6MjA2NTc5MzU4Nn0.Ewq7oRlQRV8IJ0g8_436m-eVHLCdCiIV9ohOTMkAidE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbXZqbndybW14eXB4cGxhbHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIxNzU4NiwiZXhwIjoyMDY1NzkzNTg2fQ.VGV206hyZ7z9koTHylKCpXE2-aU2sljK5G8iZ9YCSRg

# Application Configuration
NODE_ENV=development
```

### 4. Database Setup
The database is already configured and running:
- **Database**: Supabase PostgreSQL
- **Project ID**: okmvjnwrmmxypxplalwp
- **Tables**: Pre-configured with all required schema
- **RLS Policies**: Active and properly configured

### 5. Start Development Server
```bash
# Start the development server
npm run dev

# Server will start on http://localhost:3000
# If port 3000 is busy, it will use 3001
```

### 6. Verify Installation
Open browser and navigate to:
- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Services**: http://localhost:3000/services

## Default Users & Access

### Admin Access
- **Email**: Any admin user in database
- **Role**: admin
- **Access**: Full system access

### Test Users Available
Check the users table in Supabase for available test accounts with different roles:
- `admin` - Full system access
- `customer` - Customer dashboard
- `driver_manager` - Driver operations
- `service_manager` - Service management
- `technician` - Technical operations

## Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
# Kill existing Node processes
taskkill /f /im node.exe  # Windows
killall node              # macOS/Linux

# Or use different port
npm run dev -- -p 3001
```

#### 2. Build Errors
```bash
# Clear Next.js cache
rm -rf .next               # macOS/Linux
Remove-Item -Recurse .next # Windows PowerShell

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 3. Database Connection Issues
- Verify environment variables in `.env.local`
- Check Supabase project status
- Ensure internet connection is stable

#### 4. Module Not Found Errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Code linting
npm run lint

# Type checking
npm run type-check
```

## File Structure Overview

```
proj_aqua/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (auth)/         # Authentication pages
│   │   ├── admin/          # Admin panel pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Main dashboard
│   │   └── services/       # Service management
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── auth/           # Authentication components
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── context/            # React context providers
├── public/                 # Static assets
└── database_migrations/    # Database setup scripts
```

## Next Steps After Installation

1. **Explore Dashboards**: Navigate through all 7 dashboards
2. **Test Functionality**: Try creating services, complaints, etc.
3. **Check Export Features**: Test data export functionality
4. **Mobile Testing**: Test PWA features on mobile devices
5. **User Management**: Explore admin user management features

## Support & Documentation

- **GitHub Repository**: https://github.com/V-harshith/aqua
- **Issue Tracking**: Use GitHub Issues for bug reports
- **Documentation**: Check README.md for additional details
- **Database Schema**: See `complete_database_schema.sql`

---
**Installation Complete!** 🎉 Your Project Aqua development environment is ready. 