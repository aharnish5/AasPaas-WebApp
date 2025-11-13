# Getting Started (Windows)

This guide gets you running the AasPaas stack locally on Windows using PowerShell.

## Prerequisites
- Node.js 18+ (check with `node -v`)
- npm 9+
- MongoDB (local service) or a MongoDB Atlas connection string
- Optional: AWS S3 bucket (for image uploads); otherwise app works with local placeholders

## 1) Clone and install
```powershell
# From the project root
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

## 2) Configure environment
- Backend variables: see docs/ENVIRONMENT.md (or `backend/ENV_GUIDE.md` for long-form)
- Frontend variables: create `frontend/.env` (or copy from `.env.example` if present)

Example PowerShell snippets:
```powershell
# backend/.env (minimum viable)
@"
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=change-me-32chars-min
JWT_REFRESH_SECRET=change-me-refresh-32chars
PORT=5000
FRONTEND_URL=http://localhost:3000
"@ | Out-File -Encoding utf8 ..\backend\.env

# frontend/.env (vite format)
@"
VITE_API_URL=http://localhost:5000/api
# Optional Mapbox – app runs without it
# VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi...your-token...
"@ | Out-File -Encoding utf8 ..\frontend\.env
```

## 3) Run the stack
Open two PowerShell terminals from the project root:
```powershell
# Terminal A – Backend
cd backend; npm run dev

# Terminal B – Frontend
cd frontend; npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API base: http://localhost:5000/api

If ports are busy, change `PORT` (backend) or Vite dev port in `vite.config.*`.

## 4) Seed sample data (optional)
```powershell
cd backend; npm run seed
```

## 5) Build/preview
```powershell
# Frontend build
cd frontend; npm run build; npm run preview

# Backend (plain Node start)
cd backend; npm start
```

## 6) Common issues
- CORS: ensure `FRONTEND_URL` in backend `.env` matches your FE dev URL.
- Mongo connection errors: verify MongoDB service is running or Atlas URI is correct.
- Images: configure S3 in backend `.env` for real uploads; otherwise use local/dev flows.
- Maps: Mapbox token is optional; without it, map UI features are hidden gracefully.

That’s it — you’re up and running. For deeper details, check ARCHITECTURE.md and FRONTEND_GUIDE.md.
