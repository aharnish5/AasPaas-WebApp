import axios from 'axios';
import logger from '../config/logger.js';

// Map free-form business types to our existing categories
const CATEGORY_MAP = [
  { match: /fruit|vegetable|juice|food|snack|tea|coffee|biryani|fast\s*food|chaat/i, category: 'food' },
  { match: /cloth|fashion|garment|boutique|saree|apparel/i, category: 'clothing' },
  { match: /mobile|electronics|repair|computer|hardware|gadget/i, category: 'electronics' },
  { match: /salon|beauty|hair|makeup|parlor/i, category: 'beauty' },
  { match: /medical|clinic|pharmacy|health|chemist/i, category: 'healthcare' },
  { match: /school|tuition|coaching|education|training/i, category: 'education' },
  { match: /cinema|entertainment|game|gaming|music/i, category: 'entertainment' },
  { match: /furniture|home|garden|decor|appliance/i, category: 'home' },
  { match: /auto|mechanic|car|bike|vehicle|tyre|tire/i, category: 'automotive' },
  { match: /service|repair|printing|consult|photography|tailor|laundry/i, category: 'services' },
];

function mapBusinessTypeToCategory(businessType) {
  if (!businessType) return 'other';
  for (const rule of CATEGORY_MAP) {
    if (rule.match.test(businessType)) return rule.category;
  }
  return 'other';
}

function buildPrompt(hints) {
  const hintText = [];
  if (hints?.signageText) {
    hintText.push(`Signage text (OCR): "${hints.signageText}".`);
  }
  if (hints?.addressText) {
    hintText.push(`Possible address context: "${hints.addressText}".`);
  }

  // System-style instruction condensed for a single text part
  const system = [
    'You are an AI assistant that extracts structured business details from a single shop photo in India.',
    'Analyze the uploaded shop image carefully and extract these fields precisely:',
    '1) Shop Name – exact as on signage with proper casing.',
    '2) Category – type of shop (e.g., footwear, restaurant, clothing, grocery, salon, electronics, stationery, bakery, jewelry, mobile repair, street food, tailor, medical store, etc.).',
    '3) Description – 2–3 natural sentences describing what the shop offers and its specialty (about 40–80 words).',
    '4) Address Components (if visible): street/area/locality, city, state, postal code (PIN). Fill what you can, else keep null/empty.',
    '5) Phone Number – visible Indian phone number (10 digits or +91 format), else empty.',
    '6) Additional Tags – optional short phrases like "since 1998", "pure veg", "wholesale only", etc.',
    '7) Confidence Level – percentage (0–100) for each of: shop_name, category, description, address, phone_number.',
    'Return ONLY a single JSON object with this exact structure: {"shop_name":"","category":"","description":"","address":{"street":"","city":"","state":"","postal_code":""},"phone_number":"","tags":[],"confidence":{"shop_name":0,"category":0,"description":0,"address":0,"phone_number":0}}.',
    'If no signage is visible or unclear, use "shop_name":"Unknown" and leave missing fields blank or null. Be concise and avoid hallucinating details.',
    'No markdown, no commentary, no backticks.'
  ].join(' ');

  return [system, hintText.length ? `Hints: ${hintText.join(' ')}` : '']
    .filter(Boolean)
    .join(' ');
}

export async function inferShopFromImage(buffer, mimeType, hints = undefined) {
  // Read env at call time to avoid import-order issues with dotenv in ESM
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini not configured' };
  }
  try {
    const base64 = buffer.toString('base64');
    const payload = {
      contents: [
        {
          parts: [
            { text: buildPrompt(hints) },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64 } },
          ],
        },
      ],
      // Generation config for more deterministic JSON
      generationConfig: {
        temperature: 0.35,
        candidateCount: 1,
        maxOutputTokens: 512,
      },
    };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, payload, { timeout: 15000 });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.warn('Gemini response missing text part');
      return { success: false, error: 'Model returned no content' };
    }

    // Extract first JSON object from text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return { success: false, error: 'Model response not JSON' };
    }
    const jsonSlice = text.slice(firstBrace, lastBrace + 1).trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonSlice);
    } catch (err) {
      logger.error('Failed to parse Gemini JSON slice:', jsonSlice);
      return { success: false, error: 'Invalid JSON from model' };
    }

    // Normalize fields from the stricter schema
    const shopName = (parsed.shop_name || '').toString().trim();
    const categoryRaw = (parsed.category || '').toString().trim();
    const description = (parsed.description || '').toString().trim();
    const tags = Array.isArray(parsed.tags) ? parsed.tags.filter(t => typeof t === 'string').slice(0, 15) : [];
    const address = typeof parsed.address === 'object' && parsed.address ? {
      street: parsed.address.street || '',
      city: parsed.address.city || '',
      state: parsed.address.state || '',
      postal_code: parsed.address.postal_code || '',
    } : { street: '', city: '', state: '', postal_code: '' };
    const phoneNumber = (parsed.phone_number || '').toString().trim();
    const confidence = typeof parsed.confidence === 'object' && parsed.confidence ? {
      shop_name: Number(parsed.confidence.shop_name ?? 0),
      category: Number(parsed.confidence.category ?? 0),
      description: Number(parsed.confidence.description ?? 0),
      address: Number(parsed.confidence.address ?? 0),
      phone_number: Number(parsed.confidence.phone_number ?? 0),
    } : { shop_name: 0, category: 0, description: 0, address: 0, phone_number: 0 };

    // Suggest our internal category mapping from the free-form categoryRaw
    const businessType = categoryRaw.toLowerCase();
    const categorySuggested = mapBusinessTypeToCategory(businessType);

    return {
      success: true,
      name: shopName,
      businessType: businessType || 'Unknown',
      description: description || 'A small local business offering everyday essentials and friendly service.',
      tags,
      category: categorySuggested,
      categoryRaw,
      address,
      phoneNumber,
      confidence,
      raw: parsed,
    };
  } catch (error) {
    logger.error('Gemini inference error:', error.response?.data || error.message);
    return { success: false, error: 'Inference failed' };
  }
}
