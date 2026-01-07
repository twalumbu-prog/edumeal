## Packages
html5-qrcode | QR Code scanning functionality for the canteen interface
recharts | For the analytics dashboard charts
framer-motion | For beautiful animations and transitions
date-fns | For date formatting and manipulation
react-hook-form | For efficient form handling
@hookform/resolvers | For Zod validation in forms
lucide-react | Icon set (already in base but confirming usage)
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
API Endpoints assumed based on schema:
- Students: /api/students (GET, POST), /api/students/:id (PUT, DELETE)
- Subscriptions: /api/subscriptions (GET, POST)
- Tickets: /api/tickets/scan (POST), /api/tickets/generate (POST)
- Stats: /api/stats (GET)
Auth is provided via Replit Auth (use-auth.ts already exists).
