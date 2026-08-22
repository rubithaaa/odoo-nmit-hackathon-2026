const Attendance = require('../models/Attendance');
const User = require('../models/User');

const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

// @desc    Check in for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    const todayStr = getTodayDateStr();
    const now = new Date();

    let attendance = await Attendance.findOne({
      user: req.user._id,
      dateString: todayStr,
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today at ' + new Date(attendance.checkIn).toLocaleTimeString(),
      });
    }

    // Determine status (Late if after 09:30 AM)
    const checkInHour = now.getHours();
    const checkInMinute = now.getMinutes();
    let status = 'Present';
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
      status = 'Late';
    }

    if (!attendance) {
      attendance = new Attendance({
        user: req.user._id,
        dateString: todayStr,
        date: new Date(todayStr),
        checkIn: now,
        status,
        workType: req.body.workType || 'Office',
        checkInNote: req.body.checkInNote || '',
      });
    } else {
      attendance.checkIn = now;
      attendance.status = status;
      if (req.body.workType) attendance.workType = req.body.workType;
      if (req.body.checkInNote) attendance.checkInNote = req.body.checkInNote;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Checked in successfully at ${now.toLocaleTimeString()}`,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check out for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const todayStr = getTodayDateStr();
    const now = new Date();

    const attendance = await Attendance.findOne({
      user: req.user._id,
      dateString: todayStr,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today at ' + new Date(attendance.checkOut).toLocaleTimeString(),
      });
    }

    // Close any open break
    let totalBreakMs = 0;
    attendance.breaks.forEach((b) => {
      if (b.startTime && !b.endTime) {
        b.endTime = now;
      }
      if (b.startTime && b.endTime) {
        totalBreakMs += (new Date(b.endTime) - new Date(b.startTime));
      }
    });

    attendance.checkOut = now;
    attendance.checkOutNote = req.body.checkOutNote || '';
    attendance.totalBreakMinutes = Math.round(totalBreakMs / (1000 * 60));

    const totalDurationMs = new Date(attendance.checkOut) - new Date(attendance.checkIn);
    const netWorkMs = Math.max(0, totalDurationMs - totalBreakMs);
    attendance.totalWorkMinutes = Math.round(netWorkMs / (1000 * 60));

    // If worked less than 240 minutes (4 hours), mark Half-day
    if (attendance.totalWorkMinutes < 240 && attendance.status !== 'On Leave') {
      attendance.status = 'Half-day';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Checked out successfully at ${now.toLocaleTimeString()}. Total working time: ${Math.floor(attendance.totalWorkMinutes / 60)}h ${attendance.totalWorkMinutes % 60}m`,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle break (Start / End)
// @route   POST /api/attendance/break-toggle
// @access  Private
const toggleBreak = async (req, res, next) => {
  try {
    const todayStr = getTodayDateStr();
    const now = new Date();

    const attendance = await Attendance.findOne({
      user: req.user._id,
      dateString: todayStr,
    });

    if (!attendance || !attendance.checkIn || attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle break when not currently checked in or already checked out.',
      });
    }

    // Check if there is an active break
    const activeBreakIndex = attendance.breaks.findIndex((b) => b.startTime && !b.endTime);

    if (activeBreakIndex !== -1) {
      // Finish active break
      attendance.breaks[activeBreakIndex].endTime = now;
      let totalBreakMs = 0;
      attendance.breaks.forEach((b) => {
        if (b.startTime && b.endTime) {
          totalBreakMs += (new Date(b.endTime) - new Date(b.startTime));
        }
      });
      attendance.totalBreakMinutes = Math.round(totalBreakMs / (1000 * 60));
      await attendance.save();

      return res.status(200).json({
        success: true,
        message: 'Break ended. Welcome back!',
        isOnBreak: false,
        attendance,
      });
    } else {
      // Start new break
      attendance.breaks.push({
        startTime: now,
        reason: req.body.reason || 'Lunch / Coffee Break',
      });
      await attendance.save();

      return res.status(200).json({
        success: true,
        message: 'Break started. Take your time!',
        isOnBreak: true,
        attendance,
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get today's attendance status & live timer
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res, next) => {
  try {
    const todayStr = getTodayDateStr();
    const attendance = await Attendance.findOne({
      user: req.user._id,
      dateString: todayStr,
    });

    let state = 'not_checked_in';
    let isOnBreak = false;
    let currentSessionMinutes = 0;

    if (attendance) {
      if (attendance.checkIn && !attendance.checkOut) {
        const activeBreak = attendance.breaks.find((b) => b.startTime && !b.endTime);
        if (activeBreak) {
          state = 'on_break';
          isOnBreak = true;
        } else {
          state = 'working';
        }
      } else if (attendance.checkOut) {
        state = 'completed';
      }
    }

    res.status(200).json({
      success: true,
      state,
      isOnBreak,
      attendance: attendance || null,
      serverTime: new Date(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's monthly/weekly attendance history
// @route   GET /api/attendance/my-history
// @access  Private
const getMyHistory = async (req, res, next) => {
  try {
    const { month, year, limit = 31 } = req.query;

    const query = { user: req.user._id };

    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const history = await Attendance.find(query)
      .sort({ dateString: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get employee's attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
const getMyStats = async (req, res, next) => {
  try {
    const targetUserId = (req.user.role === 'admin' && req.query.userId)
      ? req.query.userId
      : req.user._id;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const attendances = await Attendance.find({
      user: targetUserId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const presentDays = attendances.filter((a) => a.status === 'Present').length;
    const lateDays = attendances.filter((a) => a.status === 'Late').length;
    const halfDays = attendances.filter((a) => a.status === 'Half-day').length;
    const onLeaveDays = attendances.filter((a) => a.status === 'On Leave').length;
    const totalWorkingMinutes = attendances.reduce((acc, a) => acc + (a.totalWorkMinutes || 0), 0);

    const totalDaysRecorded = attendances.length || 1;
    const effectivePresent = presentDays + lateDays + (halfDays * 0.5);
    const attendancePercentage = Math.min(100, Math.round((effectivePresent / Math.max(1, totalDaysRecorded)) * 100));

    res.status(200).json({
      success: true,
      stats: {
        attendancePercentage,
        presentDays,
        lateDays,
        halfDays,
        onLeaveDays,
        totalHoursLogged: +(totalWorkingMinutes / 60).toFixed(1),
        averageDailyHours: attendances.length > 0 ? +(totalWorkingMinutes / 60 / attendances.length).toFixed(1) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all attendance records with rich filtering
// @route   GET /api/attendance/all
// @access  Private (Admin only)
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, department, status, employeeId, search } = req.query;

    const query = {};

    if (date) {
      query.dateString = date;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let users = null;
    const userQuery = {};
    if (department && department !== 'All') {
      userQuery.department = department;
    }
    if (employeeId) {
      userQuery.employeeId = employeeId.toUpperCase();
    }
    if (search) {
      userQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (Object.keys(userQuery).length > 0) {
      const matchingUsers = await User.find(userQuery).select('_id');
      query.user = { $in: matchingUsers.map((u) => u._id) };
    }

    const records = await Attendance.find(query)
      .populate('user', 'fullName employeeId department designation avatar')
      .sort({ dateString: -1, createdAt: -1 })
      .limit(100);

    // Compute today's summary metrics
    const todayStr = getTodayDateStr();
    const totalActiveEmployees = await User.countDocuments({ status: 'Active' });
    const todayRecords = await Attendance.find({ dateString: todayStr });
    const presentToday = todayRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const lateToday = todayRecords.filter((r) => r.status === 'Late').length;
    const onLeaveToday = todayRecords.filter((r) => r.status === 'On Leave').length;
    const absentToday = Math.max(0, totalActiveEmployees - presentToday - onLeaveToday);

    res.status(200).json({
      success: true,
      count: records.length,
      records,
      summary: {
        totalEmployees: totalActiveEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        attendanceRate: totalActiveEmployees > 0 ? Math.round((presentToday / totalActiveEmployees) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn,
  checkOut,
  toggleBreak,
  getTodayStatus,
  getMyHistory,
  getMyStats,
  getAllAttendance,
};
