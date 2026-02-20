# Smart Expense Tracker

Production-ready full-stack expense tracking with analytics, budgets, recurring expenses, and export.

## Tech stack

- **Backend**: Python, FastAPI, **MongoDB**, Beanie ODM, JWT auth, Pydantic, APScheduler
- **Frontend**: React, Vite, TypeScript (in `frontend/`)
- **Deploy**: Docker, docker-compose, Render.com, Vercel, MongoDB Atlas

## 🚀 Production Deployment (FREE - No Payment Required!)

**Deploy to production in minutes with zero cost!** Full end-to-end guide:

- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** ← **Complete Render deployment guide** ⭐ **START HERE**
- **[DEPLOYMENT_QUICK_REFERENCE.txt](./DEPLOYMENT_QUICK_REFERENCE.txt)** ← Quick command reference

**Stack:**
- Backend: Render.com (free tier - no sleep) — `https://expense-tracker-api-xxxxx.onrender.com`
- Frontend: Vercel (free tier) — `https://expense-tracker-xxxxx.vercel.app`
- Database: MongoDB Atlas (free M0 tier) — 512 MB storage, auto backups
- **Total Cost: $0/month**

**Why Render?**
✅ No payment method required  
✅ No cold starts (doesn't sleep)  
✅ One-click deploy from GitHub  
✅ Built-in health checks  
✅ Easy environment variables  

**Quick Start:**
1. Create free Render account: https://dashboard.render.com/register
2. Connect GitHub (skip payment method)
3. Deploy backend (5-10 minutes)
4. Deploy frontend to Vercel (5-10 minutes)
5. Done! Your app is live.

See **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** for complete step-by-step instructions with screenshots and troubleshooting.

## Run full backend with Docker (Mongo + API)

From the project root:

1. Copy `backend/.env.example` to `backend/.env` and set **JWT_SECRET** (and optionally other vars). The API container uses `MONGODB_URL=mongodb://mongo:27017` automatically.
2. Start the stack:

   ```bash
   docker-compose up -d
   ```

3. API: http://localhost:8000 — Docs: http://localhost:8000/docs  
   MongoDB (host): `localhost:27019` (data in volume `mongo_data`).

To run only MongoDB (and run the API locally), use the same `docker-compose up -d`; the API service will start too. To run only Mongo, you can comment out the `api` service or use `docker-compose up -d mongo`.

## Quick start (backend, local)

1. Run MongoDB (e.g. `docker-compose up -d mongo` then use `MONGODB_URL=mongodb://localhost:27019`, or run Mongo another way).
2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URL` and `JWT_SECRET`.
3. From `backend/`:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   On Linux/macOS: `python -m venv venv && source venv/bin/activate` then `python -m pip install -r requirements.txt`
4. Open http://localhost:8000/docs for the API docs.

## Run the frontend

From the project root, with the backend running on port 8000:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` to the backend (see `frontend/vite.config.ts`). Log in or register to access the dashboard, expenses, budgets, categories, and recurring rules.

## 🤖 LLM-Powered Analysis (NEW!)

The app now includes intelligent spending behavior analysis powered by OpenAI:

- **Spending Spikes**: Automatically detects unusual expenses
- **Lifestyle Profile**: Classifies your spending personality
- **Trend Detection**: Identifies increasing/decreasing spending patterns
- **AI Insights**: Get actionable recommendations for each finding

### Get Started with LLM Analysis

1. Get your free OpenAI API key: https://platform.openai.com/api-keys
2. Set environment variable:
   ```bash
   export OPENAI_API_KEY="sk-your-key"
   ```
3. Start the app (same as above)
4. Click "Analysis" in the sidebar to view intelligent insights!

**Cost**: ~$0.001 per analysis (super affordable!)

**Learn More**: See [`QUICK_START_LLM.md`](./QUICK_START_LLM.md) for quick setup or [`docs/INDEX.md`](./docs/INDEX.md) for comprehensive documentation.

## 🚀 Production Deployment (FREE)

**Deploy to production in minutes with zero cost!** Full end-to-end guide:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** ← **Complete deployment guide** (Fly.io + Vercel + MongoDB Atlas)
- **[DEPLOYMENT_QUICK_REFERENCE.txt](./DEPLOYMENT_QUICK_REFERENCE.txt)** ← Quick command reference

**Stack:**
- Backend: Fly.io (free tier) — `https://expense-tracker-api-xxxxx.fly.dev`
- Frontend: Vercel (free tier) — `https://expense-tracker-xxxxx.vercel.app`
- Database: MongoDB Atlas (free M0 tier) — 512 MB storage, auto backups
- **Total Cost: $0/month**

**Quick Start:**
```powershell
# 1. Install Fly CLI
choco install flyctl

# 2. Login & deploy (follows steps in DEPLOYMENT.md)
flyctl auth login
flyctl launch --no-deploy
flyctl deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions including troubleshooting.

## Project layout

- `docs/ARCHITECTURE.md` — Architecture, MongoDB collections, folder structure
- `docs/DESIGN.md` — Design, implementation order
- `docs/INDEX.md` — **NEW** Complete documentation index
- `docs/LLM_INTEGRATION_GUIDE.md` — **NEW** LLM feature details
- `DEPLOYMENT.md` — **Production deployment guide (Fly.io + Vercel + MongoDB)**
- `DEPLOYMENT_QUICK_REFERENCE.txt` — Quick command reference for deployment
- `backend/` — FastAPI app, Beanie models, services, API routes
- `frontend/` — React app (Vite, TypeScript, React Router, auth, API client)
