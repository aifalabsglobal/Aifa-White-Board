# Deploying MultiFinger Board to Vercel

This guide walks you through deploying your MultiFinger Board application to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A PostgreSQL database (you can use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))

## Step 1: Prepare Your Database

### Option A: Using Neon (Recommended for Free Tier)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it should look like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### Option B: Using Supabase

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string under "Connection pooling"

### Option C: Using Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project and add PostgreSQL
3. Copy the connection string from the PostgreSQL service

## Step 2: Deploy to Vercel

### Using Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy your project**
```bash
vercel
```

4. **Add environment variables during deployment**
When prompted, add these environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., https://your-app.vercel.app)

### Using Vercel Dashboard

1. **Import your GitHub repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `multifingerboard` repository
   - Click "Import"

2. **Configure environment variables**
   - In the deployment settings, go to "Environment Variables"
   - Add the following variables:

   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_generated_secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Step 3: Run Database Migrations

After your first deployment, you need to run the database migrations:

1. **Using Vercel CLI**
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

2. **Or connect directly to your production database**
```bash
DATABASE_URL="your_production_database_url" npx prisma migrate deploy
```

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-app.vercel.app`)
2. Test the whiteboard functionality
3. Try creating an account and logging in

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your application's public URL | `https://your-app.vercel.app` |

## Troubleshooting

### Build Fails with Prisma Error

**Problem**: Build fails with "Can't reach database server"

**Solution**: Make sure your `DATABASE_URL` is correctly set in environment variables and the database is accessible from Vercel's servers.

### Database Migration Issues

**Problem**: Tables don't exist in production

**Solution**: Run migrations manually:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### NextAuth Errors

**Problem**: Authentication doesn't work in production

**Solution**: 
1. Make sure `NEXTAUTH_URL` matches your actual deployment URL
2. Regenerate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
3. Ensure both variables are set in Vercel environment variables

## Continuous Deployment

Once set up, every push to your `main` branch will automatically deploy to Vercel. You can:

1. Create a `develop` branch for staging
2. Set up preview deployments for pull requests
3. Configure custom domains in Vercel settings

## Custom Domain

To use a custom domain:

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update `NEXTAUTH_URL` to your custom domain

## Performance Optimization

- Vercel automatically optimizes your Next.js app
- Static pages are cached at the edge
- API routes run on serverless functions
- Images are automatically optimized

## Monitoring

- View deployment logs in the Vercel dashboard
- Set up error tracking with [Sentry](https://sentry.io)
- Monitor performance with Vercel Analytics

---

Need help? Check the [Vercel documentation](https://vercel.com/docs) or open an issue on GitHub.
