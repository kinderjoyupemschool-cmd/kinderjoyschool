const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');

let memoryAnnouncements = [];

// GET /api/announcements (Public)
router.get('/', async (req, res) => {
  try {
    let items = [];
    if (mongoose.connection.readyState === 1) {
      try {
        items = await Announcement.find({ isActive: true }).sort({ isUrgent: -1, updatedAt: -1 });
      } catch (err) {
        items = [];
      }
    }
    if (!items.length) {
      items = memoryAnnouncements.filter(a => a.isActive);
    }
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/announcements/all (Protected Admin)
router.get('/all', protect, async (req, res) => {
  try {
    let items = [];
    if (mongoose.connection.readyState === 1) {
      try {
        items = await Announcement.find().sort({ updatedAt: -1 });
      } catch (err) {
        items = [];
      }
    }
    if (!items.length) {
      items = memoryAnnouncements;
    }
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/announcements (Protected Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { text, link, icon, isUrgent, isActive, showAsPopup, popupTitle } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Announcement text is required' });
    }

    const newObj = {
      text,
      link: link || '',
      icon: icon || 'fa-bullhorn',
      isUrgent: !!isUrgent,
      isActive: isActive !== undefined ? !!isActive : true,
      showAsPopup: !!showAsPopup,
      popupTitle: popupTitle || 'Important School Announcement',
      updatedAt: new Date()
    };

    let result;
    try {
      result = await Announcement.create(newObj);
      console.log(`✅ Announcement saved to Atlas: ${result._id}`);
    } catch (err) {
      result = { _id: 'ann-' + Date.now(), ...newObj };
      memoryAnnouncements.unshift(result);
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/announcements/:id (Protected Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { text, link, icon, isUrgent, isActive } = req.body;
    const update = {};
    if (text !== undefined) update.text = text;
    if (link !== undefined) update.link = link;
    if (icon !== undefined) update.icon = icon;
    if (isUrgent !== undefined) update.isUrgent = !!isUrgent;
    if (isActive !== undefined) update.isActive = !!isActive;
    update.updatedAt = new Date();

    let updated = null;
    try {
      updated = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true });
    } catch (e) {}

    if (!updated) {
      const idx = memoryAnnouncements.findIndex(a => a._id === req.params.id);
      if (idx !== -1) {
        memoryAnnouncements[idx] = { ...memoryAnnouncements[idx], ...update };
        updated = memoryAnnouncements[idx];
      }
    }

    res.json({ success: true, data: updated || { _id: req.params.id, ...update } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/announcements/:id (Protected Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    try {
      await Announcement.findByIdAndDelete(req.params.id);
    } catch (e) {
      memoryAnnouncements = memoryAnnouncements.filter(a => a._id !== req.params.id);
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

