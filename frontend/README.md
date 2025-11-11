# Aas Paas Frontend

Production-ready React frontend for the Aas Paas hyperlocal vendor-customer platform.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_TOKEN=pk.your-token
```

### Development
```bash
npm run dev
```

Frontend runs on: http://localhost:3000

### Build
```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/      # Reusable components
│   ├── ui/         # Base UI components (Button, Input, Modal)
│   ├── layout/     # Layout components (Navbar, Footer)
│   ├── shop/       # Shop-related components
│   └── auth/       # Auth components
├── pages/          # Page components
│   ├── auth/       # Login, Signup pages
│   ├── customer/   # Customer pages
│   └── vendor/     # Vendor pages
├── store/          # Redux store and slices
├── services/       # API services
├── hooks/          # Custom hooks
└── utils/          # Utility functions
```

## 🎨 Design System

- **Primary Color**: #0F766E (Teal)
- **Accent Color**: #06B6D4 (Cyan)
- **Font**: Inter
- **Framework**: TailwindCSS
- **Icons**: Lucide React

## 📝 Features

- ✅ Authentication (Customer & Vendor)
- ✅ Shop Search & Discovery
- ✅ Shop Detail Pages
- ✅ Responsive Design
- ✅ Protected Routes
- ✅ Redux State Management

## 🚧 Coming Soon

- Vendor Onboarding Flow
- OCR Result Modal
- Image Upload
- Map Integration
- Reviews & Ratings
- Analytics Dashboard

## 📚 Documentation

See `PROJECT_SUMMARY.md` in root for complete feature list.

