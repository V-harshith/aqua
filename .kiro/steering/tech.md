# Technology Stack & Build System

## Core Framework
- **Next.js 15.3.2** with App Router architecture
- **React 19** with TypeScript 5 (strict mode enabled)
- **Supabase** for authentication, database, and real-time features
- **Tailwind CSS 4.0** for styling with mobile-first approach

## Key Dependencies
- **@supabase/supabase-js** & **@supabase/ssr** - Database and auth integration
- **lucide-react** - Icon system for visual-first design
- **xlsx** - Excel export functionality (production requirement)
- **class-variance-authority** & **clsx** - Component styling utilities
- **shadcn-ui** patterns for consistent UI components

## Development Tools
- **Turbopack** for fast development builds
- **ESLint** with Next.js configuration
- **TypeScript** with strict type checking
- Path aliases configured (`@/*` → `./src/*`)

## Build Commands
```bash
# Development with Turbopack (fast reload)
npm run dev

# Production build (generates 41+ static pages)
npm run build

# Production server
npm run start

# Code linting
npm run lint
```

## Environment Configuration
Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Integration
- **Supabase PostgreSQL** with Row Level Security (RLS)
- Real-time subscriptions for live data updates
- Automatic user profile creation via database triggers
- Production database: `okmvjnwrmmxypxplalwp.supabase.co`

## PWA Configuration
- Service worker for offline functionality
- Web app manifest for native app installation
- Optimized for mobile devices and touch interfaces
- Image optimization for Supabase CDN

## Performance Standards
- Build time: ~18-20 seconds
- Bundle size: 149KB average first load
- API response: Sub-second for data queries
- Auto-refresh: 30-second intervals for dashboards