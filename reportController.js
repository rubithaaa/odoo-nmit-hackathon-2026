const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

// @desc    Get Attendance Report data
// @route   GET /api/reports/attendance
// @access  Private (Admin only)
const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    let users = await User.find(department && department !== 'All' ? { department } : {}).select('_id fullName employeeId department designation');
    const userIds = users.map((u) => u._id);

    query.user = { $in: userIds };

    const records = await Attendance.find(query)
      .populate('user', 'fullName employeeId department designation')
      .sort({ dateString: -1 });

    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const halfDayCount = records.filter((r) => r.status === 'Half-day').length;
    const onLeaveCount = records.filter((r) => r.status === 'On Leave').length;
    const totalWorkingHours = +(records.reduce((acc, r) => acc + (r.totalWorkMinutes || 0), 0) / 60).toFixed(1);

    res.status(200).json({
      success: true,
      summary: {
        totalRecords,
        presentCount,
        lateCount,
        halfDayCount,
        onLeaveCount,
        totalWorkingHours,
      },
      records,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Leave Utilization Report data
// @route   GET /api/reports/leaves
// @access  Private (Admin only)
const getLeaveReport = async (req, res, next) => {
  try {
    const { status, leaveType, department } = req.query;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (leaveType && leaveType !== 'All') query.leaveType = leaveType;

    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      query.user = { $in: usersInDept.map((u) => u._id) };
    }

    const leaves = await Leave.find(query)
      .populate('user', 'fullName employeeId department designation')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    const totalDaysRequested = leaves.reduce((acc, l) => acc + l.totalDays, 0);
    const approvedDays = leaves.filter((l) => l.status === 'Approved').reduce((acc, l) => acc + l.totalDays, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalRequests: leaves.length,
        totalDaysRequested,
        approvedDays,
      },
      leaves,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Payroll Expense Report
// @route   GET /api/reports/payroll
// @access  Private (Admin only)
const getPayrollReport = async (req, res, next) => {
  try {
    const { year, month, department } = req.query;

    const query = {};
    if (year && year !== 'All') query.year = parseInt(year);
    if (month && month !== 'All') query.month = parseInt(month);

    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      query.user = { $in: usersInDept.map((u) => u._id) };
    }

    const records = await Payroll.find(query)
      .populate('user', 'fullName employeeId department designation')
      .sort({ year: -1, month: -1 });

    const totalGross = records.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalNet = records.reduce((acc, r) => acc + r.netSalary, 0);
    const totalDeductions = records.reduce((acc, r) => acc + r.totalDeductions, 0);

    // Department breakdown
    const deptTotals = {};
    records.forEach((r) => {
      if (r.user && r.user.department) {
        const d = r.user.department;
        if (!deptTotals[d]) deptTotals[d] = { gross: 0, net: 0, count: 0 };
        deptTotals[d].gross += r.grossEarnings;
        deptTotals[d].net += r.netSalary;
        deptTotals[d].count += 1;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalGross,
        totalNet,
        totalDeductions,
        slipCount: records.length,
        deptTotals,
      },
      records,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Comprehensive Employee Master Report
// @route   GET /api/reports/employees
// @access  Private (Admin only)
const getEmployeeMasterReport = async (req, res, next) => {
  try {
    const { department, status } = req.query;

    const query = {};
    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;

    const employees = await User.find(query).select('-password').sort({ employeeId: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeMasterReport,
};
