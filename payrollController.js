const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Notification = require('../models/Notification');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Helper to calculate gross, deductions, net
const computePayrollTotals = (structure) => {
  const s = structure;
  const gross =
    Number(s.basicSalary || 0) +
    Number(s.hra || 0) +
    Number(s.conveyanceAllowance || 0) +
    Number(s.medicalAllowance || 0) +
    Number(s.specialAllowance || 0) +
    Number(s.performanceBonus || 0);

  const deductions =
    Number(s.providentFund || 0) +
    Number(s.taxDeduction || 0) +
    Number(s.healthInsurance || 0) +
    Number(s.otherDeductions || 0);

  const net = Math.max(0, gross - deductions);

  return { grossEarnings: gross, totalDeductions: deductions, netSalary: net };
};

// @desc    Get current employee's payroll records & active structure
// @route   GET /api/payroll/my-payroll
// @access  Private
const getMyPayroll = async (req, res, next) => {
  try {
    const payslips = await Payroll.find({ user: req.user._id })
      .sort({ year: -1, month: -1 });

    const latestSlip = payslips[0] || null;

    res.status(200).json({
      success: true,
      count: payslips.length,
      payslips,
      currentStructure: latestSlip ? latestSlip.salaryStructure : null,
      latestSummary: latestSlip
        ? {
            gross: latestSlip.grossEarnings,
            deductions: latestSlip.totalDeductions,
            net: latestSlip.netSalary,
            period: latestSlip.periodName,
            status: latestSlip.status,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all payroll records with filters
// @route   GET /api/payroll/all
// @access  Private (Admin only)
const getAllPayroll = async (req, res, next) => {
  try {
    const { month, year, department, search } = req.query;

    const query = {};

    if (month && month !== 'All') {
      query.month = parseInt(month);
    }
    if (year && year !== 'All') {
      query.year = parseInt(year);
    }

    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      query.user = { $in: usersInDept.map((u) => u._id) };
    }

    let records = await Payroll.find(query)
      .populate('user', 'fullName employeeId department designation email avatar')
      .sort({ year: -1, month: -1, createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter(
        (r) =>
          r.user &&
          (r.user.fullName.toLowerCase().includes(searchLower) ||
            r.user.employeeId.toLowerCase().includes(searchLower))
      );
    }

    // Company summary stats
    const totalPayrollGross = records.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalPayrollNet = records.reduce((acc, r) => acc + r.netSalary, 0);
    const totalDeductions = records.reduce((acc, r) => acc + r.totalDeductions, 0);

    res.status(200).json({
      success: true,
      count: records.length,
      records,
      summary: {
        totalGross: totalPayrollGross,
        totalNet: totalPayrollNet,
        totalDeductions,
        processedCount: records.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single payslip details (Printable/Downloadable)
// @route   GET /api/payroll/slip/:id
// @access  Private (Self or Admin)
const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await Payroll.findById(req.params.id)
      .populate('user', 'fullName employeeId department designation email phone address joiningDate');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found',
      });
    }

    const isSelf = req.user._id.toString() === payslip.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this payslip',
      });
    }

    res.status(200).json({
      success: true,
      payslip,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Update salary structure for an employee
// @route   PUT /api/payroll/structure/:userId
// @access  Private (Admin only)
const updateSalaryStructure = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { salaryStructure } = req.body;

    if (!salaryStructure || salaryStructure.basicSalary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Valid salary structure with basic salary is required.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const { grossEarnings, totalDeductions, netSalary } = computePayrollTotals(salaryStructure);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const periodName = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;

    // Update or upsert current month payslip
    const payroll = await Payroll.findOneAndUpdate(
      { user: user._id, month: currentMonth, year: currentYear },
      {
        user: user._id,
        month: currentMonth,
        year: currentYear,
        periodName,
        salaryStructure,
        grossEarnings,
        totalDeductions,
        netSalary,
        status: 'Processed',
      },
      { upsert: true, new: true }
    );

    // Notify employee of compensation update
    await Notification.create({
      recipient: user._id,
      title: 'Salary Structure Updated',
      message: `Your compensation package has been updated by HR. New Net Take-Home: $${netSalary.toLocaleString()}. Check your Payroll tab for details.`,
      type: 'payroll_ready',
      actionUrl: 'payroll',
    });

    res.status(200).json({
      success: true,
      message: `Salary structure updated for ${user.fullName}`,
      payroll,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Generate batch payroll for all active employees for given month/year
// @route   POST /api/payroll/generate-batch
// @access  Private (Admin only)
const generatePayrollBatch = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const periodName = `${MONTH_NAMES[m - 1]} ${y}`;

    const activeEmployees = await User.find({ status: 'Active' });
    let createdCount = 0;

    for (const emp of activeEmployees) {
      // Find latest structure or use default
      const prevSlip = await Payroll.findOne({ user: emp._id }).sort({ year: -1, month: -1 });
      const structure = prevSlip ? prevSlip.salaryStructure : {
        basicSalary: 6000,
        hra: 2100,
        conveyanceAllowance: 400,
        medicalAllowance: 300,
        specialAllowance: 700,
        performanceBonus: 500,
        providentFund: 600,
        taxDeduction: 1100,
        healthInsurance: 250,
        otherDeductions: 0,
      };

      const { grossEarnings, totalDeductions, netSalary } = computePayrollTotals(structure);

      await Payroll.findOneAndUpdate(
        { user: emp._id, month: m, year: y },
        {
          user: emp._id,
          month: m,
          year: y,
          periodName,
          salaryStructure: structure,
          grossEarnings,
          totalDeductions,
          netSalary,
          status: 'Paid',
          paymentDate: new Date(),
        },
        { upsert: true }
      );
      createdCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed payroll batch for ${periodName} across ${createdCount} employees.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPayroll,
  getAllPayroll,
  getPayslipById,
  updateSalaryStructure,
  generatePayrollBatch,
};
