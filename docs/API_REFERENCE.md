# API Reference (v1)

Base URL (local): `http://localhost:5000/api`

Auth
- Use JWT access token via `Authorization: Bearer <token>` or `accessToken` cookie
- Some routes allow anonymous (optionalAuth), others require roles: customer/vendor/admin
- Errors are JSON: `{ "error": string }`

---

## Auth — `/api/auth`
- POST `/signup` — create user (body: name, email, password, role?="customer"|"vendor", phone?="+<cc>...")
- POST `/login` — login (body: identifier=email|phone, password)
- POST `/refresh` — rotate tokens with refresh token
- GET `/me` — current user profile (auth)
- POST `/logout` — revoke current session (auth)
- POST `/forgot-password` — send reset email (body: email)
- POST `/reset-password` — reset with token (body: token, password)
- PATCH `/profile` — update name/phone (auth)
- PATCH `/change-password` — change password (auth)
- PATCH `/change-email` — change email (auth)

Validation: enforced via express-validator; see detailed messages in responses.

---

## Shops — `/api/shops`
Uploads & utilities
- POST `/upload-image` — image upload (multipart form: image) [auth vendor]
- POST `/infer-image` — AI infer fields from image [auth vendor; rate-limited]
- GET `/ocr-result` — poll AI/OCR result by `uploadId`
- GET `/geocode?address=...` — forward geocode (Mappls-first; rate-limited)
- GET `/reverse-geocode?lat=..&lon=..` — reverse geocode (rate-limited)
- GET `/places?q=...&limit?=5` — suggestion list (Mappls→Google Places→Nominatim)
- GET `/places/details?placeId=...` — Google place details (if configured)

CRUD & search
- POST `/` — create shop [auth vendor]
- GET `/` — list shops (query: lat, lon, q, locality, radius, category, categoryId, categorySlug, minRating, page, limit, sort=proximity|rating|newest, ownerId, priceRange, maxAveragePrice, minAveragePrice)
- POST `/search` — authoritative georadius search (body: center:{lat,lon}, radiusMeters?, city_slug?, query?, category?, categoryId?, pagination/sorts same as GET)
- GET `/:shopId` — details (optional distance calc with `lat`/`lon` query)
- PATCH `/:shopId` — update [auth owner or admin]; supports image `uploadIds` finalization
- DELETE `/:shopId` — delete [auth owner or admin]
- POST `/:shopId/images` — add image (multipart) [auth owner]

Tracking & analytics
- POST `/:shopId/track-view` — record a view (optionalAuth)

---

## Reviews — mounted under `/api/shops`
Public and vendor flows share the shop prefix.
- POST `/:shopId/reviews` — create review with optional images [auth customer]
- GET `/:shopId/reviews` — list reviews (query: page, limit, sort=newest|oldest|rating|helpful, filter=photos|all)
- PATCH `/:shopId/reviews/:reviewId` — update own review [auth]
- DELETE `/:shopId/reviews/:reviewId` — delete own or admin
- POST `/:shopId/reviews/:reviewId/helpful` — mark helpful [auth]
- GET  `/:shopId/reviews/:reviewId/reply` — get vendor reply (public)

Vendor views
- GET  `/:shopId/vendor/:vendorId/reviews` — list reviews for vendor-owned shop [auth]
- GET  `/:shopId/vendor/:vendorId/reviews/analytics` — stats [auth]
- POST `/:shopId/vendor/:vendorId/reviews/:reviewId/reply` — reply add/update [auth]

---

## Favorites — `/api`
- POST   `/shops/:shopId/favorite` — favorite a shop [auth customer]
- DELETE `/shops/:shopId/favorite` — remove favorite [auth customer]
- GET    `/shops/:shopId/favorite` — is favorited? [auth customer]
- GET    `/favorites` — current user favorites [auth customer]

---

## Vendors Analytics — `/api/vendors`
- GET `/:vendorId/analytics?range=7|30|90|custom` — vendor metrics [auth]

Also see tracking route under Shops.

---

## Location — `/api/location`
- GET `/autocomplete?q=...` — suggestions (rate-limited)
- GET `/details?osmId=...&osmType=...` — place details via Nominatim

---

## Categories — `/api/categories`
- POST `/` — create category [admin]
- GET  `/` — list; `?parent=<id>&grouped=true|false&includeCounts=true|false`
- PATCH `/:id` — update [admin]
- DELETE `/:id` — delete [admin]

---

## Upload — `/api`
- POST `/upload` — generic images array upload (field: images[]) [auth customer]

---

## Auth details
Send token as header or cookie:
```
Authorization: Bearer <accessToken>
```
Or via cookie named `accessToken`.

## Error format
```
HTTP 400/401/403/404/500
{ "error": "message" }
```
Validation errors use express-validator result structure with field-specific messages.
