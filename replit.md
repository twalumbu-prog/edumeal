# EduMeal - School Canteen Meal Verification System

## Overview

EduMeal is a school canteen meal verification system that manages student meal subscriptions and validates meal tickets via QR code scanning. The application enables administrators and canteen staff to:

- Manage student records and meal subscriptions
- Generate and validate meal tickets with QR codes
- Track daily meal consumption through a dashboard
- Authenticate users via Replit Auth

The system follows a full-stack TypeScript architecture with React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion for transitions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **API Design**: RESTful endpoints with Zod schema validation

### Data Storage
- **Database**: PostgreSQL (required, configured via DATABASE_URL)
- **Schema Location**: `shared/schema.ts` defines all tables
- **Core Tables**:
  - `students` - Student registry with school IDs, grades, meal balances
  - `subscriptions` - Meal plan subscriptions with payment tracking
  - `tickets` - Individual meal tickets with QR codes and status
  - `logs` - Audit trail for system events
  - `users` - Authenticated admin/staff users (Replit Auth)
  - `sessions` - Session storage for authentication

### Authentication Flow
- Replit Auth handles login/logout via OIDC
- Sessions stored in PostgreSQL for persistence
- Protected routes require authentication middleware
- User data synced to local database on login

### Shared Code Pattern
- `shared/` directory contains code used by both frontend and backend
- Schema definitions with Drizzle and Zod for type safety
- API route definitions with input/output schemas in `shared/routes.ts`

### Build Process
- Development: `npm run dev` runs Vite dev server with Express
- Production: `npm run build` creates optimized bundle, `npm start` serves it
- Database: `npm run db:push` syncs schema to PostgreSQL via Drizzle Kit

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle Kit**: Database migration and schema push tool

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Environment Variables Required**:
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Secret for session encryption
  - `ISSUER_URL` - OIDC issuer (defaults to Replit)
  - `REPL_ID` - Replit environment identifier

### Third-Party Libraries
- **html5-qrcode**: QR code scanning for ticket verification
- **recharts**: Dashboard analytics charts
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon set

### Planned Integrations (from requirements)
- **QuickBooks**: Payment integration via webhooks (Zapier/Make)
- Webhook endpoint for automated subscription creation from payments