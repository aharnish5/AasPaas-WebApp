# Architecture Overview

AasPaas is a MERN-style app with a modern React/Tailwind frontend and an Express/Mongoose backend. It’s optimized for hyperlocal search, vendor onboarding, reviews, and analytics.

## High-level diagram
```
[ React + Vite + Tailwind ]  --(HTTP)->  [ Express API ] --(Mongoose)-> [ MongoDB ]
                |                                  |                      
                |                                  ├─ geocoding (Mappls → Google/Mapbox → Nominatim)
                |                                  ├─ OCR (Tesseract; optional Google Vision)
                |                                  └─ Storage (AWS S3 for images)
```

## Frontend
- React 18, Vite 5, TypeScript 5
- TailwindCSS 3 with design tokens via CSS variables (see `src/styles/theme.ts` and `src/hooks/useTheme.tsx`)
- Routing: React Router v6
- State: Redux Toolkit; forms via React Hook Form + zod
- UI: Radix primitives, Lucide icons, Recharts for analytics
- Storybook 7 for component docs; Vitest + RTL for unit tests

## Backend
- Node 18+, Express 4
- Mongoose 8 (MongoDB)
- JWT auth (access + refresh), express-validator, multer for uploads, CORS, rate limiting
- Services: storage (S3), geocoding (Mappls primary with fallbacks), OCR (Tesseract), AI (Gemini)
- Routes: auth, shops, reviews, favorites, analytics, location, categories, upload

## Data highlights
- Shops: GeoJSON Point for `location` with `$nearSphere` queries; derived `distance`
- Reviews: images, helpful votes, vendor replies; vendor analytics endpoints
- Categories: hierarchical tree with grouped output and optional shop counts

## Error handling & logging
- Central error handler (`middleware/errorHandler.js`) returns normalized JSON errors
- Winston logger configured in `src/config/logger.js`

## Security & limits
- CORS allowlist respects FRONTEND_URL
- Rate limiting on geocoding endpoints (Mappls-protective)
- Auth roles: customer/vendor/admin with route guards

## Build & deploy
- Frontend: Vite build to `frontend/dist` (static assets)
- Backend: Node app (stateless); can be containerized. See root `Dockerfile` and `render*.Dockerfile`.
- Render deployment and docker-compose provided. See root DEPLOYMENT docs.
