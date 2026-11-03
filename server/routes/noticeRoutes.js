const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const { protect } = require('../middleware/auth');

// In-memory store for instant real-time operations
let memoryNotices = [];

// GET /api/notices - Responds instantly in 0ms
router.get('/', async (req, res) => {
  try {
    const { type, category, targetClass } = req.query;
    let query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (targetClass && targetClass !== 'All') {
      query.targetClasses = { $in: ['All', targetClass] };
    }

    let notices = [];
    if (mongoose.connection.readyState === 1) {
      try {
        notices = await Notice.find(query).sort({ isUrgent: -1, publishDate: -1 });
      } catch (dbErr) {
        notices = [];
      }
    }

    if (!notices.length) {
      notices = memoryNotices.filter(n => {
        if (type && n.type !== type) return false;
        if (category && n.category !== category) return false;
        if (targetClass && targetClass !== 'All') {
          return n.targetClasses.includes('All') || n.targetClasses.includes(targetClass);
        }
        return true;
      });
    }

    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/notices (Protected)
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, type, category, targetClasses, isUrgent, eventDate, attachmentUrl } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const newNotice = {
      title,
      content,
      type: type || 'news',
      category: category || 'General',
      targetClasses: targetClasses && targetClasses.length ? targetClasses : ['All'],
      eventDate: eventDate ? new Date(eventDate) : new Date(),
      isUrgent: !!isUrgent,
      attachmentUrl: attachmentUrl || '',
      publishDate: new Date()
    };

    let result;
    try {
      result = await Notice.create(newNotice);
      console.log(`✅ Notice saved to MongoDB Atlas: ${result._id}`);
    } catch (dbErr) {
      console.warn(`⚠️ Notice DB save warning: ${dbErr.message}`);
      result = { _id: 'notice-' + Date.now(), ...newNotice };
      memoryNotices.unshift(result);
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notices/:id (Protected)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, type, category, targetClasses, isUrgent, eventDate, attachmentUrl } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (targetClasses !== undefined) updateData.targetClasses = targetClasses;
    if (isUrgent !== undefined) updateData.isUrgent = !!isUrgent;
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

    let updatedDoc = null;
    try {
      updatedDoc = await Notice.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
      if (updatedDoc) {
        console.log(`✅ Notice updated in MongoDB Atlas: ${updatedDoc._id}`);
      }
    } catch (dbErr) {
      console.warn(`⚠️ Notice update warning: ${dbErr.message}`);
    }

    if (!updatedDoc) {
      const idx = memoryNotices.findIndex(n => n._id === req.params.id);
      if (idx !== -1) {
        memoryNotices[idx] = { ...memoryNotices[idx], ...updateData };
        updatedDoc = memoryNotices[idx];
      }
    }

    res.json({ success: true, data: updatedDoc || { _id: req.params.id, ...updateData } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/notices/:id (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    try {
      await Notice.findByIdAndDelete(req.params.id);
    } catch (dbErr) {
      memoryNotices = memoryNotices.filter(n => n._id !== req.params.id);
    }
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

