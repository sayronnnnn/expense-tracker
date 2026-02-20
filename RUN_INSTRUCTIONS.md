# How to Run the Expense Tracker

## Prerequisites

Make sure you have installed:
- **Python 3.12+** (for backend)
- **Node.js 18+** (for frontend)
- **MongoDB** (running locally or connection string ready)
- **Git** (to clone the repo)

## Quick Start (2 Terminals)

### Terminal 1: Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

The API will be available at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

### Terminal 2: Start the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run the development server
npm run dev
```

Expected output:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

The frontend will be available at: **http://localhost:5173**

---

## Full Setup Instructions (Starting from Scratch)

### 1. Clone/Navigate to Project

```bash
cd c:\GitClone\Cyron\expense-tracker
```

### 2. Set Up Backend

```bash
# Go to backend folder
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload
```

Backend running at: `http://localhost:8000`

### 3. Set Up Frontend (In a NEW Terminal)

```bash
# Navigate to frontend from project root
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend running at: `http://localhost:5173`

---

## Accessing the Application

1. **Open your browser**
2. **Go to**: http://localhost:5173
3. **You should see the login page**

### First Time Setup:
1. Click "Register" to create an account
2. Fill in email and password
3. Log in with your credentials
4. You'll be redirected to the Dashboard

### Testing the Calendar:
1. Navigate to Dashboard
2. Create some expenses with different dates (use "Expenses" page)
3. Scroll down on Dashboard to see the **Calendar View**
4. Click "Previous" and "Next" to navigate between months
5. Days with spending will be highlighted with amounts

---

## Troubleshooting

### Backend Won't Start

**Error: Connection refused to MongoDB**
```
Fix: Make sure MongoDB is running
- Windows: Check if MongoDB service is running
- Command: mongosh (to test connection)
```

**Error: Port 8000 already in use**
```
Fix: Change the port
python -m uvicorn app.main:app --reload --port 8001
```

### Frontend Won't Start

**Error: npm command not found**
```
Fix: Install Node.js from https://nodejs.org/
```

**Error: Port 5173 already in use**
```
Fix: Vite will automatically use the next available port
Or manually specify: npm run dev -- --port 5174
```

**Error: "Cannot find module"**
```
Fix: Clear and reinstall dependencies
rm -r node_modules
npm install
npm run dev
```

### Calendar Not Showing

**Check:**
1. Is backend running? (Check http://localhost:8000/docs)
2. Is frontend running? (Check http://localhost:5173)
3. Open browser DevTools (F12) → Console tab → Check for errors
4. Network tab → Check if `/api/v1/analytics/daily-breakdown` requests are successful

---

## Development Workflow

### Making Changes

**Backend Changes:**
1. Edit files in `backend/app/`
2. Server auto-reloads (thanks to `--reload`)
3. Refresh browser to see changes

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Vite auto-refreshes (Hot Module Replacement)
3. Changes appear instantly in browser

### Testing the Calendar Feature

1. **Create test expenses:**
   - Go to Expenses page
   - Add expenses with different dates in same month
   - Use dates spread throughout the month

2. **View in calendar:**
   - Go to Dashboard
   - Scroll to Calendar View section
   - Verify amounts show on correct dates
   - Check transaction counts are accurate

3. **Test navigation:**
   - Click "Previous" and "Next" buttons
   - Verify calendar loads different months
   - Check data is correct for each month

4. **Test responsiveness:**
   - Resize browser window to test mobile view
   - Open DevTools → Toggle device toolbar (F12)
   - Try different device sizes

---

## Environment Variables (If Needed)

### Backend Configuration
Create `backend/.env` if needed:
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=expense_tracker
DEBUG=True
CORS_ORIGINS=http://localhost:5173
```

### Frontend Configuration
Check `frontend/.env` if needed:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Docker Option (Advanced)

If you prefer using Docker:

```bash
# From project root
docker-compose up
```

This will start:
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:5173`
- MongoDB automatically

---

## Useful URLs

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost:5173 | Main app |
| Backend API | http://localhost:8000 | API server |
| API Docs | http://localhost:8000/docs | Swagger docs |
| Health Check | http://localhost:8000/health | Server status |

---

## Database Commands (MongoDB)

```bash
# Connect to MongoDB
mongosh

# List databases
show dbs

# Use expense_tracker database
use expense_tracker

# View collections
show collections

# Count expenses
db.expenses.countDocuments()

# View recent expenses
db.expenses.find().limit(5)
```

---

## Common Issues & Solutions

### ❌ "ModuleNotFoundError: No module named 'app'"
**Solution:** Make sure you're in the `backend` directory and Python path is correct

### ❌ Calendar doesn't update when navigating months
**Solution:** Check browser console (F12) for API errors. Backend might not be running.

### ❌ Expenses not showing on calendar
**Solution:** 
1. Create expenses with dates in current month
2. Refresh the page
3. Check backend logs for errors

### ❌ CORS errors in console
**Solution:** Make sure backend is running and CORS_ORIGINS includes your frontend URL

### ❌ Can't login
**Solution:** 
1. Check backend is running
2. Check database connection
3. Try registering a new account
4. Check browser console for errors

---

## Stop the Servers

**To stop the backend:**
- Press `Ctrl + C` in the backend terminal

**To stop the frontend:**
- Press `Ctrl + C` in the frontend terminal

---

## Summary

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend (in another terminal)
cd frontend
npm run dev

# Open browser
http://localhost:5173
```

That's it! Your expense tracker with the new calendar view is ready to use! 🎉

---

## Next Steps

1. ✅ Start both servers
2. ✅ Open the app in browser
3. ✅ Register and create an account
4. ✅ Add some expenses
5. ✅ Check the Dashboard to see the Calendar View
6. ✅ Navigate months with Previous/Next buttons
7. ✅ See daily spending highlighted on the calendar

Enjoy! 💰📅
