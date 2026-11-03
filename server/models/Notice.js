const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['news', 'circular', 'event', 'exam', 'general', 'urgent'],
    default: 'news'
  },
  category: {
    type: String,
    enum: ['General', 'Holiday', 'Event', 'Celebration', 'Admission', 'Exam', 'Circular', 'Sports', 'Special', 'general', 'holiday', 'event', 'celebration', 'admission', 'exam', 'circular', 'sports', 'special'],
    default: 'General'
  },
  targetClasses: {
    type: [String],
    default: ['All']
  },
  eventDate: {
    type: Date,
    default: null
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Notice || mongoose.model('Notice', NoticeSchema);

