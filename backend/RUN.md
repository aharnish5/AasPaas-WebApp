# How to Run the Backend

## Quick Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create .env File

**Windows PowerShell:**
```powershell
copy .env.example .env
```

**Windows CMD:**
```cmd
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

**Or create manually:** Create a file named `.env` in the `backend` folder

### 3. Edit .env File

Open `backend/.env` in a text editor and set at minimum:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=dev-secret-key-change-this-to-random-32-chars-minimum
JWT_REFRESH_SECRET=dev-refresh-secret-change-this-to-random-32-chars
FRONTEND_URL=http://localhost:3000
```

### 4. Install Dependencies (if not done)
```bash
npm install
```

### 5. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas (Cloud):**
- Go to https://www.mongodb.com/cloud/atlas
- Create free cluster
- Get connection string
- Update `MONGO_URI` in `.env`

### 6. (Optional) Seed Database
```bash
npm run seed
```

### 7. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 8. Test

Open browser: http://localhost:5000/health

Should see: `{"status":"ok","timestamp":"..."}`

## File Locations

- **Environment file:** `backend/.env` (create from `.env.example`)
- **Server entry:** `backend/src/index.js`
- **Main app:** `backend/src/app.js`
- **Configuration:** `backend/src/config/`

## Common Issues

**"Cannot find module"**
→ Run `npm install`

**"MongoDB connection error"**
→ Start MongoDB or check MONGO_URI in .env

**"Port 5000 already in use"**
→ Change PORT in .env to 5001

**".env file not found"**
→ Create it manually or copy from .env.example

