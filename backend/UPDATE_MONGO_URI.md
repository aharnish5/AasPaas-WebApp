# How to Update MONGO_URI in .env File

## Your Current Issue

Your `.env` file has:
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
```

This tries to connect to **local MongoDB** (which isn't running).

You need to change it to your **MongoDB Atlas** connection string.

---

## Step-by-Step Fix

### 1. Get Your MongoDB Atlas Connection String

From MongoDB Atlas, your connection string looks like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 2. Update It to Include Database Name

Add `/aas-paas` before the `?`:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aas-paas?retryWrites=true&w=majority
```

**Important:** Replace:
- `username` → Your Atlas database username
- `password` → Your Atlas database password (URL encode special characters)
- `cluster0.xxxxx` → Your actual cluster address

### 3. Edit Your .env File

**Option A: Using Notepad**
1. Navigate to: `C:\Users\ARYAMAN BHARDWAJ\AasPaas\backend`
2. Right-click `.env` → Open with Notepad
3. Find the line: `MONGO_URI=mongodb://localhost:27017/aas-paas`
4. Replace it with your Atlas connection string
5. Save (Ctrl+S)

**Option B: Using PowerShell**
```powershell
cd "C:\Users\ARYAMAN BHARDWAJ\AasPaas\backend"
notepad .env
```

### 4. Example of What It Should Look Like

**Before:**
```env
MONGO_URI=mongodb://localhost:27017/aas-paas
```

**After:**
```env
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/aas-paas?retryWrites=true&w=majority
```

---

## Important Notes

### Password Special Characters

If your password has special characters, you need to URL encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |

**Example:**
- Password: `my@pass#123`
- Use in URI: `my%40pass%23123`

### Or Change Your Password

Easier: In MongoDB Atlas, change your database user password to something without special characters.

---

## Verify Your Connection String Format

✅ **Correct:**
```
mongodb+srv://username:password@cluster.mongodb.net/aas-paas?retryWrites=true&w=majority
```

❌ **Wrong:**
```
mongodb://localhost:27017/aas-paas  (local MongoDB)
mongodb+srv://cluster.mongodb.net   (missing username/password)
mongodb+srv://user:pass@cluster.net/?...  (missing database name before ?)
```

---

## After Updating

1. **Save** the `.env` file
2. **Restart** your server:
   ```bash
   npm start
   ```

You should see:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

## Still Having Issues?

1. **Check your Atlas cluster is running** (status should be "Active")
2. **Verify Network Access:**
   - Go to Atlas → Network Access
   - Make sure your IP is whitelisted (or `0.0.0.0/0` for development)
3. **Check username/password** are correct
4. **Test connection** from Atlas:
   - Click "Connect" → "Connect your application"
   - Copy the connection string exactly as shown

