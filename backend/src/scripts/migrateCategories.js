#!/usr/bin/env node
// Migration script: map legacy flat shop.category enum to new Category hierarchy.
// Safe to run multiple times (idempotent). Provides a summary at end.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Category from '../models/Category.js';
import Shop from '../models/Shop.js';
import { categorizeShop } from '../services/autoCategorizationService.js';

dotenv.config();

const TAXONOMY_FILE = path.resolve('backend/src/data/taxonomy.in.json');

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aaspaas';
  await mongoose.connect(uri, { autoIndex: true });
  console.log('[migrateCategories] Connected to MongoDB');
}

// Recursively upsert nodes preserving parent relationships
async function upsertNode(node, parentId = null) {
  const { name, slug, suggestedAliases = [], attributes = [], description, icon, priority, visibleInSearch = true } = node;
  if (slug === 'root') {
    // Seed children of root
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        await upsertNode(child, null);
      }
    }
    return;
  }
  let doc = await Category.findOne({ slug });
  if (!doc) {
    doc = await Category.create({ name, slug, parent: parentId, suggestedAliases, attributes, description, icon, priority, visibleInSearch });
  } else {
    // Update parent/fields if changed
    doc.name = name;
    doc.parent = parentId || null;
    doc.suggestedAliases = suggestedAliases;
    doc.attributes = attributes;
    if (description !== undefined) doc.description = description;
    if (icon !== undefined) doc.icon = icon;
    if (priority !== undefined) doc.priority = priority;
    if (visibleInSearch !== undefined) doc.visibleInSearch = visibleInSearch;
    await doc.save();
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      await upsertNode(child, doc._id);
    }
  }
}

async function seedCategories() {
  if (!fs.existsSync(TAXONOMY_FILE)) {
    console.warn('[migrateCategories] Taxonomy file not found, skipping seed');
    return;
  }
  const json = JSON.parse(fs.readFileSync(TAXONOMY_FILE, 'utf-8'));
  await upsertNode(json, null);
  console.log('[migrateCategories] Seed complete.');
}

// Map legacy category string to a fallback category slug (broad buckets)
const legacyMap = {
  food: 'food',
  clothing: 'tailoring-alterations',
  electronics: 'electronics-repair',
  services: 'services',
  automotive: 'key-cutting-locksmith', // placeholder; could add automotive-repair later
  beauty: 'services',
  healthcare: 'services',
  education: 'services',
  entertainment: 'food',
  home: 'services',
  other: 'services',
};

async function migrateShops() {
  const shops = await Shop.find({ primaryCategory: { $exists: false } }).limit(5000);
  let updated = 0;
  for (const shop of shops) {
    // 1) Try rules-based auto categorization
    const auto = await categorizeShop(shop);
    let primaryCategoryId = auto.primaryCategory;
    let confidence = auto.confidence;

    // 2) Fallback to legacy map if no rule matched
    if (!primaryCategoryId && shop.category) {
      const slug = legacyMap[shop.category];
      if (slug) {
        const cat = await Category.findOne({ slug });
        if (cat) {
          primaryCategoryId = cat._id;
          confidence = Math.max(confidence, 0.5); // baseline confidence
        }
      }
    }

    // Only update if we have a category
    if (primaryCategoryId) {
      shop.primaryCategory = primaryCategoryId;
      if (auto.tags?.length) {
        shop.tags = Array.from(new Set([...(shop.tags || []), ...auto.tags]));
      }
      if (confidence !== undefined) {
        shop.categoryConfidence = confidence;
      }
      await shop.save();
      updated++;
    }
  }
  console.log(`[migrateCategories] Migrated ${updated} shops.`);
}

async function run() {
  await connect();
  await seedCategories();
  await migrateShops();
  await mongoose.disconnect();
  console.log('[migrateCategories] Done');
}

run().catch((e) => {
  console.error('[migrateCategories] Fatal error', e);
  process.exit(1);
});
