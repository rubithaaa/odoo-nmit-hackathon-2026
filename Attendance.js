const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  reason: {
    type: String,
    default: 'Lunch / Coffee Break',
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateString: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    breaks: [breakSchema],
    totalWorkMinutes: {
      type: Number,
      default: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Half-day', 'Absent', 'On Leave'],
      default: 'Present',
    },
    workType: {
      type: String,
      enum: ['Office', 'Remote', 'Hybrid'],
      default: 'Office',
    },
    checkInNote: {
      type: String,
      default: '',
    },
    checkOutNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 attendance record per user per day
attendanceSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
