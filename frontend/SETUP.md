# Frontend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_TOKEN=pk.your-mapbox-token
```

**Note:** `VITE_MAPBOX_TOKEN` is optional - app works without it (maps will be disabled)

### 3. Start Development Server
```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Input, Modal
│   │   ├── layout/       # Navbar, Footer, Layouts
│   │   ├── shop/         # ShopCard
│   │   └── auth/         # ProtectedRoute
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SearchResults.jsx
│   │   ├── ShopDetail.jsx
│   │   ├── auth/         # Login, Signup pages
│   │   ├── customer/     # Customer pages
│   │   └── vendor/       # Vendor pages
│   ├── store/            # Redux store & slices
│   ├── services/         # API client
│   ├── hooks/            # useAuth hook
│   └── utils/            # Utilities
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## ✅ What's Implemented

### Pages
- ✅ Home (Landing page with search)
- ✅ Search Results (with filters)
- ✅ Shop Detail
- ✅ Customer Login/Signup
- ✅ Vendor Login/Signup
- ✅ Forgot Password
- ✅ Customer Feed
- ✅ Customer Favorites (placeholder)
- ✅ Customer Profile
- ✅ Vendor Dashboard (placeholder)
- ✅ Vendor Shop (placeholder)
- ✅ Vendor Analytics (placeholder)
- ✅ Vendor Settings (placeholder)

### Components
- ✅ Navbar (role-aware, responsive)
- ✅ Footer
- ✅ Button (primary, secondary, ghost variants)
- ✅ Input (with validation)
- ✅ Modal (accessible, focus trap)
- ✅ ShopCard (with distance, rating)
- ✅ ProtectedRoute (role-based)

### Features
- ✅ React Router v6 with nested routes
- ✅ Redux Toolkit for state management
- ✅ React Hook Form + Zod validation
- ✅ TailwindCSS design system
- ✅ Responsive design (mobile-first)
- ✅ Toast notifications
- ✅ Protected routes
- ✅ API integration

---

## 🚧 Still To Implement

### High Priority
- [ ] MapPicker component (Mapbox integration)
- [ ] ImageUpload component
- [ ] OCRResultModal component
- [ ] RatingStars component
- [ ] Review components
- [ ] Vendor onboarding flow
- [ ] Image gallery/carousel
- [ ] Favorites functionality
- [ ] Analytics charts

### Medium Priority
- [ ] Form autosave
- [ ] Image cropping
- [ ] Map clustering
- [ ] Skeleton loaders
- [ ] Error boundaries
- [ ] Pagination component

---

## 🎨 Design System

### Colors
- **Primary**: `#0F766E` (Teal)
- **Accent**: `#06B6D4` (Cyan)
- **Success**: `#10B981` (Green)
- **Danger**: `#EF4444` (Red)

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: 2.25rem (h1) → 0.875rem (small)

### Components
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- **Inputs**: `.input-field`, `.input-label`, `.input-error`
- **Cards**: `.card` with shadow and rounded corners

---

## 🔧 Configuration

### Vite Config
- Port: 3000
- Proxy: `/api` → `http://localhost:5000`
- Alias: `@` → `./src`

### Tailwind Config
- Content: `./src/**/*.{js,jsx}`
- Custom colors defined
- Container max-width: 1200px

---

## 🧪 Testing

```bash
npm test
```

Tests use Vitest and React Testing Library.

---

## 📦 Build

```bash
npm run build
```

Output: `dist/` directory (ready for Vercel/Netlify)

---

## 🐛 Troubleshooting

**"Cannot find module"**
→ Run `npm install`

**"Port 3000 already in use"**
→ Change port in `vite.config.js`

**"API connection failed"**
→ Check backend is running on port 5000
→ Verify `VITE_API_URL` in `.env`

**"Mapbox errors"**
→ Optional - app works without Mapbox token
→ Add `VITE_MAPBOX_TOKEN` to `.env` for maps

---

## 📚 Next Steps

1. **Test the app:**
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Visit: http://localhost:3000

2. **Test authentication:**
   - Sign up as customer
   - Sign up as vendor
   - Login/logout

3. **Test shop features:**
   - Search for shops
   - View shop details
   - Add to favorites (coming soon)

4. **Implement remaining features:**
   - See "Still To Implement" section above

---

**Frontend is ready for development! 🎉**

