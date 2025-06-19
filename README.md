# Project Aqua 💧

A modern water solutions platform built with Next.js, featuring secure authentication and a responsive dashboard interface. Project Aqua provides a foundation for water management, monitoring, and solutions applications.

## ✨ Features

### 🔐 Authentication System
- **User Registration & Login** - Secure account creation and sign-in
- **Password Reset** - Email-based password recovery
- **Protected Routes** - Middleware-protected dashboard and user areas
- **Session Management** - Persistent user sessions with Supabase

### 🎯 Core Functionality
- **Dashboard Interface** - Protected user dashboard with profile information
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Modern UI Components** - Custom-built Button, Card, and Input components
- **Type Safety** - Full TypeScript implementation

### 🚀 Technical Stack
- **Framework**: Next.js 15.3.2 with App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **Language**: TypeScript 5
- **Development**: Turbopack for fast development

## 🏗️ Project Structure

```
proj_aqua/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── signin/        # Sign in page
│   │   │   ├── signup/        # Registration page
│   │   │   └── reset-password/ # Password reset
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── layout.tsx         # Root layout with AuthProvider
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── auth/             # Authentication components
│   │   │   ├── AuthNav.tsx   # Navigation with auth state
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── context/
│   │   └── AuthContext.tsx   # Global auth state management
│   ├── hooks/
│   │   └── useAuth.ts        # Custom auth hook
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client configuration
│   │   └── utils.ts          # Utility functions
│   └── middleware.ts         # Route protection middleware
└── task-magic/               # AI task management system
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm
- Supabase account and project

### 1. Clone and Install
```bash
git clone <repository-url>
cd proj_aqua
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Configuration
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Add the credentials to your `.env.local` file

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🔒 Authentication Flow

### User Registration
1. Navigate to `/signup`
2. Enter email and password
3. Receive confirmation email (if email confirmation enabled)
4. Automatically redirected to dashboard upon successful registration

### User Sign In
1. Navigate to `/signin`
2. Enter credentials
3. Redirected to dashboard upon successful authentication

### Password Reset
1. Navigate to `/reset-password`
2. Enter email address
3. Receive password reset email
4. Follow email instructions to reset password

### Route Protection
- **Public Routes**: `/`, `/signin`, `/signup`, `/reset-password`
- **Protected Routes**: `/dashboard/*`
- **Middleware**: Automatically redirects unauthenticated users to sign-in page

## 🧩 Component System

### UI Components
- **Button**: Flexible button component with multiple variants
- **Card**: Container component for content sections
- **Input**: Form input with validation states and accessibility features

### Auth Components
- **AuthNav**: Navigation component that adapts based on authentication state
- **SignInForm**: Complete sign-in form with validation
- **SignUpForm**: Registration form with email/password validation
- **ResetPasswordForm**: Password reset request form

## 📱 Responsive Design

The application is built mobile-first with Tailwind CSS:
- **Mobile**: Optimized for phones and small screens
- **Tablet**: Adapted layout for medium screens
- **Desktop**: Full-featured layout for large screens

## 🔧 Development Tools

### Task Magic Integration
This project includes the Task Magic system for AI-assisted development:
- **Plans**: Located in `.ai/plans/` for feature planning
- **Tasks**: Active development tasks in `.ai/tasks/`
- **Memory**: Archived work in `.ai/memory/`

### TypeScript Configuration
- Strict mode enabled for better code quality
- Path aliases configured for clean imports
- Full type coverage for Supabase integration

## 🎨 Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update Tailwind config in `postcss.config.mjs`
- Customize component styles in individual component files

### Authentication
- Configure Supabase settings in your Supabase dashboard
- Modify auth flows in the auth components
- Update protected routes in `middleware.ts`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
1. Build the project: `npm run build`
2. Set environment variables on your platform
3. Deploy the `.next` folder

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](./issues) page
- Review the Supabase [documentation](https://supabase.com/docs)
- Consult the Next.js [documentation](https://nextjs.org/docs)

---

**Project Aqua** - Bringing modern web technologies to water solutions. 💧✨
