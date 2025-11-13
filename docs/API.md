# API Reference

Base URL defaults to `/api` when frontend and backend are served from the same origin. In split deployments set `VITE_API_URL` (frontend) and ensure reverse proxy forwards to backend host.

## Authentication & Session

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | No | Create customer or vendor account. |
| `POST` | `/auth/login` | No | Login with email or phone (`identifier`). |
| `PATCH` | `/auth/profile` | Access token | Update name/phone. |
| `PATCH` | `/auth/change-password` | Access token | Change password (invalidates refresh tokens). |
| `PATCH` | `/auth/change-email` | Access token | Change email with password confirmation. |
| `POST` | `/auth/refresh` | Refresh cookie | Issue new access token. |
| `POST` | `/auth/forgot-password` | No | Generate password reset token (logs token in dev). |
| `POST` | `/auth/reset-password` | No | Reset password with token. |
| `GET` | `/auth/me` | Access token | Fetch current user profile. |
| `POST` | `/auth/logout` | Access token | Clear refresh token cookie & delete stored token. |

**Request Example** (`POST /auth/signup`):
```json
{
  "name": "Asha Vendor",
  "email": "asha@example.com",
  "password": "secret123",
  "role": "vendor",
  "phone": "+919876543210",
  "defaultLocation": {
    "rawAddress": "MG Road, Bengaluru",
    "coordinates": [77.5946, 12.9716]
  }
}
```

**Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "6510cf...",
    "name": "Asha Vendor",
    "email": "asha@example.com",
    "role": "vendor",
    "phone": "+919876543210",
    "createdAt": "2024-11-13T10:21:13.456Z",
    "updatedAt": "2024-11-13T10:21:13.456Z"
  },
  "accessToken": "eyJhbGciOiJI..."
}
```

Errors return `{ "error": "message", "details": [...] }` with appropriate HTTP status (`400`, `401`, `403`).

## Shops & Geospatial Search

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/shops/upload-image` | Vendor | Upload image (10 MB) for OCR & pending storage. |
| `POST` | `/shops/infer-image` | Vendor | Upload image and run OCR + Gemini inference. Rate-limited (12/min). |
| `GET` | `/shops/ocr-result` | Optional | Fetch cached OCR result by `uploadId`. |
| `GET` | `/shops/geocode?address=` | Public | Geocode address string. |
| `GET` | `/shops/reverse-geocode?lat&lon` | Public | Reverse geocode coordinates. |
| `GET` | `/shops/places?q=` | Public | Autocomplete suggestions (Mapple + OSM + optional Google). |
| `GET` | `/shops/places/details?placeId=` | Public | Google Place details (requires API key). |
| `POST` | `/shops` | Vendor | Create shop. Moves pending images into shop folder. |
| `GET` | `/shops` | Optional | List shops with filters & pagination. |
| `POST` | `/shops/search` | Public | Precise radius/city search via Mongo `$geoNear`. |
| `GET` | `/shops/:shopId` | Optional | Fetch single shop; calculates distance if `lat` & `lon` included. |
| `PATCH` | `/shops/:shopId` | Vendor/Admin | Update shop fields, geocode address, attach new images. |
| `DELETE` | `/shops/:shopId` | Vendor/Admin | Delete shop & images. |
| `POST` | `/shops/:shopId/images` | Vendor/Admin | Upload additional image (10 MB). |

**Filters supported by `GET /shops`**:  
`lat`, `lon`, `radius` (km), `q` (text query), `category`, `categoryId`, `categorySlug`, `minRating`, `priceRange`, `minAveragePrice`, `maxAveragePrice`, `sort` (`proximity|rating|newest`), `page`, `limit`, `locality`, `ownerId` (requires auth + ownership).

**Create Shop Request**:
```json
{
  "name": "Sharma Key Makers",
  "category": "services",
  "description": "Traditional locksmith and key duplication",
  "address": {
    "raw": "15, Bazaar St, Delhi",
    "locality": "Bazaar Street",
    "city": "Delhi",
    "state": "Delhi",
    "postalCode": "110006",
    "country": "India"
  },
  "location": { "coordinates": [77.2200, 28.6320] },
  "hours": [
    { "dayOfWeek": 1, "openTime": "09:00", "closeTime": "21:00" }
  ],
  "phone": "+919999000111",
  "priceRange": "low",
  "averagePrice": 150,
  "uploadIds": ["1700000000-abcdxyz"]
}
```

**Response**:
```json
{
  "message": "Shop created successfully",
  "shop": {
    "_id": "6521aa...",
    "ownerId": "6510cf...",
    "name": "Sharma Key Makers",
    "category": "services",
    "status": "live",
    "address": { "...": "..." },
    "location": { "type": "Point", "coordinates": [77.22, 28.632] },
    "images": [
      {
        "url": "https://bucket.s3.amazonaws.com/shops/6521aa/1700000000-abcdxyz.jpg",
        "uploadedBy": "6510cf..."
      }
    ],
    "ocrData": {
      "extractedName": "SHARMA KEY MAKERS",
      "confidence": 0.78,
      "processedAt": "2024-11-13T11:01:02.987Z"
    }
  }
}
```

## Reviews & Vendor Replies

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/shops/:shopId/reviews` | Customer | Submit review with rating (1-5) and up to 5 images (5 MB each). |
| `GET` | `/shops/:shopId/reviews` | Optional | List reviews (`page`, `limit`, `sort`, `filter=photos`). |
| `PATCH` | `/shops/:shopId/reviews/:reviewId` | Owner | Update own review. |
| `DELETE` | `/shops/:shopId/reviews/:reviewId` | Owner/Admin | Delete review; removes images. |
| `POST` | `/shops/:shopId/reviews/:reviewId/helpful` | Authenticated | Mark review helpful (idempotent). |
| `GET` | `/shops/:shopId/vendor/:vendorId/reviews` | Vendor/Admin | Vendor dashboard view of reviews. |
| `GET` | `/shops/:shopId/vendor/:vendorId/reviews/analytics` | Vendor/Admin | Summary counts, rating breakdown, time series. |
| `POST` | `/shops/:shopId/vendor/:vendorId/reviews/:reviewId/reply` | Vendor/Admin | Create/update reply to review. |
| `GET` | `/shops/:shopId/reviews/:reviewId/reply` | Public | Retrieve vendor reply. |

**Create Review Response**:
```json
{
  "message": "Review created successfully",
  "review": {
    "_id": "6521bb...",
    "shopId": "6521aa...",
    "userId": { "_id": "6510cf...", "name": "Rahul", "email": "rahul@example.com" },
    "rating": 5,
    "text": "Quick service and fair price",
    "images": [
      { "url": "https://.../reviews/6521aa/170000112233-abc.jpg" }
    ],
    "createdAt": "2024-11-13T11:05:09.102Z"
  }
}
```

Vendor analytics response:
```json
{
  "totalShops": 2,
  "totalViews": 540,
  "totalReviews": 18,
  "averageRating": 4.4,
  "shops": [
    { "shopId": "6521aa...", "name": "Sharma Key Makers", "views": 320, "reviews": 12, "rating": 4.6, "status": "live" }
  ],
  "viewsOverTime": [
    { "date": "2024-10-15", "views": 18 },
    { "date": "2024-10-16", "views": 18 }
  ],
  "period": { "start": "2024-09-13T11:05:09.102Z", "end": "2024-11-13T11:05:09.102Z", "days": 60 }
}
```

## Favorites

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/shops/:shopId/favorite` | Customer | Add shop to favorites (increments `favoritesCount`). |
| `DELETE` | `/shops/:shopId/favorite` | Customer | Remove favorite (decrements count). |
| `GET` | `/shops/:shopId/favorite` | Customer | Check if current user favorited shop. |
| `GET` | `/favorites` | Customer | List favorite shops with basic info. |

Response example (`GET /favorites`):
```json
{
  "shops": [
    {
      "_id": "6521aa...",
      "name": "Sharma Key Makers",
      "category": "services",
      "images": [...],
      "ratings": { "avg": 4.6, "count": 12 },
      "address": { "locality": "Bazaar Street", "city": "Delhi" },
      "favoritesCount": 8
    }
  ]
}
```

## Analytics & Tracking

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/shops/:shopId/track-view` | Optional | Increment view counter. Accepts optional JWT for personalization logging. |
| `GET` | `/vendors/:vendorId/analytics?range=7|30|90|custom` | Vendor/Admin | Aggregate vendor stats. |

`track-view` returns `{ "message": "View tracked" }`.

## Categories & Taxonomy

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/categories` | Admin | Create category (supports optional parent, attributes). |
| `GET` | `/categories` | Public | List categories; `parent`, `grouped`, `includeCounts`. |
| `PATCH` | `/categories/:id` | Admin | Update category. |
| `DELETE` | `/categories/:id` | Admin | Delete category. |

Grouped response example (`GET /categories?grouped=true&includeCounts=true`):
```json
{
  "grouped": {
    "food": [
      { "_id": "6500...", "name": "Street Food", "slug": "street-food", "children": [] }
    ]
  },
  "counts": {
    "6500...": 42
  },
  "roots": [
    {
      "_id": "649f...",
      "name": "Food & Drinks",
      "slug": "food",
      "children": [{ "_id": "6500...", "name": "Street Food", "...": "..." }]
    }
  ]
}
```

## Location Autocomplete (Deprecated Photon replaced)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/location/autocomplete?q=&lat=&lon=&limit=` | Public (rate-limited) | Combines Mapple, Nominatim with caching; returns highlighted labels. |
| `GET` | `/location/details?osmId=&osmType=` | Public | Fetches details via Nominatim lookup. |

Autocomplete response:
```json
{
  "suggestions": [
    {
      "label": "Banjara Hills, Hyderabad, Telangana",
      "displayName": "Banjara Hills, Hyderabad, Telangana, India",
      "locality": "Banjara Hills",
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "latitude": 17.4126,
      "longitude": 78.4347,
      "provider": "mapple",
      "highlightLabel": "Ban<mark>jara</mark> Hills, Hyderabad, Telangana"
    }
  ]
}
```

## Uploads (Generic Review Photos)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/upload` | Customer | Upload image(s) outside review form; returns array of URLs under `reviews/temp`. |

Response:
```json
{ "urls": ["https://.../reviews/temp/uuid.jpg"] }
```

## Health Check

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | None | Returns `{ "status": "ok", "timestamp": ISO8601 }`. Used for Render health probes. |

## Error Handling
- Validation errors (`400`) respond with:
  ```json
  {
    "error": "Validation failed",
    "details": [
      { "type": "field", "msg": "Shop name is required", "path": "name", "location": "body" }
    ]
  }
  ```
- Auth errors use `401` or `403` with `{ "error": "Invalid credentials" }`.
- Rate limits return `429` and `Retry-After` header.
- Geocoding failures return `400` with `details`.

## Headers & Tokens
- **Authentication**: `Authorization: Bearer <accessToken>` plus HTTP-only `refreshToken` cookie (set on signup/login).
- **Content-Type**: `application/json` except multipart endpoints (`upload-image`, `infer-image`, `reviews`, `upload`).
- **CORS**: Controlled by `FRONTEND_URL`, `CORS_SAME_SERVICE`, defaulting to local dev origins.
- **Mapple Rate Limit**: Exceeding per-IP or global quotas yields `429` with `Rate limit exceeded for Mapple geocoding`.

## Curl Cheat Sheet

### Signup (vendor)
```bash
curl -X POST https://api.example.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"secret123","role":"vendor"}'
```

### Login (customer)
```bash
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"identifier":"customer@example.com","password":"secret123","role":"customer"}'
```

### Refresh Token
```bash
curl -X POST https://api.example.com/api/auth/refresh \
  -b cookies.txt
```

### Create Shop
```bash
curl -X POST https://api.example.com/api/shops \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @shop.json
```

### Search Shops Near Coordinates
```bash
curl "https://api.example.com/api/shops?lat=28.6320&lon=77.2195&radius=5&sort=proximity"
```

### Vendor Analytics
```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://api.example.com/api/vendors/6510cf.../analytics?range=30"
```

### Upload Review Photo (multipart)
```bash
curl -X POST https://api.example.com/api/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "images=@/path/review.jpg"
```

## Middleware Reference
- `authenticate`: Verifies JWT access token.
- `optionalAuth`: Parses JWT if present, otherwise continues.
- `requireVendor`, `requireCustomer`, `requireAdmin`: Role guards.
- `validateRequest`: Wraps express-validator errors.
- `rateLimiter`: Lightweight token bucket; used for `/shops/infer-image` and `/shops/places`.
- `mappleRateLimiter`: Env-configurable rate limit for Mapple geocoding + autocomplete.
- `errorHandler`: Centralized structured error responses.
- `notFound`: 404 JSON fallback.

## Environment-Driven Behavior
- `CORS_SAME_SERVICE=true` allows any origin (useful when frontend served by same container).
- Absence of `S3_BUCKET` serves local uploads via `/uploads/*`.
- `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` toggles Google autocomplete & details.
- `GEMINI_API_KEY` enables AI inference; fallback gracefully reports `Inference unavailable`.
- `GOOGLE_VISION_ENABLED` toggles Vision OCR; else Tesseract (`eng.traineddata` packaged).
- `MAPBOX_TOKEN` exposes interactive map; otherwise UI shows disabled placeholder.

Refer to `api-spec.json` for a machine-readable OpenAPI skeleton; ensure updates remain in sync when routes evolve.


