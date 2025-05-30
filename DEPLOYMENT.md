# Toyota Enterprise Portal - Deployment Guide

## Railway Deployment

This guide will help you deploy the Toyota Enterprise Portal to Railway with PostgreSQL database.

### Prerequisites

1. Railway account (https://railway.app)
2. GitHub account
3. Git installed locally

### Step 1: Commit Code to GitHub

1. **Initialize Git repository (if not already done):**
   ```bash
   cd /Users/sahanalakshminarayana/Toyota\ App
   git init
   git add .
   git commit -m "Initial commit - Toyota Enterprise Portal"
   ```

2. **Create GitHub repository:**
   - Go to GitHub.com and create a new repository named `toyota-enterprise-portal`
   - Don't initialize with README, .gitignore, or license (since we already have code)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/toyota-enterprise-portal.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Railway

#### Option A: Using Railway Dashboard (Recommended)

1. **Login to Railway:**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `toyota-enterprise-portal` repository

3. **Add PostgreSQL Database:**
   - In your Railway project dashboard, click "New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically create the database and provide connection details

4. **Configure Environment Variables:**
   - Click on your app service (not the database)
   - Go to "Variables" tab
   - Add the following environment variables:

   ```
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-something-very-secure
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_NAME=${{Postgres.PGDATABASE}}
   ```

   Note: The `${{Postgres.VARIABLENAME}}` values will automatically reference your PostgreSQL service.

5. **Deploy:**
   - Railway will automatically detect the Dockerfile and deploy
   - The deployment will take 5-10 minutes for the first build

#### Option B: Using Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway link  # Link to existing project or create new one
   railway add --database postgresql
   railway up
   ```

### Step 3: Set Up Database

After deployment, you need to seed the database with initial data:

1. **Connect to your Railway project:**
   ```bash
   railway shell
   ```

2. **Run database seeding:**
   ```bash
   npm run seed
   ```

   Or you can run the seed command through Railway dashboard in the "Deployments" tab.

### Step 4: Access Your Application

1. **Get your app URL:**
   - In Railway dashboard, go to your app service
   - Click on "Settings" > "Domains"
   - Your app will be available at the generated Railway URL (e.g., `https://toyota-enterprise-portal-production.up.railway.app`)

2. **Test the deployment:**
   - Visit your app URL
   - Try logging in with the seeded admin account (check your seed file for credentials)

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Port for the application | `8080` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `DB_HOST` | PostgreSQL host | `${{Postgres.PGHOST}}` |
| `DB_PORT` | PostgreSQL port | `${{Postgres.PGPORT}}` |
| `DB_USERNAME` | PostgreSQL username | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | PostgreSQL password | `${{Postgres.PGPASSWORD}}` |
| `DB_NAME` | PostgreSQL database name | `${{Postgres.PGDATABASE}}` |

### Troubleshooting

1. **Build Failures:**
   - Check the build logs in Railway dashboard
   - Ensure all dependencies are properly defined in package.json files

2. **Database Connection Issues:**
   - Verify environment variables are correctly set
   - Check that PostgreSQL service is running

3. **File Upload Issues:**
   - Railway uses ephemeral file systems
   - Consider using external file storage (AWS S3, Cloudinary) for production

4. **Memory Issues:**
   - Railway's free tier has memory limits
   - Consider upgrading to a paid plan for production use

### Database Backup

To backup your production database:

```bash
railway connect postgres
# Then use pg_dump commands to backup your data
```

### Monitoring

- Use Railway's built-in metrics and logs
- Set up health check monitoring for `/api/health` endpoint
- Monitor database performance through Railway dashboard

### Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use strong, unique JWT secrets in production
   - Regularly rotate database passwords

2. **CORS Configuration:**
   - Update CORS settings to only allow your domain
   - Remove wildcard (`*`) CORS origins in production

3. **Rate Limiting:**
   - Consider adding rate limiting middleware
   - Monitor for suspicious API usage

### Scaling

Railway automatically handles scaling for most use cases. For high-traffic applications:

1. **Database Scaling:**
   - Monitor database performance
   - Consider connection pooling
   - Upgrade PostgreSQL plan if needed

2. **Application Scaling:**
   - Railway automatically scales based on traffic
   - Monitor resource usage in dashboard

### Updates and Deployments

1. **Automatic Deployments:**
   - Railway automatically deploys when you push to your main branch
   - Monitor deployments in the Railway dashboard

2. **Manual Deployments:**
   ```bash
   railway up
   ```

3. **Rollbacks:**
   - Use Railway dashboard to rollback to previous deployments
   - Or redeploy a specific Git commit

### Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app 