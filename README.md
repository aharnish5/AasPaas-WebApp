Here is a **polished, professional, beautifully formatted README.md**, upgraded with emojis, tables, improved structure, clearer explanations, visual organization, and expandable sections.
It is ready to paste directly into your repo.

---

# ✨ **AasPaas – Mapping The Heartbeat of India**

A modern platform that connects **nearby customers** with **local micro-vendors** — cobblers, tea stalls, momo shops, key-makers, tailors, and more.
AasPaas makes local businesses **discoverable, reviewable, and reachable** with a seamless, map-based experience.

🌐 **Live Demo:**
👉 [https://aaspaas-ij41.onrender.com](https://aaspaas-ij41.onrender.com)

---

## 🎬 **Screenshots**

### 🖼️ Screenshots


| Page                        | Preview                                                      |
| --------------------------- | ------------------------------------------------------------ |
| 🏠 **Home / Search**        | ![Home](docs/screenshots/home.png)                         |
| 🏪 **Shop Detail with Map** | ![Shop Detail](screenshots/shop-detail.png)           |
| 🧑‍🔧 **Vendor Dashboard**  | ![Vendor Dashboard](screenshots/vendor-dashboard.png) |
| ⭐ **Reviews & Favorites**   | ![Favorites](screenshots/favorites.png)               |
| 🌙 **Dark Mode**            | ![Dark](screenshots/dark-mode.png)                    |

---

# ✨ **Features**

### 🔎 **Smart Discovery**

* Category-based browsing (food, repair, services, etc.)
* Location-aware search (Map/List toggle)
* Auto-complete search bar

### 🧾 **Vendor Onboarding**

* OCR-powered shop detail extraction
* Upload shop photos → auto-suggest name/category
* Vendor console to edit shop details, visibility, timings

### ⭐ **Engagement**

* Customer reviews with photos
* Favorite shops
* “Helpful” upvotes
* Average rating system

### 🧭 **Geospatial Power**

* Nearby shop search
* Integrated Google Maps directions
* Distance + ETA preview

### 🔐 **Authentication**

* JWT-based auth (Access + Refresh tokens)
* Vendor, Customer, Admin roles
* Secure cookie/LS token flow

### 🤖 **AI Helpers (Optional)**

* OCR (Tesseract.js)
* Shop category classification
* Text extraction
* Gemini-based enhancements

---

# 🧱 **Tech Stack**

### 🖥️ **Frontend**

| Tech              | Purpose                       |
| ----------------- | ----------------------------- |
| ⚛️ React + Vite   | Fast UI development           |
| 🎨 TailwindCSS    | Utility-first styling         |
| 🔄 Redux Toolkit  | Global state management       |
| 🚦 React Router   | Routing                       |
| 📡 TanStack Query | Server state fetching/caching |
| 🗺️ Mapbox/Mappls | Maps + geolocation            |

---

### 🛠️ **Backend**

| Tech                  | Purpose                                |
| --------------------- | -------------------------------------- |
| 🟩 Node.js + Express  | REST API                               |
| 🍃 MongoDB + Mongoose | Database                               |
| 🧰 Redis              | Caching, queues                        |
| 📮 BullMQ             | Background jobs (OCR, auto-processing) |
| 🔑 JWT                | Auth                                   |
| ✂️ Sharp              | Image resize/optimize                  |
| 👓 Tesseract.js       | OCR engine                             |
| 🤖 Gemini API         | Optional AI help                       |

---

### ⚓ **DevOps**

| Tool                | Purpose         |
| ------------------- | --------------- |
| 🐳 Docker & Compose | Containers      |
| 🚀 Render           | Deployment      |
| 🔧 render.yaml      | Infra-as-config |

---

# 📦 **Monorepo Structure**

```
.
├── backend/                   # Express API, DB, OCR, queues
│   ├── src/
│   │   ├── models/            # Mongoose schemas
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, CORS, logging
│   │   ├── utils/             # Helpers
│   │   ├── services/          # OCR, AI, file operations
│   │   └── app.js             # Express setup
│   ├── Dockerfile
│   ├── .env.example
│   └── seed.js
│
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Pages (home, vendor, shops)
│   │   ├── store/             # Redux store
│   │   ├── hooks/             # Custom hooks
│   │   ├── api/               # API calls
│   │   └── styles/            # Tailwind + theme
│   ├── public/
│   ├── Dockerfile
│   └── index.html
│
├── docker-compose.yml
└── README.md
```

---

# 🚀 **Quick Start**

## Option A — ⭐ Docker Compose (recommended)

```bash
docker compose up --build
```

### Services exposed:

| Service         | URL                                            |
| --------------- | ---------------------------------------------- |
| 🗄️ MongoDB     | localhost:27017                                |
| 🚦 Redis        | localhost:6379                                 |
| 🛠️ Backend API | [http://localhost:5000](http://localhost:5000) |
| 🖥️ Frontend    | [http://localhost:3000](http://localhost:3000) |

---

## Option B — Manual Setup

### 1️⃣ Backend

```powershell
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/aas-paas
PORT=5000
JWT_SECRET=change-this-32+chars
JWT_REFRESH_SECRET=change-this-32+chars
FRONTEND_URL=http://localhost:3000

# Optional
REDIS_URL=redis://localhost:6379
GOOGLE_VISION_ENABLED=false
MAPPLE_API_KEY=your-mappls-key
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
```

Run backend:

```bash
npm run dev
```

---

### 2️⃣ Frontend

```powershell
cd frontend
npm install
```

Create `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_MAPPLS_MAP_SDK_KEY=your-mappls-key
# VITE_MAPBOX_TOKEN=your-token
```

Run frontend:

```bash
npm run dev
```

---

### 3️⃣ Optional — Seed database

```bash
cd backend
npm run seed
```

---

# 🧪 **Testing**

| Area                  | Command                   |
| --------------------- | ------------------------- |
| 🧠 Backend (Jest)     | `cd backend && npm test`  |
| 🖥️ Frontend (Vitest) | `cd frontend && npm test` |
| 🧪 E2E (Playwright)   | `npm run test:e2e`        |

---

# ⚙️ **Environment Notes**

* Frontend reads API base from `VITE_API_URL`
* Default: `http://localhost:5000/api`
* Docker Compose auto-wires all services (Mongo, Redis, Frontend, Backend)

---

# 🚢 **Deployment**

AasPaas supports:

* 🟦 **Render** (recommended)
* 🐳 **Docker Image Deployment**
* 🟢 **Static Hosting** (frontend)

Render config includes:

* `render.yaml`
* Dockerfiles for frontend & backend
* Auto-deploy on Git push (branch: main)

---

# 👤 **Author**

**Aharnish Dubey (aharnish5)**
🔗 GitHub: [https://github.com/aharnish5/](https://github.com/aharnish5/)

---

# 🎉 **Enjoy Building with AasPaas!**

This project is designed to celebrate India’s vibrant micro-business ecosystem and bring local shops online with ease.
Feel free to open issues, contribute, or suggest improvements!
