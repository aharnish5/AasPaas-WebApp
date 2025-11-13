# Environment Configuration

This is the concise env reference for both backend and frontend. For a comprehensive backend guide with examples, see `backend/ENV_GUIDE.md`.

## Backend (`backend/.env`)
Required
- MONGO_URI — e.g., mongodb://localhost:27017/aas-paas or Atlas URI
- JWT_SECRET — random 32+ chars
- JWT_REFRESH_SECRET — different random 32+ chars

Recommended
- PORT — default 5000
- NODE_ENV — development | production
- FRONTEND_URL — e.g., http://localhost:3000 (CORS allowlist)

Uploads (S3)
- S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

AI Autofill (Gemini)
- GEMINI_API_KEY (optional)
- GEMINI_MODEL=gemini-2.0-flash (optional override)

Geocoding/Places
- MAPPLE_API_KEY (primary provider)
- MAPPLE_GEOCODE_URL=https://atlas.mappls.com/api/places/geocode
- GOOGLE_PLACES_API_KEY (optional)
- MAPBOX_TOKEN (optional fallback)
- GEOCODER_PROVIDER=mapbox | google (fallback selection)
- MAPPLE_RL_WINDOW_MS, MAPPLE_RL_MAX, MAPPLE_RL_GLOBAL_MAX (rate limits)

OCR
- TESSERACT_ENABLED=true | false
- GOOGLE_VISION_ENABLED=false | true
- GOOGLE_VISION_KEY_PATH=./config/google-vision-key.json

Redis (optional)
- REDIS_URL=redis://...

## Frontend (`frontend/.env`)
Required
- VITE_API_URL=http://localhost:5000/api

Optional
- VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi... (map features)

Notes
- Vite requires all public envs to be prefixed with VITE_.
- When deploying, set corresponding production envs and update API URL.
