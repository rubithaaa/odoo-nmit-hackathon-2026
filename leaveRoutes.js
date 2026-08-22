const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(applyLeave);

router.get('/my-leaves', getMyLeaves);
router.get('/all', authorize('admin'), getAllLeaves);
router.patch('/:id/review', authorize('admin'), reviewLeave);

module.exports = router;
