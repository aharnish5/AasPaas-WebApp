import express from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requireCustomer } from '../middleware/role.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { addFavorite, removeFavorite, getMyFavorites, isFavorited } from '../controllers/favoriteController.js';

const router = express.Router();

// Add favorite (customer only)
router.post(
	'/shops/:shopId/favorite',
	authenticate,
	requireCustomer,
	[param('shopId').isMongoId().withMessage('Invalid shop ID')],
	validateRequest,
	addFavorite
);

// Remove favorite (customer only)
router.delete(
	'/shops/:shopId/favorite',
	authenticate,
	requireCustomer,
	[param('shopId').isMongoId().withMessage('Invalid shop ID')],
	validateRequest,
	removeFavorite
);

// Check if current user has favorited this shop
router.get(
	'/shops/:shopId/favorite',
	authenticate,
	requireCustomer,
	[param('shopId').isMongoId().withMessage('Invalid shop ID')],
	validateRequest,
	isFavorited
);

// Get current user's favorites
router.get('/favorites', authenticate, requireCustomer, getMyFavorites);

export default router;

