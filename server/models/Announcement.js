const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'fa-bullhorn'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  showAsPopup: {
    type: Boolean,
    default: false
  },
  popupTitle: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

