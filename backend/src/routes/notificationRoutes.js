import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import * as notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/notifications — get user's notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id);
    const unread = notifications.filter(n => !n.read).length;
    res.status(200).json({ success: true, data: { notifications, unread } });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', verifyToken, async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', verifyToken, async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

export default router;
