# Backend Setup Guide

## Step 1: Create Environment File

Copy the example environment file:

```bash
cd backend
copy .env.example .env
```

Or on Linux/Mac:
```bash
cp .env.example .env
```

## Step 2: Edit .env File

Open `backend/.env` and configure the following **REQUIRED** variables:

### Minimum Required Configuration

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (REQUIRED)
MONGO_URI=mongodb://localhost:27017/aas-paas

# JWT Secrets (REQUIRED - Generate random strings)
JWT_SECRET=change-this-to-a-random-32-character-string
JWT_REFRESH_SECRET=change-this-to-another-random-32-character-string

# CORS
FRONTEND_URL=http://localhost:3000
```

### Optional (but recommended):

```env
# For image uploads (can use local storage for development)
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# For geocoding (can skip for basic testing)
MAPBOX_TOKEN=pk.your-token

# OCR (Tesseract works without Google Vision)
TESSERACT_ENABLED=true
GOOGLE_VISION_ENABLED=false
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start MongoDB

### Option A: Local MongoDB
```bash
# If MongoDB is installed locally
mongod
```

### Option B: MongoDB Atlas (Cloud - Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGO_URI` in `.env`

## Step 5: (Optional) Seed Database

Create sample data:
```bash
npm run seed
```

This creates:
- 2 vendors (vendor1@example.com / password123)
- 3 customers (customer1@example.com / password123)
- 3 sample shops

## Step 6: Start Backend Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Server will start on: **http://localhost:5000**

## Step 7: Test the API

Open browser or use Postman:
- Health check: http://localhost:5000/health
- API base: http://localhost:5000/api

## Quick Start (Minimal Config)

For quick testing, create `.env` with just:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=dev-secret-key-minimum-32-characters-long-here
JWT_REFRESH_SECRET=dev-refresh-secret-minimum-32-characters-long
FRONTEND_URL=http://localhost:3000
```

Then:
```bash
npm install
npm run dev
```

## Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running: `mongosh` (should connect)
- Check MONGO_URI in .env matches your MongoDB setup
- For Atlas: Check IP whitelist includes your IP (or 0.0.0.0/0 for development)

**Port Already in Use:**
- Change PORT in .env to another port (e.g., 5001)
- Update FRONTEND_URL accordingly

**Missing Dependencies:**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

## Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ Yes | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | Secret for JWT tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ Yes | Secret for refresh tokens (min 32 chars) |
| `PORT` | No | Server port (default: 5000) |
| `S3_BUCKET` | No* | AWS S3 bucket name (*required for image uploads) |
| `MAPBOX_TOKEN` | No* | Mapbox API token (*required for geocoding) |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |

## Next Steps

After backend is running:
1. Start frontend (see `frontend/` directory)
2. Test APIs with Postman or curl
3. Check `QUICKSTART.md` in root for full setup

