# Deployment Instructions for Rise 66

## Option 1: Vercel + Supabase (Free)

### 1. Database Setup (Supabase)
- Create account at supabase.com
- Create new project
- Run the SQL from database-setup.sql in SQL Editor
- Copy connection string from Settings > Database

### 2. Code Repository
- Push code to GitHub repository
- Ensure vercel.json is in root directory

### 3. Vercel Deployment
- Connect GitHub repo to Vercel
- Set environment variables:
  - DATABASE_URL (from Supabase)
  - TOGETHER_API_KEY (your key)
  - SESSION_SECRET (random string)
  - REPL_ID (your-app-name)
  - REPLIT_DOMAINS (your-domain.vercel.app)

### 4. Authentication Setup
- Update replitAuth.ts for production domains
- Test login flow after deployment

## Option 2: Railway + PostgreSQL (Free)

### 1. Railway Setup
- Sign up at railway.app with GitHub
- Create new project from GitHub repo
- Add PostgreSQL database service

### 2. Environment Variables
- Same as Vercel option
- DATABASE_URL automatically provided by Railway

## Option 3: Render + PostgreSQL (Free)

### 1. Database
- Create free PostgreSQL instance on Render
- Run database-setup.sql

### 2. Web Service
- Deploy from GitHub repo
- Set environment variables
- Use build command: npm run build
- Use start command: npm start

## Authentication Notes
- For production, you'll need to set up proper OAuth
- Consider using NextAuth.js or Auth0 for easier setup
- Current Replit auth may need modification for external domains

## Post-Deployment
1. Test all features
2. Verify database connections
3. Check AI functionality
4. Test habit tracking and journaling

## Monitoring
- Use Vercel Analytics (free)
- Monitor database usage on Supabase
- Check API rate limits on Together AI