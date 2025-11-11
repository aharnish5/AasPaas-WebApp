import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { requireCustomer } from '../middleware/role.js';
import { uploadImage } from '../services/storageService.js';

const router = express.Router();

// Multer config for review photo uploads (generic endpoint if needed outside review form)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
}).array('images', 5);

router.post('/upload', authenticate, requireCustomer, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }
      const results = [];
      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, 'reviews/temp');
        results.push(uploaded.url);
      }
      res.status(201).json({ urls: results });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

export default router;
