# Deploy to Render.com (Free Tier - No Payment Required)

**Quick Start:** 5-10 minutes to live production

## Why Render over other services?

✅ **No payment method required** (truly free tier)  
✅ **Includes database options** (PostgreSQL free)  
✅ **No cold starts** (unlike some services)  
✅ **Easy deploy from GitHub** (one-click)  
✅ **Perfect for portfolios & side projects**

---

## Step 1: Create Render Account

1. Go to: https://dashboard.render.com/register
2. Sign up with GitHub (easiest option)
3. No payment method needed
4. Verify email

---

## Step 2: Deploy Backend API

### 2.1 Create New Web Service

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. **Connect a repository:**
   - Click **"Connect account"** to link GitHub
   - Select your **"expense-tracker"** repository
   - Click **"Connect"**

### 2.2 Configure Web Service

Fill in the fields:

| Field | Value |
|-------|-------|
| **Name** | `expense-tracker-api` |
| **Environment** | `Docker` |
| **Region** | `Singapore` (or closest to you) |
| **Branch** | `main` |
| **Build Command** | (leave empty - Dockerfile handles it) |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| **Plan** | `Free` |

### 2.3 Add Environment Variables

Click **"Advanced"** and add these variables:

**Non-sensitive (can set now):**
```
ENVIRONMENT=production
DEBUG=false
APP_NAME=Expense Tracker API
MONGODB_DB_NAME=expense_tracker
CORS_ORIGINS=http://localhost:5173
```

**Sensitive (add during setup):**
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?appName=expense_tracker
JWT_SECRET=your-random-32-character-string
GROQ_API_KEY=gsk_your-key-here
```

⚠️ **For Sensitive Variables:**
- Click the variable → Check **"Secret"** checkbox
- This hides it from logs and UI

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your GitHub repo
   - Build Docker image (2-5 minutes)
   - Deploy to cloud
   - Assign public URL: `https://expense-tracker-api-xxxxx.onrender.com`

**Monitor deployment:**
- Go to service dashboard
- Click **"Logs"** to watch build/startup
- Green checkmark = deployed successfully

---

## Step 3: Get API URL

After deployment completes:

1. Go to your service settings
2. Find **"Render URL"** section
3. Copy the URL (e.g., `https://expense-tracker-api-7f3k.onrender.com`)
4. **Save this** - you need it for frontend config

---

## Step 4: Update Backend Environment Variables

Now that deployment is live, update sensitive variables:

1. In Render dashboard, go to your service
2. Click **"Environment"** tab
3. Set/update:
   ```
   MONGODB_URL=mongodb+srv://cyron234:@Sayron0103@personalprojectcluster.ll1hkgc.mongodb.net/?appName=PersonalProjectCluster
   JWT_SECRET=[your-jwt-secret]
   GROQ_API_KEY=[your-groq-key]
   CORS_ORIGINS=https://expense-tracker-xxxxx.vercel.app,http://localhost:5173
   ```
4. Click **"Save"**
5. Service auto-redeploys with new variables

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Create `.env.production` in Frontend

Create `frontend/.env.production`:
```
VITE_API_URL=https://expense-tracker-api-xxxxx.onrender.com
```

(Replace with your actual Render API URL from Step 3)

### 5.2 Push to GitHub

```powershell
cd c:\GitClone\Cyron\expense-tracker
git add .
git commit -m "Add Vercel environment configuration"
git push origin main
```

### 5.3 Deploy to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Project"**
3. **Select repository:**
   - Connect GitHub if not already done
   - Search for **"expense-tracker"**
   - Click **"Import"**
4. **Configure project:**
   - **Root Directory:** Leave empty
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
5. **Add Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://expense-tracker-api-xxxxx.onrender.com`
   - Scope: Production + Preview + Development
6. Click **"Deploy"**

**Wait for deployment:**
- Vercel builds frontend (~2-3 minutes)
- Shows green checkmark when done
- Gets URL like: `https://expense-tracker-xxxxx.vercel.app`

### 5.4 Save Frontend URL

Copy this URL - you need it to update backend CORS

---

## Step 6: Update Backend CORS for Frontend

Now that frontend is deployed on Vercel:

1. Go to Render dashboard → your API service
2. Click **"Environment"** tab
3. Update `CORS_ORIGINS` to:
   ```
   CORS_ORIGINS=https://expense-tracker-xxxxx.vercel.app,http://localhost:5173
   ```
4. Click **"Save"**
5. Service redeploys (1-2 minutes)

---

## Step 7: Test Everything Works

### 7.1 Test Frontend

1. Visit: `https://expense-tracker-xxxxx.vercel.app`
2. **Check browser console** (F12 → Console):
   - Should show no CORS errors
   - Should see requests going to Render API URL
3. **Register new account** and login
4. Dashboard should load with data

### 7.2 Test API Health

```powershell
# Replace with your Render URL
curl https://expense-tracker-api-xxxxx.onrender.com/health
# Should return: {"status":"ok"}
```

### 7.3 Test API Endpoints

```powershell
# Register (no auth needed)
curl -X POST https://expense-tracker-api-xxxxx.onrender.com/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Get token from response, then test protected endpoint:
curl -X GET https://expense-tracker-api-xxxxx.onrender.com/api/v1/categories `
  -H "Authorization: Bearer [token]"
```

### 7.4 Test Notifications

1. Create a **budget** (e.g., Food ₱5,000)
2. Add **expense** exceeding 80% (e.g., ₱4,200)
3. Refresh page
4. **Bell icon** should show red badge
5. Click bell to see notification

### 7.5 Test Recurring Expenses

1. Create **recurring rule** (e.g., "Rent" monthly)
2. Wait 5-60 minutes (job runs hourly)
3. Check **Expenses page** for auto-created expense
4. Verify in Render logs:
   ```
   Click "Logs" → search "recurring"
   ```

### 7.6 Test Export

1. Go to **Expenses** page  
2. Click **Download CSV** or **Download PDF**
3. File should download

### 7.7 Test Theme Toggle

1. Click **Sun/Moon icon** (top-right)
2. Page toggles light/dark
3. Reload page - theme persists

✅ If all tests pass → **You're live in production!**

---

## Render Free Tier Limits

| Resource | Limit |
|----------|-------|
| **Compute** | 0.5 CPU, 512 MB RAM |
| **Requests** | Unlimited |
| **Bandwidth** | Unlimited |
| **Sleep** | **No** (unlike Heroku) |
| **Monthly Uptime** | ~99.9% |
| **Database** | Optional PostgreSQL (free tier available) |

✅ Your app will NOT sleep - always responsive!

---

## Monitoring & Maintenance

### View Logs

```powershell
# Real-time logs in Render dashboard
# Service → Logs tab
# Search for errors or recurring job output
```

### Restart Service

If something breaks:
1. Render dashboard → Service
2. Click menu (⋮) → **"Restart"**
3. Service restarts in ~30 seconds

### Redeploy After Code Changes

```powershell
# Make code changes locally
git add .
git commit -m "Fixed issue XYZ"
git push origin main

# Render auto-deploys from GitHub!
# Watch deployment in Render dashboard → "Deployments" tab
```

---

## Upgrade Later (Optional)

If you hit tier limits or want better performance:

| Plan | Price | CPU | RAM | Use Case |
|------|-------|-----|-----|----------|
| **Free** | $0 | 0.5 | 512 MB | Hobby/learning |
| **Starter** | $7/mo | 0.5 | 512 MB | Same as free (removes suspension) |
| **Standard** | $12/mo | 1 | 1 GB | Production side projects |
| **Premium** | $19/mo | 2 | 2 GB | Production apps |

**You can upgrade anytime** - no data loss, automatic migration.

---

## Troubleshooting

### Issue: Deployment Fails

**Check logs:**
1. Render dashboard → Deployments tab
2. Click failed deployment
3. Look for error message

**Common causes:**
- Docker build error: Check `backend/Dockerfile` syntax
- Missing dependencies: Verify `backend/requirements.txt`
- Port binding: Ensure app runs on port 8000

**Fix: Make code change → Push to GitHub → Auto-redeploys**

### Issue: 502 Bad Gateway

**Backend not responding:**
```powershell
curl https://[your-api].onrender.com/health
# If timeout or error:
```

**Likely cause:** Environment variable missing
1. Check MONGODB_URL is set correctly
2. Verify JWT_SECRET is generated
3. Restart service in Render dashboard

### Issue: CORS Error (Browser)

**JavaScript console shows:**
```
Access-Control-Allow-Origin header missing
```

**Fix:**
1. Render dashboard → Environment
2. Update `CORS_ORIGINS` to include your Vercel URL
3. Save → service auto-redeploys

### Issue: Recurring Expenses Not Creating

**Problem:** Waited 1+ hour but no auto-generated expenses

**Check backend logs:**
1. Render dashboard → Logs
2. Search for: `recurring` or `APScheduler`
3. Should show: `Running recurring expense job...`

**If no output→ Job hasn't fired yet (runs hourly)**

**Debug:**
1. Manually trigger in Render dashboard → Restart
2. Check logs again
3. Job runs in background, may take 1 minute to process

---

## Your Deployment Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Browser                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     Frontend (React + Vite)                                  │
│     https://expense-tracker-xxxxx.vercel.app                 │
│     (Deployed on Vercel - CDN + edge caching)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     Backend API (FastAPI + APScheduler)                     │
│     https://expense-tracker-api-xxxxx.onrender.com           │
│     (Deployed on Render - Always awake)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     Database (MongoDB)                                      │
│     cluster.mongodb.net (MongoDB Atlas M0 free tier)        │
│     (512 MB storage, auto backups)                          │
└─────────────────────────────────────────────────────────────┘
```

**Cost: $0/month** ✅

---

## Next: Deploy Now!

Ready? Start at **Step 1** above. I'll wait while you:
1. Create Render account
2. Deploy backend
3. Deploy frontend
4. Test

Come back when you hit a step and I'll help!
