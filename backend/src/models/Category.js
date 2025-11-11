import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['tags', 'string', 'boolean', 'range', 'number'], required: true },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    default: { type: mongoose.Schema.Types.Mixed },
    min: { type: Number },
    max: { type: Number },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    icon: { type: String },
    description: { type: String },
    priority: { type: Number, default: 0, index: true },
    visibleInSearch: { type: Boolean, default: true },
    suggestedAliases: { type: [String], default: [] },
    autoTags: { type: [String], default: [] },
    attributes: { type: [attributeSchema], default: [] },
    // Optional locale-specific names and aliases for i18n
    locales: {
      type: Map,
      of: new mongoose.Schema(
        {
          name: String,
          aliases: [String],
          description: String,
        },
        { _id: false }
      ),
      default: new Map(),
    },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, priority: -1 });
categorySchema.index({ suggestedAliases: 1 });

// Basic slug generator helper
categorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
