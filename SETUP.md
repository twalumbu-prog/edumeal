# Setup Guide for TEC-Edumeal

## Quick Start

### 1. Install Dependencies ✅
Already done! All npm packages are installed.

### 2. Set Up PostgreSQL Database

You have three options:

#### Option A: Use Supabase (Recommended - Free & Easy)
1. Go to https://supabase.com and sign up
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`)
5. Update `.env` file with your `DATABASE_URL`

#### Option B: Use Neon (Free PostgreSQL)
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string from the dashboard
4. Update `.env` file with your `DATABASE_URL`

#### Option C: Install PostgreSQL Locally
```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb edumeal

# Update .env with:
# DATABASE_URL=postgresql://postgres@localhost:5432/edumeal
```

### 3. Update Environment Variables

Edit the `.env` file and update `DATABASE_URL` with your actual database connection string.

### 4. Push Database Schema

Once your database is set up, run:
```bash
npm run db:push
```

This will create all the necessary tables in your database.

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5000

## Environment Variables

The `.env` file contains:
- `DATABASE_URL` - PostgreSQL connection string (REQUIRED)
- `SESSION_SECRET` - Session encryption secret (already generated)
- `ISSUER_URL` - Replit Auth issuer (optional for local dev)
- `REPL_ID` - Replit ID (optional for local dev)
- `PORT` - Server port (defaults to 5000)

## Troubleshooting

### Database Connection Issues
- Make sure your `DATABASE_URL` is correct
- Check if your database is accessible (firewall, network)
- Verify database credentials

### Auth Issues
- The app uses Replit Auth by default
- For local development, you may need to modify auth setup or use a Replit environment
- Check `server/replit_integrations/auth/` for auth configuration

### Port Already in Use
- Change the `PORT` in `.env` file
- Or kill the process using port 5000: `lsof -ti:5000 | xargs kill`

## Next Steps

1. Set up your PostgreSQL database (choose one of the options above)
2. Update `DATABASE_URL` in `.env`
3. Run `npm run db:push` to create tables
4. Run `npm run dev` to start the server
5. Open http://localhost:5000 in your browser

