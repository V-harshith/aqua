# Project Structure & Organization

## Root Directory Structure
```
proj_aqua/
├── src/                    # Main application source
├── public/                 # Static assets and PWA files
├── database_migrations/    # SQL migration files
├── supabase/              # Supabase configuration
├── scripts/               # Utility scripts
└── .kiro/                 # Kiro AI configuration
```

## Source Code Organization (`src/`)

### App Router Structure (`src/app/`)
```
app/
├── (auth)/                # Auth route group (signin, signup, reset-password)
├── admin/                 # Admin dashboard and management
├── dashboard/             # Customer dashboard
├── driver/                # Driver manager dashboard
├── services/              # Service management (new, assignment, list)
├── api/                   # API routes for backend operations
├── layout.tsx             # Root layout with AuthProvider
├── page.tsx               # Landing page
└── globals.css            # Global styles
```

### Component Architecture (`src/components/`)
```
components/
├── auth/                  # Authentication components
│   ├── AuthNav.tsx        # Navigation with auth state
│   ├── SignInForm.tsx     # Login form
│   ├── SignUpForm.tsx     # Registration form
│   └── ResetPasswordForm.tsx
└── ui/                    # Reusable UI components
    ├── Button.tsx         # Primary button component
    ├── Card.tsx           # Container component
    └── Input.tsx          # Form input component
```

### Core Services (`src/lib/` & `src/services/`)
```
lib/
├── supabase.ts            # Supabase client configuration
├── auth-client.ts         # Authentication utilities
├── userService.ts         # User management operations
└── utils.ts               # Utility functions

services/
└── [service-specific modules for business logic]
```

### State Management (`src/context/` & `src/hooks/`)
```
context/
└── AuthContext.tsx        # Global auth state management

hooks/
└── useAuth.ts             # Custom authentication hook
```

## Route Protection Patterns
- **Public Routes**: `/`, `/signin`, `/signup`, `/reset-password`
- **Protected Routes**: `/dashboard/*`, `/admin/*`, `/services/*`
- **Role-based Access**: Each dashboard checks user role via Supabase RLS
- **Middleware**: Handles static file exclusions, auth handled per component

## API Route Organization (`src/app/api/`)
```
api/
├── admin/                 # Admin-only endpoints
│   ├── all-data/         # Complete data export
│   ├── stats/            # System statistics
│   └── users/            # User management
├── dashboard/            # Dashboard data endpoints
├── services/             # Service management APIs
└── [other domain-specific routes]
```

## Database Schema Conventions
- **Table Naming**: Snake_case (users, service_requests, water_distributions)
- **Foreign Keys**: Consistent `_id` suffix (user_id, customer_id)
- **Timestamps**: `created_at`, `updated_at` on all tables
- **RLS Policies**: Role-based access control on all tables
- **Triggers**: Automatic profile creation and timestamp updates

## File Naming Conventions
- **Components**: PascalCase (AuthNav.tsx, SignInForm.tsx)
- **Pages**: lowercase with hyphens (reset-password, service-types)
- **API Routes**: lowercase with hyphens (all-data, route.ts)
- **Utilities**: camelCase (userService.ts, auth-client.ts)
- **Types**: PascalCase interfaces and types

## Import Path Standards
- Use `@/` alias for all src imports
- Relative imports only for same-directory files
- Group imports: external packages, then internal modules
- Export components as default, utilities as named exports