import express from 'express';
import { getProgress, getOfferingProgress } from '../controllers/progressController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/progress/:offeringId — student: own progress
router.get('/:offeringId', verifyToken, authorizeRoles('student'), getProgress);

// GET /api/progress/offering/:offeringId/students — trainer/admin: all students progress
router.get('/offering/:offeringId/students', verifyToken, authorizeRoles('trainer', 'admin'), getOfferingProgress);

export default router;
