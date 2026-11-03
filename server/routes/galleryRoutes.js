const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryItem = require('../models/GalleryItem');
const { protect } = require('../middleware/auth');

// Storage Configuration
const uploadDir = path.join(__dirname, '../../uploads/gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  }
});

// Memory store fallback
let memoryGallery = [];

// GET /api/gallery (Public - with optional ?category=)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== 'all' ? { category } : {};
    let items = [];
    if (mongoose.connection.readyState === 1) {
      try {
        items = await GalleryItem.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        items = [];
      }
    }
    if (!items.length) {
      items = memoryGallery.filter(item => {
        if (category && category !== 'all' && item.category !== category) return false;
        return true;
      });
    }
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/gallery (Protected Admin - Upload photo)
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const { title, caption, category, imageUrl } = req.body;
    let finalImageUrl = imageUrl || '';

    if (req.file) {
      finalImageUrl = `/uploads/gallery/${req.file.filename}`;
    }

    if (!title || !finalImageUrl) {
      return res.status(400).json({ success: false, message: 'Photo title and image are required' });
    }

    const newObj = {
      title,
      caption: caption || '',
      category: category || 'annual-day',
      imageUrl: finalImageUrl,
      createdAt: new Date()
    };

    let result;
    try {
      result = await GalleryItem.create(newObj);
      console.log(`✅ Gallery photo saved to Atlas: ${result._id}`);
    } catch (err) {
      result = { _id: 'gal-' + Date.now(), ...newObj };
      memoryGallery.unshift(result);
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/gallery/:id (Protected Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    let deleted = null;
    try {
      deleted = await GalleryItem.findByIdAndDelete(req.params.id);
    } catch (e) {}

    if (!deleted) {
      const idx = memoryGallery.findIndex(g => g._id === req.params.id);
      if (idx !== -1) {
        deleted = memoryGallery.splice(idx, 1)[0];
      }
    }

    // Try deleting image file from disk if uploaded locally
    if (deleted && deleted.imageUrl && deleted.imageUrl.startsWith('/uploads/gallery/')) {
      const filePath = path.join(__dirname, '../..', deleted.imageUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    res.json({ success: true, message: 'Photo removed from gallery' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

