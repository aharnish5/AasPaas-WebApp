import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'food',
        'clothing',
        'electronics',
        'services',
        'automotive',
        'beauty',
        'healthcare',
        'education',
        'entertainment',
        'home',
        'other',
      ],
      // TODO: Deprecated legacy flat category; will be replaced by primaryCategory & secondaryCategories after migration
    },
    // New categorization fields (backwards compatible during migration)
    primaryCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    secondaryCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true,
      },
    ],
    // Free-form or controlled tags improving micro-vendor discoverability (e.g., 'cobbler','key-cutting','tailor')
    tags: {
      type: [String],
      index: true,
      validate: {
        validator: function(arr) {
          return Array.isArray(arr) && arr.every(t => typeof t === 'string' && t.length <= 40);
        },
        message: 'All tags must be strings up to 40 characters',
      },
      default: [],
    },
    // Category-specific attributes (schema-driven) stored as key-value pairs (Map for flexibility)
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    // Confidence score for auto-assigned primaryCategory (0-1). If < threshold, flagged for review.
    categoryConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        // Optional Cloudinary public identifier (enables future delete/transform operations).
        publicId: {
          type: String,
          required: false,
        },
        caption: {
          type: String,
          default: '',
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    address: {
      raw: {
        type: String,
        required: [true, 'Address is required'],
      },
      street: String,
      locality: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number' &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
    hours: [
      {
        dayOfWeek: {
          type: Number,
          required: true,
          min: 0,
          max: 6, // 0 = Sunday, 6 = Saturday
        },
        openTime: {
          type: String,
          required: true,
          match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
        },
        closeTime: {
          type: String,
          required: true,
          match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
        },
      },
    ],
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number'],
    },
    status: {
      type: String,
      enum: ['pending', 'live', 'suspended'],
      default: 'pending',
    },
    // Pricing (optional)
    priceRange: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    averagePrice: {
      type: Number,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    ratings: {
      avg: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    // Normalized city & area slugs (India-only scope). Slugs lowercased, spaces -> hyphens.
    city_slug: {
      type: String,
      index: true,
      trim: true,
      lowercase: true,
    },
    area_slug: {
      type: String,
      index: true,
      trim: true,
      lowercase: true,
    },
    city_name: {
      type: String,
      trim: true,
    },
    area_name: {
      type: String,
      trim: true,
    },
    // Flag for records needing (re)geocoding enrichment by migration script
    needs_geocoding: {
      type: Boolean,
      default: false,
      index: true,
    },
    favoritesCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    ocrData: {
      extractedName: String,
      extractedAddress: String,
      confidence: Number,
      processedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
shopSchema.index({ location: '2dsphere' });

// Note: ownerId index is already created by index: true in schema definition

// Index for status and category filtering
shopSchema.index({ status: 1, category: 1 });
// Indexes for new categorization fields
shopSchema.index({ primaryCategory: 1, status: 1 });
shopSchema.index({ secondaryCategories: 1 });
shopSchema.index({ tags: 1 });

// Index for ratings sorting
shopSchema.index({ 'ratings.avg': -1 });
// Index for favorites popularity sorting (optional future use)
shopSchema.index({ favoritesCount: -1 });
// Composite index to accelerate city + area queries
shopSchema.index({ city_slug: 1, area_slug: 1 });
// Index for geocoding backlog processing
shopSchema.index({ needs_geocoding: 1 });

// Virtual for distance (will be populated in queries)
shopSchema.virtual('distance').get(function () {
  return this._distance;
});

// Method to calculate distance from a point (in km)
shopSchema.methods.calculateDistance = function (longitude, latitude) {
  const R = 6371; // Earth's radius in km
  const dLat = ((this.location.coordinates[1] - latitude) * Math.PI) / 180;
  const dLon = ((this.location.coordinates[0] - longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude * Math.PI) / 180) *
      Math.cos((this.location.coordinates[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Shop = mongoose.model('Shop', shopSchema);

export default Shop;

