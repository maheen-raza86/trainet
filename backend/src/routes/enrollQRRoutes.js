import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/enroll/qr/:token — legacy GET-based enrollment
router.get('/qr/:token', verifyToken, userController.enrollViaQR);

// POST /api/enroll/qr — new POST-based enrollment (token in body)
router.post('/qr', verifyToken, userController.enrollViaQRPost);

export default router;
