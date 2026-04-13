import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/me', verifyToken, userController.getCurrentUser);
router.get('/profile', verifyToken, userController.getUserProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// PATCH with optional avatar file upload
router.patch('/profile', verifyToken, uploadAvatar.single('avatar'), userController.patchProfile);

router.put('/password', verifyToken, userController.changePassword);

export default router;
