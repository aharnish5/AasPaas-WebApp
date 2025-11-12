import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import path from 'path';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import reviewRoutes from './routes/reviews.js';
import favoriteRoutes from './routes/favorites.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import locationRoutes from './routes/location.js';
import categoryRoutes from './routes/categories.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

dotenv.config();

const app = express();

// Behind Render/Proxies: trust X-Forwarded-* so secure cookies work over HTTPS
app.set('trust proxy', 1);

// CORS configuration
// Support multiple local dev origins (localhost + 127.0.0.1, different ports) and env FRONTEND_URL.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173', // Vite default if port not overridden
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.RENDER_EXTERNAL_URL, // Render sets this in some contexts
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // In single-service deployments (frontend + backend same domain), allow any origin and let browser same-origin rules apply
    if (process.env.CORS_SAME_SERVICE === 'true') {
      return callback(null, true);
    }
    // Allow requests with no origin (e.g. mobile apps, curl) or if origin is in list
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve locally stored uploads if in local mode (no S3 bucket configured)
if (!process.env.S3_BUCKET) {
  const uploadsPath = path.resolve('uploads');
  app.use('/uploads', express.static(uploadsPath));
  logger.info(`Serving local uploads from ${uploadsPath}`);
}

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shops', reviewRoutes); // Reviews are nested under shops
app.use('/api', favoriteRoutes); // Favorites routes (shops + list)
app.use('/api', uploadRoutes); // Generic upload endpoint
app.use('/api/shops', analyticsRoutes); // Track view route
app.use('/api/vendors', analyticsRoutes); // Vendor analytics route
app.use('/api/location', locationRoutes);
app.use('/api/categories', categoryRoutes); // Admin category management

// Serve frontend (SPA) if built assets are present
const spaDir = process.env.FRONTEND_DIST_DIR || path.resolve('frontend-dist');
if (fs.existsSync(spaDir)) {
  app.use(express.static(spaDir));
  const indexFile = path.join(spaDir, 'index.html');
  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    return next();
  });
  logger.info(`Serving SPA from ${spaDir}`);
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;

