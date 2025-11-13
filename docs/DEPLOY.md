# Deployment & Operations Guide

## 1. Prerequisites
- Node.js ≥ 18 and npm ≥ 9.
- MongoDB 6/7 (Atlas or self-hosted). Redis optional (future analytics).
- Docker & Docker Compose (for containerized workflows).
- Mapbox, Mapple, Gemini, Google Maps/Places, AWS S3 credentials if advanced features required.
- Render or compatible container platform for production hosting.

## 2. Local Development

### 2.1 Manual (Two-Terminal) Setup
```bash
# Backend
cd backend
npm install
cp ENV_GUIDE.md .env # or create from scratch
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp SETUP.md .env.local # fill VITE_API_URL etc.
npm run dev
```
Default ports: backend `http://localhost:5000`, frontend `http://localhost:5173`. Backend CORS whitelist already includes 5173 for Vite.

### 2.2 Docker Compose
```bash
docker-compose up --build
```
Services:
- `mongodb`: Mongo 7, data volume `mongodb_data`.
- `redis`: Redis 7 (reserved for future queue/ratelimiting).
- `backend`: Express API with nodemon, auto-reloads on code change.
- `frontend`: Nginx serving Vite production build (`http://localhost:3000`).

Environment overrides (compose) include development JWT secrets and Mongo URI (`mongodb://mongodb:27017/aas-paas`).

### 2.3 Local Testing Commands
- Backend tests: `cd backend && npm test`.
- Frontend unit tests: `cd frontend && npm run test`.
- Storybook: `cd frontend && npm run storybook`.
- Playwright (requires `npx playwright install`): `npm run test:e2e`.

## 3. Production Build (Single Container)

### 3.1 Build Image
```bash
docker build -t aaspaas/app:latest .
```
Multi-stage Dockerfile:
1. Build frontend (`frontend/dist`) with Node 18 Alpine.
2. Install backend prod deps, copy backend source.
3. Copy built assets into `/app/frontend-dist` (served by Express).
4. `CMD ["node", "src/index.js"]`, listens on `$PORT` (defaults 5000).

Expose port 5000; front/back served from same origin to simplify CORS and cookie handling.

### 3.2 Run Container
```bash
docker run -d \
  -p 8080:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb+srv://... \
  -e JWT_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e FRONTEND_URL=https://app.example.com \
  -e PUBLIC_BASE_URL=https://app.example.com \
  aaspaas/app:latest
```
If serving static assets from Express, point DNS to container host. For local storage, ensure persistent volume mounts for `/app/uploads` and `/app/logs`.

## 4. Render Deployment

### 4.1 Service Configuration (`render.yaml`)
Key fields:
- `type: web`, `env: docker`, `dockerfilePath: ./Dockerfile`.
- `rootDir`: repo root (default).
- `healthCheckPath: /health`.
- `autoDeploy: true` (optional).

Copy env vars into Render dashboard:
| Key | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Ensure production mode. |
| `PORT` | `10000` (Render sets automatically) | Express uses `process.env.PORT`. |
| `FRONTEND_URL` | `https://aaspaas.onrender.com` | For CORS + oauth redirect. |
| `PUBLIC_BASE_URL` | `https://aaspaas.onrender.com` | Generates absolute image URLs. |
| `CORS_SAME_SERVICE` | `true` | Skip origin checks if single host. |
| `MONGO_URI` | `<managed Mongo / Atlas URI>` | Required. |
| `JWT_SECRET` | Random 32+ chars | Use Render “Generate value”. |
| `JWT_REFRESH_SECRET` | Random 32+ chars | (Render field name `REFRESH_TOKEN_SECRET` in template—ensure code uses `JWT_REFRESH_SECRET`). |
| `MAPBOX_TOKEN` | `pk...` | Enables ShopMap. |
| `MAPPLE_API_KEY` | `<token>` | Mapple geocoding. |
| `MAPPLE_GEOCODE_URL` | `https://atlas.mappls.com/api/places/geocode` | Endpoint. |
| `GOOGLE_MAPS_API_KEY` | optional | Node geocoder fallback + Places details. |
| `GOOGLE_PLACES_API_KEY` | optional | Autocomplete. |
| `GEMINI_API_KEY` | optional | AI inference. |
| `S3_BUCKET`/`S3_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` | optional | Media uploads. |
| `TESSERACT_ENABLED` | `true` | Keep fallback OCR active. |
| `LOG_LEVEL` | `info` | Control Winston verbosity. |

> **Note**: Render template in repo lists `REFRESH_TOKEN_SECRET`; update to `JWT_REFRESH_SECRET` to match code or alias both keys.

### 4.2 Build & Start
- Render runs `docker build` using provided Dockerfile.
- No custom `buildCommand`/`startCommand` needed for Docker services.
- Health check hits `GET /health` (served by Express).
- Logs available in Render dashboard; Winston also writes to `/app/logs/combined.log`.

### 4.3 Static Frontend via CDN (Optional)
- Build frontend separately (`npm run build`).
- Host `frontend/dist` on CDN/S3/Netlify.
- Set `VITE_API_URL=https://api.example.com/api`.
- Run backend Docker image without static assets (set `FRONTEND_DIST_DIR` empty or remove copy step).
- Adjust CORS allowlist accordingly.

## 5. Environment Files
- `backend/ENV_GUIDE.md`: Example `.env` values (update with real secrets).
- `backend/ENV_QUICK_EDIT.md`, `UPDATE_MONGO_URI.md`, `MONGODB_SETUP.md`: Additional instructions.
- `frontend/SETUP.md`: Step-by-step Vite env configuration.

## 6. Logging & Monitoring
- Winston logs to console + `logs/error.log`, `logs/combined.log`.
- In Docker/Render, ensure directory mounted/persisted.
- Recommend forwarding logs to centralized service (Render log drain, Datadog, etc.).
- Expose metrics via lightweight middleware (todo) or integrate with OpenTelemetry.

## 7. Common Deployment Pitfalls
| Issue | Symptoms | Fix |
| --- | --- | --- |
| Missing `PORT` binding | Container logs show “Server running on port 5000” but Render health fails | Render injects `PORT` env; ensure not hard-coded and health path is `/health`. |
| CORS blocked origin | Browser console `CORS blocked origin http://localhost:5173` | Set `FRONTEND_URL`, or `CORS_SAME_SERVICE=true` for same-host deployment. |
| Mongo connection refused | Startup error `Server selection timed out` | Whitelist Render IP range or use Render Managed Mongo; verify credentials & SRV string. |
| Map features disabled | Frontend message “Map preview disabled (no Mapbox token)” | Set `VITE_MAPBOX_TOKEN` at build; redeploy frontend. |
| AI/OCR failures | Response includes `"error": "Inference unavailable"` | Set `GEMINI_API_KEY` / `GOOGLE_VISION_KEY_PATH`; ensure service account file mounted. |
| S3 upload errors | `"Failed to upload image"` | Provide valid S3 creds or leave `S3_BUCKET` unset to use local storage; ensure bucket allows public-read. |

## 8. Backups & Data Management
- `backend/uploads/` holds media when S3 disabled. Mount persistent volume or sync to object storage.
- Mongo backups handled via Atlas/managed service; snapshot schedules recommended.
- Use migrations (`backend/src/scripts/migrations/*.js`) to backfill data: run with `node` after setting `MONGO_URI`.

## 9. Branching & Release Flow
- Recommended: feature branches -> PR -> CI (lint/test/build) -> merge into `main`.
- Tag release version, trigger Render deploy (auto or manual).
- Maintain `UI-REDESIGN/*` branch per migration guide to stage new UX.

## 10. Checklist Before Production
- [ ] Verify all env secrets set on Render/Docker.
- [ ] Run `npm run build` (frontend) & `npm test` (front/back) before deploy.
- [ ] Confirm `/health` returns 200.
- [ ] Smoke-test signup/login, shop creation, review flow on staging.
- [ ] Ensure CDN / Map tokens present for map features.
- [ ] Configure custom domain + HTTPS (Render supports automatic TLS).
- [ ] Enable `CORS_SAME_SERVICE` only if front/back same domain; otherwise list explicit origins.
- [ ] Rotate JWT secrets after transfer to production.
- [ ] Enable log retention & monitoring alerts (error rate, latency, Mongo health).


