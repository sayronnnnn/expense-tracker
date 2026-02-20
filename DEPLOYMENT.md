# Expense Tracker - Deployment Guide (Fly.io + Vercel + MongoDB Atlas)

This guide walks through deploying the full Expense Tracker stack to free cloud services with **zero cost**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS (Vercel)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                    │
│           https://expense-tracker.vercel.app                 │
│  - Displays dashboard, expenses, budgets, analytics         │
│  - Theme toggle (light/dark mode)                           │
│  - Collapsible filters, notifications                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS (Fly.io)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend API (FastAPI + APScheduler)                │
│      https://expense-tracker.fly.dev or similar              │
│  - FastAPI REST endpoints (/api/v1/...)                     │
│  - JWT authentication                                       │
│  - APScheduler (hourly recurring expense processing)        │
│  - Health check endpoint (/health) for monitoring           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ MongoDB Wire Protocol
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Database (MongoDB Atlas - Free Tier)               │
│   - 512 MB storage                                          │
│   - 3 data centers (Singapore, etc.)                        │
│   - Automatic backups                                       │
└─────────────────────────────────────────────────────────────┘
```

**Cost Breakdown:**
- **Frontend (Vercel):** Free (3x monthly per-function invocations, unlimited builds)
- **Backend (Fly.io):** Free (3 shared-cpu instances, 3GB RAM shared)
- **Database (MongoDB Atlas):** Free (M0 tier, 512 MB)
- **Total Monthly Cost:** **$0**

---

## Prerequisites

1. **Git & GitHub Account**
   - Have your code pushed to a GitHub repository
   - Command: `git push origin main`

2. **MongoDB Atlas Account** ✅ (Already set up)
   - Connection string in `backend/.env`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/?appName=...`

3. **Fly.io Account** (Create free)
   - Visit: https://fly.io
   - Click "Sign Up"
   - Verify email
   - Optionally add credit card (for overages, but free tier won't incur charges)

4. **Vercel Account** (Create free)
   - Visit: https://vercel.com
   - Click "Sign Up"
   - Connect GitHub account

5. **Flyctl CLI Tool** (Windows)
   ```powershell
   # Install chocolatey if not already installed
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

   # Then install flyctl
   choco install flyctl
   ```
   Verify: `flyctl --version`

---

## Step 1: Initialize Fly.io App (Backend)

### 1.1 Login to Fly.io and Create App

```powershell
# Login to Fly.io (opens browser for auth)
flyctl auth login

# Navigate to project root
cd c:\GitClone\Cyron\expense-tracker

# Create new Fly app (will use fly.toml in root)
# This will ask for app name - use: expense-tracker-api-{yourname}
flyctl launch --no-deploy
```

**When prompted:**
- **App name:** `expense-tracker-api` (Fly will append random suffix to make unique)
- **Region:** Choose closest to you (e.g., `sin` for Singapore, `sfo` for San Francisco)
- **Postgres:** NO
- **Redis:** NO
- **Dockerfile path:** `backend/Dockerfile` (should auto-detect)

✅ This creates/updates `fly.toml` with app configuration (app name, region, build config)

### 1.2 Verify fly.toml Configuration

```powershell
# View generated fly.toml
cat fly.toml
```

Should show:
```toml
app = "expense-tracker-api-xxxxx"
primary_region = "sin"
build = {dockerfile = "backend/Dockerfile"}
```

---

## Step 2: Set Environment Variables on Fly.io

### 2.1 Set Secrets (sensitive data)

```powershell
# Set MongoDB connection (sensitive - use secret)
flyctl secrets set MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/?appName=expense_tracker"

# Set JWT secret (generate a random 32+ character string)
# Example: use PowerShell to generate:
# $randomString = -join ((1..32) | ForEach-Object { [char]([int](@(33..126) | Get-Random)) })
# Or use online generator: https://randomkeygen.com/ (copy "CodeIgniter Encryption Keys")
flyctl secrets set JWT_SECRET="your-32-character-random-string-here"

# Set CORS origins (frontend URL will be determined after Vercel deployment)
flyctl secrets set CORS_ORIGINS="https://expense-tracker-xxxxx.vercel.app,http://localhost:5173"

# Set Groq API key (if using LLM features)
flyctl secrets set GROQ_API_KEY="gsk_your-groq-api-key-here"
```

### 2.2 Set Regular Environment Variables

```powershell
# Set non-sensitive config
flyctl config set ENVIRONMENT="production"
flyctl config set DEBUG="false"
flyctl config set APP_NAME="Expense Tracker API"
flyctl config set MONGODB_DB_NAME="expense_tracker"
```

### 2.3 Verify All Secrets Are Set

```powershell
flyctl secrets list
```

Should show:
```
NAME                 DIGEST          CREATED AT
MONGODB_URL          sha256:abc123   2024-01-15 10:30:00 Z
JWT_SECRET           sha256:def456   2024-01-15 10:31:00 Z
CORS_ORIGINS         sha256:ghi789   2024-01-15 10:31:30 Z
GROQ_API_KEY         sha256:jkl012   2024-01-15 10:32:00 Z
```

---

## Step 3: Deploy Backend to Fly.io

### 3.1 Deploy Application

```powershell
# Build and deploy (this will take 2-5 minutes)
flyctl deploy
```

**What happens:**
1. Fly.io pulls code from GitHub (or local Docker daemon)
2. Builds Docker image using `backend/Dockerfile`
3. Pushes image to Fly's registry
4. Starts container with 2 shared CPU cores, 1 GB RAM
5. Assigns public URL: `https://expense-tracker-api-xxxxx.fly.dev`

### 3.2 Monitor Deployment

```powershell
# Watch logs (Ctrl+C to exit)
flyctl logs

# Check status
flyctl status

# Get app URL
flyctl apps info
```

**Expected logs after startup:**
```
[app] INFO:     Uvicorn running on http://0.0.0.0:8000
[app] INFO:     Application startup complete
```

### 3.3 Verify Health Check

```powershell
# Get public URL (copy this)
$API_URL = (flyctl apps info --json | ConvertFrom-Json).Hostname

# Test health endpoint
curl "https://$API_URL/health"
# Should return: {"status":"ok"}

# Test docs/API docs
# Visit: https://$API_URL/docs in browser
```

✅ Backend is now live! Save API URL for next step: `https://expense-tracker-api-xxxxx.fly.dev`

---

## Step 4: Update Frontend Environment Variables

### 4.1 Create .env.production

In `frontend/` folder, create `.env.production`:

```bash
VITE_API_URL=https://expense-tracker-api-xxxxx.fly.dev
```

(Replace with actual Fly.io URL from Step 3.3)

### 4.2 Verify Frontend API Client Uses Environment Variable

Check `frontend/src/api/client.ts`:

```typescript
const BASE = import.meta.env.VITE_API_URL || '/api/v1';
```

✅ This ensures frontend connects to cloud backend in production

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Push Code to GitHub

```powershell
cd c:\GitClone\Cyron\expense-tracker
git add .
git commit -m "Deployment configuration: Fly.io backend, MongoDB Atlas, Vercel frontend"
git push origin main
```

### 5.2 Deploy on Vercel

1. **Go to:** https://vercel.com/new
2. **Select "Import Git Repository"**
3. **Search for:** `expense-tracker` (or whichever repo name)
4. **Click Import**
5. **Configure Project:**
   - **Root Directory:** Leave empty or set to `./` if prompted
   - **Build Command:** `npm run build` (Vercel should auto-detect)
   - **Output Directory:** `frontend/dist`
   - **Framework:** Select "Vite" if prompted
6. **Environment Variables**
   - Click "Environment Variables"
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://expense-tracker-api-xxxxx.fly.dev
     (Select all environments)
     ```
7. **Click Deploy**

**Vercel will:**
1. Wait for build to complete (~2-3 minutes)
2. Assign URL: `https://expense-tracker-xxxxx.vercel.app`
3. Show deployment status (when checkmark appears, it's live)

### 5.3 Update Backend CORS

Now that Vercel URL is assigned, update backend CORS:

```powershell
# Update Vercel URL in backend
flyctl secrets set CORS_ORIGINS="https://expense-tracker-xxxxx.vercel.app,http://localhost:5173"

# Deploy updated secret
flyctl deploy
```

---

## Step 6: Test Full Integration

### 6.1 Test Frontend Login/Registration

1. **Visit:** `https://expense-tracker-xxxxx.vercel.app`
2. **Register new account** with email/password
3. **Login** and verify dashboard loads
4. **Check browser console** (F12 → Console tab): should show no CORS errors

### 6.2 Test API Endpoints

```powershell
# Get JWT token (test credentials)
$response = curl -X POST "https://expense-tracker-api-xxxxx.fly.dev/api/v1/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }' | ConvertFrom-Json

$token = $response.access_token

# Get categories (requires token)
curl -X GET "https://expense-tracker-api-xxxxx.fly.dev/api/v1/categories" `
  -H "Authorization: Bearer $token"
```

### 6.3 Test Notifications

1. Create a **budget** for a category (e.g., Food with ₱5,000)
2. Add an **expense** that exceeds 80% (e.g., ₱4,200)
3. **Refresh page** - notification bell should show red badge
4. **Click bell icon** - should show budget alert

### 6.4 Test Recurring Expenses

1. Create a **recurring rule** (e.g., "Monthly rent" every month)
2. Wait up to **1 hour** (APScheduler runs every 60 minutes)
3. **Refresh page** - new auto-created expense should appear
4. Check Fly backend logs:
   ```powershell
   flyctl logs
   ```
   Should show: `Running recurring expense job...`

### 6.5 Test Export

1. Go to **Expenses** page
2. Click **Download CSV** or **Download PDF**
3. Should download file with transactions

### 6.6 Test Theme Toggle

1. Click **Sun/Moon icon** in top-right corner
2. Page should toggle between light/dark mode
3. **Reload page** - theme should persist

✅ All features working? You're deployed!

---

## Step 7: Production Maintenance

### 7.1 Keep Backend Awake

Fly.io **free tier doesn't sleep** (unlike Render), so no need for EasyCron setup.

However, monitor free tier usage:

```powershell
# Check resource usage
flyctl status

# View cost estimate
flyctl billing summary
```

### 7.2 Automated Monitoring

Fly.io automatically monitors `/health` endpoint every 30 seconds. If it fails, your app will restart.

### 7.3 Database Backups

MongoDB Atlas automatically backs up your free M0 cluster daily.

To verify:
1. Go to: https://cloud.mongodb.com
2. Login with your account
3. Select **Backups** tab
4. Should show automatic snapshots

### 7.4 View Backend Logs

```powershell
# Real-time logs
flyctl logs --follow

# Last 100 lines
flyctl logs --limit 100

# Logs from specific timestamp
flyctl logs --since 1h
```

### 7.5 Redeploy After Code Changes

```powershell
# Make code changes locally
# Commit to git
git add .
git commit -m "Fixed bug XYZ"
git push origin main

# Deploy automatically triggers from Fly webhook
# OR manually deploy:
flyctl deploy
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Check if backend is running:**
```powershell
curl https://expense-tracker-api-xxxxx.fly.dev/health
```

**Check logs:**
```powershell
flyctl logs
```

**Likely causes:**
- CORS error: Verify `CORS_ORIGINS` matches Vercel URL exactly
- Database error: Verify `MONGODB_URL` secret is correct
- Out of memory: Fly.io free tier is shared, restart app:
  ```powershell
  flyctl apps restart
  ```

### Issue: CORS Error in Browser

**Browser shows:** `Access-Control-Allow-Origin header missing`

**Fix:**
```powershell
# Verify backend CORS setting
flyctl secrets list | findstr CORS_ORIGINS

# Update if wrong
flyctl secrets set CORS_ORIGINS="https://[your-vercel-url].vercel.app,http://localhost:5173"
flyctl deploy
```

Wait 2 minutes for deployment to complete.

### Issue: Notifications Not Working

**NProblem:** Bell icon shows no notifications even after creating budget alert

**Check:**
1. Frontend can reach backend API: Open DevTools Network tab, click bell icon
2. Should see GET request to `[BACKEND_URL]/api/v1/notifications`
3. If error in network tab:

   **Solution:**
   ```powershell
   # Verify CORS headers being sent
   curl -i -X OPTIONS https://expense-tracker-api-xxxxx.fly.dev/api/v1/notifications \
     -H "Origin: https://expense-tracker-xxxxx.vercel.app" \
     -H "Access-Control-Request-Method: GET"
   ```

### Issue: Recurring Expenses Not Processing

**Problem:** Created recurring rule, but new auto-generated expenses aren't appearing

**Likely cause:** APScheduler job runs every 1 hour, might not have run yet

**Check backend logs:**
```powershell
flyctl logs | findstr "recurring"
```

Should show:
```
[app] INFO: Running recurring expense job...
[app] INFO: Created expense for rule: Rent Monthly...
```

**If no output after 1+ hour:**
1. Check database connection: `flyctl logs | findstr "mongodb"`
2. Check APScheduler: `flyctl logs | findstr "scheduler"`
3. Restart app: `flyctl apps restart`

### Issue: Database Connection Error

**Error message:** `pymongo.errors.AutoReconnect` or `ServerSelectionTimeoutError`

**Check `MONGODB_URL` is correct:**
```powershell
flyctl secrets list | findstr MONGODB_URL
```

Should show a `sha256` hash (secret is masked).

**Verify MongoDB cluster is accessible:**
1. Go to: https://cloud.mongodb.com
2. Click **Network Access**
3. Should see Fly.io IP whitelisted (should be `0.0.0.0/0` for free tier)

**Fix:**
```powershell
# Re-set MongoDB URL with correct credentials
flyctl secrets set MONGODB_URL="mongodb+srv://[USER]:[PASS]@[CLUSTER].mongodb.net/?appName=expense_tracker"
flyctl deploy
```

---

## Rollback & Disaster Recovery

### Rollback to Previous Deployment

```powershell
# List deployment history
flyctl releases

# Rollback to previous version
flyctl releases rollback [RELEASE_ID]
```

### Export Data from Production

```powershell
# Download entire database
# Use MongoDB Atlas UI at: https://cloud.mongodb.com
# Click "Database" → "Collections" → "Export" → "JSON"
```

---

## Next Steps & Optimization

### Option 1: Upgrade to Paid Tiers (Optional)

- **Fly.io:** $5-30/month for dedicated resources (no shared CPU limits)
- **MongoDB Atlas:** $10+/month for M2+ tiers (more storage, better performance)
- **Vercel:** Free tier sufficient for most use cases

### Option 2: Add Custom Domain

1. Buy domain (GoDaddy, Namecheap, etc.)
2. Create Cname record pointing to Vercel/Fly.io
3. Configure in Vercel/Fly dashboards

### Option 3: Add Monitoring & Alerting

- **Sentry** (free tier): Error tracking
- **New Relic** (free tier): Performance monitoring
- **StatusPage.io** (free tier): Status page for users

### Option 4: CI/CD Pipeline

Currently deploying manually. Set up GitHub Actions:

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Fly
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Summary: Your Deployment Stack

| Component      | Service        | URL                                  | Cost  |
|---|---|---|---|
| Frontend (React) | Vercel         | `https://expense-tracker-xxxxx.vercel.app` | Free  |
| Backend (FastAPI) | Fly.io         | `https://expense-tracker-api-xxxxx.fly.dev` | Free  |
| Database (MongoDB) | Atlas         | `cluster.mongodb.net`                 | Free  |
| **Total**      | -              | -                                    | **$0/mo** |

✅ **Fully deployed!** Your app is live and handling real traffic.

---

## Support & Resources

- **Fly.io Docs:** https://fly.io/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Community Help:** Discord servers for Fly.io, Vercel, MongoDB

