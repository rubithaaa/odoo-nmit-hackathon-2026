const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Payroll = require('../models/Payroll');

// @desc    Calculate smart Dayflow Insights from real database records
// @route   GET /api/insights
// @access  Private
const getInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Fetch active users
    const users = await User.find({ status: 'Active' });
    const totalUsers = users.length;

    if (totalUsers === 0) {
      return res.status(200).json({
        success: true,
        insights: [
          {
            id: 'insufficient_data',
            type: 'neutral',
            title: 'Data Collection Active',
            description: 'Not enough data to generate this insight. Start clocking attendance to see real-time workforce intelligence.',
            metric: '0%',
            tag: 'System',
          },
        ],
      });
    }

    const insightsList = [];

    // Date ranges
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // 2. Attendance improvement/trend
    const thisMonthAtt = await Attendance.find({
      date: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }).populate('user', 'department fullName');

    const prevMonthAtt = await Attendance.find({
      date: { $gte: prevMonthStart, $lte: prevMonthEnd },
    });

    const thisMonthPresent = thisMonthAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const thisMonthTotal = thisMonthAtt.length;
    const thisMonthRate = thisMonthTotal > 0 ? Math.round((thisMonthPresent / thisMonthTotal) * 100) : 0;

    const prevMonthPresent = prevMonthAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const prevMonthTotal = prevMonthAtt.length;
    const prevMonthRate = prevMonthTotal > 0 ? Math.round((prevMonthPresent / prevMonthTotal) * 100) : 0;

    if (thisMonthTotal >= 5) {
      const diff = thisMonthRate - prevMonthRate;
      if (diff > 0) {
        insightsList.push({
          id: 'attendance_trend',
          type: 'positive',
          icon: 'trending-up',
          title: 'Attendance Momentum',
          description: `Company attendance rate reached ${thisMonthRate}%, an improvement of +${diff}% compared to last month.`,
          metric: `+${diff}%`,
          tag: 'Workforce Attendance',
        });
      } else if (diff < 0) {
        insightsList.push({
          id: 'attendance_trend',
          type: 'warning',
          icon: 'trending-down',
          title: 'Attendance Dip Detected',
          description: `Company attendance rate shifted to ${thisMonthRate}% (${diff}% vs previous month).`,
          metric: `${diff}%`,
          tag: 'Workforce Attendance',
        });
      } else {
        insightsList.push({
          id: 'attendance_trend',
          type: 'positive',
          icon: 'check-circle',
          title: 'Stable Attendance Rate',
          description: `Consistent high attendance sustained at ${thisMonthRate}% across all business units.`,
          metric: `${thisMonthRate}%`,
          tag: 'Workforce Attendance',
        });
      }
    }

    // 3. Department Attendance Ranking
    const deptMap = {};
    thisMonthAtt.forEach((att) => {
      if (att.user && att.user.department) {
        const dept = att.user.department;
        if (!deptMap[dept]) {
          deptMap[dept] = { present: 0, total: 0 };
        }
        deptMap[dept].total += 1;
        if (att.status === 'Present' || att.status === 'Late') {
          deptMap[dept].present += 1;
        }
      }
    });

    const deptRankings = Object.keys(deptMap)
      .map((dept) => ({
        department: dept,
        rate: deptMap[dept].total > 0 ? Math.round((deptMap[dept].present / deptMap[dept].total) * 100) : 0,
        total: deptMap[dept].total,
      }))
      .filter((d) => d.total >= 3)
      .sort((a, b) => b.rate - a.rate);

    if (deptRankings.length > 0) {
      const topDept = deptRankings[0];
      insightsList.push({
        id: 'top_department',
        type: 'highlight',
        icon: 'award',
        title: 'Department of the Month',
        description: `${topDept.department} leads company engagement with a remarkable ${topDept.rate}% punctuality and presence rate.`,
        metric: `${topDept.rate}%`,
        tag: 'Team Performance',
      });
    }

    // 4. Low Attendance / Attention Outlier
    const userAttCount = {};
    thisMonthAtt.forEach((att) => {
      if (att.user && att.user._id) {
        const uid = att.user._id.toString();
        if (!userAttCount[uid]) userAttCount[uid] = { present: 0, total: 0, name: att.user.fullName };
        userAttCount[uid].total += 1;
        if (att.status === 'Present' || att.status === 'Late') userAttCount[uid].present += 1;
      }
    });

    const lowAttUsers = Object.values(userAttCount).filter(
      (u) => u.total >= 5 && (u.present / u.total) < 0.85
    );

    if (lowAttUsers.length > 0) {
      insightsList.push({
        id: 'attendance_risk',
        type: 'warning',
        icon: 'alert-triangle',
        title: 'Attendance Alert',
        description: `${lowAttUsers.length} employee(s) have attendance below the 85% benchmark this cycle. Proactive check-in recommended.`,
        metric: `${lowAttUsers.length} Flagged`,
        tag: 'Attention Required',
      });
    }

    // 5. Leave Request Velocity
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekLeaves = await Leave.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });
    const lastWeekLeaves = await Leave.countDocuments({
      createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
    });

    if (thisWeekLeaves > lastWeekLeaves && thisWeekLeaves > 1) {
      insightsList.push({
        id: 'leave_surge',
        type: 'info',
        icon: 'calendar',
        title: 'Leave Request Surge',
        description: `Leave submissions increased this week (${thisWeekLeaves} requests filed vs ${lastWeekLeaves} last week). Ensure project coverage.`,
        metric: `+${thisWeekLeaves - lastWeekLeaves} this week`,
        tag: 'Leave Velocity',
      });
    }

    // 6. Average Workday Duration
    const completedWorkSessions = thisMonthAtt.filter((a) => a.totalWorkMinutes > 0);
    if (completedWorkSessions.length >= 5) {
      const avgMinutes =
        completedWorkSessions.reduce((sum, a) => sum + a.totalWorkMinutes, 0) /
        completedWorkSessions.length;
      const avgHours = (avgMinutes / 60).toFixed(1);

      insightsList.push({
        id: 'avg_workday',
        type: 'info',
        icon: 'clock',
        title: 'Workday Productivity Rhythm',
        description: `The average productive workday across the organization is currently ${avgHours} hours. Staff work-life balance is on target.`,
        metric: `${avgHours} hrs/day`,
        tag: 'Productivity',
      });
    }

    // Fallback if not enough data
    if (insightsList.length === 0) {
      insightsList.push({
        id: 'insufficient_data',
        type: 'neutral',
        icon: 'info',
        title: 'Generating Insights...',
        description: 'Not enough data to generate this insight. As your team logs check-ins and leaves, Dayflow will unlock statistical insights.',
        metric: 'Calibrating',
        tag: 'Analytics',
      });
    }

    res.status(200).json({
      success: true,
      insights: insightsList,
      departmentRankings: deptRankings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights };
