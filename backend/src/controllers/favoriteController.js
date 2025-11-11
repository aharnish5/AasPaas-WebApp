import Favorite from '../models/Favorite.js';
import Shop from '../models/Shop.js';
import mongoose from 'mongoose';

// Add to favorites (idempotent)
export const addFavorite = async (req, res, next) => {
	try {
		const { shopId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(shopId)) {
			return res.status(400).json({ error: 'Invalid shop ID' });
		}

		const shop = await Shop.findById(shopId).select('_id');
		if (!shop) {
			return res.status(404).json({ error: 'Shop not found' });
		}

		let created = false;
		try {
			await Favorite.create({ userId: req.userId, shopId });
			created = true;
		} catch (err) {
			// Duplicate favorite -> ignore
			if (err.code !== 11000) throw err;
		}

		if (created) {
			await Shop.findByIdAndUpdate(shopId, { $inc: { favoritesCount: 1 } });
		}

		res.status(201).json({ message: 'Added to favorites', favorited: true });
	} catch (error) {
		next(error);
	}
};

// Remove from favorites (idempotent)
export const removeFavorite = async (req, res, next) => {
	try {
		const { shopId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(shopId)) {
			return res.status(400).json({ error: 'Invalid shop ID' });
		}

		const result = await Favorite.findOneAndDelete({ userId: req.userId, shopId });
		if (result) {
			await Shop.findByIdAndUpdate(shopId, { $inc: { favoritesCount: -1 } });
		}

		res.json({ message: 'Removed from favorites', favorited: false });
	} catch (error) {
		next(error);
	}
};

// Get current user's favorites list with shops
export const getMyFavorites = async (req, res, next) => {
	try {
		const favorites = await Favorite.find({ userId: req.userId })
			.populate({
				path: 'shopId',
				select: 'name images ratings address category favoritesCount',
			})
			.sort({ createdAt: -1 });

		const shops = favorites
			.map((f) => f.shopId)
			.filter(Boolean);

		res.json({ shops });
	} catch (error) {
		next(error);
	}
};

// Check if a given shop is in current user's favorites
export const isFavorited = async (req, res, next) => {
	try {
		const { shopId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(shopId)) {
			return res.status(400).json({ error: 'Invalid shop ID' });
		}
		const existing = await Favorite.findOne({ userId: req.userId, shopId }).lean();
		res.json({ favorited: !!existing });
	} catch (error) {
		next(error);
	}
};

