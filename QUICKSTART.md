# Quick Start Guide

## Local Development Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas connection string)
- Git

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repo-url>
cd AasPaas

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Backend** (`backend/.env`):
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=dev-secret-key-min-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-chars
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
MAPBOX_TOKEN=pk.your-token
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=pk.your-token
```

### Step 3: Start MongoDB

```bash
# If MongoDB installed locally
mongod

# Or use MongoDB Atlas (cloud)
# Just update MONGO_URI in backend/.env
```

### Step 4: Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates:
- 2 vendors (vendor1@example.com, vendor2@example.com)
- 3 customers (customer1@example.com, etc.)
- 3 sample shops
- Password for all: `password123`

### Step 5: Start Servers

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

### Step 6: Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Docker Quick Start

```bash
# Start everything
docker-compose up

# Access:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - MongoDB: localhost:27017
# - Redis: localhost:6379
```

## Test Accounts

After seeding:

**Vendor:**
- Email: `vendor1@example.com`
- Password: `password123`

**Customer:**
- Email: `customer1@example.com`
- Password: `password123`

## Next Steps

1. **Explore Features:**
   - Vendor signup → Upload shop image → OCR extracts info → Create shop
   - Customer login → Search shops → View details → Add review

2. **API Testing:**
   - Use Postman/Thunder Client
   - Import API collection (if available)
   - Test endpoints

3. **Development:**
   - Check `analysis.md` for architecture
   - Review `README.md` for full documentation
   - See `DEPLOYMENT.md` for production setup

## Troubleshooting

**Port already in use:**
```bash
# Change ports in .env files
PORT=5001  # backend
REACT_APP_API_URL=http://localhost:5001/api
```

**MongoDB connection error:**
- Check MongoDB is running: `mongosh`
- Verify MONGO_URI in backend/.env
- Check MongoDB Atlas IP whitelist (if using cloud)

**Frontend can't connect to backend:**
- Verify REACT_APP_API_URL matches backend port
- Check CORS settings in backend
- Verify backend is running

**Image upload fails:**
- Configure S3 credentials in backend/.env
- Or use local file storage (modify storageService.js)

---

**Happy Coding! 🚀**

