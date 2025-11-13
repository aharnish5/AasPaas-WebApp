# Architecture Guide

## 1. System Context
- **Clients**: Web SPA (customers & vendors) built with Vite/React, optionally embedded vendor map widgets.
- **API Layer**: Express app (`backend/src/app.js`) exposes RESTful endpoints under `/api/*`, handles CORS, rate limits, logging, static SPA serving, and health check.
- **Data Layer**: MongoDB (Atlas/self-hosted) accessed via Mongoose models with rich indexing for geo queries and analytics.
- **External Services**:
  - **Geospatial**: Mapple (Mappls/MapmyIndia) preferred; fallback to Mapbox/Google Maps via `node-geocoder`; OpenStreetMap Nominatim for reverse geocode & autocomplete.
  - **AI & OCR**: Google Gemini for business inference, Tesseract (local) or Google Vision for OCR, orchestrated in `ocrService` and `geminiService`.
  - **Storage**: AWS S3 (public-read) or local filesystem (`backend/uploads/`) with Sharp image compression.
  - **Maps Frontend**: Mapbox GL JS for map rendering, optional Google Places for autocomplete.
  - **Email**: Nodemailer dependency exists (not yet wired) for future transactional mailers.
- **Deployment**: Docker multi-stage image (build frontend → run backend) deployed via Render or bespoke container platforms. Docker Compose available for local dev with Mongo/Redis.

## 2. Backend Component Map
```
                            ┌──────────────────────────────────┐
   HTTP(S) Requests         │  backend/src/app.js              │
   (REST/JSON, cookies)     │  ├─ CORS / JSON Parsing          │
     ▲                      │  ├─ Logging Middleware           │
     │                      │  ├─ /health                      │
     │                      │  ├─ /api/auth → authRoutes       │
     │                      │  ├─ /api/shops → shopsRoutes     │
     │                      │  ├─ /api/shops → reviewRoutes    │
     │                      │  ├─ /api/shops → analyticsRoutes │
     │                      │  ├─ /api/vendors → analytics     │
     │                      │  ├─ /api/location → location     │
     │                      │  ├─ /api/categories              │
     │                      │  ├─ /api → favorites/upload      │
     │                      │  └─ SPA static fallback          │
     │                      └──────────────────────────────────┘
     │                                     │
     │                                     ▼
     │                    ┌───────────────────────────────────────┐
     │                    │ Controllers                           │
     │                    │  • authController (JWT, profile, OTP) │
     │                    │  • shopController (AI onboarding,     │
     │                    │    geocoding, CRUD, search)           │
     │                    │  • reviewController (media, replies,  │
     │                    │    analytics)                         │
     │                    │  • favoriteController, analytics      │
     │                    │  • locationController (autocomplete)  │
     │                    └───────────────────────────────────────┘
     │                                     │
     │                                     ▼
     │                    ┌───────────────────────────────────────┐
     │                    │ Services & Utils                      │
     │                    │  • storageService (S3/local + Sharp)  │
     │                    │  • geocodingService (Mapple/Mapbox)   │
     │                    │  • mappleService (Mappls REST)        │
     │                    │  • googlePlacesService                │
     │                    │  • geminiService, ocrService          │
     │                    │  • lruCache, generateTokens           │
     │                    │  • migrate scripts (seed, geocode)    │
     │                    └───────────────────────────────────────┘
     │                                     │
     │                                     ▼
     │                    ┌───────────────────────────────────────┐
     │                    │ MongoDB via Mongoose Models           │
     │                    │  • User (auth, refresh tokens)        │
     │                    │  • Shop (geo indexes, pricing, OCR)   │
     │                    │  • Review, ReviewHelpful,             │
     │                    │    VendorReply                        │
     │                    │  • Favorite                           │
     │                    │  • Category (hierarchy, attributes)   │
     │                    └───────────────────────────────────────┘
```

### Lifecycle Hooks & Background Considerations
- `Review` schema post-save/-delete hooks recalculate shop rating aggregates.
- `User` schema pre-save hashes passwords, TTL for refresh tokens via Mongo TTL index.
- `Shop` schema includes geospatial indices for `$nearSphere` queries and slug fields for quick lookups.
- LRU caches for geocoding/autocomplete reduce upstream quota usage; mapple rate limiter enforces env-configured windows.
- `bullmq` dependency reserved for future job queues (not yet instantiated); add Redis connection when enabling background analytics.

## 3. Frontend Component Map
```
main.tsx → <Provider store> + <Router> + <ThemeContext>
   │
   └─ App.jsx (route switch)
       ├─ Public Pages (Home, About, Contact, SearchResults, ShopDetail)
       ├─ Auth Pages (Customer/Vendor Login/Signup, ForgotPassword)
       ├─ ProtectedRoute
           ├─ CustomerLayout → CustomerFeed / Favorites / Profile
           └─ VendorLayout → Dashboard / Shops CRUD / Analytics / Settings

Shared Modules:
  • hooks: useAuth (Redux + getMe), useGeolocation, useTheme
  • store: authSlice (JWT, refresh), shopsSlice (listings), reviewsSlice (per-shop)
  • services/api.js: Axios client with refresh token handling, service namespaces
  • components/ui: Tailwind-styled primitives (Button/Input/Modal)
  • components/navigation: Sidebar/Topbar/AppLogo with Storybook stories/tests
  • components/map: ShopMap (Mapbox), VendorMapEmbed (embedded map)
  • components/search: AddressAutocomplete (Mapple/Google), CategoryDropdown, CityAreaSelector
  • styles/theme.ts & tailwind config define design tokens and CSS variables

Data Flow:
 1. Components dispatch async thunks (e.g., `fetchShops`) → API client.
 2. Axios attaches JWT from localStorage; on 401 attempts `/auth/refresh` to mint new token and retry.
 3. Responses update Redux slices; selectors feed React components.
 4. `useAuth` auto-fetches `/auth/me` on mount if token present.
 5. Map components expect `import.meta.env.VITE_MAPBOX_TOKEN`; gracefully degrade if missing.
```

### UI/UX Layer
- Tailwind + custom CSS animations (see `Home.jsx` inline keyframes) enable modern hero transitions, floating cards, gradient backgrounds.
- `Framer Motion` available for interactive animations; ensure consistent usage via central animation tokens (planned in migration guide).
- Storybook documents reusable nav components; encourage extending coverage to forms, cards, and map widgets in redesign.

## 4. Data Model Summary

| Model | Key Fields | Notes & Indexing |
| --- | --- | --- |
| `User` | `name`, `email`, `phone`, `passwordHash`, `role`, `defaultLocation`, `refreshTokens[]` | Email & phone unique indexes, location 2dsphere, `comparePassword` helper, refresh tokens TTL expires after 7 days. |
| `Shop` | `ownerId`, `name`, `category`, `primaryCategory`, `tags`, `address{}`, `location`, `hours[]`, `images[]`, `priceRange`, `averagePrice`, `status`, `ratings`, `favoritesCount`, `ocrData`, `city_slug`, `area_slug` | Extensive indexes: geospatial on `location`, composite on status/category, slugs, favorites, rating. Slugify helper ensures ASCII hyphenated names. |
| `Review` | `shopId`, `userId`, `rating`, `text`, `images[]`, `helpfulCount` | Compound unique index `(shopId,userId)` prevents duplicates; post hooks recalc shop ratings. |
| `Favorite` | `userId`, `shopId` | Unique pair ensures idempotent favorites; increments `Shop.favoritesCount`. |
| `ReviewHelpful` | `reviewId`, `userId` | Unique pair per helpful vote. |
| `VendorReply` | `reviewId`, `vendorId`, `replyText` | Unique `reviewId` ensures single reply per review. |
| `Category` | `name`, `slug`, `parent`, `priority`, `icon`, `attributes[]`, `locales` | Supports taxonomy tree, optional attribute schema for advanced filtering; used by shop controllers for slug lookups. |

Sample documents are provided in `docs/API.md` response examples; see migration scripts (`src/scripts/`) for seeding and geocoding transformations.

## 5. Request Flows
- **Customer Browsing**
  1. User visits `/` → selects location via `AddressAutocomplete`.
  2. Frontend calls `GET /api/shops?lat&lon&radius` with optional filters.
  3. Backend uses `$nearSphere` query, sorts by proximity/rating/newest, returns pagination metadata.
  4. Shop cards display data; optional `ShopMap` renders markers if Mapbox token set.

- **Vendor Shop Creation**
  1. Vendor uploads storefront image via `POST /api/shops/upload-image` (multer stores in `pending/`).
  2. Server runs OCR (`ocrService`) & optional Gemini inference; response contains `uploadId`.
  3. Vendor submits form (`POST /api/shops`) with details + `uploadIds[]`.
  4. Controller geocodes address (Mapple fallback), moves images into `shops/{shopId}`, stores OCR metadata.

- **Review Lifecycle**
  1. Customer submits review with optional photos (`POST /api/shops/:id/reviews`).
  2. Images saved under `reviews/{shopId}`, review stored; post hook updates shop ratings.
  3. Vendor views analytics via `/api/shops/:shopId/vendor/:vendorId/reviews/analytics`.
  4. Vendor replies with `/reply` endpoint; customers fetch replies in review list.

- **Auth & Token Refresh**
  1. Login/signup returns `accessToken` + refresh cookie.
  2. Frontend stores access token in localStorage.
  3. Axios interceptor refreshes via `/api/auth/refresh` when access token expires; refresh token is validated against stored token list on `User`.

## 6. Environment Configuration
- Backend expects `.env` akin to:
  ```
  PORT=5000
  MONGO_URI=mongodb+srv://...
  JWT_SECRET=...
  JWT_REFRESH_SECRET=...
  FRONTEND_URL=https://app.example.com
  CORS_SAME_SERVICE=true
  PUBLIC_BASE_URL=https://app.example.com
  S3_BUCKET=...
  S3_REGION=us-east-1
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  MAPBOX_TOKEN=...
  MAPPLE_API_KEY=...
  MAPPLE_GEOCODE_URL=https://atlas.mappls.com/api/places/geocode
  GEMINI_API_KEY=...
  GOOGLE_MAPS_API_KEY=...
  GOOGLE_PLACES_API_KEY=...
  TESSERACT_ENABLED=true
  LOG_LEVEL=info
  ```
- Frontend `.env` (Vite):
  ```
  VITE_API_URL=https://api.example.com/api
  VITE_MAPBOX_TOKEN=pk.XXXX
  VITE_GEMINI_ENABLED=true
  ```
  Values are baked at build time; update `render.yaml` or Docker secrets accordingly.

## 7. Scaling & Future-Proofing Notes
- Introduce Redis for rate limiting and background jobs (bullmq already listed). Update services to share Redis connection.
- Replace in-memory `ocrResults` map with persistent store (Redis) to scale across pods.
- Offload analytics calculations to scheduled jobs (daily aggregation) storing results per vendor.
- Implement OpenAPI generator to keep `api-spec.json` synchronized with controllers.
- Attach observability stack (OpenTelemetry, request tracing) and integrate with Render logging/metrics.

Refer to `docs/MIGRATION.md` for UI/UX modernization roadmap and phased rollout strategy.

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
