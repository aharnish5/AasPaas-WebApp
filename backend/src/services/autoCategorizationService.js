import Category from '../models/Category.js';

// Simple rules/heuristics-based auto-categorization stub
// Returns: { primaryCategory, secondaryCategories, tags, confidence, matchedRules }
export async function categorizeShop(shop) {
  const text = `${shop.name || ''} ${shop.description || ''}`.toLowerCase();
  const hints = new Set();
  const matchedRules = [];

  const rules = [
    { hint: 'cobbler|shoe repair|sole|heel', slug: 'cobbler-shoe-repair', tags: ['cobbler','shoe-repair'] },
    { hint: 'key maker|key cutting|locksmith', slug: 'key-cutting-locksmith', tags: ['key-maker','locksmith'] },
    { hint: 'tailor|alteration|stitch', slug: 'tailoring-alterations', tags: ['tailor','alterations'] },
    { hint: 'street food|panipuri|chaat|bhel|pani puri|golgappa', slug: 'street-food', tags: ['street-food'] },
    { hint: 'kirana|grocery|provision store', slug: 'kirana-grocery', tags: ['kirana','grocery'] },
    { hint: 'mobile recharge|sim|prepaid|postpaid', slug: 'mobile-recharge-sim', tags: ['mobile-recharge','sim'] },
    { hint: 'electronics repair|mobile repair|laptop repair|tv repair', slug: 'electronics-repair', tags: ['electronics-repair'] },
  ];

  for (const r of rules) {
    const regex = new RegExp(r.hint, 'i');
    if (regex.test(text)) {
      matchedRules.push(r.slug);
      r.tags.forEach(t => hints.add(t));
    }
  }

  let primaryCategory = null;
  if (matchedRules.length > 0) {
    // Prefer the first matched rule; could be enhanced with priority weighting later
    const cat = await Category.findOne({ slug: matchedRules[0] }).lean();
    if (cat) primaryCategory = cat._id;
  }

  const confidence = Math.min(1, 0.6 + matchedRules.length * 0.1); // crude heuristic

  return {
    primaryCategory,
    secondaryCategories: [],
    tags: Array.from(hints),
    confidence: matchedRules.length ? confidence : 0,
    matchedRules,
  };
}
