import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createReview,
  getShopReviews,
  updateReview,
  deleteReview,
  uploadReviewImages,
  markHelpful,
  vendorGetShopReviews,
  vendorGetShopReviewStats,
  vendorReply,
  getVendorReply,
} from '../controllers/reviewController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireCustomer } from '../middleware/role.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Create review (customer only)
router.post(
  '/:shopId/reviews',
  authenticate,
  requireCustomer,
  uploadReviewImages,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('text').optional().isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
  ],
  validateRequest,
  createReview
);

// Get reviews for a shop (public)
router.get(
  '/:shopId/reviews',
  optionalAuth,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['newest', 'oldest', 'rating', 'helpful']),
    query('filter').optional().isIn(['photos','all']).withMessage('Invalid filter'),
  ],
  validateRequest,
  getShopReviews
);

// Update review (owner only)
router.patch(
  '/:shopId/reviews/:reviewId',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('text').optional().isLength({ max: 1000 }),
  ],
  validateRequest,
  updateReview
);

// Delete review (owner or admin)
router.delete(
  '/:shopId/reviews/:reviewId',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
  ],
  validateRequest,
  deleteReview
);

// Mark review helpful
router.post(
  '/:shopId/reviews/:reviewId/helpful',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
  ],
  validateRequest,
  markHelpful
);

// Vendor: get reviews for owned shop
router.get(
  '/:shopId/vendor/:vendorId/reviews',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('vendorId').isMongoId().withMessage('Invalid vendor ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['newest', 'oldest', 'rating', 'helpful']),
  ],
  validateRequest,
  vendorGetShopReviews
);

// Vendor: review analytics
router.get(
  '/:shopId/vendor/:vendorId/reviews/analytics',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('vendorId').isMongoId().withMessage('Invalid vendor ID'),
  ],
  validateRequest,
  vendorGetShopReviewStats
);

// Vendor: add/update reply to a review
router.post(
  '/:shopId/vendor/:vendorId/reviews/:reviewId/reply',
  authenticate,
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('vendorId').isMongoId().withMessage('Invalid vendor ID'),
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
  ],
  validateRequest,
  vendorReply
);

// Public: get reply for a review
router.get(
  '/:shopId/reviews/:reviewId/reply',
  [
    param('shopId').isMongoId().withMessage('Invalid shop ID'),
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
  ],
  validateRequest,
  getVendorReply
);

export default router;

