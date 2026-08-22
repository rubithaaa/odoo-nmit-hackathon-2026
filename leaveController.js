const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');

// Helper to calculate business/calendar days between dates
const calculateDays = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e - s);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private (Employee or Admin)
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Leave Type, Start Date, End Date, and Reason.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.',
      });
    }

    const totalDays = calculateDays(start, end);

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'Pending',
    });

    // Notify all HR/Admins
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map((admin) =>
      Notification.create({
        recipient: admin._id,
        title: 'New Leave Request',
        message: `${req.user.fullName} requested ${totalDays} day(s) of ${leaveType} leave (${start.toLocaleDateString()} to ${end.toLocaleDateString()}).`,
        type: 'leave_status',
        actionUrl: 'leaves',
      })
    );
    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: `Leave application for ${totalDays} day(s) submitted successfully.`,
      leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's leave requests and balance
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    // Compute balances
    // Standard quota: Paid: 18, Sick: 12, Casual: 6
    const approvedLeaves = leaves.filter((l) => l.status === 'Approved');
    const usedPaid = approvedLeaves
      .filter((l) => l.leaveType === 'Paid')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const usedSick = approvedLeaves
      .filter((l) => l.leaveType === 'Sick')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const usedCasual = approvedLeaves
      .filter((l) => l.leaveType === 'Casual')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const usedUnpaid = approvedLeaves
      .filter((l) => l.leaveType === 'Unpaid')
      .reduce((acc, l) => acc + l.totalDays, 0);

    const balances = {
      paid: { total: 18, used: usedPaid, remaining: Math.max(0, 18 - usedPaid) },
      sick: { total: 12, used: usedSick, remaining: Math.max(0, 12 - usedSick) },
      casual: { total: 6, used: usedCasual, remaining: Math.max(0, 6 - usedCasual) },
      unpaid: { used: usedUnpaid },
    };

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
      balances,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all leave requests
// @route   GET /api/leaves/all
// @access  Private (Admin only)
const getAllLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, department, search } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      query.user = { $in: usersInDept.map((u) => u._id) };
    }

    let leaves = await Leave.find(query)
      .populate('user', 'fullName employeeId department designation avatar email')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      leaves = leaves.filter(
        (l) =>
          l.user &&
          (l.user.fullName.toLowerCase().includes(searchLower) ||
            l.user.employeeId.toLowerCase().includes(searchLower) ||
            l.reason.toLowerCase().includes(searchLower))
      );
    }

    const pendingCount = await Leave.countDocuments({ status: 'Pending' });
    const approvedCount = await Leave.countDocuments({ status: 'Approved' });
    const rejectedCount = await Leave.countDocuments({ status: 'Rejected' });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Review (Approve or Reject) leave request
// @route   PATCH /api/leaves/:id/review
// @access  Private (Admin only)
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Approved or Rejected.',
      });
    }

    const leave = await Leave.findById(req.params.id).populate('user', 'fullName email');
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = reviewComment || (status === 'Approved' ? 'Approved by HR' : 'Declined by HR');

    await leave.save();

    // If approved, create/update attendance status for those dates as "On Leave"
    if (status === 'Approved') {
      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
          { user: leave.user._id, dateString: dateStr },
          {
            user: leave.user._id,
            dateString: dateStr,
            date: new Date(dateStr),
            status: 'On Leave',
            checkInNote: `${leave.leaveType} Leave (Approved)`,
          },
          { upsert: true, new: true }
        );
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Send notification to the employee
    await Notification.create({
      recipient: leave.user._id,
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType} leave request for ${leave.totalDays} day(s) has been ${status.toLowerCase()} by ${req.user.fullName}. ${reviewComment ? `Note: "${reviewComment}"` : ''}`,
      type: 'leave_status',
      actionUrl: 'leaves',
    });

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}.`,
      leave,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
};
