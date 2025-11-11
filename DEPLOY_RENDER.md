# Deploying Aas Paas to Render (Backend + Frontend)

This guide shows how to deploy the backend (Express/Mongo/Mongoose) and the frontend (React/Vite) to [Render](https://render.com) using Docker.

## Overview
You will create two services on Render:
1. Backend Web Service (Docker) – Runs the Express API.
2. Frontend Static Site (recommended) or Docker Web Service – Serves the built React app via NGINX.

MongoDB can be:
- A Render MongoDB instance (managed database) OR
- An external MongoDB Atlas cluster.

Uploads: Current backend falls back to local disk if `S3_BUCKET` is not set. Render's filesystem is **ephemeral** (cleared on redeploy). For production persistence use S3 (set AWS creds + bucket) or provision a Render Disk (slower). Prefer S3.

## 1. Prerequisites
- Render account
- Git repository (this repo) pushed to GitHub/GitLab/Bitbucket.
- MongoDB URI (Atlas or Render DB)
- JWT secrets, optional API keys for geocoding, etc.

## 2. Environment Variables (Backend)
Set these in the Render backend service dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | yes | Must match exposed port (5000) | 
| `MONGODB_URI` | yes | Connection string to MongoDB |
| `JWT_ACCESS_SECRET` | yes | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | yes | Refresh token secret |
| `NODE_ENV` | yes | `production` |
| `FRONTEND_URL` | yes | Your frontend URL (e.g. https://aaspaas-frontend.onrender.com) for CORS |
| `S3_BUCKET` | optional | If using S3 for uploads |
| `AWS_ACCESS_KEY_ID` | optional | S3 credential |
| `AWS_SECRET_ACCESS_KEY` | optional | S3 credential |
| `S3_REGION` | optional | e.g. `ap-south-1` |
| `MAPBOX_TOKEN` | optional | Geocoding/maps (if enabled) |
| `GOOGLE_MAPS_API_KEY` | optional | Alternate geocoding key |
| `TESSERACT_ENABLED` | optional | `true` (default) – set `false` to disable OCR |
| `GOOGLE_VISION_ENABLED` | optional | `true` if using Vision OCR (needs key file) |

If not using Vision, omit `GOOGLE_VISION_*`.

## 3. Backend Docker Build on Render
Render can use the existing `backend/Dockerfile`. Simpler: point Render service root to `backend/` and Dockerfile path `backend/Dockerfile`.

Alternatively, `render-backend.Dockerfile` at repo root (created) references backend subfolder directly. In Render, set:
- Root Directory: `/` (repo root)
- Dockerfile: `render-backend.Dockerfile`

### Backend Dockerfile Notes
Current backend Dockerfile:
```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]
```
This works. Just ensure `PORT=5000` env on Render.

### Health Check
Set the Render health check path to `/health` (returns JSON ok).

## 4. Frontend Deployment Options
### Option A: Render Static Site (Recommended)
Simpler & cheaper.
1. Create a **Static Site** service.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `frontend/dist`
5. Environment variable (optional): `VITE_API_BASE` if you switch hard-coded URLs; currently proxy expects `/api` hitting the same origin – update axios config if needed when deploying separately.

In production, the frontend calls backend at a different domain; update API base URL in your Axios instance (e.g. set `VITE_API_BASE=https://aaspaas-backend.onrender.com`). If not yet parameterized, create a small change:
- Introduce `import.meta.env.VITE_API_BASE || window.location.origin`.

### Option B: Frontend Docker (NGINX)
If you prefer Docker:
- Root Directory: `frontend`
- Dockerfile: `frontend/Dockerfile`
- Exposed Port: `80`

## 5. CORS Configuration
Backend uses `FRONTEND_URL` for allowed origins. Set it to exact Render frontend URL after first deploy (then redeploy backend).

## 6. Persistent Uploads
To avoid losing images:
1. Configure S3 bucket and credentials.
2. Set environment variables (see section 2). The backend will then store on S3.
3. Confirm logs show `Image uploaded to S3:` instead of local save.

## 7. MongoDB
### Using Render Mongo
- Provision a **MongoDB** instance in Render dashboard.
- Copy connection string (`mongodb+srv://...`).
- Set `MONGODB_URI` in backend service.

### Using MongoDB Atlas
- Add Render IPs to Atlas Network Access or enable 0.0.0.0/0 (not recommended).
- Use standard connection string in `MONGODB_URI`.

## 8. Logging & Monitoring
Logs appear in the Render dashboard.
Consider adding:
- `LOG_LEVEL=info` (or debug) if implemented.
- External monitoring (e.g., Pingdom hitting `/health`).

## 9. Background Jobs / Queues
If you later enable BullMQ / Redis features, add a Render Redis instance and set env vars (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`). Currently unused in minimal flow.

## 10. Deployment Steps Summary
Backend:
1. Push repo to Git.
2. Create Render Web Service → Select repo.
3. Set Root Directory: `backend` (if using backend/Dockerfile) OR root + `render-backend.Dockerfile`.
4. Auto-detect Docker; leave build command empty (Docker handles it).
5. Set env vars (section 2).
6. Set health check `/health`.
7. Deploy.

Frontend (Static Site option):
1. Create Render Static Site → Select repo.
2. Root Directory: `frontend`.
3. Build Command: `npm install && npm run build`.
4. Publish Directory: `dist`.
5. Set `VITE_API_BASE` to backend URL (update code if necessary).
6. Deploy.

Update backend `FRONTEND_URL` env to the final frontend domain and redeploy backend.

## 11. Optional: `render.yaml` (Infrastructure as Code)
You can declare both services in a `render.yaml` at repo root:
```yaml
services:
  - type: web
    name: aas-paas-backend
    env: docker
    plan: starter
    rootDir: backend
    dockerfilePath: backend/Dockerfile
    autoDeploy: true
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 5000
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false  # set in dashboard
      - key: JWT_ACCESS_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
  - type: static
    name: aas-paas-frontend
    rootDir: frontend
    buildCommand: npm install && npm run build
    publishPath: dist
    envVars:
      - key: VITE_API_BASE
        sync: false
```
Add secrets manually via dashboard or use Render Secret Files.

## 12. Testing After Deploy
Backend:
```bash
curl https://<backend-domain>/health
curl -X POST https://<backend-domain>/api/auth/login -H 'Content-Type: application/json' -d '{"identifier":"test@example.com","password":"pass","role":"customer"}'
```
Frontend:
- Visit frontend URL and confirm network calls go to backend domain and succeed (check browser dev tools).

## 13. Common Issues
| Issue | Fix |
|-------|-----|
| 502/Failed health check | Ensure `PORT` matches Docker EXPOSE (5000) & health path `/health`. |
| CORS blocked | Set correct `FRONTEND_URL` env; ensure https in value. Redeploy. |
| Images disappear | Use S3 instead of local storage; set bucket vars. |
| Large OCR memory usage | Set `TESSERACT_ENABLED=false` if not needed. |
| Geocoding empty | Provide `MAPBOX_TOKEN` or fallback to Google Maps key. |

## 14. Security Hardening
- Use long, random JWT secrets.
- Enable HTTPS redirects at frontend layer (Render handles TLS automatically).
- Avoid exposing admin endpoints publicly; implement role checks (already present for vendor routes).

## 15. Scaling
- Upgrade plan when CPU/RAM limited.
- Add CDN caching (Render static site already uses global CDN).
- For heavy OCR tasks, move OCR/Tesseract to a separate worker service with a queue (BullMQ + Redis).

---
**Ready:** After following steps, you have a production deployment on Render.
