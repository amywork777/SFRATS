# Deployment Steps

## Frontend (Vercel)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set up environment variables in Vercel:
   - VITE_API_URL

## Backend (Railway or similar)
1. Create a new project
2. Set up PostgreSQL database
3. Deploy backend API
4. Set up environment variables:
   - DATABASE_URL
   - ADMIN_PASSWORD
   - CORS_ORIGIN (frontend URL)

## Database (Supabase)
1. Create new project
2. Run schema.sql
3. Set up row level security
4. Get connection string 