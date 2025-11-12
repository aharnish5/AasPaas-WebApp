# Deploy to Render (single Web Service for frontend + backend)

This guide deploys both the React frontend (Vite) and the Express backend to a single Render Web Service using one Docker image.

## What this setup does

- Builds the frontend (`frontend/`) during Docker build and copies the compiled assets into the backend image.
- The backend (`backend/`) serves API under `/api/*` and also serves the built SPA (static files) at all other routes.
- One Render Web Service, one URL, simpler CORS.

## Prerequisites

- A MongoDB connection string (Render Managed Mongo or MongoDB Atlas).
- Optional cloud keys if you use them: Mapbox or Google Maps, S3 bucket credentials, etc.

## Files added/updated

- `Dockerfile` (root): multi-stage build to create a single image for both apps.
- `render.yaml`: Render blueprint for one Docker-based Web Service.
- `backend/src/app.js`: serves the SPA when `frontend-dist` exists and adds `CORS_SAME_SERVICE` toggle.

## One-time setup on Render

1) Push your changes to GitHub (main branch recommended).

2) Create a new Web Service
	 - On Render, click “New +” → “Web Service”.
	 - Connect your GitHub repo and pick the branch.
	 - Environment: Docker
	 - Name: `aas-paas-web` (or your choice)
	 - Region: closest to your users.
	 - Instance type: Start with Free, upgrade as needed.
	 - Render detects the `Dockerfile` automatically. No build or start command needed.

3) Set environment variables
	 - Required
		 - `NODE_ENV=production`
		 - `CORS_SAME_SERVICE=true` (simplifies CORS when SPA and API share the same URL)
		 - `MONGODB_URI=<your mongo connection string>`
		 - `JWT_SECRET=<generate strong secret>`
		 - `REFRESH_TOKEN_SECRET=<generate strong secret>`
	 - Recommended
		 - After the first deploy, set `FRONTEND_URL` to your service URL, e.g. `https://your-service.onrender.com` (keeps CORS list accurate if you later turn off `CORS_SAME_SERVICE`).
	 - Optional (enable features if you use them)
		 - `MAPBOX_TOKEN` or `GOOGLE_MAPS_API_KEY`
		 - `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
		 - `TESSERACT_ENABLED=true`

4) Health check
	 - In the service settings, ensure the health check path is `/health` (already set in `render.yaml`).

5) Deploy
	 - Click “Create Web Service”. Render will build the image and start the service.

## How it works

The root `Dockerfile`:
- Builds the frontend with Vite and copies `/frontend/dist` into the backend image at `/app/frontend-dist`.
- The backend reads `FRONTEND_DIST_DIR` (default `/app/frontend-dist`) and serves those files.
- All non-`/api/*` routes fall back to `index.html` so client-side routing works.

Backend binds to `$PORT` provided by Render. No extra config needed.

## Local test (optional)

You can build and run the same container locally:

```powershell
# From repo root
docker build -t aas-paas:local .
# Expose backend port; container serves both API and SPA
docker run --rm -p 5000:5000 `
	-e PORT=5000 `
	-e NODE_ENV=production `
	-e CORS_SAME_SERVICE=true `
	-e MONGODB_URI="mongodb://localhost:27017/aaspaas" `
	aas-paas:local
```
Then open http://localhost:5000/.

## Notes & tips

- CORS: With `CORS_SAME_SERVICE=true`, the backend allows requests from any origin. Because SPA and API share the same URL, the browser enforces same-origin, so this is safe and simple. If you later split front/back into different services, turn this off and set `FRONTEND_URL` instead.
- Static uploads: If you haven’t configured S3, uploads are stored inside the container’s filesystem (`/uploads`). On Render, use a persistent disk or switch to S3 for durability across deploys.
- OCR: Tesseract runs in-process. If a user uploads an unreadable image, the server returns an empty OCR result now (no crashes).
- Environment secrets: Prefer storing secrets via Render’s dashboard or `render.yaml` with `sync: false` so values aren’t committed.

## Troubleshooting

- App boots but SPA isn’t served: ensure the frontend actually built and exists at `/app/frontend-dist` (check logs for “Serving SPA from ...”).
- CORS errors in browser console: keep `CORS_SAME_SERVICE=true` for single-service deployments; or set `FRONTEND_URL` exactly to your Render URL.
- 502s during startup: check MongoDB connectivity and that your `$PORT` is used (it is by default). Ensure health check path `/health` returns 200.
