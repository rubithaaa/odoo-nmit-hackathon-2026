const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');

// @desc    Get all employees (with search, filter, pagination)
// @route   GET /api/employees
// @access  Private (Admin has full list, Employee has directory summary)
const getAllEmployees = async (req, res, next) => {
  try {
    const { search, department, status, role, sort = 'fullName' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    const employees = await User.find(query)
      .select('-password')
      .sort(sort);

    // Get today's attendance status for each employee to display live in directory
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendances = await Attendance.find({ dateString: todayStr });
    const attendanceMap = {};
    todayAttendances.forEach((att) => {
      attendanceMap[att.user.toString()] = {
        status: att.status,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        isWorking: !!att.checkIn && !att.checkOut,
      };
    });

    const enrichedEmployees = employees.map((emp) => {
      const empObj = emp.toObject();
      empObj.todayAttendance = attendanceMap[emp._id.toString()] || {
        status: 'Not Checked In',
        checkIn: null,
        checkOut: null,
        isWorking: false,
      };
      return empObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedEmployees.length,
      employees: enrichedEmployees,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // If regular employee, only allow viewing self or public directory info
    const isSelf = req.user._id.toString() === employee._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Fetch quick stats
    const totalAttendances = await Attendance.countDocuments({
      user: employee._id,
      status: { $in: ['Present', 'Late'] },
    });
    const approvedLeaves = await Leave.countDocuments({
      user: employee._id,
      status: 'Approved',
    });
    const latestPayroll = await Payroll.findOne({ user: employee._id }).sort({
      year: -1,
      month: -1,
    });

    res.status(200).json({
      success: true,
      employee,
      stats: {
        totalDaysPresent: totalAttendances,
        approvedLeaves,
        latestPayroll: (isSelf || isAdmin) ? latestPayroll : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee profile
// @route   PUT /api/employees/:id
// @access  Private (Self edits restricted fields, Admin edits all)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const isSelf = req.user._id.toString() === employee._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this profile.',
      });
    }

    // Fields employee can update
    if (req.body.phone !== undefined) employee.phone = req.body.phone;
    if (req.body.address) {
      employee.address = {
        ...employee.address.toObject(),
        ...req.body.address,
      };
    }
    if (req.body.emergencyContact) {
      employee.emergencyContact = {
        ...employee.emergencyContact.toObject(),
        ...req.body.emergencyContact,
      };
    }
    if (req.body.avatar !== undefined) employee.avatar = req.body.avatar;

    // Fields ONLY admin can update
    if (isAdmin) {
      if (req.body.fullName) employee.fullName = req.body.fullName;
      if (req.body.email) employee.email = req.body.email.toLowerCase().trim();
      if (req.body.role) employee.role = req.body.role;
      if (req.body.department) employee.department = req.body.department;
      if (req.body.designation) employee.designation = req.body.designation;
      if (req.body.employmentType) employee.employmentType = req.body.employmentType;
      if (req.body.status) employee.status = req.body.status;
      if (req.body.joiningDate) employee.joiningDate = req.body.joiningDate;
    }

    await employee.save();

    const updated = await User.findById(employee._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      employee: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin create new employee
// @route   POST /api/employees
// @access  Private (Admin only)
const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId,
      fullName,
      email,
      password = 'Dayflow@2026',
      role = 'employee',
      department = 'Engineering',
      designation = 'Team Member',
      employmentType = 'Full-time',
      phone,
      address,
      salary,
    } = req.body;

    if (!employeeId || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, and Email are required.',
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingId = await User.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is already in use.',
      });
    }

    const user = await User.create({
      employeeId: employeeId.toUpperCase().trim(),
      fullName,
      email: email.toLowerCase().trim(),
      password,
      role,
      department,
      designation,
      employmentType,
      phone: phone || '+1 (555) 019-2834',
      address: address || undefined,
      status: 'Active',
    });

    // Automatically create initial default payroll structure for the new employee
    const baseVal = salary ? Number(salary) : 5500;
    const hraVal = Math.round(baseVal * 0.35);
    const allowVal = Math.round(baseVal * 0.15);
    const pfVal = Math.round(baseVal * 0.1);
    const taxVal = Math.round(baseVal * 0.12);
    const insVal = 200;
    const gross = baseVal + hraVal + allowVal;
    const deductions = pfVal + taxVal + insVal;
    const net = gross - deductions;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    await Payroll.create({
      user: user._id,
      month: currentMonth,
      year: currentYear,
      periodName: `${monthNames[currentMonth - 1]} ${currentYear}`,
      salaryStructure: {
        basicSalary: baseVal,
        hra: hraVal,
        conveyanceAllowance: 300,
        medicalAllowance: 200,
        specialAllowance: Math.max(0, allowVal - 500),
        performanceBonus: 0,
        providentFund: pfVal,
        taxDeduction: taxVal,
        healthInsurance: insVal,
        otherDeductions: 0,
      },
      grossEarnings: gross,
      totalDeductions: deductions,
      netSalary: net,
      status: 'Processed',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully with payroll setup',
      employee: {
        id: user._id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin deactivate/activate employee
// @route   PATCH /api/employees/:id/status
// @access  Private (Admin only)
const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Choose Active, Inactive, or On Leave.',
      });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    employee.status = status;
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee status updated to ${status}`,
      employee,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  toggleEmployeeStatus,
};
