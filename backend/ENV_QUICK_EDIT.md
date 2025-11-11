# Quick Guide: How to Edit .env File

## 📍 Where is the .env file?

**Location:** `backend\.env`

**Path:** `C:\Users\ARYAMAN BHARDWAJ\AasPaas\backend\.env`

---

## 🖊️ How to Open and Edit

### Method 1: Notepad (Easiest)
1. Open File Explorer
2. Navigate to: `C:\Users\ARYAMAN BHARDWAJ\AasPaas\backend`
3. Right-click on `.env` file
4. Click "Open with" → "Notepad"
5. Edit the values
6. Press `Ctrl+S` to save

### Method 2: VS Code
1. Open VS Code
2. Press `Ctrl+O` (or File → Open Folder)
3. Select `backend` folder
4. Click `.env` file in left sidebar
5. Edit and save (`Ctrl+S`)

### Method 3: PowerShell
```powershell
cd backend
notepad .env
```

---

## 📝 What Your .env File Looks Like

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB - REQUIRED! Change this!
MONGO_URI=mongodb://localhost:27017/aas-paas

# JWT Secrets - REQUIRED! Change these!
JWT_SECRET=dev-secret-key-change-this-to-random-32-chars-minimum-length-required
JWT_REFRESH_SECRET=dev-refresh-secret-change-this-to-random-32-chars-minimum-length

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# OCR
TESSERACT_ENABLED=true
GOOGLE_VISION_ENABLED=false
```

---

## ✏️ What You MUST Edit (Minimum)

### 1. MongoDB Connection (`MONGO_URI`)

**If MongoDB is installed on your computer:**
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
```
✅ This is probably already correct! Don't change if MongoDB is running locally.

**If using MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aas-paas?retryWrites=true&w=majority
```
Replace:
- `username` → Your MongoDB Atlas username
- `password` → Your MongoDB Atlas password
- `cluster0.xxxxx` → Your cluster address

**Example:**
```env
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/aas-paas?retryWrites=true&w=majority
```

---

### 2. JWT Secrets (REQUIRED - Change These!)

**Current (WEAK - Change these!):**
```env
JWT_SECRET=dev-secret-key-change-this-to-random-32-chars-minimum-length-required
JWT_REFRESH_SECRET=dev-refresh-secret-change-this-to-random-32-chars-minimum-length
```

**Generate Random Secrets:**

**Option A: Use Online Generator**
1. Go to: https://www.random.org/strings/
2. Generate 2 strings, 32+ characters each
3. Copy and paste

**Option B: Use PowerShell**
```powershell
# Generate JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# Generate JWT_REFRESH_SECRET (run again for different value)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

**After generating, your .env should look like:**
```env
JWT_SECRET=aB3dEf9GhIjKlMnOpQrStUvWxYz1234567890
JWT_REFRESH_SECRET=ZxYwVuTsRqPoNmLkJiHgFeDcBa9876543210
```

---

## 🎯 Step-by-Step Editing Example

### Example: Editing for Local Development

1. **Open `.env` file** (using Notepad or VS Code)

2. **Find this line:**
   ```env
   MONGO_URI=mongodb://localhost:27017/aas-paas
   ```
   ✅ If MongoDB is running locally, this is fine. Leave it.

3. **Find these lines:**
   ```env
   JWT_SECRET=dev-secret-key-change-this-to-random-32-chars-minimum-length-required
   JWT_REFRESH_SECRET=dev-refresh-secret-change-this-to-random-32-chars-minimum-length
   ```
   ✏️ Replace with random strings (see generation methods above)

4. **Save the file** (`Ctrl+S`)

5. **Done!** Now you can run the server.

---

## 📋 Copy-Paste Ready Minimal Config

Copy this entire block and replace your `.env` file content:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHARS_MINIMUM_ABCDEFGHIJKLMNOP
JWT_REFRESH_SECRET=CHANGE_THIS_TO_DIFFERENT_RANDOM_32_CHARS_QRSTUVWXYZ
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
TESSERACT_ENABLED=true
GOOGLE_VISION_ENABLED=false
# Mappls Geocoding (primary) - obtain from MapmyIndia developer portal
MAPPLE_API_KEY=YOUR_MAPPLS_KEY
MAPPLE_GEOCODE_URL=https://atlas.mappls.com/api/places/geocode
# Rate limiting (optional overrides)
MAPPLE_RL_WINDOW_MS=60000
MAPPLE_RL_MAX=120
MAPPLE_RL_GLOBAL_MAX=600
# Fallback geocoder (set MAPBOX_TOKEN or GOOGLE_MAPS_API_KEY if needed)
GEOCODER_PROVIDER=mapbox
MAPBOX_TOKEN=YOUR_MAPBOX_PUBLIC_TOKEN
# Frontend map (placed instead in frontend/.env as VITE_MAPBOX_TOKEN)
# VITE_MAPBOX_TOKEN=YOUR_MAPBOX_PUBLIC_TOKEN
```

**Remember:** Replace `CHANGE_THIS_TO_RANDOM_32_CHARS_MINIMUM_ABCDEFGHIJKLMNOP` with actual random strings!

---

## 🔍 Common Editing Mistakes

### ❌ Wrong:
```env
JWT_SECRET = my-secret          # ❌ Spaces around =
JWT_SECRET=my-secret            # ❌ Too short (less than 32 chars)
MONGO_URI="mongodb://..."       # ❌ Quotes not needed (but won't break)
```

### ✅ Correct:
```env
JWT_SECRET=my-super-secret-key-that-is-at-least-32-characters-long  # ✅ Good
MONGO_URI=mongodb://localhost:27017/aas-paas                       # ✅ Good
```

---

## ✅ After Editing

1. **Save** the file (`Ctrl+S`)
2. **Restart** your server:
   ```bash
   # Stop server (press Ctrl+C)
   # Start again
   npm run dev
   ```

---

## 🆘 Troubleshooting

**"MongoDB connection error"**
→ Check `MONGO_URI` is correct
→ Make sure MongoDB is running

**"JWT secret too short"**
→ Generate new random 32+ character strings

**"Port already in use"**
→ Change `PORT=5000` to `PORT=5001`

**"File not saving"**
→ Make sure you have write permissions
→ Try running Notepad as Administrator

---

## 📚 Need More Details?

See `ENV_GUIDE.md` for complete explanation of all variables.

