const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get current user notifications & broadcast notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipient: req.user._id }, { recipient: null }],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user._id }, { recipient: null }],
        isRead: false,
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Broadcast announcement to company or department
// @route   POST /api/notifications/broadcast
// @access  Private (Admin only)
const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { title, message, department } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and Message are required for announcement broadcast.',
      });
    }

    if (department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      const promises = usersInDept.map((u) =>
        Notification.create({
          recipient: u._id,
          title: `[${department}] ${title}`,
          message,
          type: 'announcement',
          actionUrl: 'pulse',
        })
      );
      await Promise.all(promises);
    } else {
      // Global broadcast
      await Notification.create({
        recipient: null,
        title: `[Company Announcement] ${title}`,
        message,
        type: 'announcement',
        actionUrl: 'pulse',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement,
};
