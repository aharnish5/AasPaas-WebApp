# Security Checklist & Guidelines

## 1. Authentication & Authorization
- **JWT Secrets**: Set `JWT_SECRET` and `JWT_REFRESH_SECRET` to at least 32 random characters. Rotate regularly; invalidate refresh tokens (`User.refreshTokens`) during rotation.
- **Refresh Tokens**: Persisted per user with TTL (7 days). Delivered via HTTP-only cookie; ensure HTTPS so `secure` flag engages. Consider `sameSite='lax'` if cross-subdomain login required.
- **Role Guards**: `requireVendor`, `requireCustomer`, `requireAdmin` enforce access. Review new routes to ensure appropriate guard.
- **Password Hashing**: Bcrypt with 10 rounds in `User` pre-save hook. Enforce minimum password length (6). Consider adding password complexity checks & rate limiting login attempts.
- **Session Management**: Logout clears refresh token; `changePassword` wipes stored tokens. Provide UI cues for multi-device sessions (future improvement).

## 2. Data Protection
- **Transport Security**: Terminate TLS at proxy/CDN. All cookies secure-only in production. For local testing, allow HTTP.
- **PII**: User email/phone stored encrypted? Currently plaintext; ensure Mongo encryption-at-rest (Atlas) and restrict admin access.
- **Media Uploads**: Sharp re-encodes JPEG files. Enforce MIME checks (already verifying `image/*`). For S3, use dedicated bucket, disable public list, apply lifecycle to temp `pending/` folder.
- **Environment Secrets**: Use `.env` ignored by git. On Render, mark as “Secret” (sync: false). Avoid logging sensitive data.

## 3. CORS & CSRF
- CORS allowlist uses `FRONTEND_URL`, dev origins, `CORS_SAME_SERVICE` flag. When frontend served on different origin, list exact domains. Treat `CORS_SAME_SERVICE=true` only when front/back same host (e.g., Render single service).
- CSRF mitigated via JWT Authorization header + refresh cookies (HTTP-only). For extra hardening, consider `state` tokens for critical endpoints or migrate refresh to `POST /auth/refresh` requiring header token.

## 4. Input Validation & Rate Limiting
- **express-validator** ensures typed fields, sanitized input. Maintain validators when adding routes.
- **Rate Limiting**:
  - `rateLimiter` for `/shops/infer-image` and `/shops/places`.
  - `mappleRateLimiter` for geocoding/autocomplete. Configure `MAPPLE_RL_*` env for per-IP/global quotas.
  - TODO: add general auth/login limiter (Redis-backed) to protect credentials.
- **Validation Feedback**: Central `validateRequest` returns structured errors. Avoid leaking internal details.

## 5. Database Hardening
- Use dedicated Mongo user with least privilege. Connection string: `mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority`.
- Whitelist IP addresses or use VPC Peering. Avoid `0.0.0.0/0` in production.
- Monitor indexes and data growth; TTL indexes (refresh tokens) enforce cleanup.

## 6. Secrets & Key Management
- **JWT Secrets**: rotate via `npm run rotate-secrets` (todo). Document rotation plan (invalidate refresh tokens, notify users).
- **Mapbox/Mapple/Gemini/Google**: store as env. Restrict API keys to server-side where possible; Mapbox token on frontend should be public but scoped.
- **AWS S3**: Use IAM user with limited permissions (`s3:PutObject`, `s3:DeleteObject`, `s3:GetObject` on bucket). Prefer KMS encryption and CloudFront CDN for serving images.
- **Google Vision**: service account JSON path from env; mount via secret manager instead of bundling file.

## 7. Logging & Monitoring
- Winston logs include request method/path. Avoid logging PII (emails sanitized?). Review `authController` to ensure sanitized logs.
- Implement log redaction for tokens and sensitive fields.
- Enable monitoring/alerting: 4xx/5xx spikes, login failures, rate limit triggers.

## 8. Dependency Management
- Backend dependencies pinned via npm lockfile. Run `npm audit` regularly; patch vulnerabilities (bcrypt, jsonwebtoken, etc.).
- Remove unused deps (e.g., `bullmq`) to reduce attack surface unless planning near-term use.
- Keep Node runtime updated (Render: set stack to Node 20 when tested).

## 9. Secure Defaults & Headers
- Add Helmet middleware (TODO) for standard security headers (HSTS, frameguard, CSP).
- Serve frontend via HTTPS, enable `Content-Security-Policy` once asset CDN fixed.
- Ensure `Strict-Transport-Security` header when behind TLS.

## 10. Operational Policies
- **Access Control**: Enforce MFA on Render/AWS/Mongo dashboards.
- **Backups**: Automate Mongo backups. Test restoration.
- **Incident Response**: Define plan for credential leak (rotate JWT secrets, revoke refresh tokens, force password reset).
- **Data Retention**: Document review retention policy, implement deletion pipeline if required by law.

## 11. Pre-Launch Security Checklist
| Item | Status |
| --- | --- |
| HTTPS enforced with valid certificate | ☐ |
| JWT secrets stored in secure vault / Render secrets | ☐ |
| Mongo IP whitelist or private peering configured | ☐ |
| Admin accounts reviewed (vendors cannot escalate) | ☐ |
| CORS origins restricted to production domains | ☐ |
| Rate limiting applied to auth endpoints | ☐ |
| Security headers (Helmet) enabled | ☐ |
| Pen-test or automated security scan performed | ☐ |
| Upload size limits confirmed (10 MB / 5 MB) | ☑ |
| Logs monitored for auth anomalies | ☐ |

Use this checklist before enabling public access. Update as new features (e.g., payments) are added.


