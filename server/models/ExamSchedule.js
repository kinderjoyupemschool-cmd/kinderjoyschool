const mongoose = require('mongoose');

const ExamItemSchema = new mongoose.Schema({
  date: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String, default: "09:30 AM - 12:00 PM" },
  subject: { type: String, required: true },
  syllabus: { type: String, default: "" }
}, { _id: false });

const ExamScheduleSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    default: "2026-2027",
    required: true
  },
  examType: {
    type: String,
    enum: ['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2'],
    required: true
  },
  className: {
    type: String,
    required: true
  },
  timingNote: {
    type: String,
    default: "Morning Session: 09:30 AM to 12:00 PM. Please report 15 minutes before the exam."
  },
  timetable: [ExamItemSchema],
  instructions: {
    type: [String],
    default: [
      "Students must arrive in proper school uniform with ID cards.",
      "Bring your own stationery (pens, pencils, erasers).",
      "School gates close at 09:15 AM sharp."
    ]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ExamScheduleSchema.index({ academicYear: 1, examType: 1, className: 1 }, { unique: true });

module.exports = mongoose.models.ExamSchedule || mongoose.model('ExamSchedule', ExamScheduleSchema);

