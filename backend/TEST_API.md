# Testing Your API

## ✅ Server is Running!

Your backend is now live at: **http://localhost:5000**

---

## Quick API Tests

### 1. Health Check
Open in browser or use curl:
```
http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T01:03:24.000Z"
}
```

### 2. Test Endpoints

#### Using Browser:
- Health: http://localhost:5000/health
- API Base: http://localhost:5000/api

#### Using PowerShell (curl):
```powershell
# Health check
curl http://localhost:5000/health

# Get shops (will be empty initially)
curl http://localhost:5000/api/shops
```

#### Using Postman/Thunder Client:
- Import the API collection (if available)
- Or test endpoints manually

---

## Seed Database (Create Sample Data)

To create test users and shops:

```bash
cd backend
npm run seed
```

This creates:
- **2 Vendors:**
  - vendor1@example.com / password123
  - vendor2@example.com / password123

- **3 Customers:**
  - customer1@example.com / password123
  - customer2@example.com / password123
  - customer3@example.com / password123

- **3 Sample Shops** (in New Delhi and Mumbai)

---

## Test Authentication

### Signup (Customer)
```powershell
curl -X POST http://localhost:5000/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'
```

### Login
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"customer1@example.com","password":"password123","role":"customer"}'
```

---

## Next Steps

1. **Seed database** (optional but recommended):
   ```bash
   npm run seed
   ```

2. **Test API endpoints** using Postman or curl

3. **Start frontend** (when ready):
   ```bash
   cd ../frontend
   npm start
   ```

---

## Common Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/shops` | Get shops list |
| GET | `/api/shops/:id` | Get shop details |
| POST | `/api/shops` | Create shop (vendor only) |

---

## API Documentation

See `analysis.md` in root directory for complete API specification.

---

**Your backend is ready! 🎉**

