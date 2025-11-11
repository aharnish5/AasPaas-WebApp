# Complete Project Setup Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ MongoDB Atlas account (or local MongoDB)
- ✅ Code editor (VS Code recommended)

---

## 📋 Step-by-Step Setup

### Step 1: Clone/Checkout Project

You should already have the project. Verify structure:
```
AasPaas/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

### Step 2: Backend Setup

#### 2.1 Install Backend Dependencies
```bash
cd backend
npm install
```

#### 2.2 Configure Backend Environment
```bash
# .env file already exists, but verify it has your MongoDB connection
```

**Required in `backend/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/aas-paas?retryWrites=true&w=majority
JWT_SECRET=your-random-32-character-secret-key-here
JWT_REFRESH_SECRET=your-different-random-32-character-secret-key
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace:
- `your-username` → Your MongoDB Atlas username
- `your-password` → Your MongoDB Atlas password
- `cluster0.xxxxx` → Your cluster address
- Generate random 32+ character strings for JWT secrets

#### 2.3 (Optional) Seed Database
```bash
npm run seed
```

This creates:
- 2 vendors (vendor1@example.com / password123)
- 3 customers (customer1@example.com / password123)
- 3 sample shops

#### 2.4 Start Backend
```bash
npm run dev
```

✅ Backend running on: **http://localhost:5000**

Test: http://localhost:5000/health (should show `{"status":"ok"}`)

---

### Step 3: Frontend Setup

#### 3.1 Open New Terminal

Keep backend running, open a **new terminal window/tab**.

#### 3.2 Install Frontend Dependencies
```bash
cd frontend
npm install
```

This installs:
- React 18
- Vite
- React Router
- Redux Toolkit
- TailwindCSS
- All other dependencies

#### 3.3 Configure Frontend Environment
```bash
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_TOKEN=pk.your-token-here
```

**Note:** Mapbox token is optional - app works without it (maps disabled)

#### 3.4 Start Frontend
```bash
npm run dev
```

✅ Frontend running on: **http://localhost:3000**

---

## 🚀 Running Complete Project

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Server running on port 5000 in development mode
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network:  use --host to expose
```

---

## 🌐 Access Points

### Frontend
- **URL**: http://localhost:3000
- **Home**: http://localhost:3000
- **Search**: http://localhost:3000/search
- **Customer Login**: http://localhost:3000/login/customer
- **Vendor Login**: http://localhost:3000/login/vendor

### Backend API
- **Base URL**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **API Docs**: See `backend/` routes for endpoints

---

## ✅ Verify Everything Works

### 1. Backend Health Check
Open browser: http://localhost:5000/health

**Should see:**
```json
{"status":"ok","timestamp":"..."}
```

### 2. Frontend Homepage
Open browser: http://localhost:3000

**Should see:**
- Hero section with "Find great local shops nearby"
- Search bar
- Feature cards
- Navigation

### 3. Test Authentication
1. Go to: http://localhost:3000/signup/customer
2. Create account
3. Should redirect to `/customer` feed

### 4. Test Shop Search
1. If you seeded database, go to: http://localhost:3000/search
2. Should see sample shops
3. Click a shop to see details

---

## 🐳 Docker Setup (Alternative)

### Option: Run Everything with Docker

```bash
# From project root
docker-compose up
```

This starts:
- MongoDB (port 27017)
- Redis (port 6379)
- Backend (port 5000)
- Frontend (port 3000)

**Note:** Still need to configure `.env` files in backend and frontend directories.

---

## 📝 Quick Command Reference

### Backend Commands
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Seed database
npm run seed

# Run tests
npm test
```

### Frontend Commands
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

---

## 🔧 Troubleshooting

### Backend Issues

**"MongoDB connection error"**
- ✅ Check `MONGO_URI` in `backend/.env`
- ✅ Verify MongoDB Atlas cluster is active
- ✅ Check Network Access allows your IP (or 0.0.0.0/0)
- ✅ Verify username/password are correct

**"Port 5000 already in use"**
- Change `PORT=5001` in `backend/.env`
- Update `FRONTEND_URL` accordingly

**"Module not found"**
- Run `npm install` again in `backend/` directory
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Frontend Issues

**"Cannot connect to API"**
- ✅ Verify backend is running on port 5000
- ✅ Check `VITE_API_URL` in `frontend/.env`
- ✅ Check browser console for CORS errors

**"Port 3000 already in use"**
- Change port in `frontend/vite.config.js`:
  ```js
  server: {
    port: 3001,
  }
  ```

**"Module not found"**
- Run `npm install` again in `frontend/` directory
- Delete `node_modules` and reinstall

**"White screen / blank page"**
- Check browser console for errors
- Verify all dependencies installed
- Try clearing browser cache

---

## 📊 Project Structure Overview

```
AasPaas/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── index.js        # Entry point
│   │   ├── app.js          # Express app
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Route handlers
│   │   └── services/       # Business logic
│   ├── .env                # Backend config (REQUIRED)
│   └── package.json
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── main.jsx        # Entry point
│   │   ├── App.jsx         # Main app component
│   │   ├── pages/          # Page components
│   │   ├── components/        # Reusable components
│   │   ├── store/          # Redux store
│   │   └── services/       # API client
│   ├── .env                # Frontend config (REQUIRED)
│   └── package.json
│
└── docker-compose.yml       # Docker setup (optional)
```

---

## 🎯 First Time Setup Checklist

### Backend
- [ ] `cd backend`
- [ ] `npm install`
- [ ] Edit `.env` with MongoDB connection
- [ ] Edit `.env` with JWT secrets (32+ chars each)
- [ ] `npm run seed` (optional but recommended)
- [ ] `npm run dev`
- [ ] Verify: http://localhost:5000/health works

### Frontend
- [ ] `cd frontend` (new terminal)
- [ ] `npm install`
- [ ] `cp .env.example .env`
- [ ] Edit `.env` with `VITE_API_URL=http://localhost:5000/api`
- [ ] `npm run dev`
- [ ] Verify: http://localhost:3000 loads

### Test
- [ ] Visit http://localhost:3000
- [ ] Try signup (customer or vendor)
- [ ] Try login
- [ ] View shop search page

---

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Set strong JWT secrets
3. Use MongoDB Atlas
4. Deploy to Render/Heroku/DigitalOcean

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to Vercel/Netlify
3. Set environment variables in hosting platform

See `DEPLOYMENT.md` for detailed instructions.

---

## 📞 Need Help?

### Common Solutions

**Backend won't start:**
1. Check MongoDB connection
2. Verify `.env` file exists and has correct values
3. Check port 5000 is free

**Frontend won't start:**
1. Verify all dependencies installed
2. Check `.env` file exists
3. Verify backend is running

**Can't connect frontend to backend:**
1. Check `VITE_API_URL` in `frontend/.env`
2. Verify backend is running on port 5000
3. Check CORS settings in backend

---

## ✨ Success Indicators

When everything is working:
- ✅ Backend terminal shows: "Server running on port 5000"
- ✅ Frontend terminal shows: "Local: http://localhost:3000"
- ✅ Browser shows homepage at http://localhost:3000
- ✅ Health check works: http://localhost:5000/health
- ✅ Can create account and login
- ✅ Can see shops (if database seeded)

---

**You're all set! Start developing! 🎉**

