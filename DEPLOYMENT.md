# Deployment Guide

## Production Deployment Checklist

### Backend Deployment (Render/Heroku/DigitalOcean)

#### 1. Environment Variables

Set the following in your hosting platform:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/aas-paas?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-strong-secret-min-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
S3_BUCKET=your-production-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# OCR
GOOGLE_VISION_ENABLED=true
GOOGLE_VISION_KEY_PATH=./config/google-vision-key.json
TESSERACT_ENABLED=true

# Geocoding
MAPBOX_TOKEN=pk.your-token
GEOCODER_PROVIDER=mapbox

# Redis (optional)
REDIS_URL=redis://your-redis-url

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

#### 2. MongoDB Atlas Setup

1. Create MongoDB Atlas account
2. Create cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for Render/Heroku)
5. Get connection string

#### 3. AWS S3 Setup

1. Create S3 bucket
2. Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": []
  }
]
```
3. Set bucket policy for public read
4. Create IAM user with S3 access
5. Get access keys

#### 4. Deploy to Render

1. Connect GitHub repository
2. Select backend directory
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Set environment variables
6. Deploy

#### 5. Deploy to Heroku

```bash
cd backend
heroku create aas-paas-backend
heroku config:set MONGO_URI=...
heroku config:set JWT_SECRET=...
# ... set all env vars
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)

#### 1. Environment Variables

```env
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_MAPBOX_TOKEN=pk.your-token
```

#### 2. Deploy to Vercel

1. Connect GitHub repository
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `build`
5. Set environment variables
6. Deploy

#### 3. Deploy to Netlify

1. Connect GitHub repository
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `build`
5. Set environment variables
6. Deploy

### Docker Production Deployment

#### 1. Build Images

```bash
docker build -t aas-paas-backend ./backend
docker build -t aas-paas-frontend ./frontend
```

#### 2. Run with Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### SSL/HTTPS

- Use hosting platform's SSL (Vercel/Netlify provide free SSL)
- Backend: Use reverse proxy (nginx) or platform SSL
- Ensure CORS allows HTTPS origins

### Monitoring

1. **Sentry** (Error Tracking)
   - Set up Sentry account
   - Add `@sentry/node` to backend
   - Add `@sentry/react` to frontend
   - Configure DSN

2. **Logging**
   - Winston logs to files
   - Consider cloud logging (Datadog, Loggly)

3. **Performance**
   - Monitor MongoDB queries
   - Use Redis caching for hot data
   - CDN for images (CloudFront)

### Security Checklist

- [ ] Strong JWT secrets (32+ chars, random)
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (N/A - MongoDB)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection (use SameSite cookies)
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] S3 bucket policy reviewed
- [ ] API keys rotated regularly

### Scaling Considerations

1. **Backend**
   - Use load balancer
   - Horizontal scaling (multiple instances)
   - Redis for session storage
   - MongoDB Atlas auto-scaling

2. **Frontend**
   - CDN (Vercel/Netlify handle this)
   - Image optimization
   - Code splitting

3. **Database**
   - Index optimization
   - Read replicas for analytics
   - Connection pooling

### Backup Strategy

1. **MongoDB**
   - Atlas automated backups
   - Manual backup script

2. **S3**
   - Versioning enabled
   - Cross-region replication

3. **Code**
   - GitHub (version control)
   - Tag releases

### Post-Deployment

1. Test all endpoints
2. Verify CORS works
3. Test image uploads
4. Verify OCR functionality
5. Test geospatial queries
6. Monitor error logs
7. Set up alerts

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL in backend env
   - Verify CORS middleware config

2. **MongoDB Connection**
   - Check IP whitelist
   - Verify connection string
   - Check network access

3. **Image Upload Fails**
   - Verify S3 credentials
   - Check bucket permissions
   - Verify CORS on S3 bucket

4. **OCR Not Working**
   - Check Google Vision API key
   - Verify Tesseract fallback
   - Check image format/size

5. **Geocoding Fails**
   - Verify Mapbox token
   - Check API quota
   - Verify address format

---

**Note**: Always test in staging environment before production deployment.

