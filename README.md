# Aas Paas - Hyperlocal Vendor-Customer Platform

A production-ready MERN full-stack application connecting local vendors with customers in India. Features include vendor onboarding via OCR, location-aware shop discovery, dashboards, analytics, and reviews.

## 🚀 Features

- **Vendor Onboarding**: Upload shop image → OCR extracts name/address → Pre-filled editable form
- **Customer Discovery**: Location-based shop search with proximity sorting
- **Reviews & Ratings**: Customers can review shops with photos
- **Vendor Dashboard**: Analytics, shop management, view tracking
- **Geospatial Search**: MongoDB geospatial queries for nearby shops
- **Image OCR**: Tesseract.js + Google Vision API fallback
- **Authentication**: JWT-based auth with role-based access (Customer/Vendor/Admin)

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Redis (optional, for job queues)
- AWS S3 account (or DigitalOcean Spaces) for image storage
- Mapbox API token (or Google Maps API key) for geocoding

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd AasPaas
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
MAPBOX_TOKEN=your-mapbox-token
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
```

**Required Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
```

### 4. Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates sample users and shops for testing.

## 🏃 Running Locally

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up
```

This starts:
- MongoDB on port 27017
- Redis on port 6379
- Backend on port 5000
- Frontend on port 3000

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 3 - MongoDB:**
```bash
mongod
```

## 📁 Project Structure

```
AasPaas/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, logger configuration
│   │   ├── models/         # Mongoose models (User, Shop, Review)
│   │   ├── routes/         # Express routes
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # OCR, storage, geocoding services
│   │   ├── scripts/        # Seed data script
│   │   └── index.js        # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Shops

- `POST /api/shops/upload-image` - Upload shop image (vendor)
- `GET /api/shops/ocr-result?uploadId=...` - Get OCR results
- `POST /api/shops` - Create shop (vendor)
- `GET /api/shops?lat=&lon=&radius=` - Search shops
- `GET /api/shops/:shopId` - Get shop details
- `PATCH /api/shops/:shopId` - Update shop (owner)
- `DELETE /api/shops/:shopId` - Delete shop (owner/admin)

### Reviews

- `POST /api/shops/:shopId/reviews` - Create review (customer, supports up to 5 images via multipart form-data field `images`)
- `GET /api/shops/:shopId/reviews` - Get shop reviews (supports `page`, `limit`, `sort=newest|oldest|rating|helpful`, `filter=all|photos`)
- `PATCH /api/shops/:shopId/reviews/:reviewId` - Update own review (rating/text)
- `DELETE /api/shops/:shopId/reviews/:reviewId` - Delete own review (or admin)
- `POST /api/shops/:shopId/reviews/:reviewId/helpful` - Mark review as helpful (one per user)

### Favorites

- `POST /api/shops/:shopId/favorite` - Add shop to favorites (customer; idempotent)
- `DELETE /api/shops/:shopId/favorite` - Remove shop from favorites (idempotent)
- `GET /api/shops/:shopId/favorite` - Check if current user has favorited the shop
- `GET /api/favorites` - Get current user's favorite shops

### Uploads

- `POST /api/upload` - Upload review photos (customer) — body: multipart form-data field `images` (up to 5). Returns `{ urls: string[] }`.

### Analytics

- `POST /api/shops/:shopId/track-view` - Track shop view
- `GET /api/shops/:shopId/vendor/:vendorId/reviews` - Vendor: list reviews for owned shop
- `GET /api/shops/:shopId/vendor/:vendorId/reviews/analytics` - Vendor: reviews analytics (average, breakdown, time series)

See `analysis.md` for detailed API specifications.

## 🚢 Deployment

### Backend (Render/Heroku/DigitalOcean)

1. Set environment variables in hosting platform
2. Deploy backend repository
3. Ensure MongoDB Atlas connection string is set

### Frontend (Vercel/Netlify)

1. Set build command: `npm run build`
2. Set output directory: `build`
3. Set environment variables:
   - `REACT_APP_API_URL` - Your backend URL
   - `REACT_APP_MAPBOX_TOKEN` - Your Mapbox token

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens in HTTP-only cookies
- Input validation with express-validator
- Rate limiting on auth endpoints
- CORS configured
- Environment variables for secrets

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is a production-ready scaffold. Ensure you:
- Set strong JWT secrets in production
- Configure proper CORS origins
- Set up MongoDB Atlas for production
- Configure S3 bucket permissions
- Enable rate limiting
- Set up monitoring (Sentry, etc.)

