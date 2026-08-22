const express = require('express');
const router = express.Router();
const {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeMasterReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/attendance', getAttendanceReport);
router.get('/leaves', getLeaveReport);
router.get('/payroll', getPayrollReport);
router.get('/employees', getEmployeeMasterReport);

module.exports = router;
