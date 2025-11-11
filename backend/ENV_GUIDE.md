# Complete Guide to .env File Configuration

## What is .env file?

The `.env` file stores environment variables (configuration settings) for your application. It's like a settings file that controls how your backend behaves.

**Location:** `backend/.env`

**Important:** Never commit this file to Git! It contains sensitive information like passwords and API keys.

---

## How to Edit .env File

### Method 1: Using Notepad (Windows)
1. Navigate to `backend` folder
2. Right-click on `.env` file
3. Select "Open with" → "Notepad"
4. Edit the values
5. Save (Ctrl+S)

### Method 2: Using VS Code
1. Open VS Code
2. File → Open Folder → Select `backend` folder
3. Click on `.env` file in sidebar
4. Edit and save

### Method 3: Using PowerShell
```powershell
cd backend
notepad .env
```

---

## Environment Variables Explained

### 🔴 REQUIRED Variables (Must Have)

#### 1. `MONGO_URI` - MongoDB Database Connection
**What it does:** Tells your app where to find the database

**Local MongoDB:**
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
```
- `localhost:27017` = MongoDB running on your computer
- `aas-paas` = Database name

**MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aas-paas?retryWrites=true&w=majority
```
- Replace `username` and `password` with your Atlas credentials
- Replace `cluster0.xxxxx` with your cluster address

**How to get MongoDB Atlas connection string:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account (free)
3. Create cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your actual password

---

#### 2. `JWT_SECRET` - Secret Key for Authentication Tokens
**What it does:** Used to sign JWT tokens for user authentication

**Example:**
```env
JWT_SECRET=my-super-secret-key-that-is-at-least-32-characters-long
```

**How to generate:**
- Use a random string generator
- Or use this PowerShell command:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Requirements:**
- Minimum 32 characters
- Should be random and secret
- Different from JWT_REFRESH_SECRET

---

#### 3. `JWT_REFRESH_SECRET` - Secret Key for Refresh Tokens
**What it does:** Used to sign refresh tokens (longer-lived tokens)

**Example:**
```env
JWT_REFRESH_SECRET=my-different-refresh-secret-key-also-32-chars-minimum
```

**Requirements:**
- Minimum 32 characters
- Must be different from JWT_SECRET
- Should be random and secret

---

### 🟡 IMPORTANT Variables (Recommended)

#### 4. `PORT` - Server Port Number
**What it does:** Which port the backend server runs on

**Default:**
```env
PORT=5000
```

**Change if:**
- Port 5000 is already in use
- Example: `PORT=5001` or `PORT=3001`

---

#### 5. `NODE_ENV` - Environment Mode
**What it does:** Sets the environment (development/production)

**Development:**
```env
NODE_ENV=development
```
- Shows detailed error messages
- Uses development settings

**Production:**
```env
NODE_ENV=production
```
- Hides sensitive error details
- Optimized for performance

---

#### 6. `FRONTEND_URL` - Frontend Application URL
**What it does:** Allows frontend to communicate with backend (CORS)

**Local Development:**
```env
FRONTEND_URL=http://localhost:3000
```

**Production:**
```env
FRONTEND_URL=https://your-frontend-domain.com
```

---

### 🟢 OPTIONAL Variables (Nice to Have)

#### 7. `JWT_EXPIRES_IN` - Access Token Expiry Time
**What it does:** How long access tokens last

**Default:**
```env
JWT_EXPIRES_IN=15m
```
- `15m` = 15 minutes
- Other options: `1h`, `24h`, `7d`

---

#### 8. `JWT_REFRESH_EXPIRES_IN` - Refresh Token Expiry Time
**What it does:** How long refresh tokens last

**Default:**
```env
JWT_REFRESH_EXPIRES_IN=7d
```
- `7d` = 7 days
- Usually longer than access token

---

#### 9. `LOG_LEVEL` - Logging Detail Level
**What it does:** How much information to log

**Options:**
```env
LOG_LEVEL=info    # Normal logging (recommended)
LOG_LEVEL=debug   # Very detailed (for troubleshooting)
LOG_LEVEL=error   # Only errors
LOG_LEVEL=warn    # Warnings and errors
```

---

### 🟦 IMAGE UPLOAD Variables (For S3/AWS)

#### 10. `S3_BUCKET` - AWS S3 Bucket Name
**What it does:** Where images are stored

**Example:**
```env
S3_BUCKET=my-aas-paas-images
```

---

### 🤖 AI AUTOFILL (Google Gemini)

To enable the "Autofill from Photo" feature, add the following:

```env
# Google Generative Language API
GEMINI_API_KEY=your_google_generative_language_api_key
# Optional: override model
GEMINI_MODEL=gemini-2.0-flash
```

Notes:
- This feature analyzes a single shop photo to suggest business type, tags, a short description, and a category.
- The API is billed by Google; protect the endpoint (vendor-only) and consider rate limiting.
- We call `v1beta/models/${GEMINI_MODEL}:generateContent`.

**How to set up:**
1. Create AWS account
2. Go to S3 service
3. Create bucket
4. Copy bucket name

---

#### 11. `S3_REGION` - AWS Region
**What it does:** Which AWS region your bucket is in

**Example:**
```env
S3_REGION=us-east-1
```

**Common regions:**
- `us-east-1` (N. Virginia)
- `us-west-2` (Oregon)
- `ap-south-1` (Mumbai, India)

---

#### 12. `AWS_ACCESS_KEY_ID` - AWS Access Key
**What it does:** Your AWS account access key

**Example:**
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

**How to get:**
1. AWS Console → IAM
2. Users → Your user → Security credentials
3. Create access key
4. Copy Access Key ID

---

#### 13. `AWS_SECRET_ACCESS_KEY` - AWS Secret Key
**What it does:** Secret key for AWS authentication

**Example:**
```env
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**⚠️ Keep this secret!** Never share or commit to Git.

---

### 🟪 GEOCODING & AUTOCOMPLETE Variables (Maps / Location)

We now use a Mappls (MapmyIndia) first strategy for geocoding & (implicit) suggestions, with graceful fallback to Mapbox/Google (configured) or Nominatim (free) when Mappls is unavailable. Previous Photon usage has been removed.

#### 14. `MAPPLE_API_KEY` – Mappls / MapmyIndia API Key
**What it does:** Authenticates requests to Mappls geocoding endpoint.

```env
MAPPLE_API_KEY=your_mappls_api_key_here
```
Obtain from: https://www.mapmyindia.com/api/

#### 15. `MAPPLE_GEOCODE_URL` (or `MAPPLE_BASE_URL`) – Geocode Endpoint URL
**What it does:** Explicit URL for Mappls geocoding. Prefer the geocode endpoint for deterministic responses.

```env
MAPPLE_GEOCODE_URL=https://atlas.mappls.com/api/places/geocode
```
If you set only `MAPPLE_BASE_URL`, it should point at a compatible endpoint that accepts an `address` or `q` query parameter.

#### 16. `MAPBOX_TOKEN` (Optional Fallback)
Used only if Mappls fails or is not configured and `GEOCODER_PROVIDER=mapbox`.

```env
MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazEyMzQ1Njc4In0.abc123def456
```

#### 17. `GOOGLE_MAPS_API_KEY` (Optional Fallback)
Used only if Mappls fails or is not configured and `GEOCODER_PROVIDER=google`.

```env
GOOGLE_MAPS_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

#### 17.1 `GOOGLE_PLACES_API_KEY` (Optional) – Place Autocomplete & Details
If present, enhances suggestion endpoint. Otherwise we attempt lightweight Mappls geocode-as-suggestion, then fallback to free Nominatim.

```env
GOOGLE_PLACES_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

#### 18. `GEOCODER_PROVIDER`
Chooses which fallback provider to initialize when Mappls is absent/disabled.

```env
GEOCODER_PROVIDER=mapbox   # default
# or
GEOCODER_PROVIDER=google
```

#### 19. Rate Limiter (Mappls Protection)
Applied to endpoints that call external geocoding / autocomplete to prevent quota exhaustion.

```env
MAPPLE_RL_WINDOW_MS=60000        # window size in ms (default 60000)
MAPPLE_RL_MAX=120                # per-IP requests per window (default 120)
MAPPLE_RL_GLOBAL_MAX=600         # global aggregate requests per window (default 600)
```

#### 20. Free Fallback (Nominatim)
No env vars required. Used automatically when neither Mappls nor paid providers succeed. Keep overall request volume low; consider adding Redis caching beyond current in-memory TTL if scaling.

#### 21. Frontend Map Rendering Token
Map shown via Mapbox GL. Place this in `frontend/.env` (Vite format):

```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazEyMzQ1Njc4In0.abc123def456
```

If omitted, the frontend will simply hide map features gracefully.

---

### �🟧 OCR Variables (Image Text Recognition)

#### 17. `TESSERACT_ENABLED` - Enable Tesseract OCR
**What it does:** Uses free OCR library (works offline)

**Default:**
```env
TESSERACT_ENABLED=true
```

**Options:**
- `true` = Use Tesseract (free, included)
- `false` = Disable Tesseract

---

#### 18. `GOOGLE_VISION_ENABLED` - Enable Google Vision OCR
**What it does:** Uses Google Cloud Vision (more accurate, costs money)

**Default:**
```env
GOOGLE_VISION_ENABLED=false
```

**Set to `true` if:**
- You have Google Cloud account
- You want better OCR accuracy
- You don't mind paying for API calls

---

#### 19. `GOOGLE_VISION_KEY_PATH` - Path to Google Vision Key File
**What it does:** Location of Google Cloud service account JSON

**Example:**
```env
GOOGLE_VISION_KEY_PATH=./config/google-vision-key.json
```

**Only needed if:** `GOOGLE_VISION_ENABLED=true`

---

### 🟨 REDIS Variables (Optional - For Job Queues)

#### 20. `REDIS_URL` - Redis Connection String
**What it does:** Connects to Redis for background jobs

**Local Redis:**
```env
REDIS_URL=redis://localhost:6379
```

**Cloud Redis (Upstash):**
```env
REDIS_URL=redis://default:password@your-redis.upstash.io:6379
```

**Note:** Optional - app works without Redis

---

### 🟩 EMAIL Variables (For Password Reset)

#### 21. `SMTP_ENABLED` - Enable Email Sending
**What it does:** Turn on email functionality

**Default:**
```env
SMTP_ENABLED=false
```

---

#### 22. `SMTP_HOST` - Email Server
**What it does:** Your email provider's SMTP server

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
```

**Outlook:**
```env
SMTP_HOST=smtp-mail.outlook.com
```

---

#### 23. `SMTP_PORT` - Email Server Port
**What it does:** Port for email server

**Common:**
```env
SMTP_PORT=587    # TLS (recommended)
SMTP_PORT=465    # SSL
SMTP_PORT=25     # Non-encrypted (not recommended)
```

---

#### 24. `SMTP_USER` - Email Address
**What it does:** Your email account

**Example:**
```env
SMTP_USER=your-email@gmail.com
```

---

#### 25. `SMTP_PASS` - Email Password/App Password
**What it does:** Password for email account

**For Gmail:** Use App Password (not regular password)
1. Google Account → Security
2. 2-Step Verification → App passwords
3. Generate app password
4. Use that password here

**Example:**
```env
SMTP_PASS=abcd efgh ijkl mnop
```

---

## Example .env File Configurations

### 🟢 Minimal Setup (Just to Run)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=change-this-to-random-32-characters-minimum-required
JWT_REFRESH_SECRET=change-this-to-different-random-32-chars-minimum
FRONTEND_URL=http://localhost:3000
```

### 🟡 Basic Setup (With Maps)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aas-paas
JWT_SECRET=change-this-to-random-32-characters-minimum-required
JWT_REFRESH_SECRET=change-this-to-different-random-32-chars-minimum
FRONTEND_URL=http://localhost:3000
MAPBOX_TOKEN=pk.your-mapbox-token-here
TESSERACT_ENABLED=true
```

### 🔵 Full Setup (Production Ready)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aas-paas
JWT_SECRET=super-secure-random-32-char-minimum-production-key
JWT_REFRESH_SECRET=different-super-secure-random-32-char-minimum-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
MAPBOX_TOKEN=pk.your-token
GEOCODER_PROVIDER=mapbox
TESSERACT_ENABLED=true
GOOGLE_VISION_ENABLED=false
LOG_LEVEL=info
```

---

## Editing Tips

### ✅ DO:
- Keep secrets secret
- Use strong random strings for JWT secrets
- Test changes by restarting server
- Comment unused variables with `#`

### ❌ DON'T:
- Commit .env to Git
- Share .env file publicly
- Use simple passwords
- Leave default values in production

---

## After Editing

1. **Save the file** (Ctrl+S)
2. **Restart the server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

---

## Common Questions

**Q: Do I need all variables?**
A: No! Start with the minimal setup. Add others as needed.

**Q: What if I leave a variable empty?**
A: The app will use default values or skip that feature.

**Q: Can I use spaces in values?**
A: Yes, but no spaces around the `=` sign. Use quotes if needed:
```env
JWT_SECRET="my secret with spaces"
```

**Q: How do I comment a line?**
A: Use `#` at the start:
```env
# This is a comment
# SMTP_ENABLED=false
```

---

## Need Help?

- Check `SETUP.md` for setup instructions
- Check `RUN.md` for running the server
- Check logs in `backend/logs/` for errors

