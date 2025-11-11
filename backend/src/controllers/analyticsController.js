import Shop from '../models/Shop.js';
import Review from '../models/Review.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Track shop view
export const trackShopView = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    // Increment view counter (fire and forget)
    Shop.findByIdAndUpdate(shopId, { $inc: { views: 1 } }).catch((err) => {
      logger.error('Failed to increment shop views:', err);
    });

    res.json({ message: 'View tracked' });
  } catch (error) {
    next(error);
  }
};

// Get vendor analytics
export const getVendorAnalytics = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { range = '30' } = req.query; // days

    // Verify vendor owns this account or is admin
    if (req.userId.toString() !== vendorId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all shops owned by vendor
    const shops = await Shop.find({ ownerId: vendorId });

    if (shops.length === 0) {
      return res.json({
        totalShops: 0,
        totalViews: 0,
        totalReviews: 0,
        averageRating: 0,
        shops: [],
      });
    }

    const shopIds = shops.map((shop) => shop._id);

    // Aggregate statistics
    const totalViews = shops.reduce((sum, shop) => sum + (shop.views || 0), 0);
    
    // Get reviews for vendor's shops
    const reviews = await Review.find({
      shopId: { $in: shopIds },
      createdAt: { $gte: startDate },
    });

    const totalReviews = reviews.length;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    // Get shop-level analytics
    const shopAnalytics = await Promise.all(
      shops.map(async (shop) => {
        const shopReviews = await Review.find({ shopId: shop._id });
        const shopRating =
          shopReviews.length > 0
            ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length
            : 0;

        return {
          shopId: shop._id,
          name: shop.name,
          views: shop.views || 0,
          reviews: shopReviews.length,
          rating: Math.round(shopRating * 10) / 10,
          status: shop.status,
        };
      })
    );

    // Calculate views over time (simplified - in production use time-series DB)
    const viewsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Simplified: evenly distribute views (in production, track actual timestamps)
      viewsOverTime.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(totalViews / days),
      });
    }

    res.json({
      totalShops: shops.length,
      totalViews,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      shops: shopAnalytics,
      viewsOverTime,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    next(error);
  }
};

