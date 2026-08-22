const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const Notification = require('../models/Notification');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin)
const register = async (req, res, next) => {
  try {
    const {
      employeeId,
      fullName,
      email,
      password,
      role,
      department,
      designation,
      phone,
      employmentType,
    } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Employee ID, Full Name, Email, and Password',
      });
    }

    // Check if user or employeeId exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingId = await User.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is already assigned to another staff member.',
      });
    }

    const user = await User.create({
      employeeId: employeeId.toUpperCase(),
      fullName,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'employee',
      department: department || 'Engineering',
      designation: designation || 'Team Member',
      phone: phone || '+1 (555) 019-2834',
      employmentType: employmentType || 'Full-time',
      status: 'Active',
    });

    // Create welcome notification
    await Notification.create({
      recipient: user._id,
      title: 'Welcome to Dayflow!',
      message: `Welcome aboard, ${user.fullName}! Your Dayflow workspace is ready. Check your Dayflow Pulse to start your first workday.`,
      type: 'system',
      actionUrl: 'pulse',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employmentType: user.employmentType,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Email/Employee ID and Password',
      });
    }

    // Allow login by email or employee ID
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { employeeId: identifier.toUpperCase().trim() },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your Email/Employee ID and password.',
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your HR administrator.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employmentType: user.employmentType,
        joiningDate: user.joiningDate,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
