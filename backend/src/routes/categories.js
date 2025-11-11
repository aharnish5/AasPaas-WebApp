import express from 'express';
import { body, param, query } from 'express-validator';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Create category
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').optional().trim().isLength({ min: 2 }).withMessage('Slug too short'),
    body('parent').optional().isMongoId().withMessage('Invalid parent id'),
    body('priority').optional().isInt().withMessage('Priority must be an integer'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const category = await Category.create(req.body);
      res.status(201).json({ category });
    } catch (err) {
      next(err);
    }
  }
);

// Get categories (flat or by parent)
router.get(
  '/',
  [
    query('parent').optional().isMongoId(),
    query('grouped').optional().isBoolean(),
    query('includeCounts').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.parent) filter.parent = req.query.parent;
  const categories = await Category.find(filter).sort({ priority: -1, name: 1 }).lean();

      if (req.query.grouped === 'true') {
        // Build full hierarchical tree
        const map = new Map();
        categories.forEach(c => map.set(c._id.toString(), { ...c, children: [] }));
        const roots = [];
        map.forEach(node => {
          if (node.parent && map.has(node.parent.toString())) {
            map.get(node.parent.toString()).children.push(node);
          } else {
            roots.push(node);
          }
        });
        // grouped by top-level root slug
        const byParent = {};
        roots.forEach(r => {
          byParent[r.slug] = r.children.length ? r.children : [];
        });
        // Optionally include shop counts for each category (primaryCategory linkage)
        let counts = {};
        if (req.query.includeCounts === 'true') {
          const Shop = (await import('../models/Shop.js')).default;
          const agg = await Shop.aggregate([
            { $match: { status: 'live', primaryCategory: { $exists: true } } },
            { $group: { _id: '$primaryCategory', count: { $sum: 1 } } },
          ]);
            counts = agg.reduce((acc, cur) => {
              acc[cur._id.toString()] = cur.count;
              return acc;
            }, {});
        }
        res.json({ grouped: byParent, counts, roots });
      } else {
        res.json({ categories });
      }
    } catch (err) {
      next(err);
    }
  }
);

// Update category
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json({ category });
    } catch (err) {
      next(err);
    }
  }
);

// Delete category
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await Category.findByIdAndDelete(req.params.id);
      if (!result) return res.status(404).json({ message: 'Category not found' });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
