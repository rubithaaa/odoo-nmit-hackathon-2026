const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.post('/broadcast', authorize('admin'), broadcastAnnouncement);

module.exports = router;
