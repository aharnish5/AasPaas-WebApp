import express from 'express';
import { param, query } from 'express-validator';
import { trackShopView, getVendorAnalytics } from '../controllers/analyticsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Track shop view (public, optional auth)
// Note: This route is mounted at /api/shops in app.js
router.post(
  '/:shopId/track-view',
  optionalAuth,
  [param('shopId').isMongoId().withMessage('Invalid shop ID')],
  validateRequest,
  trackShopView
);

// Get vendor analytics (vendor or admin only)
router.get(
  '/:vendorId/analytics',
  authenticate,
  [
    param('vendorId').isMongoId().withMessage('Invalid vendor ID'),
    query('range').optional().isIn(['7', '30', '90', 'custom']),
  ],
  validateRequest,
  getVendorAnalytics
);

export default router;

