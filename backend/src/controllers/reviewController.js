import Review from '../models/Review.js';
import Shop from '../models/Shop.js';
import { uploadImage, deleteImage } from '../services/storageService.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';
import multer from 'multer';
import ReviewHelpful from '../models/ReviewHelpful.js';
import VendorReply from '../models/VendorReply.js';

// Configure multer for multiple images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
}).array('images', 5); // Max 5 images per review

// Create review
export const createReview = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { rating, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if user already reviewed this shop
    const existingReview = await Review.findOne({
      shopId,
      userId: req.userId,
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this shop' });
    }

    // Upload review images if any
    const reviewImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadImage(file.buffer, `reviews/${shopId}`, {
            filename: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
          });
          reviewImages.push({
            url: uploadResult.url,
            uploadedAt: new Date(),
          });
        } catch (error) {
          logger.error('Failed to upload review image:', error);
        }
      }
    }

    // Create review
    const review = await Review.create({
      shopId,
      userId: req.userId,
      rating: parseInt(rating),
      text: text || '',
      images: reviewImages,
    });

    // Populate user info
    await review.populate('userId', 'name email');

    res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a shop
export const getShopReviews = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, sort = 'newest', filter } = req.query;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    let sortObj = {};
    if (sort === 'newest') {
      sortObj = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sort === 'rating') {
      sortObj = { rating: -1 };
    } else if (sort === 'helpful') {
      sortObj = { helpfulCount: -1 };
    }

    const findQuery = { shopId };
    if (filter === 'photos') {
      findQuery['images.0'] = { $exists: true }; // only reviews with at least 1 image
    }

    const reviews = await Review.find(findQuery)
      .populate('userId', 'name email')
      .sort(sortObj)
      .limit(limitNum)
      .skip(skip);

    const total = await Review.countDocuments(findQuery);

    // Attach vendor replies
    const ids = reviews.map(r => r._id);
    const replies = await VendorReply.find({ reviewId: { $in: ids } }).lean();
    const replyMap = new Map(replies.map(r => [r.reviewId.toString(), r]));
    const enriched = reviews.map(r => {
      const json = r.toJSON();
      const rep = replyMap.get(r._id.toString());
      if (rep) json.vendorReply = { replyText: rep.replyText, createdAt: rep.createdAt, updatedAt: rep.updatedAt };
      return json;
    });

    res.json({
      reviews: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update review (owner only)
export const updateReview = async (req, res, next) => {
  try {
    const { shopId, reviewId } = req.params;
    const { rating, text } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      shopId,
      userId: req.userId,
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (rating !== undefined) review.rating = parseInt(rating);
    if (text !== undefined) review.text = text;

    await review.save();
    await review.populate('userId', 'name email');

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// Delete review (owner or admin)
export const deleteReview = async (req, res, next) => {
  try {
    const { shopId, reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      shopId,
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership or admin
    if (review.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete review images from S3
    for (const image of review.images) {
      try {
        const urlParts = image.url.split('/');
        const key = urlParts.slice(-3).join('/'); // reviews/{shopId}/{filename}
        await deleteImage(key);
      } catch (error) {
        logger.error(`Failed to delete review image ${image.url}:`, error);
      }
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Helper function to upload review images (used as middleware)
export const uploadReviewImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Mark review as helpful (one per user)
export const markHelpful = async (req, res, next) => {
  try {
    const { shopId, reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId, shopId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    try {
      await ReviewHelpful.create({ reviewId, userId: req.userId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Already marked helpful' });
      }
      throw err;
    }

    review.helpfulCount += 1;
    await review.save();

    res.status(201).json({ message: 'Marked helpful', helpfulCount: review.helpfulCount });
  } catch (error) {
    next(error);
  }
};

// Vendor: get all reviews for a specific shop the vendor owns
export const vendorGetShopReviews = async (req, res, next) => {
  try {
    const { vendorId, shopId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    // AuthZ: vendor or admin only, and vendorId must match current user unless admin
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
      return res.status(403).json({ error: 'Cannot access other vendor data' });
    }

    const shop = await Shop.findOne({ _id: shopId, ownerId: vendorId });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found or not owned by vendor' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortObj = {};
    if (sort === 'newest') sortObj = { createdAt: -1 };
    else if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'helpful') sortObj = { helpfulCount: -1 };

    const [reviews, total] = await Promise.all([
      Review.find({ shopId })
        .populate('userId', 'name email')
        .sort(sortObj)
        .limit(limitNum)
        .skip(skip),
      Review.countDocuments({ shopId }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Vendor: analytics for reviews of a shop
export const vendorGetShopReviewStats = async (req, res, next) => {
  try {
    const { vendorId, shopId } = req.params;

    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
      return res.status(403).json({ error: 'Cannot access other vendor data' });
    }

    const shop = await Shop.findOne({ _id: shopId, ownerId: vendorId });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found or not owned by vendor' });
    }

    // Breakdown and time series (last 6 months by month)
    const [breakdown, timeSeries, total, avg] = await Promise.all([
      Review.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Review.countDocuments({ shopId }),
      Review.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]).then(r => (r[0]?.avg ?? 0)),
    ]);

    const ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach(b => { ratingsBreakdown[b._id] = b.count; });

    res.json({
      total,
      average: Math.round(avg * 10) / 10,
      breakdown: ratingsBreakdown,
      timeSeries,
    });
  } catch (error) {
    next(error);
  }
};

// Vendor reply create or update
export const vendorReply = async (req, res, next) => {
  try {
    const { vendorId, reviewId } = req.params;
    const { replyText } = req.body;

    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
      return res.status(403).json({ error: 'Cannot reply for another vendor' });
    }

    const review = await Review.findById(reviewId).populate('shopId', 'ownerId');
    if (!review || !review.shopId) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (req.user.role === 'vendor' && review.shopId.ownerId.toString() !== vendorId) {
      return res.status(403).json({ error: 'Review does not belong to your shop' });
    }

    const existing = await VendorReply.findOne({ reviewId });
    if (existing) {
      existing.replyText = replyText;
      await existing.save();
      return res.json({ message: 'Reply updated', reply: existing });
    }

    const created = await VendorReply.create({ reviewId, vendorId, replyText });
    res.status(201).json({ message: 'Reply added', reply: created });
  } catch (error) {
    next(error);
  }
};

// Get reply for a review (public)
export const getVendorReply = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const reply = await VendorReply.findOne({ reviewId }).lean();
    if (!reply) return res.json({ reply: null });
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};


