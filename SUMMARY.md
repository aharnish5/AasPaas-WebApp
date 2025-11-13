# AasPaas – Mapping the Heartbeat of India

## Project Overview
- **Purpose**: Hyperlocal discovery platform connecting customers with nearby informal vendors (cobblers, keymakers, fritter sellers, etc.) through a location-aware directory, reviews, and rich vendor tooling.
- **Core Features**: AI-assisted shop onboarding (image OCR + Gemini inference), geospatial shop search, vendor analytics, customer favorites and reviews with photos, secure auth flows with refresh tokens, responsive Vite/Tailwind frontend with animated hero, map visualizations, and vendor dashboards.
- **Primary Users**: Walk-in customers seeking neighbourhood services, local vendors managing their digital presence, and administrators curating categories & safety.

## Architecture at a Glance
```
Customers / Vendors (Web SPA)
        │  (HTTPS, JWT)
        ▼
Vite React Frontend (`frontend/`)
        │  REST / JSON
        ▼
Express API (`backend/src/app.js`)
        │         │
        │         ├── External Services
        │         │     • Mappl̥e & Mapbox (geocoding/maps)
        │         │     • Google Places (optional autocomplete)
        │         │     • Gemini & OCR (image intelligence)
        │         │     • AWS S3 or local FS (media)
        │         └── Middleware & Business Logic
        ▼
MongoDB (Atlas / self-hosted) with Mongoose models
```
Render (Docker) or Docker Compose orchestrates services; static frontend assets can be served by Express or Nginx.

## Tech Stack Summary
- **Frontend**: React 18, Vite 5, Tailwind CSS (custom theme), Framer Motion, Redux Toolkit, React Hook Form, Lucide icons, Mapbox GL, Recharts, React Query (available). Storybook & Vitest for UI/tests, Playwright planned for e2e.
- **Backend**: Node 18, Express 4, Mongoose 8, JWT, bcrypt, Multer, Sharp, Winston logging, express-validator, custom rate limiters, optional AWS S3, Mapple/Mapbox/Google geocoding, Gemini AI, Tesseract OCR.
- **Database**: MongoDB with geo indexes; models for Users, Shops, Reviews, Favorites, Categories, Vendor replies/helpfulness.
- **Infrastructure**: Docker multi-stage build (frontend + backend), Render deployment (`render.yaml`), Docker Compose for local Mongo/Redis, optional Redis (future bullmq).
- **Tooling & QA**: ESLint/Tailwind configs, Vitest, Jest + Supertest (backend), Storybook, Playwright scaffold, coverage reports.

## File Structure Highlights
| Path | Description |
| --- | --- |
| `backend/src/index.js` | Entry point; loads env, connects Mongo, starts Express with resilient shutdown handlers. |
| `backend/src/app.js` | Express app wiring: CORS, health check, static SPA hosting, route mounting, error stack. |
| `backend/src/routes/` | Auth, shops, reviews, favorites, analytics, location, categories, upload routers with validators + middleware. |
| `backend/src/controllers/` | Business logic (AI-assisted shop onboarding, review lifecycle, vendor analytics, auth, geocoding). |
| `backend/src/models/` | Mongoose schemas with indexes, hooks (e.g., review rating recalculation). |
| `backend/src/services/` | Integrations: storage (S3/local), geocoding (Mapple/Mapbox/Google), Gemini, OCR, Google Places, LRU cache. |
| `backend/src/middleware/` | Auth (JWT + refresh cookie), role guards, validation, rate limiters, error/not-found. |
| `backend/src/scripts/` | Seed & migration utilities (category import, geocoding fixes). |
| `frontend/src/App.jsx` | Route tree: public pages, customer/vendor portals, ProtectedRoute wrapper. |
| `frontend/src/pages/` | Views for home, search, shop detail, auth flows, customer dashboard, vendor console. |
| `frontend/src/components/` | Layouts, navigation, map embeds, shop cards, UI primitives with Tailwind/Framer animations. |
| `frontend/src/store/` | Redux Toolkit slices for auth, shops, reviews; async thunks call REST API client. |
| `frontend/src/services/api.js` | Axios instance with refresh-token interceptor, typed service methods for all endpoints. |
| `Dockerfile` | Multi-stage build bundling Vite dist into backend image served via Express. |
| `docker-compose.yml` | Local dev stack (Mongo, Redis placeholder, backend nodemon, frontend Nginx). |
| `render.yaml` | Render Docker deployment config, env var template. |

Build artifacts live in `frontend/dist/` (Vite) and `frontend/storybook-static/`; backend uploads stored under `backend/uploads/` when S3 disabled; coverage reports under `backend/coverage/`. Generated assets are ignored from Git except when attached for reference.

## Backend Highlights
- JWT access tokens with refresh-token cookies; signup/login support email or phone, role-aware authorization.
- Shop onboarding pipeline: image upload → pending storage → OCR (Tesseract/Google Vision) → Gemini inference hints → geocoding (Mapple fallback to Mapbox/Google) → final shop creation with city/area slugs & price metadata.
- Geo search endpoints: GET `/api/shops` (proximity + filters) and POST `/api/shops/search` (geoNear aggregation) with category filters, price, rating, locality.
- Review system: images, helpful votes, vendor replies, analytics (breakdowns, timeseries).
- Favorites per customer, vendor analytics (views, ratings, shop stats) with simple timeseries placeholder.
- Comprehensive error handling & validation feedback, rate limiting for geocoding/autocomplete endpoints.

## Frontend Highlights
- Animated landing page with AddressAutocomplete (Mapple/Google suggestions), framer motion hero, CTA flows for customers and vendors.
- Vendor wizard supports AI inference + OCR data reconciliation before POST `/api/shops`.
- Customers can browse, filter, and view map overlays (`ShopMap`) given Mapbox token; fallback messaging when token missing.
- Auth guard via `ProtectedRoute`, Redux-managed session with background `getMe`, axios interceptor for silent refresh.
- Theming & design tokens via `tailwind.config.ts` and `styles/theme.ts`; `useTheme` hook offers system/dark-mode toggles.
- Storybook stories for navigation and layout components; Vitest tests for layout/sidebar/Topbar; Playwright scaffold (`test/utils.tsx`).

## Deployment & Operations
- Local development: `npm install` in `frontend/` and `backend/`, run `npm run dev` pair or `docker-compose up`.
- Production build: multi-stage `Dockerfile` builds frontend then boots backend server serving static SPA + `/api`.
- Render deployment: `render.yaml` references root Dockerfile, expects Mongo URI, JWT secrets, optional Mapbox/Mapple/Gemini/S3 keys, `CORS_SAME_SERVICE=true` for same-host front/back.
- Logs persisted via Winston to `backend/logs/`, accessible in container volume; health check at `/health`.

## Testing & QA
- **Backend**: Jest + Supertest tests under `backend/src/test/`, including auth profile, directions, search, rate limiter, geocoding cache; coverage output stored in `backend/coverage/`.
- **Frontend**: Vitest + Testing Library (`src/layouts/__tests__/`, `components/navigation/__tests__/`, etc.), Storybook snapshots, Playwright placeholder for e2e journey.
- Recommended CI checks: `npm run lint`, `npm run test`, `npm run build` on both frontend/backend, optional Storybook build and Playwright smoke.

## Security & Compliance
- Password hashing with bcrypt, tokens (access + refresh) using env-driven secrets with configurable expiry.
- Refresh tokens stored in Mongo with TTL, delivered via HTTP-only cookie; CORS whitelist reads `FRONTEND_URL` or multi-origin dev defaults.
- Optional S3 or local storage with Sharp optimization; file limits (shop images 10 MB, review images 5 MB).
- Rate limiting for Mapple/geocoding endpoints; `auth` middleware ensures role-based access. Ensure HTTPS in production, rotate secrets, restrict Mongo IPs, configure `CORS_SAME_SERVICE` or explicit allowlist.

## Performance, Observability & Modern UI Roadmap
- Mongo indexes on geo fields, category, ratings, favorites; `Shop.calculateDistance` caches distances.
- LRU caches for geocoding and autocomplete; planned Redis integration (bullmq dependency) for scaling.
- Observability: Winston JSON logs, recommend adding structured log shipping (Render dashboard, Loki or ELK) plus metrics on request latency, DB ops, rate-limit hits.
- UI modernization path (see `docs/MIGRATION.md`): incremental feature flags for redesigned layout, shared design tokens, animation guidelines, skeleton loaders, and performant code-splitting to keep Lighthouse scores high.

## Next Steps (High-level)
1. Harden deployment (Render env variables, secret rotation, Mongo network rules).
2. Fill `api-spec.json` with full OpenAPI and integrate with Postman.
3. Implement Redis-backed rate limiting & background jobs for analytics aggregation (bullmq stub).
4. Execute staged UI refresh with enhanced vendor dashboards, map animations, offline caching (details in migration guide).


