import Tesseract from 'tesseract.js';
import logger from '../config/logger.js';
import fs from 'fs';
import sharp from 'sharp';

let visionClient = null;
let visionClientInitialized = false;

// Initialize Google Vision client lazily
async function initializeVisionClient() {
  if (visionClientInitialized) {
    return visionClient;
  }
  
  visionClientInitialized = true;
  
  if (process.env.GOOGLE_VISION_ENABLED !== 'true') {
    return null;
  }

  try {
    // Dynamic import to avoid errors if package not installed
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    
    const keyPath = process.env.GOOGLE_VISION_KEY_PATH || './config/google-vision-key.json';
    if (fs.existsSync(keyPath)) {
      visionClient = new ImageAnnotatorClient({
        keyFilename: keyPath,
      });
      logger.info('Google Vision API client initialized');
    } else {
      logger.warn('Google Vision key file not found, falling back to Tesseract.js');
    }
  } catch (error) {
    logger.warn('Google Vision not available, falling back to Tesseract.js:', error.message);
  }
  
  return visionClient;
}

/**
 * Extract text from image using OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @param {object} options - OCR options
 * @returns {Promise<object>} OCR result with extracted text and confidence
 */
export const extractText = async (imageBuffer, options = {}) => {
  const { preferCloud = true } = options;

  // Try Google Vision first if enabled and preferred
  if (preferCloud && process.env.GOOGLE_VISION_ENABLED === 'true') {
    const client = await initializeVisionClient();
    if (client) {
      try {
        return await extractWithGoogleVision(imageBuffer);
      } catch (error) {
        logger.warn('Google Vision OCR failed, falling back to Tesseract:', error.message);
      }
    }
  }

  // Fallback to Tesseract.js
  if (process.env.TESSERACT_ENABLED !== 'false') {
    return await extractWithTesseract(imageBuffer);
  }

  throw new Error('No OCR service available');
};

/**
 * Extract text using Google Cloud Vision API
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object>} OCR result
 */
const extractWithGoogleVision = async (imageBuffer) => {
  try {
    const client = await initializeVisionClient();
    if (!client) {
      throw new Error('Google Vision client not available');
    }
    
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return {
        text: '',
        confidence: 0,
        words: [],
        method: 'google-vision',
      };
    }

    // Full text is in the first detection
    const fullText = detections[0].description || '';
    
    // Extract words with bounding boxes
    const words = detections.slice(1).map((detection) => ({
      text: detection.description || '',
      confidence: detection.confidence || 0,
      boundingBox: detection.boundingPoly?.vertices || [],
    }));

    // Calculate average confidence
    const avgConfidence = words.length > 0
      ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
      : 0;

    return {
      text: fullText,
      confidence: avgConfidence,
      words,
      method: 'google-vision',
    };
  } catch (error) {
    logger.error('Google Vision OCR error:', error);
    throw error;
  }
};

/**
 * Extract text using Tesseract.js
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object>} OCR result
 */
const extractWithTesseract = async (imageBuffer) => {
  try {
    // Normalize image to a Tesseract-friendly format to avoid Leptonica format errors
    let normalizedBuffer = imageBuffer;
    try {
      normalizedBuffer = await sharp(imageBuffer)
        .rotate() // respect orientation
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toFormat('png') // PNG is reliably supported by Leptonica
        .toBuffer();
    } catch (preErr) {
      logger.warn('OCR preprocessing failed, using original buffer:', preErr.message);
      // If preprocessing fails, fall back to original buffer; Tesseract may still handle it
      normalizedBuffer = imageBuffer;
    }

    const { data } = await Tesseract.recognize(normalizedBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const words = data.words.map((word) => ({
      text: word.text,
      confidence: word.confidence || 0,
      boundingBox: word.bbox,
    }));

    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      words,
      method: 'tesseract',
    };
  } catch (error) {
    // Known error when Leptonica cannot parse the buffer
    const message = error?.message || String(error);
    if (/Unknown format|no pix returned|Error attempting to read image/i.test(message)) {
      logger.warn('Tesseract could not read image (unsupported/corrupt).');
      // Return a graceful empty result instead of throwing to avoid crashing higher layers
      return {
        text: '',
        confidence: 0,
        words: [],
        method: 'tesseract',
        error: 'UNREADABLE_IMAGE',
      };
    }
    logger.error('Tesseract OCR error:', error);
    throw error;
  }
};

/**
 * Extract shop name and address from OCR text
 * @param {string} ocrText - Raw OCR text
 * @returns {object} Extracted shop name and address fragments
 */
export const extractShopInfo = (ocrText) => {
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      extractedName: '',
      extractedAddress: '',
      confidence: 0,
    };
  }

  const lines = ocrText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

  // Heuristics for Indian shop signs:
  // - Shop name is usually in the first few lines, often in larger text
  // - Address often contains keywords like "road", "street", "nagar", "colony", etc.
  // - Phone numbers often follow addresses

  let extractedName = '';
  let extractedAddress = '';
  const addressKeywords = [
    'road', 'street', 'nagar', 'colony', 'sector', 'block', 'lane', 'plot',
    'near', 'opposite', 'behind', 'pin', 'pincode', 'district', 'state',
  ];

  // First 2-3 lines are often shop name
  if (lines.length > 0) {
    extractedName = lines[0];
    if (lines.length > 1 && lines[1].length < 50) {
      // Second line might be part of name if short
      extractedName += ' ' + lines[1];
    }
  }

  // Look for address in remaining lines
  const addressLines = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      addressKeywords.some((keyword) => line.includes(keyword)) ||
      /\d{6}/.test(line) || // Pincode pattern
      /\d{10}/.test(line) // Phone number pattern
    ) {
      addressLines.push(lines[i]);
    }
  }

  extractedAddress = addressLines.join(', ');

  // Estimate confidence based on text length and structure
  const confidence = Math.min(
    100,
    (extractedName.length > 3 ? 40 : 0) +
    (extractedAddress.length > 10 ? 30 : 0) +
    (lines.length > 2 ? 30 : 0)
  );

  return {
    extractedName: extractedName.trim(),
    extractedAddress: extractedAddress.trim(),
    confidence,
  };
};

/**
 * Process image and extract shop information
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object>} Shop information with OCR data
 */
export const processShopImage = async (imageBuffer) => {
  try {
    // Run OCR (with cloud first if enabled)
    const ocrResult = await extractText(imageBuffer, { preferCloud: true });

    // Extract shop info from OCR text
    const shopInfo = extractShopInfo(ocrResult.text);

    return {
      ...shopInfo,
      fullOcrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      ocrMethod: ocrResult.method,
      processedAt: new Date(),
      ocrError: ocrResult?.error || undefined,
    };
  } catch (error) {
    // Never crash callers: return a safe, empty payload with an error marker
    logger.warn('Shop image processing failed, returning empty result:', error?.message || error);
    return {
      extractedName: '',
      extractedAddress: '',
      confidence: 0,
      fullOcrText: '',
      ocrConfidence: 0,
      ocrMethod: 'none',
      processedAt: new Date(),
      ocrError: error?.message || 'OCR_FAILED',
    };
  }
};

