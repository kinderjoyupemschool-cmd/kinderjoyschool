const mongoose = require('mongoose');

const GalleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['annual-day', 'science-day', 'award-ceremony', 'sports', 'campus'],
    default: 'annual-day'
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.GalleryItem || mongoose.model('GalleryItem', GalleryItemSchema);

