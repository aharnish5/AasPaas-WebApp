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

  // Simplified, direct instruction for JSON-mode
  const system = [
    'Extract business details from this shop photo in India.',
    'Return ONLY a JSON object (no markdown, no explanation) with this structure:',
    '{"shop_name":"exact name on signage","category":"type (e.g., restaurant, grocery, salon, electronics, clothing)","description":"2-3 sentences about what the shop offers","address":{"street":"","city":"","state":"","postal_code":""},"phone_number":"10-digit or +91 format if visible","tags":["optional tags like since 1998, pure veg"],"confidence":{"shop_name":80,"category":90,"description":70,"address":50,"phone_number":30}}',
    'If unclear, use "Unknown" for shop_name and confidence 0-100 for each field.',
  ].join(' ');

  return [system, hintText.length ? `Hints: ${hintText.join(' ')}` : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Aggressive JSON extraction that handles multiple encoding/wrapping schemes:
 * - Markdown code fences: ```json ... ``` or ``` ... ```
 * - Double JSON-encoded strings: "{ ... }"
 * - Prefix/suffix text: "Here's the data: { ... } Hope this helps"
 * - Newlines and whitespace everywhere
 */
function extractJsonObject(rawText) {
  let text = rawText;

  // 1. Strip markdown code fences (greedy, case-insensitive)
  text = text.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // 2. If the whole string is a JSON-encoded string (starts/ends with "), unwrap it
  if (text.startsWith('"') && text.endsWith('"') && text.length > 1) {
    try {
      const inner = JSON.parse(text);
      if (typeof inner === 'string') text = inner.trim();
    } catch {
      // not a valid JSON string — proceed with original text
    }
  }

  // 3. Find the first { and scan for the matching }
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1).trim();
      }
    }
  }

  return null;
}

// Ordered list of FREE stable models (most reliable first)
// Note: gemini-2.5-* models are deprecated for new API keys
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite', // Most reliable, least thinking tokens
  'gemini-3.5-flash',      // Stable, free tier available
  'gemini-3.6-flash',      // Latest but uses more thinking tokens
];

/**
 * Returns true for errors that should retry on a different model:
 * 503 Service Unavailable, 429 Quota Exceeded, 500 Internal Server Error,
 * 404 Model Not Found (deprecated models), UNAVAILABLE, RESOURCE_EXHAUSTED.
 */
function isRetryableError(error) {
  const httpStatus = error.response?.status;
  if (httpStatus === 503 || httpStatus === 429 || httpStatus === 500) return true;
  
  // 404 with model deprecation message should retry
  if (httpStatus === 404) {
    const msg = error.response?.data?.error?.message || '';
    if (/model.*no longer available|deprecated|not found/i.test(msg)) return true;
  }
  
  const providerStatus = error.response?.data?.error?.status;
  if (providerStatus === 'UNAVAILABLE' || providerStatus === 'RESOURCE_EXHAUSTED' || providerStatus === 'NOT_FOUND') return true;
  
  // Also retry on 400 if the error message mentions model unavailability
  if (httpStatus === 400) {
    const msg = error.response?.data?.error?.message || '';
    if (/model.*not (found|available|supported)/i.test(msg)) return true;
  }
  return false;
}

/**
 * Call a single Gemini model. Throws on any error (caller decides retry logic).
 */
async function callGeminiModel(model, payload, apiKey, timeoutMs) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  return axios.post(url, payload, { timeout: timeoutMs });
}

export async function inferShopFromImage(buffer, mimeType, hints = undefined) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const configuredTimeout = Number.parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10);
  const GEMINI_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 60000;

  if (!GEMINI_API_KEY) {
    logger.error('Gemini API key not configured');
    return { success: false, error: 'AI service not configured' };
  }

  // Validate API key format (should start with AIza or AQ.)
  if (!GEMINI_API_KEY.startsWith('AIza') && !GEMINI_API_KEY.startsWith('AQ.')) {
    logger.error('Invalid Gemini API key format', { 
      keyPrefix: GEMINI_API_KEY.slice(0, 4) 
    });
    return { success: false, error: 'AI service configuration error' };
  }

  // Validate image buffer
  if (!buffer || buffer.length === 0) {
    logger.error('Empty image buffer');
    return { success: false, error: 'Invalid image file' };
  }

  // Check buffer size (max 20MB for Gemini API)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (buffer.length > maxSize) {
    logger.error('Image too large', { size: buffer.length, maxSize });
    return { success: false, error: 'Image file too large. Please use an image smaller than 20MB.' };
  }

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
    generationConfig: {
      temperature: 0.4,
      candidateCount: 1,
      maxOutputTokens: 1024, // Increased to handle full JSON response + thinking tokens
    },
  };

  // Build model list: primary first, then fallbacks (deduplicated)
  const modelsToTry = [
    PRIMARY_MODEL,
    ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL),
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      logger.info(`Attempting Gemini inference with model: ${model}`);
      const response = await callGeminiModel(model, payload, GEMINI_API_KEY, GEMINI_TIMEOUT_MS);

      // Check finish reason — if MAX_TOKENS, the response was truncated
      const finishReason = response.data?.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        logger.warn('Gemini response truncated (MAX_TOKENS)', { model });
        // Try next model with potentially better token efficiency
        lastError = new Error('Response truncated');
        continue;
      }

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        logger.warn('Gemini response missing text part', { model, finishReason });
        // Try next model — this might be a model-specific issue
        lastError = new Error('Model returned no content');
        continue;
      }

      // Extract JSON from the response (handles markdown, double-encoding, etc.)
      const jsonSlice = extractJsonObject(text);
      if (!jsonSlice) {
        logger.warn('Gemini response contains no JSON object', { 
          model, 
          preview: text.slice(0, 300) 
        });
        // Try next model
        lastError = new Error('Model response not JSON');
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonSlice);
      } catch (parseError) {
        logger.error('Failed to parse extracted JSON', { 
          model, 
          jsonSlice: jsonSlice.slice(0, 500),
          error: parseError.message 
        });
        // Try next model
        lastError = parseError;
        continue;
      }

      // Normalize the parsed response to our internal schema
      const shopName = (parsed.shop_name || '').toString().trim();
      const categoryRaw = (parsed.category || '').toString().trim();
      const description = (parsed.description || '').toString().trim();
      const tags = Array.isArray(parsed.tags) 
        ? parsed.tags.filter(t => typeof t === 'string').slice(0, 15) 
        : [];
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

      // Map the free-form category to our internal category enum
      const businessType = categoryRaw.toLowerCase();
      const categorySuggested = mapBusinessTypeToCategory(businessType);

      logger.info(`Gemini inference succeeded`, { 
        model, 
        shopName: shopName || 'Unknown',
        category: categorySuggested 
      });

      return {
        success: true,
        name: shopName || 'Unknown Shop',
        businessType: businessType || 'general store',
        description: description || 'A local business serving the community with everyday needs.',
        tags,
        category: categorySuggested,
        categoryRaw,
        address,
        phoneNumber,
        confidence,
        raw: parsed,
      };
    } catch (error) {
      const providerError = error.response?.data?.error;
      const httpStatus = error.response?.status;
      const errorMessage = providerError?.message || error.message || 'Unknown error';

      logger.error('Gemini inference error', {
        model,
        message: error.message,
        code: error.code,
        httpStatus,
        providerStatus: providerError?.status,
        providerMessage: providerError?.message,
        // Log first 200 chars of request/response for debugging
        requestPreview: payload?.contents?.[0]?.parts?.[0]?.text?.slice(0, 200),
      });

      // Timeout errors — don't retry, fail immediately
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return { 
          success: false, 
          error: 'Image analysis timed out. Please try again with a smaller image.' 
        };
      }

      // Retryable errors — try the next model in the fallback chain
      if (isRetryableError(error)) {
        logger.warn(`Model ${model} unavailable or overloaded (${httpStatus ?? providerError?.status}), trying next fallback...`);
        lastError = error;
        continue;
      }

      // Non-retryable error (auth failure, bad request, etc.) — fail immediately
      const errorDetail = providerError?.message || error.message || 'Unknown error';
      logger.error('Non-retryable Gemini error', { 
        model, 
        httpStatus, 
        errorDetail,
        fullError: JSON.stringify(providerError || {}).slice(0, 500)
      });
      
      // Return a more helpful error message based on status code
      if (httpStatus === 400) {
        // Check if it's a model-specific issue
        if (errorMessage.includes('model')) {
          logger.warn(`Model ${model} returned 400, trying next fallback...`);
          lastError = error;
          continue;
        }
        return { success: false, error: 'Invalid image format or content. Please try a different image.' };
      }
      if (httpStatus === 401 || httpStatus === 403) {
        return { success: false, error: 'AI service authentication failed. Please contact support.' };
      }
      return { 
        success: false, 
        error: 'AI service error. Please try again or use a different image.' 
      };
    }
  }

  // All models exhausted without success
  const providerMsg = lastError?.response?.data?.error?.message || lastError?.message;
  logger.error('All Gemini models exhausted', { modelsToTry, lastError: providerMsg });
  return {
    success: false,
    error: 'AI service is temporarily unavailable. Please try again in a few moments.',
  };
}
