# MongoDB Setup Guide

## Issue: MongoDB Connection Refused

You're getting this error:
```
connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

This means MongoDB is **not running** on your computer.

---

## Solution Options

### Option 1: Install MongoDB Locally (Recommended for Development)

#### Windows:

1. **Download MongoDB:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI installer
   - Download and install

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Install as Windows Service (recommended)

3. **Verify Installation:**
   ```powershell
   mongod --version
   ```

4. **Start MongoDB:**
   - MongoDB should start automatically as a Windows service
   - Or start manually:
     ```powershell
     net start MongoDB
     ```

5. **Test Connection:**
   ```powershell
   mongosh
   ```
   If it connects, MongoDB is running!

---

### Option 2: Use MongoDB Atlas (Cloud - FREE) - Easiest!

1. **Create Account:**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Click "Try Free"
   - Sign up (use Google/GitHub)

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Create Database User:**
   - Username: `aaspaas` (or any username)
   - Password: Generate secure password (save it!)
   - Click "Create Database User"

4. **Network Access:**
   - Click "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your IP: `0.0.0.0/0`

5. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

6. **Update .env File:**
   ```env
   MONGO_URI=mongodb+srv://aaspaas:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/aas-paas?retryWrites=true&w=majority
   ```
   Replace:
   - `aaspaas` → Your database username
   - `YOUR_PASSWORD` → Your database password
   - `cluster0.xxxxx` → Your cluster address
   - `aas-paas` → Database name (add before `?`)

---

## Quick Setup Checklist

### If Using Local MongoDB:
- [ ] MongoDB installed
- [ ] MongoDB service running
- [ ] `.env` has: `MONGO_URI=mongodb://localhost:27017/aas-paas`
- [ ] Test with: `mongosh`

### If Using MongoDB Atlas:
- [ ] Account created
- [ ] Cluster created (FREE tier)
- [ ] Database user created
- [ ] IP whitelisted (0.0.0.0/0 for dev)
- [ ] Connection string copied
- [ ] `.env` updated with connection string

---

## Test MongoDB Connection

### Test Local MongoDB:
```powershell
mongosh
# Should connect and show: "Current Mongosh Log ID: ..."
```

### Test Atlas Connection:
```powershell
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aas-paas"
```

---

## After MongoDB is Running

1. **Restart your backend:**
   ```bash
   cd backend
   npm start
   ```

2. **You should see:**
   ```
   MongoDB Connected: localhost:27017
   ```
   or
   ```
   MongoDB Connected: cluster0.xxxxx.mongodb.net
   ```

---

## Troubleshooting

**"MongoDB service not found"**
→ Install MongoDB or use MongoDB Atlas

**"Access denied"**
→ Check username/password in connection string

**"IP not whitelisted"**
→ Add your IP in MongoDB Atlas Network Access

**"Connection timeout"**
→ Check internet connection (for Atlas)
→ Check MongoDB is running (for local)

---

## Recommended: Use MongoDB Atlas

**Why?**
- ✅ No installation needed
- ✅ Free tier available
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Easy to share with team

**Free Tier Includes:**
- 512 MB storage
- Shared RAM
- Perfect for development

---

Once MongoDB is running, restart your backend server and the connection error will be gone!

