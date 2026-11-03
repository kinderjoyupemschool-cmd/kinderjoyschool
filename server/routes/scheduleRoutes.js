const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ExamSchedule = require('../models/ExamSchedule');
const { protect } = require('../middleware/auth');

// In-memory store for instant real-time responses
let memorySchedules = [];

// GET /api/schedules - Responds instantly in 0ms
router.get('/', async (req, res) => {
  try {
    const { academicYear, examType, className } = req.query;
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (examType) query.examType = examType;
    if (className && className !== 'All') query.className = className;

    let schedules = [];

    // Only query Mongo if connected, otherwise return memory data immediately (0ms)
    if (mongoose.connection.readyState === 1) {
      try {
        schedules = await ExamSchedule.find(query).sort({ examType: 1, className: 1 });
      } catch (dbErr) {
        schedules = [];
      }
    }

    if (!schedules.length) {
      schedules = memorySchedules.filter(s => {
        if (academicYear && s.academicYear !== academicYear) return false;
        if (examType && s.examType !== examType) return false;
        if (className && className !== 'All' && s.className !== className) return false;
        return true;
      });
    }

    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/schedules/years - Instant response
router.get('/years', async (req, res) => {
  try {
    let years = [];
    if (mongoose.connection.readyState === 1) {
      try {
        years = await ExamSchedule.distinct('academicYear');
      } catch (err) {
        years = [];
      }
    }

    if (!years || !years.length) {
      const memYears = [...new Set(memorySchedules.map(s => s.academicYear).filter(Boolean))];
      years = memYears.length ? memYears : ["2026-2027"];
    }

    res.json({ success: true, data: years });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/schedules (Upsert - Protected Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { academicYear, examType, className, timingNote, timetable, instructions } = req.body;
    if (!examType || !className || !timetable || !timetable.length) {
      return res.status(400).json({ success: false, message: 'Academic Year, Exam type, Class, and at least one timetable row are required' });
    }

    const yearVal = academicYear || "2026-2027";
    const scheduleData = {
      academicYear: yearVal,
      examType,
      className,
      timingNote: timingNote || "09:30 AM to 12:00 PM",
      timetable,
      instructions: instructions && instructions.length ? instructions : [
        "Students must arrive in proper school uniform with ID cards.",
        "Bring your own stationery (pens, pencils, erasers)."
      ],
      updatedAt: new Date()
    };

    let result;
    try {
      result = await ExamSchedule.findOneAndUpdate(
        { academicYear: yearVal, examType, className },
        scheduleData,
        { new: true, upsert: true }
      );
    } catch (dbErr) {
      const idx = memorySchedules.findIndex(s => s.academicYear === yearVal && s.examType === examType && s.className === className);
      if (idx >= 0) {
        memorySchedules[idx] = { ...memorySchedules[idx], ...scheduleData };
        result = memorySchedules[idx];
      } else {
        result = { _id: 'sched-' + Date.now(), ...scheduleData };
        memorySchedules.push(result);
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/schedules/:id (Protected Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    try {
      await ExamSchedule.findByIdAndDelete(req.params.id);
    } catch (dbErr) {
      memorySchedules = memorySchedules.filter(s => s._id !== req.params.id);
    }
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
