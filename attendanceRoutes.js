const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  toggleBreak,
  getTodayStatus,
  getMyHistory,
  getMyStats,
  getAllAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/break-toggle', toggleBreak);
router.get('/today', getTodayStatus);
router.get('/my-history', getMyHistory);
router.get('/stats', getMyStats);
router.get('/all', authorize('admin'), getAllAttendance);

module.exports = router;
