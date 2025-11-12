import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import path from 'path';

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

// CORS configuration
// Support multiple local dev origins (localhost + 127.0.0.1, different ports) and env FRONTEND_URL.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173', // Vite default if port not overridden
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]
  // Normalize any trailing slashes in env-provided URLs
  .filter(Boolean)
  .map((o) => (typeof o === 'string' ? o.replace(/\/$/, '') : o));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) or if origin is in list
    const normalized = origin ? origin.replace(/\/$/, '') : origin;
    if (!normalized || allowedOrigins.includes(normalized)) {
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

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;

