# Rise 66 - Deployment Guide

## Quick Deploy Options (All Free)

### Option 1: Vercel + Supabase (Recommended)

**Prerequisites:**
- GitHub account
- Vercel account (free)
- Supabase account (free)

**Steps:**

1. **Setup Database:**
   ```bash
   # Go to supabase.com, create project, run database-setup.sql
   ```

2. **Deploy to Vercel:**
   ```bash
   # Push code to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   
   # Go to vercel.com, import GitHub repo
   # Set environment variables in Vercel dashboard
   ```

3. **Environment Variables (Vercel Dashboard):**
   ```
   DATABASE_URL=postgresql://[supabase-connection-string]
   TOGETHER_API_KEY=[your-together-ai-key]
   SESSION_SECRET=your-random-secret-string
   NODE_ENV=production
   ```

### Option 2: Railway (Alternative)

1. Go to railway.app
2. Deploy from GitHub
3. Add PostgreSQL database
4. Set same environment variables
5. Deploy automatically

### Option 3: Render (Alternative)

1. Create PostgreSQL database on Render
2. Deploy web service from GitHub
3. Set environment variables
4. Use build command: `npm run build`
5. Use start command: `npm start`

## Authentication Note

The current authentication uses Replit's OAuth system. For production deployment, you have two options:

1. **Simple Demo Mode**: Disable authentication temporarily
2. **Full Auth**: Implement Google/GitHub OAuth

I can help you set up either option after you choose your deployment platform.

## Post-Deployment Checklist

- [ ] Database tables created
- [ ] Environment variables set
- [ ] AI features working
- [ ] Authentication configured
- [ ] Habit tracking functional
- [ ] Journal features operational

## Support

After deployment, test all features:
1. User registration/login
2. Habit creation and tracking
3. AI affirmations and prompts
4. Progress charts
5. Journal functionality

The app is production-ready and includes all premium features you requested.